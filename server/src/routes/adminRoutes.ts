import { Router } from 'express';
import { 
  getAdminStats, 
  getUsersList, 
  getPaymentsList, 
  getSubscriptionsList, 
  updateActivityContent, 
  updateAudioTrack 
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Server-side authentication and role-based authorization for all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getUsersList);
router.get('/payments', getPaymentsList);
router.get('/subscriptions', getSubscriptionsList);
router.put('/activities/:id', updateActivityContent);
router.put('/audio-tracks/:id', updateAudioTrack);

export default router;
