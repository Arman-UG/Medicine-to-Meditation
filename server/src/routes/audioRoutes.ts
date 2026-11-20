import { Router } from 'express';
import { getAudioTracks } from '../controllers/audioController';

const router = Router();

router.get('/', getAudioTracks);

export default router;
