import { Router } from 'express';
import { createCommunityEventSchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (_request, response) => {
  const { data, error } = await supabaseAdmin
    .from('community_events')
    .select('id, title, poster_url, starts_at, ends_at, venue, created_by, created_at')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(20);
  if (error) {
    response.status(500).json({ error: 'Unable to load community events' });
    return;
  }
  response.json({ items: data ?? [] });
});

eventsRouter.post('/', requireAuth, requireRole('staff', 'admin'), async (request, response) => {
  const parsed = createCommunityEventSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Enter an event name, start date/time, and venue.', details: parsed.error.flatten() });
    return;
  }
  if (Date.parse(parsed.data.starts_at) <= Date.now()) {
    response.status(400).json({ error: 'Event start must be in the future.' });
    return;
  }
  if (parsed.data.ends_at && Date.parse(parsed.data.ends_at) <= Date.parse(parsed.data.starts_at)) {
    response.status(400).json({ error: 'Event end must be after the start.' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('community_events')
    .insert({ ...parsed.data, poster_url: parsed.data.poster_url ?? null, ends_at: parsed.data.ends_at ?? null, created_by: request.userId })
    .select('id, title, poster_url, starts_at, ends_at, venue, created_by, created_at')
    .single();
  if (error) {
    response.status(500).json({ error: 'Unable to create community event' });
    return;
  }
  response.status(201).json(data);
});

eventsRouter.delete('/:eventId', requireAuth, requireRole('staff', 'admin'), async (request, response) => {
  const { error } = await supabaseAdmin
    .from('community_events')
    .delete()
    .eq('id', request.params.eventId);
  if (error) {
    response.status(500).json({ error: 'Unable to delete community event' });
    return;
  }
  response.status(204).send();
});
