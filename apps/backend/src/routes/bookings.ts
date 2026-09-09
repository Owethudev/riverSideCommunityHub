import { Router } from 'express';
import { createBookingSchema, paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { bookingRequestEmail, bookingStatusEmail, getAuthEmail, getRoleEmails, sendToMany } from '../services/email.js';

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth, requireRole('member'));

bookingsRouter.get('/', async (request, response) => {
  if (!request.userId) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }
  const parsed = paginationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten() });
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabaseAdmin
    .from('bookings')
    .select('id, member_id, resource_id, starts_at, ends_at, status, cellphone, notes, cancellation_reason, resources(id, name, kind, category, description, capacity, approval_required, is_active)', { count: 'exact' })
    .eq('member_id', request.userId)
    .order('starts_at', { ascending: false })
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load bookings' });
    return;
  }
  const items = (data ?? []).map((booking) => ({ ...booking, resource: booking.resources, resources: undefined }));
  response.json({ items, page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});

bookingsRouter.post('/', async (request, response) => {
  const parsed = createBookingSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid booking request', details: parsed.error.flatten() });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, membership_expires_at')
    .eq('id', request.userId)
    .single();
  if (profileError || !profile) {
    response.status(403).json({ error: 'Profile is not available' });
    return;
  }
  if (new Date(profile.membership_expires_at).getTime() <= Date.now()) {
    response.status(403).json({ error: 'Your membership has expired.' });
    return;
  }
  const startTime = Date.parse(parsed.data.starts_at);
  const endTime = Date.parse(parsed.data.ends_at);
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    response.status(400).json({ error: 'Booking start and end times are invalid.' });
    return;
  }
  if (startTime <= Date.now() || startTime > Date.now() + 30 * 24 * 60 * 60 * 1000) {
    response.status(400).json({ error: 'Bookings must be future-dated and within 30 days.' });
    return;
  }
  if (endTime - startTime < 30 * 60 * 1000 || endTime - startTime > 2 * 60 * 60 * 1000) {
    response.status(400).json({ error: 'Bookings must be between 30 minutes and 2 hours.' });
    return;
  }

  const { data: resource, error: resourceError } = await supabaseAdmin
    .from('resources')
    .select('id, approval_required')
    .eq('id', parsed.data.resource_id)
    .eq('is_active', true)
    .single();
  if (resourceError || !resource) {
    response.status(404).json({ error: 'That resource is not available.' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      member_id: request.userId,
      resource_id: parsed.data.resource_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      cellphone: parsed.data.cellphone,
      notes: parsed.data.notes ?? null,
      status: resource.approval_required ? 'pending' : 'approved',
    })
    .select('id, member_id, resource_id, starts_at, ends_at, status, cellphone, notes, cancellation_reason')
    .single();

  if (error) {
    const messages: Record<string, [number, string]> = {
      '23P01': [409, 'That resource is already requested for this time.'],
      'P0001': [400, 'The requested booking does not meet the operating rules.'],
      '42703': [503, 'The booking database migration has not been applied yet.'],
      '42P01': [503, 'The booking database migration has not been applied yet.'],
      PGRST204: [503, 'The booking database migration has not been applied yet.'],
    };
    const errorCode = error.code ?? Object.keys(messages).find((code) => error.message.includes(code));
    const match = errorCode ? messages[errorCode] : undefined;
    console.error('Booking creation failed', { code: error.code, message: error.message, details: error.details });
    response.status(match?.[0] ?? 500).json({ error: match?.[1] ?? error.message ?? 'Unable to create booking' });
    return;
  }
  const [{ data: resourceDetails }, { data: memberProfile }] = await Promise.all([
    supabaseAdmin.from('resources').select('name').eq('id', parsed.data.resource_id).single(),
    supabaseAdmin.from('profiles').select('full_name').eq('id', request.userId).single(),
  ]);
  const resourceName = resourceDetails?.name ?? 'resource';
  const memberName = memberProfile?.full_name ?? null;
  const staffEmails = await getRoleEmails(['staff', 'admin']);
  await sendToMany(staffEmails, bookingRequestEmail(resourceName, memberName, parsed.data.starts_at, parsed.data.ends_at));
  if (data.status === 'approved') {
    const memberEmail = request.userId ? await getAuthEmail(request.userId) : null;
    if (memberEmail) await sendToMany([memberEmail], bookingStatusEmail(resourceName, 'approved'));
  }
  response.status(201).json(data);
});

bookingsRouter.post('/:bookingId/cancel', async (request, response) => {
  if (!request.userId) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { data: booking, error: lookupError } = await supabaseAdmin
    .from('bookings')
    .select('id, member_id, starts_at, status')
    .eq('id', request.params.bookingId)
    .eq('member_id', request.userId)
    .single();

  if (lookupError || !booking) {
    response.status(404).json({ error: 'Booking not found' });
    return;
  }
  if (booking.status !== 'pending') {
    response.status(409).json({ error: 'Only pending bookings can be cancelled' });
    return;
  }
  if (Date.parse(booking.starts_at) - Date.now() < 2 * 60 * 60 * 1000) {
    response.status(400).json({ error: 'Bookings can only be cancelled at least 2 hours before they start' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: 'Cancelled by member' })
    .eq('id', booking.id)
    .eq('member_id', request.userId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    response.status(500).json({ error: 'Unable to cancel booking' });
    return;
  }
  response.json(data);
});
