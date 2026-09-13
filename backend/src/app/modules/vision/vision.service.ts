import axios from 'express';
import axiosHttp from 'axios';
import openai from '../../libs/openai';
import config from '../../../configs';
import type {
  IAnalyzeImagePayload,
  IVisionAnalysisResult,
  ImageCategoryEnum,
} from './vision.interface';

const VISION_SYSTEM_PROMPT = `You are the expert computer vision AI for "Royal Honey BD" (an organic honey & food e-commerce brand in Bangladesh).
Your job is to analyze images sent by customers on Facebook Messenger or WhatsApp.

Categorize the image into EXACTLY ONE of the following categories:
1. "PAYMENT_PROOF": A screenshot or receipt of mobile payment (bKash or Nagad or Bank transfer) showing a Transaction ID (TrxID) and sent amount.
2. "PRODUCT_INQUIRY": A photograph of honey, honey jar, bee comb, ghee, or honey nuts where customer is asking about or showing our product.
3. "ADDRESS_PROOF": A screenshot or photo of handwritten/typed shipping address containing customer name, phone number, thana, district, or delivery location.
4. "COMPLAINT_DAMAGE": A photo of a broken glass jar, broken lid, leaking honey, or damaged delivery parcel.
5. "UNCLEAR": Blurry, unreadable, irrelevant, or dark image where text/subject cannot be determined with certainty.

PRODUCT CATALOG for reference:
- ID 01: কালোজিরা ফুলের মধু (Black Cumin Honey) - 250g, Price: ৳200
- ID 02: সরিষা ফুলের মধু (Mustard Flower Honey) - 250g, Price: ৳200
- ID 03: সুন্দরবনের মধু (Sundarban Wild Honey) - 250g, Price: ৳200
- ID 04: স্পেশাল মিনি হানি কম্ব (Mini Honey Comb - 3 jars) - 250g x 3, Price: ৳200
- ID 05: বিশুদ্ধ ঘি (Pure Ghee) - 500g, Price: ৳500
- ID 06: Honey Nut (Honey with mixed dry nuts) - 500g, Price: ৳600

PAYMENT OCR RULES (CRITICAL):
- Carefully read the Transaction ID (TrxID). In bKash it is typically 8-10 alphanumeric characters (e.g. "BL68A2KM9", "9K40AZ91"). In Nagad it is typically 8 alphanumeric characters (e.g. "71G02PL8").
- Extract the exact numeric amount sent (e.g. 200, 260, 320, 500, 600, 1200).
- Identify payment method: "BKASH" or "NAGAD".
- If the TrxID or amount is partially cut off or blurred, set isUnclear = true and confidence < 0.6.

Respond ONLY with a valid JSON object strictly matching this schema:
{
  "imageCategory": "PAYMENT_PROOF" | "PRODUCT_INQUIRY" | "ADDRESS_PROOF" | "COMPLAINT_DAMAGE" | "UNCLEAR",
  "confidence": number between 0.0 and 1.0,
  "description": "Brief 1-line description of what is seen in image in Bengali",
  "paymentData": {
    "transactionId": string | null,
    "amount": number | null,
    "paymentMethod": "BKASH" | "NAGAD" | null,
    "recipientNumber": string | null,
    "senderNumber": string | null,
    "timestamp": string | null
  },
  "productMatch": {
    "matchedProductId": "01" | "02" | "03" | "04" | "05" | "06" | null,
    "productName": string | null,
    "confidence": number
  },
  "addressData": {
    "name": string | null,
    "phone": string | null,
    "fullAddress": string | null,
    "district": string | null,
    "thana": string | null
  },
  "complaintData": {
    "isDamagedJar": boolean,
    "isLeaking": boolean,
    "issueDescription": string | null
  }
}`;

/**
 * Fetch image binary and convert to base64 data URI to guarantee OpenAI access even with protected CDNs
 */
const fetchImageAsDataUri = async (imageUrl: string): Promise<string> => {
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }

  try {
    const response = await axiosHttp.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    const contentType = String(response.headers['content-type'] || 'image/jpeg');
    const base64 = Buffer.from(response.data).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (err: any) {
    console.warn(`⚠️ [VisionService] Direct image download failed, using raw URL: ${err?.message}`);
    return imageUrl;
  }
};

/**
 * Analyze an image sent by a customer
 */
const analyzeCustomerImage = async (
  payload: IAnalyzeImagePayload,
): Promise<IVisionAnalysisResult> => {
  let imageUri: string;

  if (payload.base64Image) {
    const mime = payload.mimeType || 'image/jpeg';
    imageUri = `data:${mime};base64,${payload.base64Image}`;
  } else if (payload.imageUrl) {
    imageUri = await fetchImageAsDataUri(payload.imageUrl);
  } else {
    throw new Error('Either imageUrl or base64Image is required for image analysis');
  }

  // Fallback for offline development without API key
  if (!config.openai.apiKey || config.openai.apiKey === 'dummy_api_key_for_offline_dev') {
    console.warn('⚠️ [VisionService] OPENAI_API_KEY is dummy/missing. Returning mock vision result.');
    return {
      imageCategory: 'PAYMENT_PROOF',
      confidence: 0.95,
      description: 'বিকাশ পেমেন্ট স্ক্রিনশট (TrxID: BL904K2A, ৳260)',
      paymentData: {
        transactionId: 'BL904K2A',
        amount: 260,
        paymentMethod: 'BKASH',
        recipientNumber: '01604121107',
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1, // Very low temperature for maximum factual consistency
      messages: [
        {
          role: 'system',
          content: VISION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this customer image according to the rules and provide JSON output.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUri,
                detail: 'high', // High detail for small text like TrxID and receipts
              },
            },
          ],
        },
      ],
    });

    const rawJson = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawJson);

    return {
      imageCategory: (parsed.imageCategory as ImageCategoryEnum) || 'UNCLEAR',
      confidence: Number(parsed.confidence ?? 0.8),
      description: parsed.description || '',
      paymentData: parsed.paymentData || undefined,
      productMatch: parsed.productMatch || undefined,
      addressData: parsed.addressData || undefined,
      complaintData: parsed.complaintData || undefined,
      rawResponse: parsed,
    };
  } catch (error: any) {
    console.error('❌ [VisionService] Vision LLM analysis error:', error?.message || error);
    return {
      imageCategory: 'UNCLEAR',
      confidence: 0,
      description: 'ইমেজটি প্রসেস করা সম্ভব হয়নি',
    };
  }
};

export const VisionServices = {
  analyzeCustomerImage,
  fetchImageAsDataUri,
};

