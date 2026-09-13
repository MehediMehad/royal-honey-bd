import express from 'express';
import { VideoControllers } from './video.controller';

const router = express.Router();

router.post('/analyze', VideoControllers.analyzeVideo);

export const VideoRoutes = router;

