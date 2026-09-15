import config from '../../../configs';
import { openai } from '../../libs/openai';
import prisma from '../../libs/prisma';

export interface IExtractedEntities {
  customerInfo?: {
    name?: string | null;
    phone?: string | null;
    district?: string | null;
    thana?: string | null;
    fullAddress?: string | null;
  };
  cartActions?: Array<{
    action: 'ADD' | 'UPDATE' | 'REMOVE' | 'CLEAR';
    productId?: string | null;
    productKeyword: string;
    quantity: number;
  }>;
  paymentMethod?: 'COD' | 'BKASH' | 'NAGAD' | null;
  transactionId?: string | null;
  isOrderIntent?: boolean;
  isOrderConfirmed?: boolean;
}

const extractionTools: any[] = [
  {
    type: 'function',
    function: {
      name: 'extractCustomerAndCartIntent',
      description:
        'Extract customer personal details (name, phone, address, thana, district), cart actions, payment method, transaction ID, and explicit order confirmation from customer message.',
      parameters: {
        type: 'object',
        properties: {
          customerInfo: {
            type: 'object',
            description: 'Any customer information provided or updated in the message',
            properties: {
              name: { type: 'string', description: 'Customer full or first name if provided' },
              phone: {
                type: 'string',
                description: 'Customer 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX)',
              },
              district: {
                type: 'string',
                description: 'District name (e.g. Dhaka, Gazipur, Chattogram, Sylhet, Rajshahi, etc.)',
              },
              thana: {
                type: 'string',
                description: 'Thana or sub-area (e.g. Mirpur, Adabor, Dhanmondi, Gulshan, Uttara)',
              },
              fullAddress: {
                type: 'string',
                description: 'Complete delivery address including house, road, area, thana, district',
              },
            },
          },
          cartActions: {
            type: 'array',
            description:
              'Any requests to add honey to cart, update quantity, remove product, or clear cart',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['ADD', 'UPDATE', 'REMOVE', 'CLEAR'],
                  description:
                    'ADD when requesting to buy/take, UPDATE when changing quantity (e.g. ২টার বদলে ৩টা), REMOVE when canceling an item, CLEAR when clearing cart',
                },
                productId: {
                  type: 'string',
                  description:
                    'The matched Product ID from the active catalog if recognized, or null if uncertain',
                },
                productKeyword: {
                  type: 'string',
                  description:
                    'Product name or weight as mentioned by customer (e.g. সুন্দরবন ১ কেজি, সরিষা ৫০০ গ্রাম, হানি নাট, হানি নার্স)',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity of jars requested (default is 1)',
                },
              },
              required: ['action', 'productKeyword'],
            },
          },
          paymentMethod: {
            type: 'string',
            enum: ['COD', 'BKASH', 'NAGAD'],
            description:
              'Customer selected payment method: COD for Cash on Delivery, BKASH for bKash, NAGAD for Nagad',
          },
          transactionId: {
            type: 'string',
            description:
              'Transaction ID provided by customer after bKash/Nagad payment (typically 8-12 alphanumeric characters like 9JH76BA2Q or BL45KKM2)',
          },
          isOrderIntent: {
            type: 'boolean',
            description:
              'True if the customer wants to buy, order, or expresses purchase interest',
          },
          isOrderConfirmed: {
            type: 'boolean',
            description:
              'True ONLY if customer explicitly confirms placing the order (e.g. হ্যাঁ, কনফার্ম, Confirm, অর্ডার করুন, জি পাঠান, ঠিক আছে পাঠান)',
          },
        },
      },
    },
  },
];

export interface IExtractionContext {
  currentCart?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice?: number;
  }>;
  recentMessages?: Array<{ sender: string; content: string }>;
}

/**
 * Extract entities and cart intentions using OpenAI Function Calling
 */
export const extractCustomerAndCartEntities = async (
  customerMessage: string,
  context?: IExtractionContext,
): Promise<IExtractedEntities> => {
  if (!config.openai.apiKey) {
    return heuristicFallbackExtraction(customerMessage, context);
  }

  try {
    // Dynamically fetch live store catalog so entity extractor recognizes all active products and IDs
    const activeProducts = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, weight: true, price: true },
    });
    const catalogList = activeProducts
      .map((p) => `- ID: "${p.id}", Name: "${p.name}" (${p.weight}, ৳${p.price})`)
      .join('\n');

    let contextSection = '';
    if (context?.currentCart && context.currentCart.length > 0) {
      const cartItemsStr = context.currentCart
        .map((ci) => `- Product ID: "${ci.productId}", Name: "${ci.productName}", Current Quantity: ${ci.quantity}`)
        .join('\n');
      contextSection += `\nCustomer's Current Cart Items:\n${cartItemsStr}\n`;
    }

    if (context?.recentMessages && context.recentMessages.length > 0) {
      const historyStr = context.recentMessages
        .slice(-4)
        .map((m) => `${m.sender}: "${m.content}"`)
        .join('\n');
      contextSection += `\nRecent Conversation History:\n${historyStr}\n`;
    }

    const response = await openai.chat.completions.create({
      model: config.openai.chatModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert entity extraction system for a Bangladeshi honey business named Royal Honey BD.
Analyze the customer message (Bangla, English, or Banglish) and extract personal details (name, phone, address, thana, district) and any product order/cart actions.

Live available product catalog:
${catalogList}
${contextSection}
When extracting cartActions:
- If customer mentions any product (including typos like "হানি নার্স" for Honey Nut, or Banglish like "sorisha modhu", or "৩টা কম্বো"), match it to the exact matched Product ID from the catalog and set productId.
- If customer changes quantity or clarifies total count wanted (e.g. "ami dui 2 ta nite chai", "২টা লাগবে", "২টা দেন", "২টি নিব", "১টা বাদ দেন"):
  Look at the product in the customer's current cart or the product discussed in the recent conversation. Set action to 'UPDATE' with that productId and the requested total quantity (e.g. 2). DO NOT use 'ADD' if the customer is clarifying or changing the count for an already selected item.
- If unsure of exact product ID, leave productId as null and set productKeyword.`,
        },
        {
          role: 'user',
          content: customerMessage,
        },
      ],
      tools: extractionTools,
      tool_choice: { type: 'function', function: { name: 'extractCustomerAndCartIntent' } },
      temperature: 0.1,
    });

    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.type === 'function' && toolCall.function?.arguments) {
      return JSON.parse(toolCall.function.arguments) as IExtractedEntities;
    }
  } catch (error: any) {
    console.warn('⚠️ OpenAI Entity Extraction fallback triggered:', error?.message || error);
  }

  return heuristicFallbackExtraction(customerMessage, context);
};

/**
 * Fast regex-based fallback if OpenAI is offline
 */
const heuristicFallbackExtraction = (
  text: string,
  context?: IExtractionContext,
): IExtractedEntities => {
  const result: IExtractedEntities = {
    customerInfo: {},
    cartActions: [],
  };

  // 1. Phone number regex (e.g. 017XXXXXXXX, 8801XXXXXXXX)
  const phoneMatch = text.match(/(?:(?:\+|00)88|01)?([13-9]\d{8})\b/);
  if (phoneMatch) {
    const raw = phoneMatch[0];
    result.customerInfo!.phone = raw.startsWith('01') ? raw : `0${raw.slice(-10)}`;
  }

  // 2. District detection
  if (text.includes('ঢাকা') || /dhaka/i.test(text)) {
    result.customerInfo!.district = 'Dhaka';
  }

  // 3. Simple Product keyword matching
  const hasSundarban = text.includes('সুন্দরবন') || /sundarban/i.test(text);
  const hasMustard = text.includes('সরিষা') || /mustard/i.test(text);
  const hasBlackSeed = text.includes('কালোজিরা') || /black.?seed/i.test(text);

  const isOrder =
    text.includes('অর্ডার') ||
    text.includes('নিব') ||
    text.includes('চাই') ||
    text.includes('পাঠান') ||
    /order/i.test(text);

  if (isOrder && (hasSundarban || hasMustard || hasBlackSeed)) {
    result.isOrderIntent = true;
    let keyword = 'sundarban_500g';
    if (hasMustard) keyword = 'mustard_500g';
    if (hasBlackSeed) keyword = 'black_seed_500g';

    result.cartActions?.push({
      action: 'ADD',
      productKeyword: keyword,
      quantity: 1,
    });
  } else if (context?.currentCart && context.currentCart.length === 1) {
    // Dynamic numeric extraction (supports both English and Bengali numerals: ১, ২, ৩, ১০, etc.)
    const banglaToEng: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const wordNums: Record<string, number> = {
      dui: 2, duto: 2, দুই: 2, দুটি: 2,
      tin: 3, tinta: 3, তিন: 3, তিনটি: 3,
      char: 4, চার: 4, চারটি: 4,
      paach: 5, পাঁচ: 5, পাঁচটি: 5,
    };

    const numMatch = text.match(/(\d+|[০-৯]+)\s*(?:ta|টা|ti|টি|jar|জার|pcs|পিস)?/i);
    let detectedQty: number | null = null;

    if (numMatch) {
      const normalized = numMatch[1].replace(/[০-৯]/g, (d) => banglaToEng[d] || d);
      const parsed = parseInt(normalized, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        detectedQty = parsed;
      }
    }

    if (!detectedQty) {
      for (const [word, val] of Object.entries(wordNums)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(text) || text.includes(word)) {
          detectedQty = val;
          break;
        }
      }
    }

    if (detectedQty) {
      result.cartActions?.push({
        action: 'UPDATE',
        productId: context.currentCart[0].productId,
        productKeyword: context.currentCart[0].productName,
        quantity: detectedQty,
      });
    }
  }

  // 4. Payment method detection
  if (/bkash|বিকাশ/i.test(text)) {
    result.paymentMethod = 'BKASH';
  } else if (/nagad|নগদ/i.test(text)) {
    result.paymentMethod = 'NAGAD';
  } else if (/cod|ক্যাশ অন|ক্যাশ|cash/i.test(text)) {
    result.paymentMethod = 'COD';
  }

  // 5. TrxID detection (8-12 alphanumeric characters, e.g. 9JH76BA2Q)
  const trxMatch = text.match(/(?:trxid|trx|ট্রানজেকশন|id)[:\s]*([A-Za-z0-9]{8,12})\b/i) ||
    text.match(/\b([A-Z0-9]{8,12})\b/);
  if (trxMatch && !phoneMatch) {
    result.transactionId = trxMatch[1].toUpperCase();
  }

  // 6. Explicit order confirmation detection
  const clean = text.trim();
  const isConfirmWord =
    /^(হ্যাঁ|হ্যা|জি|confirm|কনফার্ম|yes|ok|ঠিক আছে|অর্ডার করুন|পাঠিয়ে দিন|পাঠান)\b/i.test(clean) ||
    /(অর্ডার\s*কনফার্ম|অর্ডারটি\s*কনফার্ম|অর্ডার\s*করুন|পাঠিয়ে\s*দিন|পাঠিয়ে\s*দেন|কনফার্ম\s*করলাম)/i.test(clean);
  if (isConfirmWord) {
    result.isOrderConfirmed = true;
  }

  return result;
};
