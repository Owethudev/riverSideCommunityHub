import { Router } from 'express';
import { adminMembersQuerySchema, paginationQuerySchema } from '@riverside/shared';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/members', async (request, response) => {
  const parsed = adminMembersQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten() });
    return;
  }
  const { page, page_size: pageSize, search, role } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let membersQuery = supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, membership_started_at, membership_expires_at, created_at', { count: 'exact' });
  if (search) membersQuery = membersQuery.ilike('full_name', `%${search}%`);
  if (role) membersQuery = membersQuery.eq('role', role);
  const { data, error, count } = await membersQuery
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load members' });
    return;
  }
  const members = await Promise.all((data ?? []).map(async (profile) => {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    return { ...profile, email: authUser.user?.email ?? null };
  }));
  response.json({ items: members, page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});

adminRouter.get('/donation-interests', async (request, response) => {
  const parsed = paginationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid pagination', details: parsed.error.flatten() });
    return;
  }
  const { page, page_size: pageSize } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabaseAdmin
    .from('donation_interests')
    .select('id, email, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    response.status(500).json({ error: 'Unable to load donation-drive interests' });
    return;
  }
  response.json({ items: data ?? [], page, page_size: pageSize, total: count ?? 0, has_more: to + 1 < (count ?? 0) });
});
