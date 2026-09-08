import cors from 'cors';
import express from 'express';
import { healthResponseSchema } from '@riverside/shared';
import { env } from './config/env.js';
import { profileRouter } from './routes/profile.js';
import { emailRouter } from './routes/email.js';
import { resourcesRouter } from './routes/resources.js';
import { bookingsRouter } from './routes/bookings.js';
import { staffBookingsRouter } from './routes/staffBookings.js';
import { notificationsRouter } from './routes/notifications.js';
import { donationsRouter } from './routes/donations.js';
import { staffDashboardRouter } from './routes/staffDashboard.js';
import { adminRouter } from './routes/admin.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api/profile', profileRouter);
app.use('/api/email', emailRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/staff/bookings', staffBookingsRouter);
app.use('/api/staff/dashboard', staffDashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/donations', donationsRouter);

app.get('/', (_request, response) => {
  response.json({
    service: 'riverside-community-hub-api',
    message: 'Riverside Community Hub API is running',
    health: '/api/health',
  });
});

app.get('/api/health', (_request, response) => {
  const payload = healthResponseSchema.parse({
    status: 'ok',
    service: 'riverside-community-hub-api',
    timestamp: new Date().toISOString(),
  });

  response.json(payload);
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});
