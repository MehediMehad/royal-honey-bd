import express from 'express';
import { VoiceControllers } from './voice.controller';

const router = express.Router();

router.post('/transcribe', VoiceControllers.transcribeAudio);

export const VoiceRoutes = router;

