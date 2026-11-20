'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Activity as ActivityIcon, 
  Music, 
  RefreshCw, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  X,
  FileText
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments' | 'subscriptions' | 'content'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [audioList, setAudioList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Content edit state
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', default_duration_sec: 300 });
  const [savingContent, setSavingContent] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, p, sub, acts, aud] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminPayments(),
        api.getAdminSubscriptions(),
        api.getActivities(),
        api.getAudioTracks(),
      ]);

      setStats(s.stats);
      setUsersList(u.users);
      setPaymentsList(p.payments);
      setSubscriptionsList(sub.subscriptions);
      setActivitiesList(acts.activities);
      setAudioList(aud.tracks);
    } catch (err: any) {
      console.error('Admin API error:', err);
      setError(err.message || 'Access restricted. Administrator privileges required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }
    if (user.role !== 'admin') {
      setError('Access denied: You do not possess administrator rights to view this page.');
      setLoading(false);
      return;
    }
    fetchAdminData();
  }, [user]);

  const handleEditActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    setSavingContent(true);
    try {
      await api.updateAdminActivity(editingActivity.id, {
        name: editFormData.name,
        description: editFormData.description,
        default_duration_sec: parseInt(editFormData.default_duration_sec as any, 10)
      });
      setSaveSuccessMsg('Activity content updated successfully.');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setEditingActivity(null);
      }, 1500);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update activity');
    } finally {
      setSavingContent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
        <p className="text-xs text-earth-muted">Authenticating administrative access...</p>
      </div>
    );
  }

  if (error || user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-forest">Private Area Restricted</h2>
        <p className="text-xs text-earth-muted leading-relaxed">
          {error || 'This dashboard is reserved for authorized Medicine to Meditation platform administrators.'}
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 bg-forest text-ivory-100 rounded-full text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest text-ivory-100 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-forest">
              Medicine to Meditation Administration
            </h1>
            <p className="text-xs text-earth-muted">
              Secure Platform Control, 72-Hour Trial Monitoring & Payment Dashboard
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-sage-200 text-xs font-medium hover:bg-sage-50 text-forest transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-sage-100">
        {[
          { id: 'stats', label: 'Overview Metrics', icon: IndianRupee },
          { id: 'users', label: 'Users Roster & Trials', icon: Users },
          { id: 'payments', label: 'Payments & Dynamic QR', icon: CreditCard },
          { id: 'subscriptions', label: 'Subscriptions & AutoPay', icon: CheckCircle2 },
          { id: 'content', label: 'Content Management', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-2xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-forest text-ivory-100 shadow-sm'
                  : 'text-earth-muted hover:text-forest hover:bg-sage-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW METRICS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Registered Users</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.totalUsers}</p>
              <span className="text-[10px] text-sage-600">Total registered accounts</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Active 72h Trials</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.activeTrialUsers ?? 0}</p>
              <span className="text-[10px] text-emerald-700">Within 72h free window</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Expired Trials</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.expiredTrialUsers ?? 0}</p>
              <span className="text-[10px] text-amber-700">Trial ended, un-subscribed</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Active Subscribers</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.activeSubscribers}</p>
              <span className="text-[10px] text-sage-600">₹99 monthly active plans</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Expired Subscribers</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.expiredSubscribers ?? 0}</p>
              <span className="text-[10px] text-red-600">Past paid period</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Verified Revenue</span>
              <p className="font-serif text-3xl font-semibold text-forest">₹{stats.totalRevenueRupees}</p>
              <span className="text-[10px] text-sage-600">Processed through Razorpay</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Active QR Orders</span>
              <p className="font-serif text-3xl font-semibold text-forest">{stats.pendingOrders}</p>
              <span className="text-[10px] text-earth-muted">Awaiting customer scan</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-100 shadow-xs space-y-1">
              <span className="text-xs text-earth-muted font-medium">Platform Status</span>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="font-serif text-xl font-medium text-forest">Operational</p>
              </div>
              <span className="text-[10px] text-sage-600">PostgreSQL 18 + Node.js API</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS ROSTER */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-sage-200/80 shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 sm:p-6 border-b border-sage-100">
            <h3 className="font-serif text-lg font-medium text-forest">Registered Accounts & Trial Status</h3>
            <p className="text-xs text-earth-muted">Complete user database, 72-hour trial tracking, and membership tiers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50/70 text-earth-muted border-b border-sage-100">
                <tr>
                  <th className="p-3.5 font-medium">Full Name</th>
                  <th className="p-3.5 font-medium">Email</th>
                  <th className="p-3.5 font-medium">Role</th>
                  <th className="p-3.5 font-medium">Stress Level</th>
                  <th className="p-3.5 font-medium">Membership Status</th>
                  <th className="p-3.5 font-medium">Trial Expiration</th>
                  <th className="p-3.5 font-medium">Renewal Mode</th>
                  <th className="p-3.5 font-medium">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {usersList.map((u) => {
                  const status = u.computed_status || (u.subscription_status === 'active' ? 'subscribed' : 'trial_active');
                  return (
                    <tr key={u.id} className="hover:bg-ivory-50 transition-colors">
                      <td className="p-3.5 font-semibold text-forest">{u.full_name}</td>
                      <td className="p-3.5 text-earth-charcoal font-mono text-[11px]">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${u.role === 'admin' ? 'bg-forest text-ivory-100' : 'bg-sage-100 text-forest'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 capitalize text-earth-muted">{u.stress_level || 'Not set'}</td>
                      <td className="p-3.5">
                        {status === 'subscribed' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Subscribed (Pro)
                          </span>
                        )}
                        {status === 'trial_active' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sage-100 text-forest border border-sage-300">
                            Active Trial (72h)
                          </span>
                        )}
                        {status === 'trial_expired' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Trial Expired
                          </span>
                        )}
                        {status === 'subscription_expired' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
                            Subscription Expired
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-earth-charcoal">
                        {u.trial_expires_at ? new Date(u.trial_expires_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3.5 capitalize text-earth-muted">{u.preferred_mode || 'Manual'}</td>
                      <td className="p-3.5 text-earth-muted font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PAYMENTS & TRANSACTIONS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-sage-200/80 shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 sm:p-6 border-b border-sage-100">
            <h3 className="font-serif text-lg font-medium text-forest">Payment Orders & Webhook Transactions</h3>
            <p className="text-xs text-earth-muted">Dynamic QR order records, capture statuses, and payment IDs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50/70 text-earth-muted border-b border-sage-100">
                <tr>
                  <th className="p-3.5 font-medium">Customer</th>
                  <th className="p-3.5 font-medium">Order ID</th>
                  <th className="p-3.5 font-medium">Amount</th>
                  <th className="p-3.5 font-medium">Order Status</th>
                  <th className="p-3.5 font-medium">Razorpay Payment ID</th>
                  <th className="p-3.5 font-medium">Method</th>
                  <th className="p-3.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {paymentsList.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-semibold text-forest block">{p.user_name}</span>
                      <span className="text-[10px] text-earth-muted font-mono">{p.user_email}</span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-earth-charcoal">{p.razorpay_order_id}</td>
                    <td className="p-3.5 font-mono font-semibold text-forest">₹{p.amount_paise / 100}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        p.status === 'paid' ? 'bg-sage-200 text-forest' : p.status === 'created' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-earth-muted">
                      {p.razorpay_payment_id || 'Pending Scan'}
                    </td>
                    <td className="p-3.5 uppercase font-mono text-[10px] text-earth-muted">{p.payment_method || 'UPI'}</td>
                    <td className="p-3.5 font-mono text-[11px] text-earth-muted">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUBSCRIPTIONS & AUTOPAY */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl border border-sage-200/80 shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 sm:p-6 border-b border-sage-100">
            <h3 className="font-serif text-lg font-medium text-forest">Subscription Records & Mandates</h3>
            <p className="text-xs text-earth-muted">Active memberships and UPI AutoPay mandate statuses</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50/70 text-earth-muted border-b border-sage-100">
                <tr>
                  <th className="p-3.5 font-medium">User</th>
                  <th className="p-3.5 font-medium">Plan</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium">Renewal Mode</th>
                  <th className="p-3.5 font-medium">Current Period End</th>
                  <th className="p-3.5 font-medium">Mandate Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {subscriptionsList.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-semibold text-forest block">{s.user_name}</span>
                      <span className="text-[10px] text-earth-muted font-mono">{s.user_email}</span>
                    </td>
                    <td className="p-3.5 font-medium text-forest">{s.plan_name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                        s.status === 'active' ? 'bg-sage-200 text-forest' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize text-earth-muted font-medium">
                      {s.renewal_type === 'autopay' ? 'UPI AutoPay' : 'Manual'}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-earth-charcoal">
                      {new Date(s.current_period_end).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-earth-muted">
                      {s.mandate_token || 'None (Manual)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CONTENT MANAGEMENT */}
      {activeTab === 'content' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-sage-200/80 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-forest">Relaxation Activities Content</h3>
            <p className="text-xs text-earth-muted">Edit names, descriptions, or default durations</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activitiesList.map((act) => (
                <div key={act.id} className="p-4 rounded-2xl bg-ivory-50 border border-sage-100 flex items-start justify-between">
                  <div className="pr-3 min-w-0">
                    <h4 className="font-serif font-medium text-forest text-sm">{act.name}</h4>
                    <p className="text-[11px] text-earth-muted line-clamp-2 mt-0.5">{act.description}</p>
                    <span className="inline-block mt-2 text-[10px] font-mono text-sage-800 bg-sage-100 px-2 py-0.5 rounded">
                      Duration: {act.default_duration_sec}s ({Math.ceil(act.default_duration_sec / 60)} min)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActivity(act);
                      setEditFormData({
                        name: act.name,
                        description: act.description,
                        default_duration_sec: act.default_duration_sec
                      });
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-sage-100 text-forest border border-sage-200 shadow-xs transition-colors shrink-0"
                    title="Edit Activity Content"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-sage-200/80 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-forest">Audio Playlist Metadata</h3>
            <p className="text-xs text-earth-muted">Configured generative soundscapes and solfeggio frequencies</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audioList.map((track) => (
                <div key={track.id} className="p-4 rounded-2xl bg-ivory-50 border border-sage-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-medium text-forest text-sm">{track.title}</h4>
                    <p className="text-[11px] text-earth-muted capitalize">{track.category} • {track.artist}</p>
                    {track.frequency_hz && (
                      <span className="text-[10px] font-mono text-sage-700 bg-white px-2 py-0.5 rounded border border-sage-200 mt-1 inline-block">
                        Frequency: {track.frequency_hz} Hz
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Content Editor Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl border border-sage-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-forest">
                Edit Activity Content
              </h3>
              <button
                onClick={() => setEditingActivity(null)}
                className="text-earth-muted hover:text-forest p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="bg-sage-100 text-forest text-xs p-2.5 rounded-xl border border-sage-300">
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleEditActivitySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-forest block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-sage-200 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="font-medium text-forest block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-sage-200 text-forest focus:outline-none focus:border-forest resize-none"
                />
              </div>

              <div>
                <label className="font-medium text-forest block mb-1">Default Duration (Seconds)</label>
                <input
                  type="number"
                  required
                  min={60}
                  step={30}
                  value={editFormData.default_duration_sec}
                  onChange={(e) => setEditFormData({ ...editFormData, default_duration_sec: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-50 border border-sage-200 text-forest focus:outline-none focus:border-forest"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sage-100">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-4 py-2 text-earth-muted hover:text-forest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContent}
                  className="px-5 py-2 rounded-full bg-forest hover:bg-forest-light text-ivory-100 font-semibold"
                >
                  {savingContent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
