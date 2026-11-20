import crypto from 'crypto';
import { Pool } from 'pg';

const API_BASE = 'http://localhost:5000/api';
const RAZORPAY_WEBHOOK_SECRET = 'calm_webhook_secret_key_secure_2026';

// Direct PG client to inspect database state and test edge cases
const pool = new Pool({
  host: '127.0.0.1',
  port: 5434,
  database: 'calm_db',
  user: 'postgres',
});

async function runM2MTests() {
  console.log('================================================================');
  console.log('🌿 MEDICINE TO MEDITATION — COMPREHENSIVE E2E VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ' — ' + detail : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: System Health & Branding
    // -------------------------------------------------------------
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = (await healthRes.json()) as any;
    assert(
      healthRes.status === 200 &&
        healthData.status === 'healthy' &&
        healthData.service.includes('Medicine to Meditation') &&
        healthData.database === 'connected',
      '1. Health Check & Service Branding ("Medicine to Meditation API")'
    );

    // -------------------------------------------------------------
    // TEST 2: Activity Library (6 Activities with Calm Rhythm Patterns)
    // -------------------------------------------------------------
    const actsRes = await fetch(`${API_BASE}/activities`);
    const actsData = (await actsRes.json()) as any;
    assert(
      actsRes.status === 200 && actsData.activities.length === 6,
      '2. All 6 Relaxation Activities Configured in Library'
    );

    const cyclicSighing = actsData.activities.find((a: any) => a.slug === 'cyclic-sighing');
    assert(
      cyclicSighing &&
        cyclicSighing.name === 'Cyclic Sighing' &&
        cyclicSighing.rhythm_pattern?.inhale1 === 2 &&
        cyclicSighing.rhythm_pattern?.inhale2 === 1.5 &&
        cyclicSighing.rhythm_pattern?.exhale === 6,
      '3. Cyclic Sighing Double-Inhale & Extended Exhale Rhythm Configured'
    );

    const boxBreathing = actsData.activities.find((a: any) => a.slug === 'box-breathing');
    assert(
      boxBreathing &&
        boxBreathing.rhythm_pattern?.inhale === 4 &&
        boxBreathing.rhythm_pattern?.holdIn === 4 &&
        boxBreathing.rhythm_pattern?.exhale === 4 &&
        boxBreathing.rhythm_pattern?.holdOut === 4,
      '4. Box Breathing (4-4-4-4) Rhythm Verified'
    );

    // -------------------------------------------------------------
    // TEST 3: Audio Library Endpoint (6 Soundscapes for /audio)
    // -------------------------------------------------------------
    const audioRes = await fetch(`${API_BASE}/audio`);
    const audioData = (await audioRes.json()) as any;
    assert(
      audioRes.status === 200 &&
        audioData.tracks.length >= 6 &&
        audioData.tracks.some((t: any) => t.audio_type === 'mp3') &&
        audioData.tracks.some((t: any) => t.frequency_hz === 396) &&
        audioData.tracks.some((t: any) => t.frequency_hz === 432),
      '5. Dedicated Audio Library Configured (Master MP3s, 396Hz, 432Hz & Nature Soundscapes)'
    );

    // -------------------------------------------------------------
    // TEST 4: 72-Hour Free Trial Immediate Assignment on Registration
    // -------------------------------------------------------------
    const testEmail = `zen_trial_${Date.now()}@meditation.local`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'PeacefulPassword2026!',
        full_name: 'Mira Sharma',
        stress_level: 'high',
      }),
    });
    const regData = (await regRes.json()) as any;
    const userToken = regData.token;

    assert(
      regRes.status === 201 && !!userToken,
      '6. User Registration & Password Hashing'
    );

    const trialStart = new Date(regData.user.trial_started_at).getTime();
    const trialEnd = new Date(regData.user.trial_expires_at).getTime();
    const diffHours = Math.round((trialEnd - trialStart) / (1000 * 60 * 60));

    assert(
      diffHours === 72,
      `7. Free Trial Duration Exactly 72 Hours (Computed: ${diffHours}h)`
    );

    assert(
      regData.user.membership.tier === 'trial_active' &&
        regData.user.membership.hasAccess === true &&
        regData.user.membership.hoursRemaining >= 71,
      '8. Immediate Trial Active Membership Tier & Full Access'
    );

    // -------------------------------------------------------------
    // TEST 5: Login & Reload Do NOT Reset Trial
    // -------------------------------------------------------------
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'PeacefulPassword2026!',
      }),
    });
    const loginData = (await loginRes.json()) as any;

    assert(
      loginRes.status === 200 &&
        loginData.user.trial_started_at === regData.user.trial_started_at &&
        loginData.user.trial_expires_at === regData.user.trial_expires_at,
      '9. User Login Preserves Trial Start & Expiration Timestamps (No Reset)'
    );

    const profileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const profileData = (await profileRes.json()) as any;

    assert(
      profileRes.status === 200 &&
        profileData.user.trial_expires_at === regData.user.trial_expires_at &&
        profileData.user.membership.tier === 'trial_active',
      '10. Profile Route Authenticated & Returns Matching Trial State'
    );

    // -------------------------------------------------------------
    // TEST 6: Active Trial User Can Access & Complete Activities
    // -------------------------------------------------------------
    const actId = cyclicSighing.id;
    const completeRes1 = await fetch(`${API_BASE}/activities/log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_id: actId,
        duration_completed_sec: 180,
      }),
    });
    const completeData1 = (await completeRes1.json()) as any;

    assert(
      completeRes1.status === 201 &&
        !!completeData1.log?.id,
      '11. Active Trial User Logs Activity Completion Successfully'
    );

    // -------------------------------------------------------------
    // TEST 7: Duplicate Submission Suppression (15-second window)
    // -------------------------------------------------------------
    const completeResDuplicate = await fetch(`${API_BASE}/activities/log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_id: actId,
        duration_completed_sec: 180,
      }),
    });
    const completeDataDuplicate = (await completeResDuplicate.json()) as any;

    assert(
      completeResDuplicate.status === 200 &&
        completeDataDuplicate.duplicatePrevented === true,
      '12. Duplicate Activity Submission Suppressed within 15 Seconds'
    );

    // Verify history in database only has 1 record for this activity
    const dbHistCheck = await pool.query(
      'SELECT COUNT(*) FROM user_activity_logs WHERE user_id = $1 AND activity_id = $2',
      [regData.user.id, actId]
    );
    assert(
      parseInt(dbHistCheck.rows[0].count, 10) === 1,
      '13. Database Confirms Strictly No Duplicate Row Created'
    );

    // -------------------------------------------------------------
    // TEST 8: Server-Side Trial Expiration Enforcement
    // -------------------------------------------------------------
    // Simulate trial expiration by setting trial_expires_at to 1 hour ago
    await pool.query(
      "UPDATE users SET trial_expires_at = NOW() - INTERVAL '1 hour' WHERE id = $1",
      [regData.user.id]
    );

    // Refresh profile to verify status changed to trial_expired
    const expiredProfileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const expiredProfileData = (await expiredProfileRes.json()) as any;

    assert(
      expiredProfileData.user.membership.tier === 'trial_expired' &&
        expiredProfileData.user.membership.hasAccess === false &&
        expiredProfileData.user.membership.label === 'Trial Expired',
      '14. Expired Trial Correctly Detected & Marked Server-Side'
    );

    // Expired user attempts to log an activity -> MUST BE BLOCKED WITH 403
    const blockedActivityRes = await fetch(`${API_BASE}/activities/log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_id: actId,
        duration_completed_sec: 300,
      }),
    });
    const blockedActivityData = (await blockedActivityRes.json()) as any;

    assert(
      blockedActivityRes.status === 403 &&
        blockedActivityData.code === 'TRIAL_EXPIRED' &&
        blockedActivityData.requiresSubscription === true,
      '15. Expired Trial User Blocked from Activity Execution (403 Forbidden)'
    );

    // Expired user CAN still access account profile, settings & subscription creation
    assert(
      expiredProfileRes.status === 200,
      '16. Expired Trial User Retains Access to Profile & Account Settings'
    );

    // -------------------------------------------------------------
    // TEST 9: Subscription Creation & Razorpay Dynamic QR for Expired User
    // -------------------------------------------------------------
    const qrRes = await fetch(`${API_BASE}/payments/create-qr`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        renewal_mode: 'manual',
      }),
    });
    const qrData = (await qrRes.json()) as any;

    assert(
      qrRes.status === 201 &&
        qrData.amount === 99 &&
        qrData.qrImage.startsWith('data:image/png;base64,') &&
        qrData.upiPayload.includes('meditation.wellness@razorpay'),
      '17. Dynamic UPI QR Order Created for ₹99 Subscription'
    );

    // -------------------------------------------------------------
    // TEST 10: HMAC-SHA256 Webhook Verification & Subscription Activation
    // -------------------------------------------------------------
    // Tampered signature test (must fail)
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_test_${Date.now()}`,
            order_id: qrData.razorpayOrderId,
            amount: 9900,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            email: testEmail,
            notes: {
              internal_order_id: qrData.orderId,
              user_id: regData.user.id,
              renewal_mode: 'manual',
            },
          },
        },
      },
    });

    const invalidSigRes = await fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_tampered_signature_hex_000000000000',
      },
      body: webhookPayload,
    });
    assert(
      invalidSigRes.status === 400,
      '18. Payment Webhook Rejects Invalid / Tampered Signature (Timing-safe)'
    );

    // Authentic HMAC signature
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const validWebhookRes = await fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: webhookPayload,
    });
    const validWebhookData = (await validWebhookRes.json()) as any;

    assert(
      validWebhookRes.status === 200 &&
        (validWebhookData.status === 'processed_and_activated' || validWebhookData.status === 'already_processed'),
      '19. Authentic Razorpay Webhook Verified & Processed'
    );

    // Check user profile after payment activation
    const activeSubProfileRes = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const activeSubProfileData = (await activeSubProfileRes.json()) as any;

    assert(
      activeSubProfileData.user.membership.tier === 'subscribed' &&
        activeSubProfileData.user.membership.hasAccess === true &&
        activeSubProfileData.user.membership.label === 'Subscribed' &&
        activeSubProfileData.subscription.status === 'active' &&
        activeSubProfileData.subscription.amount_paise === 9900,
      '20. Subscription Activated: User Transitions to Active "Subscribed" Tier'
    );

    // Formerly-blocked user can now execute activities again!
    const unblockedActivityRes = await fetch(`${API_BASE}/activities/log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_id: boxBreathing.id,
        duration_completed_sec: 240,
      }),
    });
    assert(
      unblockedActivityRes.status === 201,
      '21. Subscribed User Regains Full Unrestricted Activity Access'
    );

    // -------------------------------------------------------------
    // TEST 11: Activity History User Isolation & Schema Integrity
    // -------------------------------------------------------------
    const userHistRes = await fetch(`${API_BASE}/activities/user/history`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const userHistData = (await userHistRes.json()) as any;

    assert(
      userHistRes.status === 200 &&
        userHistData.history.length === 2 &&
        userHistData.history.every(
          (h: any) =>
            h.activity_name &&
            h.created_at &&
            h.duration_completed_sec &&
            !h.audio_blob &&
            !h.voice_recording
        ),
      '22. Activity History is User-Isolated & Completely Void of Audio Recordings'
    );

    // -------------------------------------------------------------
    // TEST 12: Admin Dashboard & Trial Metrics
    // -------------------------------------------------------------
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@calm.local',
        password: 'CalmAdmin2026!',
      }),
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    const adminToken = adminLoginData.token;

    assert(
      adminLoginRes.status === 200 && adminLoginData.user.role === 'admin',
      '23. Administrator Authentication Verified'
    );

    const adminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData = (await adminStatsRes.json()) as any;

    assert(
      adminStatsRes.status === 200 &&
        adminStatsData.stats.totalUsers >= 2 &&
        typeof adminStatsData.stats.activeTrialUsers === 'number' &&
        typeof adminStatsData.stats.expiredTrialUsers === 'number' &&
        typeof adminStatsData.stats.activeSubscribers === 'number' &&
        typeof adminStatsData.stats.expiredSubscribers === 'number' &&
        adminStatsData.stats.totalRevenueRupees >= 99,
      '24. Admin Stats Return Categorized Trial & Subscription Counters'
    );

    const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = (await adminUsersRes.json()) as any;

    assert(
      adminUsersRes.status === 200 &&
        adminUsersData.users.some(
          (u: any) => u.email === testEmail && u.computed_status === 'subscribed'
        ),
      '25. Admin Users Roster Reports Real-Time Computed Membership Statuses'
    );

    console.log('\n================================================================');
    console.log(`🎉 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    await pool.end();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('💥 Test suite crashed with error:', err);
    await pool.end();
    process.exit(1);
  }
}

runM2MTests();
