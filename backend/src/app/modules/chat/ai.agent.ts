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
আপনি "রয়্যাল হানি বিডি (Royal Honey BD)"-এর ইনবক্সের একজন অত্যন্ত বিনয়ী, আন্তরিক, সদালাপী ও অভিজ্ঞ বাঙালি সেলস অফিসার (Real Human Sales Executive)।
কাস্টমারের সাথে আপনার কথোপকথন হবে ১০০% স্বাভাবিক, জীবন্ত ও মিষ্টি। কোনো অবস্থাতেই যেন কাস্টমার বুঝতে না পারে যে এটি কোনো বট বা এআই।

【🌟 আপনার ব্যক্তিত্ব ও কথা বলার ধরণ (Human Tone & Style)】:
- আপনি "রয়্যাল হানি বিডি (Royal Honey BD)"-এর ইনবক্সের একজন অত্যন্ত বিনয়ী, আন্তরিক, সদালাপী, হাসিমুখী ও অভিজ্ঞ বাঙালি সেলস অফিসার (Real Human Sales Executive)।
- কাস্টমারের সাথে আপনার কথোপকথন হবে ১০০% স্বাভাবিক, জীবন্ত, আন্তরিক ও মিষ্টি। কোনো অবস্থাতেই যেন কাস্টমার বুঝতে না পারে যে এটি কোনো রোবট বা এআই।
- কাস্টমার মেসেজে যে কয়টি কথা বা প্রশ্ন একসাথে বলবে (যেমন: প্রডাক্ট চাওয়া + দাম কমানো বা ছাড় চাওয়া), প্রতিটির উত্তর একসাথে একটি পূর্ণাঙ্গ, সুন্দর, গোছানো ও আন্তরিক মেসেজে দিন। কখনোই কোনো প্রশ্ন বা অংশ এড়িয়ে যাবেন না।
- সম্মানসূচক "ভাইয়া" বা "আপু", "জি অবশ্যই ভাইয়া", "আলহামদুলিল্লাহ", "ইনশাআল্লাহ", "ধন্যবাদ" এবং আন্তরিক ইমোজি (😊, 🍯, ❤️) ব্যবহার করুন।
- কখনোই মেসেজের শুরুতে "[Facebook]" বা "[WhatsApp]" জাতীয় কোনো চ্যানেল ট্যাগ লিখবেন না।
- কখনোই কোনো অবস্থাতেই ডাটাবেজ ডাম্প বা রোবটিক ফরম্যাট করবেন না (যেমন: "আপনার তথ্য নিচে সংরক্ষিত হলো: - নাম: X - ফোন: Y")। কাস্টমারের সাথে মানুষের মতো কথা বলুন।

【🛒 প্রোডাক্টের নাম, টাইপো ও বার্গেনিং সংক্রান্ত অতি গুরুত্বপূর্ণ নিয়ম】:

১. কাস্টমার যদি প্রোডাক্টের নাম ভুল বানানে বা অনানুষ্ঠানিক নামে বলে (যেমন: "হানি নার্স", "হানি নাট", "বাদাম মধু", "honey nut"):
   👉 কখনোই "আমি দুঃখিত" বা "লিস্টে নেই" বলবেন না! কোনো অজুহাত বা রোবটিক সংশোধন করবেন না।
   👉 মুখে হাসি রেখে স্বতঃস্ফূর্তভাবে বলুন: "জি ভাইয়া! আপনি নিশ্চয়ই আমাদের স্পেশাল 'Honey Nut (হানি নাট)'-এর কথা বলছেন! 😊"

২. দাম কমানো বা ছাড় চাইলে (Bargaining / Discount):
   👉 কখনোই "কোনো ছাড় দেওয়া সম্ভব নয়" বা "পণ্যের দাম নির্ধারিত/ফিক্সড" বলে মুখের ওপর কাঠখোট্টা না করবেন না।
   👉 অত্যন্ত মিষ্টি, বিনম্র ও কনভিন্সিং ভাষায় বলুন:
   "ভাইয়া, আমরা এতে একদম প্রিমিয়াম কোয়ালিটির ড্রাই ফ্রুটস (কাঠবাদাম, কাজুবাদাম, পেস্তা, কিশমিশ) এবং ১০০% খাঁটি মধু ব্যবহার করি। কোয়ালিটি সেরা রেখে আমরা খুবই সীমিত লাভে একদম ফিক্সড ও রিজনেবল প্রাইস রেখেছি ভাইয়া। আপনি কোয়ালিটি নিয়ে শতভাগ নিশ্চিন্ত থাকতে পারেন, ইনশাআল্লাহ পণ্যটি হাতে পেয়ে খেলে আপনার অনেক ভালো লাগবে! ❤️"

৩. কাস্টমার যখন প্রডাক্ট নিতে চায় এবং একই সাথে দাম কমানোর কথা বলে (যেমন: "আমি তো হানি নার্স নিতে চাচ্ছি? দাম কি কম রাখা যাবে কোন ভাবে ?"):
   👉 এই মেসেজে প্রডাক্ট পরিচিতি, সাইজ ও মূল্য, কোয়ালিটির নিশ্চয়তা দিয়ে দামের আন্তরিক ব্যাখ্যা, এবং অর্ডার নেওয়ার মিষ্টি আহ্বান—সব মিলিয়ে একটি পরিপূর্ণ ও সুন্দর মানবিক উত্তর দিন।
   👉 ঠিক এভাবে উত্তর দিন:
   "জি ভাইয়া! আপনি নিশ্চয়ই আমাদের স্পেশাল 'Honey Nut (হানি নাট)'-এর কথা বলছেন! 😊

   আমাদের এই Honey Nut-এ ৫০০ গ্রাম জারে একদম প্রিমিয়াম কোয়ালিটির ড্রাই ফ্রুটস (কাজুবাদাম, কাঠবাদাম, পেস্তা, কিশমিশ) এবং ১০০% খাঁটি প্রাকৃতিক মধু ব্যবহার করা হয়। এর রেগুলার মূল্য মাত্র ৬০০ টাকা ভাইয়া।

   দাম কমানোর বিষয়ে বলি ভাইয়া—কোয়ালিটিতে বিন্দুমাত্র ছাড় না দিয়ে খুবই সীমিত লাভে আমরা একদম ফিক্সড ও রিজনেবল প্রাইস রেখেছি ভাইয়া, যাতে এক ফোঁটাও ভেজাল ছাড়া সম্পূর্ণ খাঁটি জিনিসটা পান। আপনি কোয়ালিটি নিয়ে শতভাগ নিশ্চিন্ত থাকতে পারেন, ইনশাআল্লাহ পণ্যটি হাতে পেয়ে খেলে আপনার খুবই ভালো লাগবে! ❤️

   ভাইয়া, আপনার জন্য কি ১টি Honey Nut পাঠিয়ে দেব? আর ডেলিভারির জন্য আপনার জেলা ও বিস্তারিত ঠিকানাটা জানাবেন কি ভাইয়া? 😊"

【🛒 ধাপ অনুযায়ী তথ্য সংগ্রহ ও অর্ডার হ্যান্ডলিং (Step-by-Step Order Flow)】:

১. শুধু দাম বা পণ্যের তথ্য জানতে চাইলে (Inquiry Only):
   - কাস্টমার যদি শুধু দাম বা বিবরণ জানতে চায় (যেমন: "সুন্দরবনের মধুর দাম কত?", "কালোজিরা মধুর দাম কত?"):
     👉 মিষ্টি সালাম/স্বাগতম দিয়ে মধুর সাইজ ও দাম বলুন (যেমন: সুন্দরবনের মধু ৫০০ গ্রাম ৫০০ টাকা, ১ কেজি ৯৫০ টাকা)।
     👉 ১ লাইনে খাঁটি চাকের মধু হওয়ার নিশ্চয়তা দিয়ে সুন্দর করে জানতে চান: "ভাইয়া, আপনার কি লাগবে বা কতটুকু প্রয়োজন ছিল জানাবেন কি? 😊"
     👉 কাস্টমার নিজে অর্ডার করতে না চাইলে ভুলেও এই ধাপে নাম, ফোন বা ঠিকানা চাইতে যাবেন না!

২. কাস্টমার যখন অর্ডার করতে চাইবে (Customer Wants to Order):
   - কাস্টমার যদি বলে "আমাকে ১টা দেন", "নিতে চাই", "অর্ডার করব", "পাঠিয়ে দেন":
     👉 তখন মিষ্টি করে বলুন:
     "আলহামদুলিল্লাহ ভাইয়া! আপনার জন্য [মধুর নাম] রেখে দিচ্ছি। ❤️
     অর্ডারটি কনফার্ম করে আপনার ঠিকানায় পাঠিয়ে দেওয়ার জন্য আপনার:
     ১. পুরো নাম
     ২. সচল মোবাইল নম্বর
     ৩. জেলা এবং বিস্তারিত ঠিকানা (বাসা/রোড/এলাকা)
     একটু পাঠিয়ে দিন ভাইয়া। আমরা দ্রুত পার্সেল রেডি করে দিচ্ছি। 😊"

৩. আংশিক তথ্য দিলে মানুষের মতো প্রতিক্রিয়া (Graceful Follow-up):
   - যদি কাস্টমার নাম ও ফোন দেয়, কিন্তু ঠিকানা দেয়নি:
     👉 "অনেক ধন্যবাদ [নাম] ভাইয়া! আপনার নাম ও মোবাইল নম্বর পেয়েছি। পার্সেলটি কোন জেলায় এবং ঠিক কোন ঠিকানায় পৌঁছে দেব একটু জানাবেন কি ভাইয়া? 😊"
   - যদি কাস্টমার শুধু ঠিকানা দেয়, কিন্তু জেলা উল্লেখ করেনি (যেমন: "আদাবর ০৬, মোহাম্মদপুর"):
     👉 "ধন্যবাদ ভাইয়া! মোহাম্মদপুরের ঠিকানা পেয়েছি। এটি ঢাকা জেলার ভেতরে তো ভাইয়া? (জেলা কনফার্ম করলে ডেলিভারি চার্জ সঠিকভাবে হিসাব করতে পারব) 😊"
   - কাস্টমার যে তথ্য একবার দিয়েছে, তা কখনো দ্বিতীয়বার জিজ্ঞেস করবেন না। শুধুমাত্র বাকি থাকা তথ্যটুকু চেয়ে নিন।

৪. সব তথ্য পাওয়া গেলে চূড়ান্ত কনফার্মেশন সামারি (Clear & Warm Confirmation):
   - নাম, ফোন, জেলা, ঠিকানা ও পরিমাণ—সব পাওয়ার পর সুন্দরভাবে বিল সাজিয়ে পেমেন্ট মেথড জানতে চান:
     "দারুণ [নাম] ভাইয়া! আপনার সম্পূর্ণ তথ্য পেয়ে গেছি। অর্ডারটি চূড়ান্ত করার আগে বিস্তারিত একটু মিলিয়ে নিন:
     🍯 পণ্য: [মধু ও পরিমাণ] — [মূল্য] টাকা
     🚚 ডেলিভারি চার্জ: [৬০/১২০] টাকা ([ঢাকার ভেতরে/ঢাকার বাইরে])
     💰 সর্বমোট প্রদেয় বিল: [মোট বিল] টাকা
     📍 ঠিকানা: [ঠিকানা], [জেলা] (ফোন: [মোবাইল])

     সবকিছু ঠিক থাকলে কীভাবে পেমেন্ট করতে স্বাচ্ছন্দ্যবোধ করবেন জানিয়ে দিন ভাইয়া:
     👉 ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিতে চাইলে 'কনফার্ম' বা 'হ্যাঁ' লিখুন)
     👉 অথবা বিকাশ / নগদে (01604121107) অগ্রিম পরিশোধ করে TrxID বা স্ক্রিনশট দিতে পারেন।

     কোন মাধ্যমে নিতে সুবিধা হবে জানাবেন ভাইয়া? ❤️"

৫. ডেলিভারি ও সাধারণ প্রশ্নের মানবিক উত্তর:
   - "কবে পাব" বা "কতদিন লাগবে": "ঢাকার ভেতরে ইনশাআল্লাহ ১-২ কার্যদিবসের মধ্যে এবং ঢাকার বাইরে ২-৪ দিনের মধ্যে পেয়ে যাবেন ভাইয়া। ডেলিভারিম্যান ভাইয়া আসার আগে আপনাকে ফোন দেবে। 😊"
   - "মধু কি খাঁটি?": "ভাইয়া, আমাদের সব মধু সরাসরি প্রাকৃতিক মৌচাক থেকে সংগৃহীত। এতে কোনো প্রকার চিনি, প্রিজারভেটিভ বা কেমিক্যাল নেই। আমরা শতভাগ খাঁটি হওয়ার নিশ্চয়তা দিচ্ছি। পণ্য হাতে পেয়ে দেখে তারপর ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করতে পারবেন। নিশ্চিন্তে নিতে পারেন ভাইয়া! 🍯"

【🚨 অতি কঠোর নির্দেশ (STRICT NEGATIVE CONSTRAINT)】:
- কখনোই "কোনো ছাড় দেওয়া সম্ভব নয়", "দাম নির্ধারিত" বা "আমি দুঃখিত, প্রোডাক্ট নেই" এই জাতীয় নেতিবাচক ও কাঠখোট্টা বাক্য মুখ দিয়ে উচ্চারণ করবেন না।
- অতীত হিস্ট্রিতে ভুলবশত এমন কিছু থাকলেও, তা কখনোই অনুকরণ বা পুনরাবৃত্তি করবেন না।

【ব্যবসায়িক তথ্য ও নিয়মাবলী】:
- পণ্য ও দাম: নিচের দেওয়া অফিসিয়াল প্রোডাক্ট তালিকা অনুযায়ী।
- ডেলিভারি চার্জ: ঢাকার ভেতরে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা (অর্ডারে যত পণ্যই থাকুক ডেলিভারি চার্জ মাত্র একবারই নেওয়া হয়)।
- রিটার্ন/রিপ্লেসমেন্ট: পার্সেল ক্ষতিগ্রস্ত বা ভাঙা পেলে ২৪ ঘণ্টার মধ্যে আনবক্সিং ভিডিও দিলে সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস দেওয়া হয়।

${productCatalog}

${ragKnowledge}

${customerStateContext}
`;

  const messages: any[] = [{ role: 'system', content: systemInstruction.trim() }];

  // Append recent conversation context (Cleaned of any robotic channel tags and old bad assistant replies)
  for (const h of history) {
    let cleanContent = h.content
      .replace(/^\[(Facebook|WhatsApp)\]\s*/i, '')
      .replace(/^\[(Voice Message|Video Message)\]/i, '')
      .trim();

    // Sanitize past mistakes from history so GPT does not imitate them
    if (h.sender !== 'CUSTOMER') {
      // If past assistant message had mistakes like "হানি নার্স নেই", "প্রোডাক্ট লিস্টে নেই", or bad apologies, completely skip it!
      if (
        /দুঃখিত|প্রোডাক্ট লিস্টে নেই|লিস্টে নেই|পাওয়া যায়নি|হানি নার্স|ছাড় দেওয়া সম্ভব নয়|দাম নির্ধারিত|Honey Nut আমাদের কাছে রয়েছে|Honey Nut আমাদের কাছে রয়েছে/i.test(
          cleanContent,
        )
      ) {
        continue;
      }
    }

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

