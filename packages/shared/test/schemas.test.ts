import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adminMembersQuerySchema,
  bookingDecisionSchema,
  createBookingSchema,
  donationInterestSchema,
  paginationQuerySchema,
} from '../src/index.js';

test('donation interest accepts and coerces a positive amount', () => {
  const result = donationInterestSchema.safeParse({ email: 'donor@example.com', amount: '250.50' });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.amount, 250.5);
  }
});

test('donation interest rejects invalid email and non-positive amounts', () => {
  assert.equal(donationInterestSchema.safeParse({ email: 'not-an-email', amount: 100 }).success, false);
  assert.equal(donationInterestSchema.safeParse({ email: 'donor@example.com', amount: 0 }).success, false);
  assert.equal(donationInterestSchema.safeParse({ email: 'donor@example.com', amount: -5 }).success, false);
  assert.equal(donationInterestSchema.safeParse({ email: 'donor@example.com' }).success, false);
});

test('admin member queries trim filters and apply pagination defaults', () => {
  const result = adminMembersQuerySchema.parse({ search: '  Ada  ', role: 'staff' });

  assert.deepEqual(result, { page: 1, page_size: 20, search: 'Ada', role: 'staff' });
});

test('pagination rejects page sizes above the API limit', () => {
  assert.equal(paginationQuerySchema.safeParse({ page: 1, page_size: 51 }).success, false);
});

test('booking decisions only allow approval or rejection', () => {
  assert.equal(bookingDecisionSchema.safeParse({ status: 'approved' }).success, true);
  assert.equal(bookingDecisionSchema.safeParse({ status: 'pending' }).success, false);
});

test('booking requests require a valid cellphone number', () => {
  const booking = {
    resource_id: '00000000-0000-0000-0000-000000000001',
    starts_at: '2026-09-10T10:00:00.000Z',
    ends_at: '2026-09-10T11:00:00.000Z',
    cellphone: '+27 82 123 4567',
  };

  assert.equal(createBookingSchema.safeParse(booking).success, true);
  assert.equal(createBookingSchema.safeParse({ ...booking, cellphone: 'not-a-phone' }).success, false);
});
