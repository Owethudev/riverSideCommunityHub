import { Router } from 'express';
import { bookingDecisionSchema, paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { bookingStatusEmail, getAuthEmail, sendToMany } from '../services/email.js';

export const staffBookingsRouter = Router();
staffBookingsRouter.use(requireAuth, requireRole('staff', 'admin'));

staffBookingsRouter.get('/', async (request, response) => {
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
    .select('id, member_id, resource_id, starts_at, ends_at, status, notes, cancellation_reason, profiles!bookings_member_id_fkey(full_name), resources(id, name, kind, category, description, capacity, approval_required, is_active)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at')
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load booking requests' });
    return;
  }
  response.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});

staffBookingsRouter.patch('/:bookingId', async (request, response) => {
  const parsed = bookingDecisionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid booking decision', details: parsed.error.flatten() });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ status: parsed.data.status, cancellation_reason: parsed.data.reason ?? null, reviewed_by: request.userId })
    .eq('id', request.params.bookingId)
    .eq('status', 'pending')
    .select('id, member_id, resource_id, starts_at, ends_at, status, notes, cancellation_reason')
    .single();

  if (error) {
    if (error.code === '23P01') {
      response.status(409).json({ error: 'This booking conflicts with another active booking' });
      return;
    }
    response.status(500).json({ error: 'Unable to update booking request' });
    return;
  }
  const [{ data: resource }, memberEmail] = await Promise.all([
    supabaseAdmin.from('resources').select('name').eq('id', data.resource_id).single(),
    getAuthEmail(data.member_id),
  ]);
  if (memberEmail) {
    await sendToMany([memberEmail], bookingStatusEmail(resource?.name ?? 'resource', data.status));
  }
  response.json(data);
});
