import { Router } from 'express';
import { paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const staffDashboardRouter = Router();
staffDashboardRouter.use(requireAuth, requireRole('staff', 'admin'));

staffDashboardRouter.get('/booking-decisions', async (request, response) => {
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
    .select('id, member_id, resource_id, starts_at, ends_at, status, cellphone, reviewed_by, reviewed_at, profiles!bookings_member_id_fkey(full_name), reviewer:profiles!bookings_reviewed_by_fkey(full_name), resources(name)', { count: 'exact' })
    .in('status', ['approved', 'declined'])
    .not('reviewed_by', 'is', null)
    .order('reviewed_at', { ascending: false })
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load booking decisions' });
    return;
  }
  response.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});
