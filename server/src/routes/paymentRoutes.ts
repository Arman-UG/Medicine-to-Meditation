import { Router } from 'express';
import { 
  createQROrder, 
  getOrderStatus, 
  handleWebhook, 
  simulateSandboxPayment, 
  cancelSubscription 
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/create-qr', authenticateToken, createQROrder);
router.get('/order-status/:orderId', authenticateToken, getOrderStatus);
router.post('/webhook', handleWebhook);
router.post('/simulate-sandbox-payment', authenticateToken, simulateSandboxPayment);
router.post('/cancel-subscription', authenticateToken, cancelSubscription);

export default router;
