import { Router } from 'express';
import { getActivities, getActivityBySlug, logCompletion, getUserHistory } from '../controllers/activityController';
import { authenticateToken, verifyMembershipAccess } from '../middleware/auth';

const router = Router();

router.get('/', getActivities);
router.get('/:slug', getActivityBySlug);
router.post('/log', authenticateToken, verifyMembershipAccess, logCompletion);
router.get('/user/history', authenticateToken, getUserHistory);

export default router;
