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

function emailLayout(eyebrow: string, title: string, content: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head><body style="margin:0;background-color:#d1d1d5;color:#111111;font-family:Arial,'Helvetica Neue',sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#d1d1d5;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#f7f7f5;border:3px solid #111111;"><tr><td style="padding:20px 22px;border-bottom:3px solid #111111;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Impact,'Arial Narrow',Arial,sans-serif;font-size:20px;line-height:20px;font-weight:900;text-transform:uppercase;">Riverside<br>Community Hub</td><td align="right"><span style="display:inline-block;background-color:#ff3b30;border:2px solid #111111;padding:9px 8px;font-family:Impact,'Arial Narrow',Arial,sans-serif;font-size:18px;line-height:18px;">RH</span></td></tr></table></td></tr><tr><td style="padding:28px 22px 30px;"><p style="margin:0 0 10px;color:#d92d24;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p><h1 style="margin:0 0 22px;font-family:Impact,'Arial Narrow',Arial,sans-serif;font-size:42px;line-height:40px;font-weight:900;text-transform:uppercase;">${escapeHtml(title)}</h1>${content}</td></tr><tr><td style="padding:16px 22px;border-top:3px solid #111111;color:#5f5f63;font-size:11px;line-height:17px;">Riverside Community Hub / Community, shared.</td></tr></table></td></tr></table></body></html>`;
}

function emailText(text: string): string {
  return `<p style="margin:0 0 18px;color:#111111;font-size:16px;line-height:25px;">${text}</p>`;
}

function emailDetail(text: string): string {
  return `<p style="margin:0 0 18px;padding:14px 16px;border-left:6px solid #ff3b30;background-color:#ffffff;color:#111111;font-size:15px;line-height:23px;">${text}</p>`;
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
    html: emailLayout('Welcome / Riverside', 'Welcome to Riverside Community Hub', `${emailText(htmlGreeting)}${emailText('Your account is ready. You can now explore facilities, manage your profile, and take part in community programmes.')}`),
    text: `Welcome to Riverside Community Hub\n\n${greeting}\nYour account is ready. You can now explore facilities, manage your profile, and take part in community programmes.`,
  };
}

export function bookingStatusEmail(resourceName: string, status: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  const safeResourceName = escapeHtml(resourceName);
  const safeStatus = escapeHtml(status);
  return {
    subject: `Booking update: ${resourceName}`,
    html: emailLayout('Booking / Update', 'Booking update', emailText(`Your booking for <strong>${safeResourceName}</strong> is now <strong>${safeStatus}</strong>.`)),
    text: `Booking update\n\nYour booking for ${resourceName} is now ${status}.`,
  };
}

export function bookingRequestEmail(resourceName: string, memberName: string | null, startsAt: string, endsAt: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  const requester = memberName ? ` from ${escapeHtml(memberName)}` : '';
  const safeResourceName = escapeHtml(resourceName);
  return {
    subject: `New booking request: ${resourceName}`,
    html: emailLayout('Booking / Staff action', 'New booking request', `${emailText(`A new request${requester} has been submitted for <strong>${safeResourceName}</strong>.`)}${emailDetail(`${escapeHtml(startsAt)} to ${escapeHtml(endsAt)}`)}${emailText('Review it in the staff booking queue.')}`),
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
  const safeCampaignName = escapeHtml(campaignName);
  return {
    subject: `Donation received: ${campaignName}`,
    html: emailLayout('Donations / Thank you', 'Thank you for your donation', emailText(`We received your contribution to <strong>${safeCampaignName}</strong>.`)),
    text: `Thank you for your donation\n\nWe received your contribution to ${campaignName}.`,
  };
}

export function donationInterestEmail(email: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  return {
    subject: 'New donation drive interest',
    html: emailLayout('Donations / Staff action', 'New donation drive interest', emailText(`<strong>${escapeHtml(email)}</strong> has registered interest in the Riverside Community Hub donation drive.`)),
    text: `New donation drive interest\n\n${email} has registered interest in the Riverside Community Hub donation drive.`,
  };
}
