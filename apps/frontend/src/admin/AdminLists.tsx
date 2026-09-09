import { useEffect, useState } from 'react';
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
  const { items, loading, error } = useAdminList<MemberRow>('/api/admin/members?page=1&page_size=50');
  if (loading) return <LoadingState />;
  return <Page title="Members" description="All registered member and staff accounts.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No members found." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Membership expires</th></tr></thead><tbody>{items.map((member) => <tr className="border-b border-slate-100" key={member.id}><td data-label="Name" className="p-3">{member.full_name ?? 'Unnamed member'}</td><td data-label="Email" className="p-3">{member.email ?? 'Unavailable'}</td><td data-label="Role" className="p-3">{member.role}</td><td data-label="Membership expires" className="p-3">{new Date(member.membership_expires_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</Page>;
}

export function AdminDonationInterests() {
  const { items, loading, error } = useAdminList<InterestRow>('/api/admin/donation-interests?page=1&page_size=50');
  if (loading) return <LoadingState />;
  return <Page title="Donation-drive interests" description="People who registered interest in supporting the donation drive.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No donation-drive interests yet." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Email</th><th className="p-3">Submitted</th></tr></thead><tbody>{items.map((interest) => <tr className="border-b border-slate-100" key={interest.id}><td data-label="Email" className="p-3">{interest.email}</td><td data-label="Submitted" className="p-3">{new Date(interest.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</Page>;
}

