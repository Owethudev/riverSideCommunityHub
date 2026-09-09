import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ReactNode } from 'react';
import { env } from '../config/env';
import { readApiResponse } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

interface MemberRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  membership_expires_at: string;
}

interface InterestRow {
  id: string;
  email: string;
  created_at: string;
}

function useAdminList<T>(path: string) {
  const { session } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const options = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {};
    void fetch(`${env.VITE_API_URL}${path}`, options)
      .then((response) => readApiResponse<{ items?: T[] }>(response))
      .then((result) => setItems(result.items ?? []))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [path, session]);
  return { items, loading, error };
}

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <div className="page-stack"><header className="page-heading"><h1>{title}</h1><p>{description}</p></header>{children}</div>; }
function LoadingState() { return <p role="status" className="state state--loading">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="state state--empty"><span className="state__mark">—</span>{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="state state--error"><span className="state__mark">!</span>{message}</p>; }

export function AdminMembers() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const query = new URLSearchParams({ page: '1', page_size: '50' });
  if (search) query.set('search', search);
  if (role) query.set('role', role);
  const { items, loading, error } = useAdminList<MemberRow>(`/api/admin/members?${query.toString()}`);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };
  if (loading) return <LoadingState />;
  return <Page title="Members" description="All registered member and staff accounts."><form className="grid gap-3 border-2 border-black bg-white p-4 md:grid-cols-[1fr_180px_auto] md:items-end" onSubmit={submitSearch}><label className="block"><span className="font-medium">Search names</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="search" placeholder="Search members" /></label><label className="block"><span className="font-medium">Filter by role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2"><option value="">All roles</option><option value="member">Members</option><option value="staff">Staff</option><option value="admin">Admins</option></select></label><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Apply filters</button></form>{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No members found." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Membership expires</th></tr></thead><tbody>{items.map((member) => <tr className="border-b border-slate-100" key={member.id}><td data-label="Name" className="p-3">{member.full_name ?? 'Unnamed member'}</td><td data-label="Email" className="p-3">{member.email ?? 'Unavailable'}</td><td data-label="Role" className="p-3">{member.role}</td><td data-label="Membership expires" className="p-3">{new Date(member.membership_expires_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</Page>;
}

export function AdminDonationInterests() {
  const { items, loading, error } = useAdminList<InterestRow>('/api/admin/donation-interests?page=1&page_size=50');
  if (loading) return <LoadingState />;
  return <Page title="Donation-drive interests" description="People who registered interest in supporting the donation drive.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No donation-drive interests yet." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Email</th><th className="p-3">Submitted</th></tr></thead><tbody>{items.map((interest) => <tr className="border-b border-slate-100" key={interest.id}><td data-label="Email" className="p-3">{interest.email}</td><td data-label="Submitted" className="p-3">{new Date(interest.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</Page>;
}

