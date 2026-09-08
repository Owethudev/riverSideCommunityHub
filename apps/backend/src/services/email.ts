import { env } from '../config/env.js';

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

export function donationReceivedEmail(campaignName: string): Pick<SendEmailInput, 'subject' | 'html' | 'text'> {
  return {
    subject: `Donation received: ${campaignName}`,
    html: `<h1>Thank you for your donation</h1><p>We received your contribution to <strong>${campaignName}</strong>.</p>`,
    text: `Thank you for your donation\n\nWe received your contribution to ${campaignName}.`,
  };
}
