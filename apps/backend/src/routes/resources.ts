import { Router } from 'express';
import { paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';

export const resourcesRouter = Router();

resourcesRouter.get('/', async (request, response) => {
  const parsed = paginationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten() });
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabaseAdmin
    .from('resources')
    .select('id, name, kind, category, description, capacity, approval_required, is_active', { count: 'exact' })
    .eq('is_active', true)
    .order('kind')
    .order('name')
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load resources' });
    return;
  }
  response.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});

resourcesRouter.get('/:resourceId/availability', async (request, response) => {
  const start = typeof request.query.start === 'string' ? request.query.start : undefined;
  const end = typeof request.query.end === 'string' ? request.query.end : undefined;
  if (!start || !end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) {
    response.status(400).json({ error: 'Valid start and end query parameters are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, starts_at, ends_at, status')
    .eq('resource_id', request.params.resourceId)
    .in('status', ['pending', 'approved'])
    .lt('starts_at', end)
    .gt('ends_at', start)
    .order('starts_at');

  if (error) {
    response.status(500).json({ error: 'Unable to load resource availability' });
    return;
  }
  response.json({ resource_id: request.params.resourceId, start, end, bookings: data ?? [] });
});
