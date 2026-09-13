import OpenAI from 'openai';
import config from '../../configs';

export const openai = new OpenAI({
  apiKey: config.openai.apiKey || 'dummy_api_key_for_offline_dev',
});

export default openai;

