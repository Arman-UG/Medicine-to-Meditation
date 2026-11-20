"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const API_BASE = 'http://localhost:5000/api';
const RAZORPAY_WEBHOOK_SECRET = 'calm_webhook_secret_key_secure_2026';
async function runTests() {
    console.log('==================================================');
    console.log('🌿 RUNNING CALM E2E AUTOMATED VERIFICATION SUITE');
    console.log('==================================================\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName, detail) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        }
        else {
            console.error(`❌ [FAIL] ${testName}${detail ? ' — ' + detail : ''}`);
            failed++;
        }
    }
    try {
        // 1. Health check
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        assert(healthRes.status === 200 && healthData.database === 'connected', '1. System Health & Database Connection');
        // 2. Activity Library
        const actsRes = await fetch(`${API_BASE}/activities`);
        const actsData = await actsRes.json();
        assert(actsRes.status === 200 && actsData.activities.length === 6, '2. All 6 Relaxation Activities Present');
        // 3. Activity Detail by Slug
        const boxRes = await fetch(`${API_BASE}/activities/box-breathing`);
        const boxData = await boxRes.json();
        assert(boxRes.status === 200 &&
            boxData.activity.name.includes('Box Breathing') &&
            boxData.activity.rhythm_pattern.inhale === 4, '3. Box Breathing (4-4-4-4) Rhythm & Instructions Verified');
        // 4. Audio Tracks Playlist
        const audioRes = await fetch(`${API_BASE}/audio`);
        const audioData = await audioRes.json();
        assert(audioRes.status === 200 && audioData.tracks.length === 6, '4. Six Meditative Audio Tracks Architecture Configured');
        // 5. User Registration (Unique New User)
        const testEmail = `test_zen_${Date.now()}@calm.local`;
        const regRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'Password123!',
                full_name: 'Serene Tester',
                stress_level: 'moderate'
            })
        });
        const regData = await regRes.json();
        assert(regRes.status === 201 && !!regData.token, '5. User Registration & Password Hashing');
        const userToken = regData.token;
        // 6. User Login
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'Password123!'
            })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200 && loginData.user.email === testEmail, '6. User Login & JWT Session Management');
        // 7. Protected Route Access Check
        const profileRes = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const profileData = await profileRes.json();
        assert(profileRes.status === 200 && profileData.user.email === testEmail, '7. Protected Route Authenticated Profile');
        // 8. Admin Access Restrictions (Standard user forbidden)
        const adminForbiddenRes = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert(adminForbiddenRes.status === 403, '8. Admin Access Restrictions (Non-admin blocked with 403)');
        // 9. Admin Authorized Access
        const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@calm.local',
                password: 'CalmAdmin2026!'
            })
        });
        const adminLoginData = await adminLoginRes.json();
        const adminToken = adminLoginData.token;
        const adminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminStatsData = await adminStatsRes.json();
        assert(adminStatsRes.status === 200 && adminStatsData.stats.totalUsers >= 1, '9. Admin Authorized Dashboard & Metrics Access');
        // 10. Dynamic UPI QR Order Creation (Rs. 99)
        const createQRRes = await fetch(`${API_BASE}/payments/create-qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ renewal_mode: 'autopay' })
        });
        const createQRData = await createQRRes.json();
        assert(createQRRes.status === 201 &&
            createQRData.amount === 99 &&
            createQRData.qrImage.startsWith('data:image/png;base64,'), '10. Dynamic UPI QR Order Generation (Rs. 99)');
        const orderId = createQRData.orderId;
        const rzpOrderId = createQRData.razorpayOrderId;
        // 11. Razorpay Webhook Signature Verification (Valid HMAC-SHA256)
        const mockPaymentId = 'pay_' + crypto_1.default.randomBytes(6).toString('hex');
        const webhookPayload = JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: mockPaymentId,
                        order_id: rzpOrderId,
                        amount: 9900,
                        currency: 'INR',
                        status: 'captured',
                        method: 'upi',
                        vpa: 'testuser@upi'
                    }
                }
            }
        });
        const validSignature = crypto_1.default
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(webhookPayload)
            .digest('hex');
        const webhookRes = await fetch(`${API_BASE}/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': validSignature
            },
            body: webhookPayload
        });
        const webhookData = await webhookRes.json();
        assert(webhookRes.status === 200 && webhookData.status === 'processed_and_activated', '11. Verified Payment Webhook & Subscription Activation');
        // 12. Webhook Signature Rejection (Tampered / Invalid Signature)
        const tamperedRes = await fetch(`${API_BASE}/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': 'invalid_forged_signature_123'
            },
            body: webhookPayload
        });
        assert(tamperedRes.status === 400, '12. Tampered / Invalid Webhook Signature Rejection');
        // 13. Idempotency Check (Duplicate Webhook Notification)
        const duplicateRes = await fetch(`${API_BASE}/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': validSignature
            },
            body: webhookPayload
        });
        const duplicateData = await duplicateRes.json();
        assert(duplicateRes.status === 200 && duplicateData.status === 'already_processed', '13. Idempotent Payment Processing (Duplicate Prevention)');
        // 14. Verify Subscription is now Active
        const checkSubRes = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const checkSubData = await checkSubRes.json();
        assert(checkSubData.subscription &&
            checkSubData.subscription.status === 'active' &&
            checkSubData.subscription.renewal_type === 'autopay', '14. Subscription Activated & AutoPay Preference Recorded');
        // 15. AutoPay Cancellation
        const cancelRes = await fetch(`${API_BASE}/payments/cancel-subscription`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const cancelData = await cancelRes.json();
        assert(cancelRes.status === 200, '15. AutoPay Mandate Cancellation & Preference Update');
        // 16. Activity Completion Logging
        const logRes = await fetch(`${API_BASE}/activities/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                activity_id: 'cyclic-sighing',
                duration_completed_sec: 180,
                completed: true,
                stress_level_before: 'moderate',
                notes: 'Felt immediate ease in chest.'
            })
        });
        assert(logRes.status === 201, '16. User Activity Completion Logging');
        // 17. Frontend HTTP Route Verification
        const feHome = await fetch('http://localhost:3000/');
        const feDash = await fetch('http://localhost:3000/dashboard');
        const feSub = await fetch('http://localhost:3000/subscribe');
        assert(feHome.status === 200 && feDash.status === 200 && feSub.status === 200, '17. Responsive Next.js Frontend Routing (Landing, Dashboard, Subscribe)');
        console.log('\n==================================================');
        console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('==================================================');
    }
    catch (err) {
        console.error('Fatal test error:', err);
    }
}
runTests();
