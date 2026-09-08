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

function Page({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <div className="space-y-6"><header><h1 className="text-3xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-slate-600">{description}</p></header>{children}</div>; }
function LoadingState() { return <p role="status" className="rounded border border-slate-200 bg-white p-6 text-slate-600">Loading...</p>; }
function EmptyState({ message }: { message: string }) { return <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-slate-600">{message}</p>; }
function ErrorState({ message }: { message: string }) { return <p role="alert" className="rounded border border-red-200 bg-red-50 p-6 text-red-800">{message}</p>; }

export function AdminMembers() {
  const { items, loading, error } = useAdminList<MemberRow>('/api/admin/members?page=1&page_size=50');
  if (loading) return <LoadingState />;
  return <Page title="Members" description="All registered member and staff accounts.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No members found." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Membership expires</th></tr></thead><tbody>{items.map((member) => <tr className="border-b border-slate-100" key={member.id}><td className="p-3">{member.full_name ?? 'Unnamed member'}</td><td className="p-3">{member.email ?? 'Unavailable'}</td><td className="p-3">{member.role}</td><td className="p-3">{new Date(member.membership_expires_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</Page>;
}

export function AdminDonationInterests() {
  const { items, loading, error } = useAdminList<InterestRow>('/api/admin/donation-interests?page=1&page_size=50');
  if (loading) return <LoadingState />;
  return <Page title="Donation-drive interests" description="People who registered interest in supporting the donation drive.">{error && <ErrorState message={error} />}{!error && items.length === 0 && <EmptyState message="No donation-drive interests yet." />}{items.length > 0 && <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Email</th><th className="p-3">Submitted</th></tr></thead><tbody>{items.map((interest) => <tr className="border-b border-slate-100" key={interest.id}><td className="p-3">{interest.email}</td><td className="p-3">{new Date(interest.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</Page>;
}

