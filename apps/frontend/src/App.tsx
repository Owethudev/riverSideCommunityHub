import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import type { UserRole } from '@riverside/shared';
import { env } from './config/env';

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
  return <Page title="Facilities" description="Information about rooms and spaces available at the hub.">
    <EmptyState message="Facility listings will appear here once they are configured." />
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

function MemberDashboard() { const { loading, user } = useAuth(); if (loading) return <LoadingState />; if (!user) return <Navigate to="/login" replace />; return <Page title="Member dashboard" description="A summary of your community hub activity."><p className="rounded border border-slate-200 bg-white p-6">You are signed in.</p></Page>; }
function Profile() {
  const { session, loading, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!session) return;
    void fetch(`${env.VITE_API_URL}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((response) => response.json() as Promise<{ full_name: string | null }>)
      .then((profile) => setFullName(profile.full_name ?? ''));
  }, [session]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    const response = await fetch(`${env.VITE_API_URL}/api/profile`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ full_name: fullName }) });
    setMessage(response.ok ? 'Profile saved.' : 'Unable to save profile.');
  };
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  return <Page title="My profile" description="Review and update your account details."><FormCard title="Profile details" onSubmit={save}><label className="block"><span className="font-medium">Full name</span><input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="text" /></label>{message && <p role="status">{message}</p>}<button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Save changes</button></FormCard></Page>;
}
function Bookings() { const { loading, user } = useAuth(); if (loading) return <LoadingState />; if (!user) return <Navigate to="/login" replace />; return <Page title="My bookings" description="View your current and past facility bookings."><EmptyState message="You do not have any bookings yet." /></Page>; }

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
  return <Page title={page.title} description={page.description}><section className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full min-w-[500px] text-left text-sm"><caption className="p-4 text-left font-semibold">Current records</caption><thead className="border-y border-slate-200 bg-slate-50"><tr><th className="p-4" scope="col">Name</th><th className="p-4" scope="col">Status</th><th className="p-4" scope="col">Action</th></tr></thead><tbody><tr><td className="p-4 text-slate-600" colSpan={3}>{page.message}</td></tr></tbody></table></section></Page>;
}

function FormCard({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit?: (event: FormEvent) => void }) { return <form className="max-w-lg space-y-4 rounded border border-slate-200 bg-white p-6" onSubmit={onSubmit ?? ((event) => event.preventDefault())}><h2 className="text-xl font-semibold">{title}</h2>{children}</form>; }
function LoadingState() { return <p role="status" className="rounded border border-slate-200 bg-white p-6 text-slate-600">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-slate-600">{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="rounded border border-red-200 bg-red-50 p-6 text-red-800">{message}</p>; }

function ProtectedRoute({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { loading, user, role } = useAuth();
  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && (!role || (!roles.includes(role) && role !== 'admin'))) return <Navigate to="/member/dashboard" replace />;
  return <>{children}</>;
}

export function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="facilities" element={<Facilities />} /><Route path="donation-drive" element={<DonationDrive />} /><Route path="login" element={<AuthPage />} /><Route path="sign-up" element={<AuthPage signUp />} /><Route path="member/dashboard" element={<MemberDashboard />} /><Route path="member/profile" element={<Profile />} /><Route path="member/bookings" element={<Bookings />} />{Object.keys(staffPages).map((path) => <Route key={path} path={path.replace(/^/, '').replace(/^\//, '')} element={<StaffPage path={path} />} />)}<Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
