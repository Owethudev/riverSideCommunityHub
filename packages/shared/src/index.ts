import { z } from 'zod';

export const userRoleSchema = z.enum(['member', 'staff', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('riverside-community-hub-api'),
  timestamp: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const bookingStatusSchema = z.enum(['pending', 'approved', 'declined', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  role: userRoleSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const authCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

export interface NavItem {
  label: string;
  path: string;
}
