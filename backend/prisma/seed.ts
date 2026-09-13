import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import prisma from '../src/app/libs/prisma';

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

async function main() {
  console.log('🌱 Starting Royal Honey BD database seeding...');

  // 1. Seed Default Admin Owner
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@royalhoneybd.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    const admin = await prisma.adminUser.create({
      data: {
        name: 'Royal Honey BD Owner',
        email: adminEmail,
        phone: '01604121107',
        password: passwordHash,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Default Admin created: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin ${adminEmail} already exists.`);
  }

  // 2. Seed Products from products.json
  const productsPath = path.join(__dirname, '../src/knowledge/products.json');
  if (fs.existsSync(productsPath)) {
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    for (const item of productsData) {
      await prisma.product.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          price: item.price,
          weight: item.weight,
          description: item.description,
          stockCount: item.stockCount,
          minThreshold: item.minThreshold,
          isAvailable: item.isAvailable,
        },
        create: {
          id: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight,
          description: item.description,
          stockCount: item.stockCount,
          minThreshold: item.minThreshold,
          isAvailable: item.isAvailable,
        },
      });
    }
    console.log(`✅ Seeded ${productsData.length} products successfully.`);
  }

  // 3. Seed Initial Knowledge Base Items (FAQs, Policies, Guides)
  const initialKnowledgeItems = [
    {
      category: 'FAQ' as const,
      question: 'মধু জমে যাওয়া কি ভেজাল হওয়ার লক্ষণ?',
      answer:
        'না, মধু জমে যাওয়া কোনো ভেজাল হওয়ার লক্ষণ নয়; বরং প্রাকৃতিক ও আসল মধুর একটি স্বাভাবিক বৈশিষ্ট্য (গ্লুকোজ ও ফ্রুক্টোজের প্রাকৃতিক অনুপাতের কারণে ঠান্ডা আবহাওয়ায় মধু জমে ক্রিস্টালাইজ হতে পারে)। বিশেষ করে সরিষা ফুলের মধু শীতে দ্রুত জমে যায়। হালকা গরম পানিতে মধুর বয়াম কিছুক্ষণ রেখে দিলে তা আবার তরল হয়ে যায়।',
      tags: ['মধু জমা', 'খাঁটি মধু', 'ক্রিস্টালাইজেশন', 'সরিষা মধু'],
    },
    {
      category: 'FAQ' as const,
      question: 'মধু কীভাবে সংরক্ষণ করব? ফ্রিজে কি রাখা যাবে?',
      answer:
        'মধু সবসময় সাধারণ তাপমাত্রায় (Room temperature) শুষ্ক ও ছায়াযুক্ত স্থানে বায়ুরোধী জারে সংরক্ষণ করবেন। মধুতে কোনো অবস্থাতেই ফ্রিজে রাখার প্রয়োজন নেই; ফ্রিজে রাখলে মধু দ্রুত জমে শক্ত হয়ে যায়। ব্যবহারের সময় শুকনো চামচ ব্যবহার করবেন।',
      tags: ['সংরক্ষণ', 'ফ্রিজ', 'তাপমাত্রা', 'বয়ম'],
    },
    {
      category: 'FAQ' as const,
      question: 'শিশুদের কি মধু খাওয়ানো যাবে?',
      answer:
        '১ বছরের নিচের শিশুদের মধু খাওয়ানো চিকিৎসকদের মতে উচিত নয় (ইনফ্যান্ট বটুলিজমের ঝুঁকি এড়াতে)। ১ বছরের বেশি বয়সী শিশুদের পরিমিত পরিমাণে নিয়মিত মধু খাওয়ানো যায়।',
      tags: ['শিশু', 'বয়সসীমা', '১ বছর', 'বাচ্চা'],
    },
    {
      category: 'FAQ' as const,
      question: 'ভাঙা বা ক্ষতিগ্রস্ত পার্সেল পেলে কী করব?',
      answer:
        'ডেলিভারি পাওয়ার সময় পার্সেল ক্ষতিগ্রস্ত বা ভাঙা দেখলে অবিলম্বে ডেলিভারিম্যান সামনে থাকা অবস্থায় আমাদের হেল্পলাইনে (01604121107) কল দিন বা আনবক্সিং ছবি/ভিডিও ফেসবুক পেজ বা হোয়াটসঅ্যাপে পাঠান। আমরা সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস করে দেব।',
      tags: ['ভাঙা জার', 'রিটার্ন', 'রিপ্লেসমেন্ট', 'ড্যামেজ'],
    },
    {
      category: 'POLICY' as const,
      question: 'ডেলিভারি চার্জ ও ডেলিভারি সময় সংক্রান্ত নিয়ম কী?',
      answer:
        'ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা এবং সময় ১-২ কার্যদিবস। ঢাকার বাইরে ডেলিভারি চার্জ ১২০ টাকা এবং সময় ২-৪ কার্যদিবস। একটি অর্ডারে যতগুলো পণ্যই থাকুক, ডেলিভারি চার্জ শুধুমাত্র একবারই যোগ হবে।',
      tags: ['ডেলিভারি চার্জ', 'সময়', 'ঢাকা', 'ঢাকার বাইরে', 'কুরিয়ার'],
    },
    {
      category: 'POLICY' as const,
      question: 'পেমেন্ট করার নিয়ম কী? বিকাশ বা নগদে কীভাবে দেব?',
      answer:
        'আমাদের ক্যাশ অন ডেলিভারি সুবিধা রয়েছে, অর্থাৎ পণ্য পেয়ে টাকা দিতে পারবেন। এছাড়া বিকাশ বা নগদ নম্বর (01604121107)-এ টাকা পাঠিয়ে Transaction ID (TrxID) বা স্ক্রিনশট পাঠালে আমাদের এডমিন ভেরিফাই করে অর্ডার কনফার্ম করবেন।',
      tags: ['পেমেন্ট', 'ক্যাশ অন ডেলিভারি', 'বিকাশ', 'নগদ', 'TrxID'],
    },
    {
      category: 'POLICY' as const,
      question: 'মধু কি ডায়াবেটিস বা রোগ নিরাময় করে?',
      answer:
        'মধু একটি পুষ্টিকর প্রাকৃতিক খাদ্য। তবে এটি ডায়াবেটিস বা কোনো নির্দিষ্ট রোগ নিরাময়ের ঔষধ নয়। জটিল কোনো স্বাস্থ্য সমস্যায় চিকিৎসকের পরামর্শ অনুযায়ী খাদ্যতালিকায় মধু রাখা উচিত।',
      tags: ['ডায়াবেটিস', 'মেডিকেল', 'রোগ নিরাময়', 'ডিসক্লেইমার'],
    },
  ];

  for (const item of initialKnowledgeItems) {
    const existing = await prisma.knowledgeItem.findFirst({
      where: { question: item.question },
    });

    if (!existing) {
      await prisma.knowledgeItem.create({
        data: {
          category: item.category,
          question: item.question,
          answer: item.answer,
          tags: item.tags,
          embedding: [], // Embeddings will be generated via AI service
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Seeded ${initialKnowledgeItems.length} Knowledge Base items successfully.`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

