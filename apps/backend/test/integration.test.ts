import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const integrationConfig = {
  url: process.env.TEST_SUPABASE_URL,
  anonKey: process.env.TEST_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
  memberToken: process.env.TEST_MEMBER_TOKEN,
  memberId: process.env.TEST_MEMBER_ID,
  otherMemberToken: process.env.TEST_OTHER_MEMBER_TOKEN,
};
const integrationEnabled = Object.values(integrationConfig).every(Boolean);
const integrationSkip = integrationEnabled ? false : 'Set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY, TEST_MEMBER_TOKEN, TEST_MEMBER_ID, and TEST_OTHER_MEMBER_TOKEN to run Supabase integration tests.';

test('protected booking routes reject unauthenticated requests', { skip: integrationSkip }, async () => {
  process.env.SUPABASE_URL = integrationConfig.url;
  process.env.SUPABASE_ANON_KEY = integrationConfig.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = integrationConfig.serviceRoleKey;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  const { app } = await import('../src/app.js');
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/bookings`);
  assert.equal(response.status, 401);
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('booking route validates required cellphone input', { skip: integrationSkip }, async () => {
  process.env.SUPABASE_URL = integrationConfig.url;
  process.env.SUPABASE_ANON_KEY = integrationConfig.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = integrationConfig.serviceRoleKey;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  const { app } = await import('../src/app.js');
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${integrationConfig.memberToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resource_id: '00000000-0000-0000-0000-000000000001', starts_at: '2030-09-10T10:00:00.000Z', ends_at: '2030-09-10T11:00:00.000Z' }),
  });
  assert.equal(response.status, 400);
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('admin-only booking export rejects a member token', { skip: integrationSkip }, async () => {
  process.env.SUPABASE_URL = integrationConfig.url;
  process.env.SUPABASE_ANON_KEY = integrationConfig.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = integrationConfig.serviceRoleKey;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  const { app } = await import('../src/app.js');
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/staff/bookings/export.csv`, { headers: { Authorization: `Bearer ${integrationConfig.memberToken}` } });
  assert.equal(response.status, 403);
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('RLS limits authenticated members to their own bookings', { skip: integrationSkip }, async () => {
  const memberClient = createClient(integrationConfig.url!, integrationConfig.anonKey!, { global: { headers: { Authorization: `Bearer ${integrationConfig.memberToken}` } } });
  const otherMemberClient = createClient(integrationConfig.url!, integrationConfig.anonKey!, { global: { headers: { Authorization: `Bearer ${integrationConfig.otherMemberToken}` } } });
  const [memberResult, otherMemberResult] = await Promise.all([
    memberClient.from('bookings').select('member_id'),
    otherMemberClient.from('bookings').select('member_id'),
  ]);
  assert.equal(memberResult.error, null);
  assert.equal(otherMemberResult.error, null);
  assert.ok((memberResult.data ?? []).every((booking) => booking.member_id === integrationConfig.memberId));
  assert.ok((otherMemberResult.data ?? []).every((booking) => booking.member_id !== integrationConfig.memberId));
});
