import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@riverside/shared';
import { supabaseAdmin, supabaseAuth } from '../config/supabase.js';

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    response.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  let { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError?.code === 'PGRST116') {
    const { error: createProfileError } = await supabaseAdmin.from('profiles').upsert(
      { id: data.user.id, full_name: data.user.user_metadata.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (!createProfileError) {
      const retry = await supabaseAdmin.from('profiles').select('role').eq('id', data.user.id).single();
      profile = retry.data;
      profileError = retry.error;
    }
  }

  if (profileError || !profile) {
    response.status(403).json({ error: 'Profile is not available' });
    return;
  }

  request.userId = data.user.id;
  request.userRole = profile.role as UserRole;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.userRole || (!roles.includes(request.userRole) && request.userRole !== 'admin')) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
