import { Router } from 'express';
import { donationInterestSchema } from '@riverside/shared';
import { getRoleEmails, donationInterestEmail, sendToMany } from '../services/email.js';
import { supabaseAdmin } from '../config/supabase.js';

export const donationsRouter = Router();

donationsRouter.post('/interest', async (request, response) => {
  const parsed = donationInterestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }

  try {
    const { error: saveError } = await supabaseAdmin.from('donation_interests').insert({ email: parsed.data.email });
    if (saveError) {
      response.status(503).json({ error: 'Donation interest storage is not configured yet.' });
      return;
    }
    const { error: donationError } = await supabaseAdmin.from('donations').insert({
      donor_email: parsed.data.email,
      amount: parsed.data.amount,
      status: 'pledged',
    });
    if (donationError) {
      console.error('Donation pledge storage failed', donationError);
      response.status(503).json({ error: 'Donation interest storage is not configured yet.' });
      return;
    }
    const staffEmails = await getRoleEmails(['staff', 'admin']);
    if (staffEmails.length > 0) {
      try {
        await sendToMany(staffEmails, donationInterestEmail(parsed.data.email, parsed.data.amount));
      } catch (emailError) {
        console.error('Donation interest email delivery failed', emailError);
      }
    }
    response.status(202).json({ submitted: true });
  } catch (error) {
    console.error('Donation interest delivery failed', error);
    response.status(500).json({ error: 'We could not save your donation interest. Please try again.' });
  }
});
