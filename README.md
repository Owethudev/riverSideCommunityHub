

Riverside Community Hub is a membership, facility booking, events, and donation platform for a community centre.

## Deployed Site

[Open Riverside Community Hub](https://river-side-community-hub-frontend.vercel.app/)

## Features

### Public visitors

- Browse community facilities and equipment.
- View facility details, capacity, approval requirements, and availability.
- View upcoming community events.
- Register interest in the donation drive with a pledged amount.
- Create a Riverside Community Hub account.

### Members

- Sign up and log in securely with Supabase Auth.
- Manage a member profile.
- View membership status and expiry warnings.
- Request room and equipment bookings.
- Add a cellphone number and notes to booking requests.
- Check booking availability before submitting a request.
- View booking history and cancel pending requests.
- Receive booking status notifications.

### Staff and administrators

- Review pending booking requests.
- Approve or reject bookings.
- View booking history and member cellphone details.
- Search and filter the member directory.
- Use pagination across large lists.
- Create community events with optional poster images.
- Minimize the event creation form while working.
- Delete posted community events.

### Administrator features

- Export booking history as a CSV file.
- View member and donation-interest records.
- Access all staff capabilities through role-protected routes.

## How It Works

1. A visitor opens the deployed site and browses facilities, equipment, and community events.
2. The visitor creates an account through Supabase Auth.
3. The member selects a resource, chooses a date and time, and submits a booking request with their cellphone number.
4. The system checks membership status, opening hours, booking duration, and conflicts before saving the request.
5. Staff review pending requests and approve or reject them.
6. Members receive status updates and can view their booking history.
7. Donation-drive interest submissions are saved with the donor email and pledged amount, and staff are notified.
8. Staff and administrators manage community events from the dashboard.
9. Administrators can export booking history for reporting.

## Access To Staff And Admin Features

The public site is available at:

[https://river-side-community-hub-frontend.vercel.app/](https://river-side-community-hub-frontend.vercel.app/)

If you need staff or administrator privileges for testing, please contact:

**jezileowethu@gmail.com**

Please do not share passwords, service keys, or other private credentials by email.
