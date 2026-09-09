import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const { bookingStatusEmail, donationInterestEmail, welcomeEmail } = await import('../src/services/email.js');

test('welcome email uses the Riverside shell and escapes member names', () => {
  const content = welcomeEmail('<Ada>');

  assert.equal(content.subject, 'Welcome to Riverside Community Hub');
  assert.match(content.html, /Riverside<br>Community Hub/);
  assert.match(content.html, /Hi &lt;Ada&gt;/);
  assert.doesNotMatch(content.html, /Hi <Ada>/);
});

test('booking status email escapes dynamic booking values', () => {
  const content = bookingStatusEmail('Hall & Room', 'approved <now>');

  assert.match(content.html, /Hall &amp; Room/);
  assert.match(content.html, /approved &lt;now&gt;/);
  assert.match(content.text ?? '', /Hall & Room/);
});

test('donation interest email formats the pledged amount', () => {
  const content = donationInterestEmail('donor@example.com', 250.5);

  assert.match(content.html, /Pledged amount: <strong>R250\.50<\/strong>/);
  assert.match(content.text ?? '', /Pledged amount: R250\.50/);
  assert.match(content.html, /#ff3b30/);
});
