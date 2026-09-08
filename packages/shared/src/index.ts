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

export const resourceKindSchema = z.enum(['room', 'equipment']);
export type ResourceKind = z.infer<typeof resourceKindSchema>;

export const resourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: resourceKindSchema,
  category: z.string(),
  description: z.string().nullable(),
  capacity: z.number().int().positive(),
  approval_required: z.boolean(),
  is_active: z.boolean(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const bookingSchema = z.object({
  id: z.string().uuid(),
  member_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  status: bookingStatusSchema,
  notes: z.string().nullable(),
  cancellation_reason: z.string().nullable().optional(),
  resource: resourceSchema.optional(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const createBookingSchema = z.object({
  resource_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().trim().max(1000).nullable().optional(),
});
export type CreateBooking = z.infer<typeof createBookingSchema>;

export const bookingDecisionSchema = z.object({
  status: z.enum(['approved', 'declined']),
  reason: z.string().trim().max(500).nullable().optional(),
});
export type BookingDecision = z.infer<typeof bookingDecisionSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  items: z.array(itemSchema),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  has_more: z.boolean(),
});

export const notificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  role: userRoleSchema,
  membership_started_at: z.string().datetime(),
  membership_expires_at: z.string().datetime(),
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

export const donationInterestSchema = z.object({
  email: z.string().email(),
});
export type DonationInterest = z.infer<typeof donationInterestSchema>;

export interface NavItem {
  label: string;
  path: string;
}
