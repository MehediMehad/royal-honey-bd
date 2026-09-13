import config from '../../../configs';
import { openai } from '../../libs/openai';
import prisma from '../../libs/prisma';
import { KnowledgeServices } from '../knowledge/knowledge.service';
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
 * Generate AI Customer Support response using OpenAI gpt-4o-mini
 */
const generateCustomerReply = async (
  customerMessage: string,
  customerName?: string | null,
  history: IRecentMessageContext[] = [],
): Promise<string> => {
  if (!config.openai.apiKey) {
    return `আসসালামু আলাইকুম ${customerName || ''}! রয়্যাল হানি বিডি (Royal Honey BD)-তে আপনাকে স্বাগতম। আমাদের সব পণ্য ১০০% প্রাকৃতিক ও খাঁটি। আপনি সুন্দরবন, সরিষা বা কালোজিরা ফুলের মধু সংক্রান্ত যে কোনো তথ্য জানতে পারেন। অর্ডার করতে আপনার নাম, মোবাইল নম্বর ও ঠিকানা দিন। ধন্যবাদ!`;
  }

  const [productCatalog, ragKnowledge] = await Promise.all([
    getProductCatalogContext(),
    getRagKnowledgeContext(customerMessage),
  ]);

  const systemInstruction = `
আপনি "রয়্যাল হানি বিডি (Royal Honey BD)"-এর আন্তরিক, প্রফেশনাল ও বিশ্বস্ত এআই কাস্টমার সাপোর্ট অ্যাসিস্ট্যান্ট।
আপনার দায়িত্ব গ্রাহকের প্রশ্নের সঠিক, নির্ভরযোগ্য ও বিনম্র উত্তর দেওয়া এবং অর্ডার করতে সাহায্য করা।

【ব্যবসায়িক নিয়মাবলী ও পলিসি (কঠোরভাবে অনুসরণীয়)】:
1. ভাষা: আন্তরিক, সম্মানজনক বাংলা (অথবা কাস্টমার বাংলিশে লিখলে সহজ বাংলায় সুন্দরভাবে উত্তর দিন)।
2. প্রোডাক্ট ও মূল্য: শুধুমাত্র নিচে দেওয়া অফিসিয়াল প্রোডাক্ট তালিকা থেকে মূল্য ও সাইজ বলবেন। মনগড়া দাম বা সাইজ বলবেন না।
3. ডেলিভারি চার্জ:
   - ঢাকার ভেতরে: ৬০ টাকা (১-২ কার্যদিবস)।
   - ঢাকার বাইরে: ১২০ টাকা (২-৪ কার্যদিবস)।
   - একটি অর্ডারে যতগুলো মধুই থাকুক, ডেলিভারি চার্জ শুধুমাত্র একবারই যোগ হবে।
4. পেমেন্ট মেথড:
   - ক্যাশ অন ডেলিভারি (COD - পণ্য হাতে পেয়ে মূল্য পরিশোধ)।
   - বিকাশ বা নগদ পার্সোনাল নম্বর: 01604121107। অগ্রিম পেমেন্ট করলে TrxID (ট্রানজেকশন আইডি) বা স্ক্রিনশট দিতে অনুরোধ করবেন।
5. মেডিকেল ডিসক্লেইমার:
   - মধু একটি পুষ্টিকর প্রাকৃতিক খাবার, তবে এটি ডায়াবেটিস বা কোনো জটিল রোগের নিরাময় বা ঔষধ নয়।
6. শিশু স্বাস্থ্য সতর্কতা:
   - ১ বছরের নিচের শিশুদের মধু খাওয়ানো সম্পূর্ণ নিষেধ (ইনফ্যান্ট বটুলিজমের ঝুঁকির কারণে)।
7. ভাঙা বা ক্ষতিগ্রস্ত পার্সেল:
   - পার্সেল ভাঙা বা ক্ষতিগ্রস্ত পেলে ডেলিভারির ২৪ ঘণ্টার মধ্যে আনবক্সিং ছবি বা ভিডিও দিলে আমরা সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস করে দেব।
8. অর্ডার প্রক্রিয়া:
   - গ্রাহক অর্ডার করতে চাইলে তাকে আন্তরিকভাবে বলুন:
     ১. কোন মধু কতটুকু (যেমন: সুন্দরবনের মধু ১ কেজি)
     ২. আপনার নাম
     ৩. মোবাইল নম্বর
     ৪. পূর্ণ ডেলিভারি ঠিকানা (থানা ও জেলাসহ)

${productCatalog}

${ragKnowledge}

কাস্টমারকে অতিরিক্ত বড় প্যারাগ্রাফ না পাঠিয়ে পয়েন্ট আকারে সুন্দর, পরিষ্কার ও মিষ্টি ভাষায় উত্তর দিন।
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
      temperature: 0.5,
      max_tokens: 600,
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }

    return reply;
  } catch (error: any) {
    console.error('❌ OpenAI Chat Completion Error:', error?.message || error);
    return 'আসসালামু আলাইকুম! রয়্যাল হানি বিডি-তে আপনাকে স্বাগতম। এই মুহূর্তে আমাদের সিস্টেমে সাময়িক ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার মেসেজ দিন অথবা আমাদের হেল্পলাইনে (01604121107) যোগাযোগ করুন। আন্তরিকভাবে দুঃখিত।';
  }
};

export const AiAgent = {
  getProductCatalogContext,
  getRagKnowledgeContext,
  generateCustomerReply,
};

