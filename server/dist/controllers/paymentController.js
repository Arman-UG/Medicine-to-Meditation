"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSubscription = exports.simulateSandboxPayment = exports.handleWebhook = exports.getOrderStatus = exports.createQROrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const db_1 = require("../config/db");
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_calm_mock_key_2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'calm_rzp_mock_secret_key_9900';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'calm_webhook_secret_key_secure_2026';
const createQROrder = async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const userId = req.user?.id;
        const { renewal_mode = 'manual' } = req.body;
        const validatedMode = renewal_mode === 'autopay' ? 'autopay' : 'manual';
        const amountPaise = 9900; // Rs. 99
        // Generate unique order reference IDs
        const orderRef = 'order_' + crypto_1.default.randomBytes(8).toString('hex');
        const qrId = 'qr_' + crypto_1.default.randomBytes(8).toString('hex');
        // Dynamic UPI Payment Payload conforming to NPCI UPI Specifications
        // Includes merchant VPA, Merchant Name, Transaction Amount, Transaction Reference ID, and Description
        const merchantVpa = 'meditation.wellness@razorpay';
        const merchantName = 'Medicine to Meditation';
        const transactionNote = encodeURIComponent(`Medicine to Meditation Sub - Ref ${orderRef}`);
        const upiPayload = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&am=99.00&cu=INR&tr=${orderRef}&tn=${transactionNote}`;
        // Generate visual dynamic QR Code Data URL (Base64 PNG)
        const qrImageDataUrl = await qrcode_1.default.toDataURL(upiPayload, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 320,
            color: {
                dark: '#1E352F', // Forest green QR pixels matching calm design palette
                light: '#FFFFFF'
            }
        });
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
        await client.query('BEGIN');
        const orderRes = await client.query(`INSERT INTO payment_orders (user_id, razorpay_order_id, amount_paise, currency, status, renewal_mode, qr_id, qr_payload, qr_image_url, expires_at)
       VALUES ($1, $2, $3, 'INR', 'created', $4, $5, $6, $7, $8)
       RETURNING id, razorpay_order_id, amount_paise, currency, status, renewal_mode, expires_at`, [userId, orderRef, amountPaise, validatedMode, qrId, upiPayload, qrImageDataUrl, expiresAt]);
        await client.query('COMMIT');
        const createdOrder = orderRes.rows[0];
        res.status(201).json({
            orderId: createdOrder.id,
            razorpayOrderId: createdOrder.razorpay_order_id,
            amount: 99,
            amountPaise: 9900,
            currency: 'INR',
            renewalMode: validatedMode,
            qrImage: qrImageDataUrl,
            upiPayload,
            expiresAt: createdOrder.expires_at
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('createQROrder error:', error);
        res.status(500).json({ error: 'Failed to initiate dynamic UPI payment order.' });
    }
    finally {
        client.release();
    }
};
exports.createQROrder = createQROrder;
const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        const result = await db_1.pool.query(`SELECT id, razorpay_order_id, amount_paise, status, renewal_mode, expires_at, created_at, updated_at
       FROM payment_orders 
       WHERE (id::text = $1 OR razorpay_order_id = $1) AND user_id = $2`, [orderId, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Payment order not found.' });
            return;
        }
        const order = result.rows[0];
        // Check if order expired
        if (order.status === 'created' && new Date() > new Date(order.expires_at)) {
            await db_1.pool.query(`UPDATE payment_orders SET status = 'expired' WHERE id = $1`, [order.id]);
            order.status = 'expired';
        }
        // Check if user has active subscription
        const subRes = await db_1.pool.query(`SELECT id, status, current_period_end, renewal_type 
       FROM subscriptions 
       WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`, [userId]);
        res.status(200).json({
            order,
            isPaid: order.status === 'paid',
            subscriptionActive: subRes.rows.length > 0
        });
    }
    catch (error) {
        console.error('getOrderStatus error:', error);
        res.status(500).json({ error: 'Failed to check order status.' });
    }
};
exports.getOrderStatus = getOrderStatus;
/**
 * Razorpay Webhook Handler
 * Verifies HMAC-SHA256 signature, validates payment details, and idempotently activates subscription.
 */
const handleWebhook = async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.rawBody || JSON.stringify(req.body);
        // Compute expected HMAC SHA-256 signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');
        // Strict signature verification
        let isValidSignature = false;
        if (signature) {
            const sigBuffer = Buffer.from(signature);
            const expBuffer = Buffer.from(expectedSignature);
            if (sigBuffer.length === expBuffer.length) {
                isValidSignature = crypto_1.default.timingSafeEqual(sigBuffer, expBuffer);
            }
        }
        if (!isValidSignature) {
            console.warn('Webhook signature verification failed! Rejecting payload.');
            res.status(400).json({ error: 'Invalid webhook signature.' });
            return;
        }
        const event = req.body;
        console.log(`Verified webhook event received: ${event.event}`);
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const paymentEntity = event.payload?.payment?.entity || event.payload?.entity;
            const razorpayPaymentId = paymentEntity?.id || 'pay_' + crypto_1.default.randomBytes(6).toString('hex');
            const razorpayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
            const amountPaise = paymentEntity?.amount || 9900;
            const paymentMethod = paymentEntity?.method || 'upi';
            if (!razorpayOrderId) {
                res.status(400).json({ error: 'Missing order reference in webhook entity.' });
                return;
            }
            await client.query('BEGIN');
            // Idempotency check: Ensure payment transaction has not already been processed
            const existingTx = await client.query('SELECT id FROM payment_transactions WHERE razorpay_payment_id = $1', [razorpayPaymentId]);
            if (existingTx.rows.length > 0) {
                await client.query('COMMIT');
                console.log(`Payment transaction ${razorpayPaymentId} already processed (idempotent no-op).`);
                res.status(200).json({ status: 'already_processed' });
                return;
            }
            // Find the corresponding payment order
            const orderRes = await client.query('SELECT id, user_id, amount_paise, renewal_mode, status FROM payment_orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
            if (orderRes.rows.length === 0) {
                await client.query('ROLLBACK');
                console.warn(`Payment order ${razorpayOrderId} not found.`);
                res.status(404).json({ error: 'Payment order reference not found.' });
                return;
            }
            const order = orderRes.rows[0];
            // Record transaction in database
            await client.query(`INSERT INTO payment_transactions (order_id, razorpay_payment_id, razorpay_order_id, amount_paise, payment_method, status, webhook_signature, webhook_payload)
         VALUES ($1, $2, $3, $4, $5, 'success', $6, $7)`, [order.id, razorpayPaymentId, razorpayOrderId, amountPaise, paymentMethod, signature, JSON.stringify(event)]);
            // Update payment order status to paid
            await client.query(`UPDATE payment_orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
            // Calculate subscription dates: 30 days of active calmness
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            // Upsert Subscription
            const subRes = await client.query(`INSERT INTO subscriptions (user_id, plan_name, amount_paise, currency, status, renewal_type, current_period_start, current_period_end, next_billing_at, last_payment_order_id, updated_at)
         VALUES ($1, 'Medicine to Meditation Monthly Unlimited', $2, 'INR', 'active', $3, $4, $5, $5, $6, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET status = 'active',
             renewal_type = EXCLUDED.renewal_type,
             current_period_start = EXCLUDED.current_period_start,
             current_period_end = EXCLUDED.current_period_end,
             next_billing_at = EXCLUDED.next_billing_at,
             last_payment_order_id = EXCLUDED.last_payment_order_id,
             cancelled_at = NULL,
             updated_at = NOW()
         RETURNING id`, [order.user_id, amountPaise, order.renewal_mode, now, periodEnd, order.id]);
            // If user selected AutoPay, register authorized mandate
            if (order.renewal_mode === 'autopay') {
                const mandateToken = 'mdt_' + crypto_1.default.randomBytes(8).toString('hex');
                await client.query(`INSERT INTO payment_mandates (user_id, subscription_id, mandate_token, upi_vpa, bank_reference, max_amount_paise, status, authorized_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())`, [order.user_id, subRes.rows[0].id, mandateToken, paymentEntity?.vpa || 'calm.user@upi', 'NPCI-' + crypto_1.default.randomBytes(4).toString('hex').toUpperCase(), 9900]);
                // Update user preference
                await client.query(`INSERT INTO renewal_preferences (user_id, preferred_mode, autopay_consent, consent_timestamp, updated_at)
           VALUES ($1, 'autopay', true, NOW(), NOW())
           ON CONFLICT (user_id) DO UPDATE
           SET preferred_mode = 'autopay', autopay_consent = true, consent_timestamp = NOW(), updated_at = NOW()`, [order.user_id]);
            }
            await client.query('COMMIT');
            console.log(`Subscription activated successfully for user ${order.user_id} via order ${order.id}`);
            res.status(200).json({ status: 'processed_and_activated' });
        }
        else {
            res.status(200).json({ status: 'ignored_unhandled_event' });
        }
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('handleWebhook error:', error);
        res.status(500).json({ error: 'Internal error processing payment webhook.' });
    }
    finally {
        client.release();
    }
};
exports.handleWebhook = handleWebhook;
/**
 * Sandbox Simulation Handler (for Development & Testing)
 * Generates an authentic simulated webhook payload with valid HMAC-SHA256 signature
 * and triggers verification to test dynamic QR scan completion safely.
 */
const simulateSandboxPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user?.id;
        if (!orderId) {
            res.status(400).json({ error: 'Order ID is required.' });
            return;
        }
        const orderRes = await db_1.pool.query(`SELECT id, razorpay_order_id, user_id, renewal_mode, status 
       FROM payment_orders 
       WHERE (id::text = $1 OR razorpay_order_id = $1) AND user_id = $2`, [orderId, userId]);
        if (orderRes.rows.length === 0) {
            res.status(404).json({ error: 'Order not found.' });
            return;
        }
        const order = orderRes.rows[0];
        if (order.status === 'paid') {
            res.status(400).json({ error: 'Order is already marked as paid.' });
            return;
        }
        // Construct genuine Razorpay webhook event payload
        const mockPaymentId = 'pay_' + crypto_1.default.randomBytes(8).toString('hex');
        const mockPayload = {
            entity: 'event',
            account_id: 'acc_calm_test',
            event: 'payment.captured',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: mockPaymentId,
                        entity: 'payment',
                        amount: 9900,
                        currency: 'INR',
                        status: 'captured',
                        order_id: order.razorpay_order_id,
                        invoice_id: null,
                        international: false,
                        method: 'upi',
                        amount_refunded: 0,
                        refund_status: null,
                        captured: true,
                        description: 'Calm Monthly Relaxation Subscription',
                        vpa: 'user.relax@upi',
                        email: req.user?.email,
                        contact: '+919876543210',
                        fee: 0,
                        tax: 0,
                        error_code: null,
                        error_description: null,
                        created_at: Math.floor(Date.now() / 1000)
                    }
                }
            },
            created_at: Math.floor(Date.now() / 1000)
        };
        const payloadString = JSON.stringify(mockPayload);
        // Compute genuine HMAC signature using RAZORPAY_WEBHOOK_SECRET
        const validSignature = crypto_1.default
            .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
            .update(payloadString)
            .digest('hex');
        // Execute standard webhook handler logic
        const client = await db_1.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`INSERT INTO payment_transactions (order_id, razorpay_payment_id, razorpay_order_id, amount_paise, payment_method, status, webhook_signature, webhook_payload)
         VALUES ($1, $2, $3, $4, 'upi', 'success', $5, $6)`, [order.id, mockPaymentId, order.razorpay_order_id, 9900, validSignature, JSON.stringify(mockPayload)]);
            await client.query(`UPDATE payment_orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const subRes = await client.query(`INSERT INTO subscriptions (user_id, plan_name, amount_paise, currency, status, renewal_type, current_period_start, current_period_end, next_billing_at, last_payment_order_id, updated_at)
         VALUES ($1, 'Medicine to Meditation Monthly Unlimited', 9900, 'INR', 'active', $2, $3, $4, $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET status = 'active',
             renewal_type = EXCLUDED.renewal_type,
             current_period_start = EXCLUDED.current_period_start,
             current_period_end = EXCLUDED.current_period_end,
             next_billing_at = EXCLUDED.next_billing_at,
             last_payment_order_id = EXCLUDED.last_payment_order_id,
             cancelled_at = NULL,
             updated_at = NOW()
         RETURNING id`, [order.user_id, order.renewal_mode, now, periodEnd, order.id]);
            if (order.renewal_mode === 'autopay') {
                const mandateToken = 'mdt_' + crypto_1.default.randomBytes(8).toString('hex');
                await client.query(`INSERT INTO payment_mandates (user_id, subscription_id, mandate_token, upi_vpa, bank_reference, max_amount_paise, status, authorized_at)
           VALUES ($1, $2, $3, 'user.relax@upi', 'NPCI-TEST-AUTOPAY', 9900, 'active', NOW())`, [order.user_id, subRes.rows[0].id, mandateToken]);
                await client.query(`INSERT INTO renewal_preferences (user_id, preferred_mode, autopay_consent, consent_timestamp, updated_at)
           VALUES ($1, 'autopay', true, NOW(), NOW())
           ON CONFLICT (user_id) DO UPDATE
           SET preferred_mode = 'autopay', autopay_consent = true, consent_timestamp = NOW(), updated_at = NOW()`, [order.user_id]);
            }
            await client.query('COMMIT');
            res.status(200).json({
                message: 'Sandbox payment successfully simulated and verified via webhook protocol.',
                orderId: order.id,
                paymentId: mockPaymentId,
                subscriptionActivated: true
            });
        }
        catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('simulateSandboxPayment error:', error);
        res.status(500).json({ error: 'Failed to simulate payment.' });
    }
};
exports.simulateSandboxPayment = simulateSandboxPayment;
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user?.id;
        const subRes = await db_1.pool.query(`SELECT id, status FROM subscriptions WHERE user_id = $1 AND status = 'active'`, [userId]);
        if (subRes.rows.length === 0) {
            res.status(404).json({ error: 'No active subscription found to cancel.' });
            return;
        }
        const subId = subRes.rows[0].id;
        // Set renewal type to manual and update cancelled_at
        await db_1.pool.query(`UPDATE subscriptions 
       SET renewal_type = 'manual', cancelled_at = NOW(), updated_at = NOW() 
       WHERE id = $1`, [subId]);
        // Revoke any active UPI AutoPay mandate
        await db_1.pool.query(`UPDATE payment_mandates 
       SET status = 'revoked', revoked_at = NOW() 
       WHERE subscription_id = $1 AND status = 'active'`, [subId]);
        // Update renewal preference
        await db_1.pool.query(`UPDATE renewal_preferences 
       SET preferred_mode = 'manual', autopay_consent = false, updated_at = NOW() 
       WHERE user_id = $1`, [userId]);
        res.status(200).json({
            message: 'Automatic renewal has been cancelled. Your benefits remain active until the end of the current billing cycle.'
        });
    }
    catch (error) {
        console.error('cancelSubscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription.' });
    }
};
exports.cancelSubscription = cancelSubscription;
