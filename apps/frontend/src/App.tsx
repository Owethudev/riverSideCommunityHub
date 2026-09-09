import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
/* eslint-disable no-control-regex */
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import type { Booking, CommunityEvent, Notification, Resource } from '@riverside/shared';
import { env } from './config/env';
import { readApiResponse } from './lib/api';
import { AdminDonationInterests, AdminMembers } from './admin/AdminLists';
import { supabase } from './lib/supabase';

type PageKind = 'public' | 'member' | 'staff';

const navigation: Record<PageKind, { label: string; path: string }[]> = {
  public: [
    { label: 'Home', path: '/' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'Donation Drive', path: '/donation-drive' },
  ],
  member: [
    { label: 'Dashboard', path: '/member/dashboard' },
    { label: 'My Profile', path: '/member/profile' },
    { label: 'My Bookings', path: '/member/bookings' },
  ],
  staff: [
    { label: 'Dashboard', path: '/staff/dashboard' },
    { label: 'Booking Requests', path: '/staff/booking-requests' },
  ],
};

const adminNavigation = [
  { label: 'Dashboard', path: '/staff/dashboard' },
  { label: 'Booking Requests', path: '/staff/booking-requests' },
  { label: 'Members', path: '/staff/members' },
  { label: 'Donations', path: '/staff/donations' },
];

function Layout() {
  const { user, role, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const canAccessStaffNavigation = role === 'staff';
  return (
    <div className="app-shell min-h-screen bg-slate-50">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand-mark" to="/" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark__number">RH</span>
            <span>Riverside<br />Community Hub</span>
          </NavLink>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
            <span>{menuOpen ? 'Close' : 'Menu'}</span><span aria-hidden="true" className="menu-toggle__icon">{menuOpen ? '×' : '≡'}</span>
          </button>
          <nav aria-label="Account navigation" className="account-nav">
            {user ? <button className="text-button" type="button" onClick={() => void signOut()}>Log out</button> : <><NavLink className="text-button" to="/login">Log in</NavLink><NavLink className="button button--small" to="/sign-up">Sign up</NavLink></>}
          </nav>
        </div>
      </header>
      <div className="app-layout">
        <aside id="main-navigation" aria-label="Main navigation" className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`}>
          <NavigationGroup title="Public" items={navigation.public} onNavigate={() => setMenuOpen(false)} />
          <NavigationGroup title="Member" items={navigation.member} onNavigate={() => setMenuOpen(false)} />
          {canAccessStaffNavigation && <NavigationGroup title="Staff and admin" items={navigation.staff} onNavigate={() => setMenuOpen(false)} />}
          {role === 'admin' && <NavigationGroup title="Admin" items={adminNavigation} onNavigate={() => setMenuOpen(false)} />}
        </aside>
        <main id="main-content" className="main-content" onClick={() => menuOpen && setMenuOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavigationGroup({ title, items, onNavigate }: { title: string; items: { label: string; path: string }[]; onNavigate: () => void }) {
  return (
    <section className="nav-group" aria-labelledby={`${title}-navigation`}>
      <h2 id={`${title}-navigation`} className="nav-group__title">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Page({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      {children}
    </div>
  );
}

function Home() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void fetch(`${env.VITE_API_URL}/api/events`)
      .then((response) => readApiResponse<{ items?: CommunityEvent[] }>(response))
      .then((result) => setEvents(result.items ?? []))
      .catch((reason: Error) => setError(reason.message));
  }, []);
  return <Page title="Welcome to Riverside Community Hub" description="A shared space for local people, groups, and community programmes.">
    <section className="rounded border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Get involved</h2>
      <p className="mt-2 text-slate-600">Explore facilities, make a donation, or create an account to manage bookings.</p>
    </section>
    <section><h2 className="text-2xl font-semibold">Upcoming community events</h2>{error && <ErrorState message={error} />}{!error && events.length === 0 && <EmptyState message="No upcoming events have been posted yet." />}<div className="mt-4 grid gap-4 md:grid-cols-2">{events.map((event) => <article className="overflow-hidden rounded border border-slate-200 bg-white" key={event.id}>{event.poster_url && <img className="h-40 w-full object-cover" src={event.poster_url} alt={`Poster for ${event.title}`} />}<div className="p-5"><h3 className="text-xl font-semibold">{event.title}</h3><p className="mt-2">{new Date(event.starts_at).toLocaleString()}</p><p className="text-slate-600">{event.venue}</p></div></article>)}</div></section>
  </Page>;
}

function Facilities() {
  const { session } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ name: string; src: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const options = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : undefined;
    void fetch(`${env.VITE_API_URL}/api/resources`, options)
      .then((response) => readApiResponse<{ items?: Resource[] }>(response))
      .then((result) => setResources(result.items ?? []))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [session]);
  return <Page title="Facilities and equipment" description="Browse bookable rooms and equipment.">
    {loading && <LoadingState />}{error && <ErrorState message={error} />}{!loading && !error && resources.length === 0 && <EmptyState message="No resources are currently available." />}
    <div className="grid gap-4 md:grid-cols-2">{resources.map((resource) => { const image = facilityImages[resource.name]; return <section className="rounded border border-slate-200 bg-white p-5" key={resource.id}><h2 className="text-xl font-semibold">{resource.name}</h2><p className="mt-1 text-sm text-slate-500">{resource.kind} · Capacity {resource.capacity}</p><p className="mt-3 text-slate-600">{resource.description}</p><p className="mt-3 text-sm">{resource.approval_required ? 'Staff approval required' : 'Usually approved automatically'}</p>{image && <button className="mt-4 rounded border border-slate-400 px-3 py-2" type="button" onClick={() => setSelectedImage({ name: resource.name, src: image })}>View image</button>}</section>; })}</div>
    {selectedImage && <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-6" role="dialog" aria-modal="true" aria-label={`${selectedImage.name} image`}><div className="max-h-full max-w-3xl rounded bg-white p-4"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{selectedImage.name}</h2><button className="rounded border border-slate-400 px-3 py-1" type="button" onClick={() => setSelectedImage(null)}>Close</button></div><img className="mt-4 max-h-[70vh] w-full object-contain" src={selectedImage.src} alt={selectedImage.name} /></div></div>}
  </Page>;
}

const facilityImages: Record<string, string> = {
  'Riverside Meeting Room': '/images/meetingRoom.jpg',
  'Community Hall': '/images/communityHall.jpg',
  'Training Room': '/images/trainingRoom.jpg',
  'Audio-Visual Equipment': '/images/audioVisualEquipment.jpg',
  'Fitness Equipment': '/images/fitnessEquipment.jpg',
};

function DonationDrive() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${env.VITE_API_URL}/api/donations/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      await readApiResponse<{ submitted: boolean }>(response);
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit your interest.');
    }
  };
  return <Page title="Donation Drive" description="Support local initiatives by contributing requested goods or funds.">
    {submitted ? <p role="status" className="rounded border border-green-200 bg-green-50 p-6 text-green-800">Thank you. Your interest has been sent to the Riverside Community Hub team.</p> : <FormCard title="Register your interest" onSubmit={submit}><label className="block"><span className="font-medium">Email address</span><input required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="email" /></label>{error && <ErrorState message={error} />}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Submit interest</button></FormCard>}
  </Page>;
}

function AuthPage({ signUp = false }: { signUp?: boolean }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (signUp) {
        const result = await auth.signUp(email, password, fullName);
        setMessage(result.needsEmailConfirmation ? 'Check your email to verify your account.' : 'Account created.');
      } else {
        await auth.signIn(email, password);
        navigate('/member/dashboard');
      }
    } catch { /* AuthContext exposes the user-facing error. */ }
  };
  return <Page title={signUp ? 'Create an account' : 'Log in'} {...(signUp ? { description: 'Join Riverside Community Hub to manage your community activity.' } : {})}>
    <FormCard title={signUp ? 'Account details' : 'Your details'} onSubmit={submit}>
      {signUp && <label className="block"><span className="font-medium">Full name</span><input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="text" /></label>}
      <label className="block"><span className="font-medium">Email address</span><input required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="email" /></label>
      <label className="block"><span className="font-medium">Password</span><input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="password" /></label>
      {auth.error && <ErrorState message={auth.error} />}
      {message && <p role="status" className="text-green-700">{message}</p>}
      <button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">{signUp ? 'Create account' : 'Log in'}</button>
    </FormCard>
  </Page>;
}

function MemberDashboard() {
  const { loading, user, session } = useAuth();
  const [profile, setProfile] = useState<{ membership_expires_at: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    void Promise.all([
      fetch(`${env.VITE_API_URL}/api/profile`, { headers }).then((response) => readApiResponse<{ membership_expires_at: string }>(response)),
      fetch(`${env.VITE_API_URL}/api/notifications`, { headers }).then((response) => readApiResponse<{ items?: Notification[] }>(response)),
    ]).then(([nextProfile, nextNotifications]) => { setProfile(nextProfile); setNotifications(nextNotifications.items ?? []); }).catch(() => { setProfile(null); setNotifications([]); });
  }, [session]);
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  const daysRemaining = profile ? Math.ceil((Date.parse(profile.membership_expires_at) - Date.now()) / 86400000) : null;
  return <Page title="Member dashboard" description="A summary of your community hub activity.">{daysRemaining !== null && daysRemaining <= 30 && <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">Your membership expires in {Math.max(daysRemaining, 0)} days.</p>}<section className="rounded border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Notifications</h2>{notifications.length === 0 ? <EmptyState message="You have no notifications." /> : <ul className="mt-3 space-y-3">{notifications.slice(0, 5).map((notification) => <li className="border-b border-slate-200 pb-3" key={notification.id}><strong>{notification.title}</strong><p className="text-slate-600">{notification.message}</p></li>)}</ul>}</section></Page>;
}
function Profile() {
  const { session, loading, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    void fetch(`${env.VITE_API_URL}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((response) => readApiResponse<{ full_name: string | null }>(response))
      .then((profile) => setFullName(profile.full_name ?? ''))
      .catch((reason: Error) => setError(reason.message));
  }, [session]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    const response = await fetch(`${env.VITE_API_URL}/api/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ full_name: fullName }) });
    if (!response.ok) {
      const body = await response.json() as { error?: string };
      setError(body.error ?? 'Unable to save profile.');
      setMessage(null);
      return;
    }
    setError(null);
    setMessage('Profile saved.');
  };
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  return <Page title="My profile" description="Review and update your account details."><FormCard title="Profile details" onSubmit={save}>{error && <ErrorState message={error} />}<label className="block"><span className="font-medium">Full name</span><input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="text" /></label>{message && <p role="status">{message}</p>}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Save changes</button></FormCard></Page>;
}
function Bookings({ create = false }: { create?: boolean }) {
  const { loading, user, session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState<Array<{ starts_at: string; ends_at: string; status: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formMinimized, setFormMinimized] = useState(false);
  const load = () => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    void Promise.all([
      fetch(`${env.VITE_API_URL}/api/bookings`, { headers }),
      fetch(`${env.VITE_API_URL}/api/resources`, { headers }),
    ])
      .then(async ([bookingResponse, resourceResponse]) => {
        const bookingResult = await bookingResponse.json() as { items?: Booking[]; error?: string };
        const resourceResult = await resourceResponse.json() as { items?: Resource[]; error?: string };
        if (!bookingResponse.ok) throw new Error(bookingResult.error ?? 'Unable to load bookings');
        if (!resourceResponse.ok) throw new Error(resourceResult.error ?? 'Unable to load resources');
        setBookings(bookingResult.items ?? []);
        setResources(resourceResult.items ?? []);
      })
      .catch((reason: Error) => {
        setBookings([]);
        setResources([]);
        setError(reason.message);
      });
  };
  useEffect(load, [session]);
  useEffect(() => {
    if (!session || !resourceId || !startsAt || !endsAt) { setAvailability([]); return; }
    const start = new Date(startsAt).toISOString();
    const end = new Date(endsAt).toISOString();
    void fetch(`${env.VITE_API_URL}/api/resources/${resourceId}/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((response) => readApiResponse<{ bookings?: Array<{ starts_at: string; ends_at: string; status: string }> }>(response))
      .then((result) => setAvailability(result.bookings ?? []))
      .catch(() => setAvailability([]));
  }, [session, resourceId, startsAt, endsAt]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setError(null);
    setMessage(null);
    try {
      const start = new Date(startsAt);
      const end = new Date(endsAt);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        setError('Choose a date and time during opening hours: Monday-Friday 06:00-21:00, Saturday 08:00-18:00, or Sunday 09:00-15:00. Bookings must be 30 minutes to 2 hours.');
        return;
      }
      const duration = end.getTime() - start.getTime();
      if (duration < 30 * 60 * 1000 || duration > 2 * 60 * 60 * 1000) {
        setError('Booking duration must be at least 30 minutes and no more than 2 hours.');
        return;
      }
      if (start.toDateString() !== end.toDateString()) {
        setError('Bookings must start and end on the same date during opening hours: Monday-Friday 06:00-21:00, Saturday 08:00-18:00, or Sunday 09:00-15:00.');
        return;
      }
      const day = start.getDay();
      const openingHour = day === 0 ? 9 : day === 6 ? 8 : 6;
      const closingHour = day === 0 ? 15 : day === 6 ? 18 : 21;
      if (start.getHours() < openingHour || end.getHours() > closingHour || (end.getHours() === closingHour && end.getMinutes() > 0) || (start.getHours() === closingHour && start.getMinutes() > 0)) {
        setError('Choose a time during opening hours: Monday-Friday 06:00-21:00, Saturday 08:00-18:00, or Sunday 09:00-15:00.');
        return;
      }
      const response = await fetch(`${env.VITE_API_URL}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ resource_id: resourceId, starts_at: start.toISOString(), ends_at: end.toISOString(), notes: notes || null }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Unable to create booking');
        return;
      }
      setMessage('Booking request submitted.');
      setNotes('');
      load();
    } catch {
      setError('Unable to reach the booking service. Please try again.');
    }
  };
  const cancel = async (id: string) => { if (!session) return; const response = await fetch(`${env.VITE_API_URL}/api/bookings/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } }); if (!response.ok) { const body = await response.json() as { error?: string }; setError(body.error ?? 'Unable to cancel booking'); return; } setMessage('Booking cancelled.'); load(); };
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (!create) return <Page title="My bookings" description="Review your current and past bookings."><div className="flex justify-end"><NavLink className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" to="/member/bookings/new">Create a booking</NavLink></div>{error && <ErrorState message={error} />}<section><h2 className="text-xl font-semibold">Booking history</h2>{bookings.length === 0 ? <EmptyState message="You have no bookings." /> : <div className="mt-3 space-y-3">{bookings.map((booking) => <article className="rounded border border-slate-200 bg-white p-4" key={booking.id}><h3 className="font-semibold">{booking.resource?.name ?? 'Resource'}</h3><p>{new Date(booking.starts_at).toLocaleString()} to {new Date(booking.ends_at).toLocaleString()}</p><p className="text-sm text-slate-600">Status: {booking.status}</p>{booking.status === 'pending' && <button className="mt-3 rounded border border-slate-400 px-3 py-1" type="button" onClick={() => void cancel(booking.id)}>Cancel request</button>}</article>)}</div>}</section></Page>;
  return <Page title="My bookings" description="Request a resource and manage your pending bookings.">{error && <ErrorState message={error} />}{formMinimized ? <button className="rounded border border-slate-400 px-4 py-2" type="button" onClick={() => setFormMinimized(false)}>Restore booking form</button> : <FormCard title="Request a booking" onSubmit={submit}><div className="flex justify-end"><button className="text-sm underline" type="button" onClick={() => setFormMinimized(true)}>Minimize form</button></div><label className="block"><span className="font-medium">Resource</span><select required value={resourceId} onChange={(event) => setResourceId(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2"><option value="">Select a resource</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label><label className="block"><span className="font-medium">Starts</span><input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Ends</span><input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>{availability.length > 0 && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-800">This resource has an active booking in the selected range.</p>}{availability.length === 0 && resourceId && startsAt && endsAt && <p className="rounded border border-green-200 bg-green-50 p-3 text-green-800">No active booking is shown for this range.</p>}<label className="block"><span className="font-medium">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>{message && <p role="status" className="text-green-700">{message}</p>}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Submit request</button></FormCard>}<section><h2 className="text-xl font-semibold">Booking history</h2>{bookings.length === 0 ? <EmptyState message="You have no bookings." /> : <div className="mt-3 space-y-3">{bookings.map((booking) => <article className="rounded border border-slate-200 bg-white p-4" key={booking.id}><h3 className="font-semibold">{booking.resource?.name ?? 'Resource'}</h3><p>{new Date(booking.starts_at).toLocaleString()} to {new Date(booking.ends_at).toLocaleString()}</p><p className="text-sm text-slate-600">Status: {booking.status}</p>{booking.status === 'pending' && <button className="mt-3 rounded border border-slate-400 px-3 py-1" type="button" onClick={() => void cancel(booking.id)}>Cancel request</button>}</article>)}</div>}</section></Page>;
}

const staffPages: Record<string, { title: string; description: string; message: string }> = {
  '/member/bookings/new': { title: 'Create booking', description: 'Request a resource booking.', message: '' },
  '/staff/dashboard': { title: 'Staff and admin dashboard', description: 'An overview of hub activity and tasks.', message: 'Dashboard metrics will appear here.' },
  '/staff/booking-requests': { title: 'Booking requests', description: 'Review and manage member booking requests.', message: 'There are no booking requests to review.' },
  '/staff/members': { title: 'Members', description: 'View and manage registered community members.', message: 'Member records will appear here.' },
  '/staff/donations': { title: 'Donations', description: 'Track donation drive activity.', message: 'Donation records will appear here.' },
};

const allowedStaffPaths = new Set(['/staff/dashboard', '/staff/booking-requests']);

function StaffPage({ path }: { path: string }) {
  const { loading, user, role } = useAuth();
  const page = staffPages[path];
  if (path === '/member/bookings/new') return <Bookings create />;
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (!role || (role !== 'staff' && role !== 'admin')) return <Navigate to="/member/dashboard" replace />;
  if (role === 'staff' && !allowedStaffPaths.has(path)) return <Navigate to="/staff/dashboard" replace />;
  if (!page) return <ErrorState message="Staff page not found." />;
  if (path === '/staff/booking-requests') return <StaffBookingQueue />;
  if (path === '/staff/dashboard') return <StaffDashboard />;
  if (path === '/staff/members') return <AdminMembers />;
  if (path === '/staff/donations') return <AdminDonationInterests />;
  return <Page title={page.title} description={page.description}><section className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full min-w-[500px] text-left text-sm"><caption className="p-4 text-left font-semibold">Current records</caption><thead className="border-y border-slate-200 bg-slate-50"><tr><th className="p-4" scope="col">Name</th><th className="p-4" scope="col">Status</th><th className="p-4" scope="col">Action</th></tr></thead><tbody><tr><td className="p-4 text-slate-600" colSpan={3}>{page.message}</td></tr></tbody></table></section></Page>;
}

function StaffBookingQueue() {
  const { session } = useAuth();
  const [items, setItems] = useState<Array<Booking & { profiles?: { full_name: string | null }; resources?: Resource }>>([]);
  const [error, setError] = useState<string | null>(null);
  const load = () => { if (!session) return; void fetch(`${env.VITE_API_URL}/api/staff/bookings`, { headers: { Authorization: `Bearer ${session.access_token}` } }).then((response) => readApiResponse<{ items?: Array<Booking & { profiles?: { full_name: string | null }; resources?: Resource }> }>(response)).then((result) => setItems(result.items ?? [])).catch((reason: Error) => { setItems([]); setError(reason.message); }); };
  useEffect(load, [session]);
  const decide = async (id: string, status: 'approved' | 'declined') => { if (!session) return; const response = await fetch(`${env.VITE_API_URL}/api/staff/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ status }) }); if (!response.ok) { const body = await response.json() as { error?: string }; setError(body.error ?? 'Unable to update booking'); return; } load(); };
  return <Page title="Booking requests" description="Approve or reject pending member booking requests.">{error && <ErrorState message={error} />}{items.length === 0 ? <EmptyState message="There are no pending booking requests." /> : <div className="space-y-3">{items.map((item) => <article className="rounded border border-slate-200 bg-white p-4" key={item.id}><h2 className="font-semibold">{item.resources?.name ?? 'Resource'}</h2><p>Requested by {item.profiles?.full_name ?? 'Member'}</p><p>{new Date(item.starts_at).toLocaleString()} to {new Date(item.ends_at).toLocaleString()}</p><div className="mt-3 flex gap-2"><button className="rounded bg-green-700 px-3 py-1 font-semibold text-white" type="button" onClick={() => void decide(item.id, 'approved')}>Approve</button><button className="rounded border border-slate-400 px-3 py-1" type="button" onClick={() => void decide(item.id, 'declined')}>Reject</button></div></article>)}</div>}</Page>;
}

function StaffDashboard() {
  const { session } = useAuth();
  const [items, setItems] = useState<Array<Booking & { reviewed_by?: string; reviewed_at?: string; profiles?: { full_name: string | null }; reviewer?: { full_name: string | null }; resources?: { name: string } }>>([]);
  const [showMore, setShowMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = (pageSize: number) => {
    if (!session) return;
    void fetch(`${env.VITE_API_URL}/api/staff/dashboard/booking-decisions?page=1&page_size=${pageSize}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((response) => readApiResponse<{ items?: Array<Booking & { reviewed_by?: string; reviewed_at?: string; profiles?: { full_name: string | null }; reviewer?: { full_name: string | null }; resources?: { name: string } }>; has_more?: boolean }>(response))
      .then((result) => { setItems(result.items ?? []); setHasMore(result.has_more ?? false); })
      .catch((reason: Error) => { setItems([]); setError(reason.message); });
  };
  useEffect(() => load(5), [session]);
  const toggleMore = () => { const next = !showMore; setShowMore(next); load(next ? 50 : 5); };
  return <Page title="Staff dashboard" description="Recent booking decisions made by staff and administrators.">{error && <ErrorState message={error} />}<EventForm /><section className="rounded border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold">Booking decisions</h2>{items.length === 0 ? <EmptyState message="No booking decisions have been recorded." /> : <div className="mt-4 space-y-3">{items.map((item) => <article className="border-b border-slate-200 pb-3" key={item.id}><p className="font-semibold">{item.resources?.name ?? 'Resource'}: {item.status}</p><p className="text-sm text-slate-600">Member: {item.profiles?.full_name ?? 'Member'} · Reviewed by: {item.reviewer?.full_name ?? 'Staff member'}</p>{item.reviewed_at && <p className="text-sm text-slate-500">{new Date(item.reviewed_at).toLocaleString()}</p>}</article>)}</div>}{(hasMore || showMore) && <button className="mt-4 rounded border border-slate-400 px-3 py-1" type="button" onClick={toggleMore}>{showMore ? 'Show less' : 'Show more'}</button>}</section></Page>;
}

function EventForm() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setError(null);
    setMessage(null);
    let posterUrl: string | null = null;
    if (posterFile) {
      if (!posterFile.type.startsWith('image/') || posterFile.size > 5 * 1024 * 1024) {
        setError('Choose an image file smaller than 5 MB.');
        return;
      }
      const extension = posterFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('event-posters').upload(path, posterFile, { contentType: posterFile.type, upsert: false });
      if (uploadError) { setError(`Unable to upload poster image: ${uploadError.message}`); return; }
      posterUrl = supabase.storage.from('event-posters').getPublicUrl(path).data.publicUrl;
    }
    const response = await fetch(`${env.VITE_API_URL}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ title, poster_url: posterUrl, starts_at: new Date(startsAt).toISOString(), ends_at: endsAt ? new Date(endsAt).toISOString() : null, venue }) });
    const body = await response.json() as { error?: string };
    if (!response.ok) { setError(body.error ?? 'Unable to create event.'); return; }
    setTitle(''); setPosterFile(null); setStartsAt(''); setEndsAt(''); setVenue(''); setMessage('Event posted successfully.');
  };
  return <FormCard title="Post a community event" onSubmit={submit}><label className="block"><span className="font-medium">Event name</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Poster image</span><input accept="image/*" type="file" onChange={(event) => setPosterFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Starts</span><input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Ends (optional)</span><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Venue</span><input required value={venue} onChange={(event) => setVenue(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>{error && <ErrorState message={error} />}{message && <p role="status" className="text-green-700">{message}</p>}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Post event</button></FormCard>;
}

function FormCard({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit?: (event: FormEvent) => void }) { return <form className="form-card max-w-lg space-y-4" onSubmit={onSubmit ?? ((event) => event.preventDefault())}><span className="section-label">FORM / ACTION</span><h2>{title}</h2>{children}</form>; }
function LoadingState() { return <p role="status" className="state state--loading">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="state state--empty"><span className="state__mark">—</span>{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="state state--error"><span className="state__mark">!</span>{message}</p>; }

export function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="facilities" element={<Facilities />} /><Route path="donation-drive" element={<DonationDrive />} /><Route path="login" element={<AuthPage />} /><Route path="sign-up" element={<AuthPage signUp />} /><Route path="member/dashboard" element={<MemberDashboard />} /><Route path="member/profile" element={<Profile />} /><Route path="member/bookings" element={<Bookings />} />{Object.keys(staffPages).map((path) => <Route key={path} path={path.replace(/^/, '').replace(/^\//, '')} element={<StaffPage path={path} />} />)}<Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
