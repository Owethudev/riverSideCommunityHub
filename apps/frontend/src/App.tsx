import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
/* eslint-disable no-control-regex */
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import type { Booking, Notification, Resource } from '@riverside/shared';
import { env } from './config/env';
import { readApiResponse } from './lib/api';

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
    { label: 'Members', path: '/staff/members' },
    { label: 'Donations', path: '/staff/donations' },
    { label: 'Resources', path: '/staff/resources' },
    { label: 'Programmes', path: '/staff/programmes' },
  ],
};

function Layout() {
  const { user, role, signOut } = useAuth();
  const canAccessStaffNavigation = role === 'staff' || role === 'admin';
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <NavLink className="text-lg font-bold text-slate-900" to="/">
            Riverside Community Hub
          </NavLink>
          <nav aria-label="Account navigation" className="flex gap-3 text-sm">
            {user ? <button className="underline" type="button" onClick={() => void signOut()}>Log out</button> : <><NavLink className="underline" to="/login">Log in</NavLink><NavLink className="underline" to="/sign-up">Sign up</NavLink></>}
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside aria-label="Main navigation" className="space-y-6">
          <NavigationGroup title="Public" items={navigation.public} />
          <NavigationGroup title="Member" items={navigation.member} />
          {canAccessStaffNavigation && <NavigationGroup title="Staff and admin" items={navigation.staff} />}
        </aside>
        <main id="main-content" className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavigationGroup({ title, items }: { title: string; items: { label: string; path: string }[] }) {
  return (
    <section aria-labelledby={`${title}-navigation`}>
      <h2 id={`${title}-navigation`} className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-blue-100 font-semibold text-blue-900' : 'text-slate-700 hover:bg-slate-100'}`
              }
              to={item.path}
              end={item.path === '/'}
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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
      </header>
      {children}
    </div>
  );
}

function Home() {
  return <Page title="Welcome to Riverside Community Hub" description="A shared space for local people, groups, and community programmes.">
    <section className="rounded border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Get involved</h2>
      <p className="mt-2 text-slate-600">Explore facilities, make a donation, or create an account to manage bookings.</p>
    </section>
    <ErrorState message="Connected services are not available in this initial skeleton." />
  </Page>;
}

function Facilities() {
  const { session } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
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
    <div className="grid gap-4 md:grid-cols-2">{resources.map((resource) => <section className="rounded border border-slate-200 bg-white p-5" key={resource.id}><h2 className="text-xl font-semibold">{resource.name}</h2><p className="mt-1 text-sm text-slate-500">{resource.kind} · Capacity {resource.capacity}</p><p className="mt-3 text-slate-600">{resource.description}</p><p className="mt-3 text-sm">{resource.approval_required ? 'Staff approval required' : 'Usually approved automatically'}</p></section>)}</div>
  </Page>;
}

function DonationDrive() {
  return <Page title="Donation Drive" description="Support local initiatives by contributing requested goods or funds.">
    <FormCard title="Register your interest"><label className="block"><span className="font-medium">Email address</span><input className="mt-1 block w-full rounded border border-slate-300 p-2" type="email" /></label><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="button">Submit interest</button></FormCard>
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
  return <Page title={signUp ? 'Create an account' : 'Log in'} description={signUp ? 'Join Riverside Community Hub to manage your community activity.' : 'Access your Riverside Community Hub account.'}>
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
function Bookings() {
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
  return <Page title="My bookings" description="Request a resource and manage your pending bookings.">{error && <ErrorState message={error} />}<FormCard title="Request a booking" onSubmit={submit}><label className="block"><span className="font-medium">Resource</span><select required value={resourceId} onChange={(event) => setResourceId(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2"><option value="">Select a resource</option>{resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label><label className="block"><span className="font-medium">Starts</span><input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label><label className="block"><span className="font-medium">Ends</span><input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>{availability.length > 0 && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-800">This resource has an active booking in the selected range.</p>}{availability.length === 0 && resourceId && startsAt && endsAt && <p className="rounded border border-green-200 bg-green-50 p-3 text-green-800">No active booking is shown for this range.</p>}<label className="block"><span className="font-medium">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" /></label>{message && <p role="status" className="text-green-700">{message}</p>}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Submit request</button></FormCard><section><h2 className="text-xl font-semibold">Booking history</h2>{bookings.length === 0 ? <EmptyState message="You have no bookings." /> : <div className="mt-3 space-y-3">{bookings.map((booking) => <article className="rounded border border-slate-200 bg-white p-4" key={booking.id}><h3 className="font-semibold">{booking.resource?.name ?? 'Resource'}</h3><p>{new Date(booking.starts_at).toLocaleString()} to {new Date(booking.ends_at).toLocaleString()}</p><p className="text-sm text-slate-600">Status: {booking.status}</p>{booking.status === 'pending' && <button className="mt-3 rounded border border-slate-400 px-3 py-1" type="button" onClick={() => void cancel(booking.id)}>Cancel request</button>}</article>)}</div>}</section></Page>;
}

const staffPages: Record<string, { title: string; description: string; message: string }> = {
  '/staff/dashboard': { title: 'Staff and admin dashboard', description: 'An overview of hub activity and tasks.', message: 'Dashboard metrics will appear here.' },
  '/staff/booking-requests': { title: 'Booking requests', description: 'Review and manage member booking requests.', message: 'There are no booking requests to review.' },
  '/staff/members': { title: 'Members', description: 'View and manage registered community members.', message: 'Member records will appear here.' },
  '/staff/donations': { title: 'Donations', description: 'Track donation drive activity.', message: 'Donation records will appear here.' },
  '/staff/resources': { title: 'Resources', description: 'Manage shared hub resources.', message: 'Resource records will appear here.' },
  '/staff/programmes': { title: 'Programmes', description: 'Manage community programmes and events.', message: 'Programme records will appear here.' },
};

function StaffPage({ path }: { path: string }) {
  const { loading, user, role } = useAuth();
  const page = staffPages[path];
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (!role || (role !== 'staff' && role !== 'admin')) return <Navigate to="/member/dashboard" replace />;
  if (!page) return <ErrorState message="Staff page not found." />;
  if (path === '/staff/booking-requests') return <StaffBookingQueue />;
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

function FormCard({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit?: (event: FormEvent) => void }) { return <form className="max-w-lg space-y-4 rounded border border-slate-200 bg-white p-6" onSubmit={onSubmit ?? ((event) => event.preventDefault())}><h2 className="text-xl font-semibold">{title}</h2>{children}</form>; }
function LoadingState() { return <p role="status" className="rounded border border-slate-200 bg-white p-6 text-slate-600">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-slate-600">{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="rounded border border-red-200 bg-red-50 p-6 text-red-800">{message}</p>; }

export function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="facilities" element={<Facilities />} /><Route path="donation-drive" element={<DonationDrive />} /><Route path="login" element={<AuthPage />} /><Route path="sign-up" element={<AuthPage signUp />} /><Route path="member/dashboard" element={<MemberDashboard />} /><Route path="member/profile" element={<Profile />} /><Route path="member/bookings" element={<Bookings />} />{Object.keys(staffPages).map((path) => <Route key={path} path={path.replace(/^/, '').replace(/^\//, '')} element={<StaffPage path={path} />} />)}<Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
