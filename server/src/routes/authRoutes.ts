import { Router } from 'express';
import { register, login, getProfile, updateStressLevel, updateRenewalPreferences, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.put('/stress-level', authenticateToken, updateStressLevel);
router.put('/renewal-preferences', authenticateToken, updateRenewalPreferences);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
