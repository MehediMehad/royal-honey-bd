import config from '../../../configs';
import { openai } from '../../libs/openai';
import prisma from '../../libs/prisma';
import { KnowledgeServices } from '../knowledge/knowledge.service';
import { CartServices } from '../cart/cart.service';
import type { ICustomerSession } from '../customer/customer.session';
import { CustomerServices } from '../customer/customer.service';
import type { IRecentMessageContext } from './chat.interface';

/**
 * Build real-time product catalog context string from PostgreSQL
 */
const getProductCatalogContext = async (): Promise<string> => {
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    orderBy: { price: 'asc' },
  });

  if (products.length === 0) {
    return 'বর্তমানে কোনো প্রোডাক্ট স্টক তালিকা পাওয়া যায়নি।';
  }

  const lines = products.map((p) => {
    const stockStatus = p.stockCount > 0 ? `স্টক আছে (${p.stockCount} টি)` : 'স্টক শেষ';
    return `- ${p.name} (${p.weight}): ৳${p.price} [${stockStatus}] | আইডি: ${p.id}`;
  });

  return `【বর্তমান রয়্যাল হানি বিডি প্রোডাক্ট তালিকা ও মূল্য】\n${lines.join('\n')}`;
};

/**
 * Retrieve relevant FAQ & Business Policies context via OpenAI Vector / Keyword RAG
 */
const getRagKnowledgeContext = async (query: string): Promise<string> => {
  try {
    const results = await KnowledgeServices.searchKnowledge({
      query,
      topK: 3,
      minSimilarity: 0.35,
    });

    if (results.length === 0) {
      return 'প্রাসঙ্গিক কোনো অতিরিক্ত নলেজ আইটেম পাওয়া যায়নি। সাধারণ বিজনেস রুল অনুসরণ করুন।';
    }

    const chunks = results.map((r: any, idx: number) => {
      const item = r.item;
      return `[নলেজ ${idx + 1} - ${item.category}]\nপ্রশ্ন/বিষয়: ${item.question}\nতথ্য/উত্তর: ${item.answer}`;
    });

    return `【প্রাসঙ্গিক বিজনেস নলেজ ও পলিসি】\n${chunks.join('\n\n')}`;
  } catch (err: any) {
    console.warn('RAG retrieval warning:', err?.message || err);
    return '';
  }
};

/**
 * Generate AI Customer Support response using OpenAI gpt-4o-mini with Cart State & Customer Context
 */
const generateCustomerReply = async (
  customerMessage: string,
  customerName?: string | null,
  history: IRecentMessageContext[] = [],
  session?: ICustomerSession,
): Promise<string> => {
  if (!config.openai.apiKey) {
    const cartSummary = session?.cart?.items?.length
      ? `\n\n${CartServices.formatCartSummary(session.cart, session.district)}`
      : '';
    return `আসসালামু আলাইকুম ${customerName || ''}! রয়্যাল হানি বিডি (Royal Honey BD)-তে আপনাকে স্বাগতম। আমাদের সব মধু ১০০% প্রাকৃতিক ও খাঁটি।${cartSummary}\nঅর্ডার সম্পন্ন করতে আপনার নাম, মোবাইল নম্বর ও সম্পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন। ধন্যবাদ!`;
  }

  const [productCatalog, ragKnowledge] = await Promise.all([
    getProductCatalogContext(),
    getRagKnowledgeContext(customerMessage),
  ]);

  let customerStateContext = '';
  if (session) {
    const cartCard = CartServices.formatCartSummary(session.cart, session.district);
    const missingPrompt = CustomerServices.formatMissingFieldsPrompt(session.missingFields);

    const linkedChannelsStr =
      session.linkedChannels && session.linkedChannels.length > 1
        ? `\n- সংযুক্ত চ্যানেলসমূহ: ${session.linkedChannels.join(', ')} (Facebook & WhatsApp একীভূত একাউন্ট)`
        : '';

    customerStateContext = `
【গ্রাহকের বর্তমান প্রোফাইল ও কার্ট স্টেট】
- কাস্টমার নাম: ${session.name || 'দেওয়া হয়নি'}
- ফোন নম্বর: ${session.phone || 'দেওয়া হয়নি'}
- জেলা: ${session.district || 'দেওয়া হয়নি'}
- পূর্ণ ঠিকানা: ${session.fullAddress || 'দেওয়া হয়নি'}${linkedChannelsStr}
- বাকি থাকা ফিল্ডসমূহ: ${session.missingFields.length > 0 ? session.missingFields.join(', ') : 'সব তথ্য পাওয়া গেছে!'}

${cartCard}

【পরবর্তী অ্যাকশন নির্দেশনা】
${missingPrompt}
`;
  }

  const systemInstruction = `
আপনি "রয়্যাল হানি বিডি (Royal Honey BD)"-এর ইনবক্সের একজন অত্যন্ত আন্তরিক, অমায়িক, হাসিখুশি ও বিশ্বস্ত বাঙালি কাস্টমার সার্ভিস ও সেলস রিপ্রেজেন্টেটিভ (Real Human Sales Executive)।
আপনার সাথে কাস্টমার কথা বলে যেন কোনোভাবেই না বোঝে যে আপনি কোনো এআই বা রোবট। আপনি একজন সত্যিকারের রক্ত-মাংসের মানুষের মতো মিষ্টি ও যত্নশীল ভাষায় কথা বলবেন।

【🚨 অত্যন্ত কঠোর ও আবশ্যিক নির্দেশনাবলী】:
১. মানুষের মতো স্বাভাবিক বাক্যে কথা বলা (Human-like Natural Tone):
   - কখনোই বার্তার শুরুতে "[Facebook]" বা "[WhatsApp]" জাতীয় কোনো ট্যাগ লিখবেন না।
   - কখনোই রোবটের মতো ডাটাবেজ ডাম্প বা ফরম্যাট করবেন না (যেমন: "ধন্যবাদ, রাকিব! আপনার তথ্য নিচে সংরক্ষিত হলো: - *নাম:* রাকিব - *ঠিকানা:* X")।
   - মানুষ যেভাবে মেসেঞ্জারে চ্যাট করে, সেভাবে স্বাভাবিক ও সাবলীল বাক্য লিখুন (যেমন: "অনেক ধন্যবাদ রাকিব ভাইয়া! আপনার নাম, মোবাইল নম্বর এবং আদাবরের ঠিকানাটি পেয়েছি। পার্সেলটি কি ঢাকা জেলায় যাবে?")।
   - সম্মানসূচক "ভাইয়া" বা "আপু", "জি অবশ্যই", "আলহামদুলিল্লাহ", "ইনশাআল্লাহ", "ধন্যবাদ" এবং মিষ্টি ইমোজি (😊, 🍯, ❤️) ব্যবহার করুন।

২. প্রোডাক্ট ইনকোয়ারি বনাম অর্ডার নেওয়া (Project Section 8 - অতি গুরুত্বপূর্ণ):
   - কাস্টমার যদি শুধুমাত্র কোনো মধুর দাম বা তথ্য জানতে চায় (যেমন: "আপনাদের সুন্দরবনের মধুর দাম কত?", "কী কী মধু আছে?"):
     👉 ভুলেও সাথে সাথে নাম, ফোন নম্বর, জেলা, ঠিকানা চাওয়া যাবে না!
     👉 আগে সালাম/অভিবাদন দিয়ে মধুর সঠিক দাম (যেমন: ২৫০ গ্রাম প্যাকেজ মাত্র ২০০ টাকা) ও সুন্দরবনের প্রাকৃতিক চাক থেকে সংগৃহীত ১০০% খাঁটি হওয়ার নিশ্চয়তা দিন। তারপর মিষ্টি করে জানতে চান: "ভাইয়া, আপনার কি লাগবে বা কতটুকু প্রয়োজন ছিল জানাবেন কি? 😊"
   - কাস্টমার যখন নিজে বলবে যে সে নিতে চায় (যেমন: "হ্যাঁ আমাকে ১টা দেন", "অর্ডার করতে চাই", "২টা লাগবে") অথবা নাম/ঠিকানা পাঠাবে, তখনই শুধুমাত্র অর্ডার নেওয়ার প্রক্রিয়া শুরু করুন।

৩. কাস্টমার তথ্য দিলে স্বাভাবিক প্রতিক্রিয়া (Natural Field Collection):
   - কাস্টমার যে তথ্য ইতিমধ্যে একবার দিয়েছে, তা আর কখনো নতুন করে জিজ্ঞেস করবেন না।
   - যেসব তথ্য এখনো বাকি আছে, খুব বিনম্রভাবে এবং স্বাভাবিক কথোপকথনের মাঝে শুধু সেই তথ্যটুকু চেয়ে নিন।
   - তথ্য পাওয়ার পর রোবটের মতো তালিকা না বানিয়ে মানুষের মতো ধন্যবাদ দিয়ে বাকি তথ্য জানতে চান।

৪. চূড়ান্ত অর্ডারের সময় সুন্দর সামারি (Final Order Confirmation):
   - যখন কাস্টমারের নাম, ফোন নম্বর, জেলা, ঠিকানা ও মধুর পরিমাণ—সব পাওয়া হয়ে যাবে, তখন সুন্দর করে গুছিয়ে বলুন:
     "রাকিব ভাইয়া, আপনার অর্ডারটি কনফার্ম করতে বিস্তারিত তথ্যগুলো একবার মিলিয়ে নিন:
     🍯 পণ্য: সুন্দরবনের মধু (২৫০ গ্রাম) - ২০০ টাকা
     🚚 ডেলিভারি চার্জ: ৬০ টাকা (ঢাকার ভেতরে)
     💰 মোট প্রদেয়: ২৬০ টাকা
     📍 ঠিকানা: আদাবর ০৬, মোহাম্মদপুর, ঢাকা (মোবাইল: 01604121107)

     সবকিছু ঠিক থাকলে কীভাবে পেমেন্ট করতে চান জানিয়ে কনফার্ম করতে পারেন:
     ১. ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিতে চাইলে 'কনফার্ম' বা 'হ্যাঁ' লিখুন)
     ২. বিকাশ / নগদ (অগ্রিম পরিশোধ করতে চাইলে আমাদের পার্সোনাল 01604121107 নম্বরে পাঠিয়ে TrxID বা স্ক্রিনশট দিন) 😊"

৫. ডেলিভারি বা সাধারণ প্রশ্নের সহজ উত্তর:
   - কাস্টমার যদি জিজ্ঞেস করে "কবে পাব" বা "কতদিন লাগবে":
     👉 "ঢাকার ভেতরে ইনশাআল্লাহ ১ থেকে ২ কার্যদিবসের মধ্যে এবং ঢাকার বাইরে ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি পেয়ে যাবেন ভাইয়া। ডেলিভারিম্যান ভাইয়া আসার আগে আপনাকে ফোন দেবে। আর কোনো কিছু জানার থাকলে নির্দ্বিধায় বলুন! 😊"

【ব্যবসায়িক পলিসি】:
- পণ্য ও দাম: শুধুমাত্র নিচের দেওয়া অফিসিয়াল তালিকা অনুযায়ী।
- ডেলিভারি চার্জ: ঢাকার ভেতরে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা (একটি অর্ডারে যত পণ্যই থাকুক ডেলিভারি চার্জ মাত্র একবারই যোগ হবে)।
- খাঁটি মধু: আমাদের সব মধু ১০০% প্রাকৃতিক ও খাঁটি। পার্সেল ভাঙা পেলে ২৪ ঘণ্টার মধ্যে আনবক্সিং ভিডিও দিলে সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস দেওয়া হয়।

${productCatalog}

${ragKnowledge}

${customerStateContext}
`;

  const messages: any[] = [{ role: 'system', content: systemInstruction.trim() }];

  // Append recent conversation context (Cleaned of any robotic channel tags)
  for (const h of history) {
    const cleanContent = h.content
      .replace(/^\[(Facebook|WhatsApp)\]\s*/i, '')
      .replace(/^\[(Voice Message|Video Message)\]/i, '')
      .trim();

    if (cleanContent) {
      messages.push({
        role: h.sender === 'CUSTOMER' ? 'user' : 'assistant',
        content: cleanContent,
      });
    }
  }

  // Append latest user message
  messages.push({
    role: 'user',
    content: customerMessage,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.chatModel,
      messages,
      temperature: 0.5,
      max_tokens: 700,
    });

    let reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }

    // Strip any accidental [Facebook] or [WhatsApp] tag
    reply = reply.replace(/^\[(Facebook|WhatsApp)\]\s*/i, '').trim();

    return reply;
  } catch (error: any) {
    console.error('❌ OpenAI Chat Completion Error:', error?.message || error);
    return 'আসসালামু আলাইকুম! রয়্যাল হানি বিডি-তে আপনাকে স্বাগতম। এই মুহূর্তে আমাদের সিস্টেমে সাময়িক ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার মেসেজ দিন অথবা হেল্পলাইনে (01604121107) যোগাযোগ করুন।';
  }
};

export const AiAgent = {
  getProductCatalogContext,
  getRagKnowledgeContext,
  generateCustomerReply,
};

