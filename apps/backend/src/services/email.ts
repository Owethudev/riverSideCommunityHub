import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PromailerResponse {
  success: boolean;
  message?: string;
  data?: { messageId?: string };
}

export class EmailConfigurationError extends Error {
  constructor() {
    super('Email delivery is not configured');
    this.name = 'EmailConfigurationError';
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

export async function sendEmail(input: SendEmailInput): Promise<PromailerResponse> {
  if (!env.API_MAIL_KEY) throw new EmailConfigurationError();

  const response = await fetch(`${env.PROMAILER_API_URL}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.API_MAIL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...input, from: env.MAIL_FROM }),
  });

  const body = (await response.json()) as PromailerResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.message ?? `Email provider returned HTTP ${response.status}`);
  }
  return body;
}

export async function sendToMany(recipients: string[], content: Pick<SendEmailInput, 'subject' | 'html' | 'text'>): Promise<{ sent: number; failed: number }> {
  if (!env.API_MAIL_KEY) throw new EmailConfigurationError();
  const results = await Promise.allSettled(recipients.map((to) => sendEmail({ to, ...content })));
  return {
    sent: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}

export function welcomeEmail(fullName: string | null): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  const greeting = fullName ? `Hi ${fullName},` : 'Welcome,';
  const htmlGreeting = fullName ? `Hi ${escapeHtml(fullName)},` : 'Welcome,';
  return {
    subject: 'Welcome to Riverside Community Hub',
    html: `<h1>Welcome to Riverside Community Hub</h1><p>${htmlGreeting}</p><p>Your account is ready. You can now explore facilities, manage your profile, and take part in community programmes.</p>`,
    text: `Welcome to Riverside Community Hub\n\n${greeting}\nYour account is ready. You can now explore facilities, manage your profile, and take part in community programmes.`,
  };
}

export function bookingStatusEmail(resourceName: string, status: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  return {
    subject: `Booking update: ${resourceName}`,
    html: `<h1>Booking update</h1><p>Your booking for <strong>${resourceName}</strong> is now <strong>${status}</strong>.</p>`,
    text: `Booking update\n\nYour booking for ${resourceName} is now ${status}.`,
  };
}

export function bookingRequestEmail(resourceName: string, memberName: string | null, startsAt: string, endsAt: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  const requester = memberName ? ` from ${escapeHtml(memberName)}` : '';
  return {
    subject: `New booking request: ${resourceName}`,
    html: `<h1>New booking request</h1><p>A new request${requester} has been submitted for <strong>${escapeHtml(resourceName)}</strong>.</p><p>${escapeHtml(startsAt)} to ${escapeHtml(endsAt)}</p><p>Review it in the staff booking queue.</p>`,
    text: `New booking request\n\nA new request${memberName ? ` from ${memberName}` : ''} has been submitted for ${resourceName}.\n${startsAt} to ${endsAt}\n\nReview it in the staff booking queue.`,
  };
}

export async function getAuthEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user.email ?? null;
}

export async function getRoleEmails(roles: Array<'staff' | 'admin'>): Promise<string[]> {
  const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id, role').in('role', roles);
  if (error) return [];
  const results = await Promise.all((profiles ?? []).map((profile) => getAuthEmail(profile.id)));
  return results.filter((email): email is string => Boolean(email));
}

export function donationReceivedEmail(campaignName: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  return {
    subject: `Donation received: ${campaignName}`,
    html: `<h1>Thank you for your donation</h1><p>We received your contribution to <strong>${campaignName}</strong>.</p>`,
    text: `Thank you for your donation\n\nWe received your contribution to ${campaignName}.`,
  };
}

export function donationInterestEmail(email: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  return {
    subject: 'New donation drive interest',
    html: `<h1>New donation drive interest</h1><p><strong>${escapeHtml(email)}</strong> has registered interest in the Riverside Community Hub donation drive.</p>`,
    text: `New donation drive interest\n\n${email} has registered interest in the Riverside Community Hub donation drive.`,
  };
}
