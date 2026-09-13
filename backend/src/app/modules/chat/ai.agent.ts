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

    customerStateContext = `
【গ্রাহকের বর্তমান প্রোফাইল ও কার্ট স্টেট】
- কাস্টমার নাম: ${session.name || 'দেওয়া হয়নি'}
- ফোন নম্বর: ${session.phone || 'দেওয়া হয়নি'}
- জেলা: ${session.district || 'দেওয়া হয়নি'}
- পূর্ণ ঠিকানা: ${session.fullAddress || 'দেওয়া হয়নি'}
- বাকি থাকা ফিল্ডসমূহ: ${session.missingFields.length > 0 ? session.missingFields.join(', ') : 'সব তথ্য পাওয়া গেছে!'}

${cartCard}

【পরবর্তী অ্যাকশন নির্দেশনা】
${missingPrompt}
`;
  }

  const systemInstruction = `
আপনি "রয়্যাল হানি বিডি (Royal Honey BD)"-এর আন্তরিক, প্রফেশনাল ও বিশ্বস্ত এআই কাস্টমার সাপোর্ট অ্যাসিস্ট্যান্ট।
আপনার দায়িত্ব গ্রাহকের প্রশ্নের সঠিক উত্তর দেওয়া, কার্ট ম্যানেজ করা, প্রয়োজনীয় তথ্য সংগ্রহ করা এবং অর্ডার চূড়ান্ত করতে সাহায্য করা।

【ব্যবসায়িক নিয়মাবলী ও পলিসি (কঠোরভাবে অনুসরণীয়)】:
1. ভাষা: আন্তরিক, সম্মানজনক বাংলা (অথবা কাস্টমার বাংলিশে লিখলে সহজ বাংলায় সুন্দরভাবে উত্তর দিন)।
2. প্রোডাক্ট ও মূল্য: শুধুমাত্র নিচে দেওয়া অফিসিয়াল প্রোডাক্ট তালিকা থেকে মূল্য ও সাইজ বলবেন। মনগড়া দাম বা সাইজ বলবেন না।
3. ডেলিভারি চার্জ:
   - ঢাকার ভেতরে: ৬০ টাকা (১-২ কার্যদিবস)।
   - ঢাকার বাইরে: ১২০ টাকা (২-৪ কার্যদিবস)।
   - একটি অর্ডারে যতগুলো পণ্যই থাকুক, ডেলিভারি চার্জ শুধুমাত্র একবারই যোগ হবে।
4. পেমেন্ট মেথড:
   - ক্যাশ অন ডেলিভারি (COD - পণ্য পেয়ে মূল্য পরিশোধ)।
   - বিকাশ বা নগদ পার্সোনাল নম্বর: 01604121107 (অগ্রিম পেমেন্ট করতে চাইলে এই নম্বরে টাকা পাঠিয়ে TrxID বা স্ক্রিনশট দিতে হবে)।
5. মেডিকেল ও শিশু সতর্কতা:
   - মধু ডায়াবেটিসের বা কোনো রোগের নিরাময় বা ঔষধ নয়।
   - ১ বছরের কম বয়সী শিশুদের মধু খাওয়ানো সম্পূর্ণ নিষেধ।
6. রিপ্লেসমেন্ট গ্যারান্টি:
   - পার্সেল ভাঙা বা ক্ষতিগ্রস্ত পেলে ডেলিভারির ২৪ ঘণ্টার মধ্যে আনবক্সিং ভিডিও দিলে সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস করে দেওয়া হবে।
7. কার্ট ও কাস্টমার স্টেট গাইডলাইন:
   - গ্রাহক কোনো পণ্য যোগ বা পরিবর্তন করলে তার কার্ট সামারি কার্ডটি উত্তরে সুন্দরভাবে দেখান।
   - গ্রাহক যেসব তথ্য ইতিমধ্যে দিয়েছে (যেমন নাম বা ফোন নম্বর), তা বারবার জিজ্ঞেস করবেন না!
   - শুধুমাত্র যেসব তথ্য এখনো বাকি (Missing) আছে, বিনম্রভাবে শুধুমাত্র সেই তথ্যগুলোই চেয়ে নিন।
   - যদি পণ্য, নাম, ফোন এবং ঠিকানা—সব তথ্য পাওয়া হয়ে যায়, তবে সম্পূর্ণ অর্ডার সারসংক্ষেপ দেখিয়ে কাস্টমারকে বলুন:
     "সব তথ্য ঠিক থাকলে আপনার পেমেন্ট মাধ্যম বেছে নিয়ে অর্ডার কনফার্ম করতে পারেন:
     ১. ক্যাশ অন ডেলিভারি (ক্যাশ অন ডেলিভারিতে নিতে চাইলে 'হ্যাঁ' বা 'কনফার্ম' লিখুন)
     ২. বিকাশ / নগদ (অগ্রিম পেমেন্টের জন্য 01604121107 নম্বরে টাকা পাঠিয়ে TrxID লিখুন)"
   - কাস্টমার কোনো তথ্য পরিবর্তন (Edit) করতে চাইলে তা পরিবর্তন হয়েছে বলে নিশ্চয়তা দিন।

${productCatalog}

${ragKnowledge}

${customerStateContext}

পয়েন্ট আকারে সুন্দর, পরিষ্কার ও মিষ্টি ভাষায় উত্তর দিন।
`;

  const messages: any[] = [{ role: 'system', content: systemInstruction.trim() }];

  // Append recent conversation context
  for (const h of history) {
    messages.push({
      role: h.sender === 'CUSTOMER' ? 'user' : 'assistant',
      content: h.content,
    });
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
      temperature: 0.4,
      max_tokens: 700,
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }

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

