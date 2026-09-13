import express from 'express';
import { VisionControllers } from './vision.controller';

const router = express.Router();

router.post('/analyze', VisionControllers.analyzeImage);

export const VisionRoutes = router;

