import { Router } from 'express';
import { updateProfileSchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get('/', async (request, response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, created_at, updated_at')
    .eq('id', request.userId)
    .single();

  if (error) {
    response.status(404).json({ error: 'Profile not found' });
    return;
  }
  response.json(data);
});

profileRouter.patch('/', async (request, response) => {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid profile data', details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(parsed.data)
    .eq('id', request.userId)
    .select('id, full_name, role, created_at, updated_at')
    .single();

  if (error) {
    response.status(500).json({ error: 'Unable to update profile' });
    return;
  }
  response.json(data);
});
