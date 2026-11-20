const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  stress_level: 'mild' | 'moderate' | 'high' | null;
  trial_started_at?: string;
  trial_expires_at?: string;
  subscription?: {
    id: string;
    status: 'active' | 'past_due' | 'cancelled' | 'expired';
    plan_name: string;
    renewal_type: 'manual' | 'autopay';
    current_period_end: string;
    next_billing_at: string;
  } | null;
  membership?: {
    tier: 'subscribed' | 'trial_active' | 'trial_expired' | 'subscription_expired';
    label: string;
    isPro: boolean;
    hasAccess: boolean;
    daysRemaining: number | null;
    hoursRemaining: number | null;
    trialStartedAt?: string;
    trialExpiresAt?: string;
    currentPeriodEnd?: string;
    renewalType?: 'manual' | 'autopay';
  };
}

export interface Activity {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  default_duration_sec: number;
  rhythm_pattern?: {
    inhale?: number;
    holdIn?: number;
    exhale?: number;
    holdOut?: number;
    inhale1?: number;
    inhale2?: number;
    hold?: number;
    cycles?: number;
  } | null;
  step_instructions: Array<{
    phase: string;
    title: string;
    instruction: string;
  }>;
  what_to_expect: string[];
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  frequency_hz: number | null;
  duration_sec: number;
  audio_type: string;
  file_url: string | null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('calm_auth_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('calm_auth_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('calm_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'A serene error occurred. Please try again.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; full_name: string; stress_level?: string | null }) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getProfile: () =>
    request<{
      user: User;
      subscription: any;
      renewal_preferences: { preferred_mode: 'manual' | 'autopay'; autopay_consent: boolean };
      active_mandate: any;
    }>('/auth/profile'),

  updateStressLevel: (stress_level: string | null) =>
    request<{ message: string; stress_level: string | null }>('/auth/stress-level', {
      method: 'PUT',
      body: JSON.stringify({ stress_level }),
    }),

  updateRenewalPreferences: (body: { preferred_mode: 'manual' | 'autopay'; autopay_consent: boolean }) =>
    request<{ message: string; preferences: any }>('/auth/renewal-preferences', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (body: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Activities
  getActivities: () =>
    request<{ activities: Activity[] }>('/activities'),

  getActivityBySlug: (slug: string) =>
    request<{ activity: Activity }>(`/activities/${slug}`),

  logCompletion: (body: {
    activity_id: string;
    duration_completed_sec: number;
    completed: boolean;
    stress_level_before?: string | null;
    notes?: string;
  }) =>
    request<{ message: string; log: any }>('/activities/log', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getUserHistory: () =>
    request<{ history: any[] }>('/activities/user/history'),

  // Audio Tracks
  getAudioTracks: () =>
    request<{ tracks: AudioTrack[] }>('/audio'),

  // Payments & Subscriptions
  createQROrder: (body: { renewal_mode: 'manual' | 'autopay' }) =>
    request<{
      orderId: string;
      razorpayOrderId: string;
      amount: number;
      amountPaise: number;
      currency: string;
      renewalMode: string;
      qrImage: string;
      upiPayload: string;
      expiresAt: string;
    }>('/payments/create-qr', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getOrderStatus: (orderId: string) =>
    request<{
      order: any;
      isPaid: boolean;
      subscriptionActive: boolean;
    }>(`/payments/order-status/${orderId}`),

  simulateSandboxPayment: (orderId: string) =>
    request<{
      message: string;
      orderId: string;
      paymentId: string;
      subscriptionActivated: boolean;
    }>('/payments/simulate-sandbox-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  cancelSubscription: () =>
    request<{ message: string }>('/payments/cancel-subscription', {
      method: 'POST',
    }),

  // Admin (Server-authorized)
  getAdminStats: () =>
    request<{ stats: any }>('/admin/stats'),

  getAdminUsers: () =>
    request<{ users: any[] }>('/admin/users'),

  getAdminPayments: () =>
    request<{ payments: any[] }>('/admin/payments'),

  getAdminSubscriptions: () =>
    request<{ subscriptions: any[] }>('/admin/subscriptions'),

  updateAdminActivity: (id: string, body: any) =>
    request<{ message: string; activity: any }>(`/admin/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  updateAdminAudioTrack: (id: string, body: any) =>
    request<{ message: string; track: any }>(`/admin/audio-tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
