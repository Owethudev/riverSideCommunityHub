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
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, hasMore: false });
  useEffect(() => {
    setLoading(true);
    setError(null);
    const options = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : {};
    void fetch(`${env.VITE_API_URL}${path}`, options)
      .then((response) => readApiResponse<{ items?: T[]; page?: number; page_size?: number; total?: number; has_more?: boolean }>(response))
      .then((result) => { setItems(result.items ?? []); setPagination({ page: result.page ?? 1, pageSize: result.page_size ?? 20, total: result.total ?? 0, hasMore: result.has_more ?? false }); })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [path, session]);
  return { items, loading, error, pagination };
}

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <div className="page-stack"><header className="page-heading"><h1>{title}</h1><p>{description}</p></header>{children}</div>; }
function LoadingState() { return <p role="status" className="state state--loading">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="state state--empty"><span className="state__mark">—</span>{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="state state--error"><span className="state__mark">!</span>{message}</p>; }
function Pagination({ page, pageSize, total, hasMore, onPageChange }: { page: number; pageSize: number; total: number; hasMore: boolean; onPageChange: (page: number) => void }) { return <nav className="pagination" aria-label="Pagination"><span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span><div><button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button><button type="button" disabled={!hasMore} onClick={() => onPageChange(page + 1)}>Next</button></div></nav>; }

export function AdminMembers() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ page: String(page), page_size: '20' });
  if (search) query.set('search', search);
  if (role) query.set('role', role);
  const { items, loading, error, pagination } = useAdminList<MemberRow>(`/api/admin/members?${query.toString()}`);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };
  if (loading) return <LoadingState />;
  return <Page title="Members" description="All registered member and staff accounts."><form className="grid gap-3 border-2 border-black bg-white p-4 md:grid-cols-[1fr_180px_auto] md:items-end" onSubmit={submitSearch}><label className="block"><span className="font-medium">Search names</span><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 p-2" type="search" placeholder="Search members" /></label><label className="block"><span className="font-medium">Filter by role</span><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="mt-1 block w-full rounded border border-slate-300 p-2"><option value="">All roles</option><option value="member">Members</option><option value="staff">Staff</option><option value="admin">Admins</option></select></label><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Apply filters</button></form>{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No members found." />}{items.length > 0 && <><div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Membership expires</th></tr></thead><tbody>{items.map((member) => <tr className="border-b border-slate-100" key={member.id}><td data-label="Name" className="p-3">{member.full_name ?? 'Unnamed member'}</td><td data-label="Email" className="p-3">{member.email ?? 'Unavailable'}</td><td data-label="Role" className="p-3">{member.role}</td><td data-label="Membership expires" className="p-3">{new Date(member.membership_expires_at).toLocaleDateString()}</td></tr>)}</tbody></table></div><Pagination {...pagination} onPageChange={setPage} /></>}</Page>;
}

export function AdminDonationInterests() {
  const [page, setPage] = useState(1);
  const { items, loading, error, pagination } = useAdminList<InterestRow>(`/api/admin/donation-interests?page=${page}&page_size=20`);
  if (loading) return <LoadingState />;
  return <Page title="Donation-drive interests" description="People who registered interest in supporting the donation drive.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No donation-drive interests yet." />}{items.length > 0 && <><div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Email</th><th className="p-3">Submitted</th></tr></thead><tbody>{items.map((interest) => <tr className="border-b border-slate-100" key={interest.id}><td data-label="Email" className="p-3">{interest.email}</td><td data-label="Submitted" className="p-3">{new Date(interest.created_at).toLocaleString()}</td></tr>)}</tbody></table></div><Pagination {...pagination} onPageChange={setPage} /></>}</Page>;
}

