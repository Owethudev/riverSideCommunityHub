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

export interface NavItem {
  label: string;
  path: string;
}
