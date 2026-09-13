import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VoiceServices } from './voice.service';

const transcribeAudio = catchAsync(async (req: Request, res: Response) => {
  const { audioUrl, channel, base64Audio, mimeType } = req.body;

  let audioBuffer: Buffer | undefined;
  if (base64Audio) {
    audioBuffer = Buffer.from(base64Audio, 'base64');
  }

  if (!audioUrl && !audioBuffer) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'audioUrl or base64Audio is required for voice transcription',
    });
    return;
  }

  const result = await VoiceServices.transcribeBanglaAudio({
    audioUrl,
    audioBuffer,
    mimeType,
    channel,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isAmbiguous
      ? 'Audio transcribed but flagged as inaudible/ambiguous'
      : 'Bangla audio transcribed successfully',
    data: result,
  });
});

export const VoiceControllers = {
  transcribeAudio,
};

