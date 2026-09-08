import { Router } from 'express';
import { supabaseAuth, supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { EmailConfigurationError, sendEmail, welcomeEmail } from '../services/email.js';

export const emailRouter = Router();
emailRouter.use(requireAuth);

emailRouter.post('/welcome', async (request, response) => {
  try {
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(
      request.headers.authorization!.replace(/^Bearer\s+/i, ''),
    );
    if (userError || !userData.user?.email) {
      response.status(400).json({ error: 'Authenticated email address is unavailable' });
      return;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, welcome_email_sent_at')
      .eq('id', request.userId)
      .single();

    if (profileError || !profile) {
      response.status(404).json({ error: 'Profile not found' });
      return;
    }
    if (profile.welcome_email_sent_at) {
      response.status(200).json({ sent: false, message: 'Welcome email already sent' });
      return;
    }

    await sendEmail({ to: userData.user.email, ...welcomeEmail(profile.full_name) });
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', request.userId);

    if (updateError) {
      response.status(500).json({ error: 'Email sent but delivery status could not be saved' });
      return;
    }
    response.status(202).json({ sent: true });
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      response.status(503).json({ error: error.message });
      return;
    }
    console.error('Promailer delivery failed', error);
    response.status(502).json({ error: 'Email delivery failed' });
  }
});
