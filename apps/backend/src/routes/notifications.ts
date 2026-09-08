import { Router } from 'express';
import { paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', async (request, response) => {
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
    .from('notifications')
    .select('id, title, message, read_at, created_at', { count: 'exact' })
    .eq('user_id', request.userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load notifications' });
    return;
  }
  response.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});

notificationsRouter.post('/:notificationId/read', async (request, response) => {
  if (!request.userId) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', request.params.notificationId)
    .eq('user_id', request.userId)
    .select('id, title, message, read_at, created_at')
    .single();

  if (error) {
    response.status(404).json({ error: 'Notification not found' });
    return;
  }
  response.json(data);
});
