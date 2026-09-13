# 40. Phased Implementation Roadmap

এই project-টি একসাথে পুরো build না করে ধাপে ধাপে implement করতে হবে। প্রতিটি phase-এর শেষে একটি working milestone থাকতে হবে।

## Phase 1 — Business Knowledge Base & Project Foundation

Goal: Business-এর সব static information, database architecture এবং project foundation তৈরি করা।

Tasks:

- Royal Honey BD product catalog তৈরি
- Product ID, name, price, stock, minThreshold ও description structure তৈরি
- Delivery rules & Courier policies
- Payment methods (COD, bKash, Nagad)
- Support information & Business policies
- RAG knowledge base & FAQ structure
- Docker Compose setup (PostgreSQL + Redis for local development)
- Node.js + TypeScript project initialization
- Prisma ORM setup & initial database migration (with Product, Inventory, KnowledgeItem & AdminUser)
- AdminUser seeding script (ডিফল্ট ওনার একাউন্ট তৈরি: `prisma/seed.ts`)
- Environment variables & Configuration validation (Zod)

Output:

```text
Business Knowledge Base
+
PostgreSQL (Prisma ORM) & Redis (Dockerized)
+
TypeScript Project Foundation
```

---

## Phase 2 — Async Text-Based AI Customer Support (BullMQ + RAG)

Goal: Meta webhook timeout এড়াতে BullMQ async queue ব্যবহার করে text-based AI Customer Support চালু করা।

Tasks:

- Facebook Messenger & WhatsApp webhook setup
- Webhook verification & immediate HTTP 200 OK acknowledgment
- BullMQ + Redis incoming message queueing
- Background Worker for AI message processing
- Incoming message normalization
- Customer identification (Prisma)
- Conversation & message history storage
- RAG retrieval (Knowledge Base vector/keyword search)
- AI Agent prompt & intent detection
- Product question answering & Delivery/payment FAQ
- Unknown information detection
- Automated Meta Graph API / WhatsApp response dispatch

Workflow:

```text
Facebook / WhatsApp
        ↓
Webhook (Express.js) ───[ Immediate 200 OK ]
        ↓
BullMQ Ingestion Queue (Redis)
        ↓
AI Chat Worker (Node.js/TS)
        ↓
RAG Retrieval + AI Agent
        ↓
PostgreSQL Storage (Prisma)
        ↓
Meta Send API (WhatsApp/Messenger)
```

Output:

Zero-timeout ও duplicate message ছাড়া customer text message পাঠিয়ে product/business-related সঠিক ও নির্ভরযোগ্য উত্তর পাবে।

---

## Phase 3 — Customer State & Cart Management (Prisma + Redis)

Goal: Redis session cache এবং Prisma (PostgreSQL) ব্যবহার করে customer-এর conversation এবং cart state দ্রুত ও নির্ভুলভাবে মনে রাখা।

Tasks:

- Customer profile management via Prisma
- Redis session caching for ultra-low latency state retrieval
- Active cart management (add, update quantity, remove item)
- Multiple product support & bundle tracking
- Customer information extraction (Name, Phone, Address, Thana, District)
- Existing information reuse from previous orders
- Missing information detection & progressive asking
- Customer information editing on demand
- Real-time stock validation
- Unit price & Subtotal calculation
- Delivery charge calculation (Inside Dhaka ৳60 / Outside Dhaka ৳120 - একবারই যোগ হবে)

Database (Prisma Schema):

```prisma
model Customer { ... }
model Conversation { ... }
model Message { ... }
model Cart { ... }
model CartItem { ... }
```

Output:

Customer-এর দেওয়া তথ্য বারবার জিজ্ঞেস না করে দ্রুত রিসিভ করবে এবং রিয়েল-টাইম কার্ট স্টেট মেইনটেইন করবে।

---

## Phase 4 — Atomic Order Workflow, Payment Handling & Stock Locking

Goal: Prisma database transactions ব্যবহার করে race-condition মুক্ত অর্ডার প্রসেস, COD/অগ্রিম পেমেন্ট হ্যান্ডলিং এবং লো-স্টক থ্রেশহোল্ড মনিটরিং তৈরি করা।

Tasks:

- Order intent detection
- Product selection & quantity confirmation
- Customer address & phone number format validation (Zod)
- Payment method selection (Cash on Delivery vs bKash / Nagad)
- Advance Payment handling:
  - বিকাশ/নগদ নম্বর ও অ্যামাউন্ট প্রদান
  - Transaction ID (TrxID) কালেকশন (Text/Voice) অথবা পেমেন্ট স্ক্রিনশট রিসিভ
  - Initial status: `PAYMENT_VERIFICATION_PENDING`
- Pre-order summary card generation & explicit confirmation check
- Atomic Order Creation (`prisma.$transaction`):
  - Create order record (with `paymentMethod`, `paymentStatus`, `transactionId`)
  - Create order items
  - Decrement product stock safely
  - Clear active cart
- **Low-Stock Check:** অর্ডার শেষে যদি `stockCount <= minThreshold` হয়, তবে স্বয়ংক্রিয়ভাবে ওনারের ড্যাশবোর্ড ও হোয়াটসঅ্যাপে রিস্টক অ্যালার্ট পাঠানো
- Unique Order ID generation (`RH-XXXXXX`)

Workflow:

```text
Order Intent & Cart
        ↓
Payment Method (COD vs bKash/Nagad)
        ↓
    ┌───┴────────────────────────────────┐
    ▼                                    ▼
   COD                              bKash/Nagad
    │                                    │
    │                           Collect TrxID / Screenshot
    │                                    │
    ▼                                    ▼
Order Status: CONFIRMED       Order Status: PAYMENT_VERIFICATION_PENDING
    │                                    │
    ├── Stock Decrement & Min Check      ├── Stock Decrement & Min Check
    │   (Alert if stock <= threshold)    │   (Alert if stock <= threshold)
    ▼                                    ▼
Proceed to Phase 5            Alert to Dashboard & WhatsApp
```

Output:

কাস্টমারের নিশ্চিত সম্মতির পর নির্ভুলভাবে স্টক আপডেট করে COD অথবা ভেরিফিকেশন-পেন্ডিং অর্ডার তৈরি হবে এবং স্টক কমে গেলে ওনার রিস্টক অ্যালার্ট পাবেন।

---

## Phase 5 — Courier API Automation, Invoice Generation & Sheet Backup

Goal: অর্ডার নিশ্চিত হওয়ার পর (COD সরাসরি, অথবা বিকাশ/নগদের ক্ষেত্রে ওনার ভেরিফাই করার পর) কুরিয়ার পার্সেল বুকিং ও ইনভয়েস তৈরি করা।

Tasks:

- Steadfast / Pathao Courier API integration:
  - Automated / 1-click parcel booking
  - Consignment ID & tracking code generation
  - Customer courier fraud check (অতীত ডেলিভারি সাকসেস রেট যাচাই)
- Printable Shipping Label & Invoice generation (PDF/Print view for honey packaging)
- Google Sheets sync (Secondary financial/backup log)
- Admin WhatsApp notification with order details & courier tracking link
- Customer order confirmation message with invoice summary & tracking info

Trigger Logic:

```text
Order Confirmed
 (Directly for COD OR After Owner Approves bKash/Nagad)
       ↓
Create DB Order (Prisma)
       ├──> 1. Courier API (Steadfast/Pathao) ──> Tracking Code
       ├──> 2. Generate Shipping Label / Invoice PDF
       ├──> 3. Google Sheet Sync (Backup)
       ├──> 4. Admin WhatsApp Notification
       └──> 5. Customer Confirmation Message
```

Output:

বিজনেস ওনারকে ম্যানুয়ালি কুরিয়ার পোর্টালে ডাটা এন্ট্রি দিতে হবে না; এক ক্লিকে পার্সেল বুক এবং লেবেল প্রিন্ট হয়ে যাবে।

---

## Phase 6 — Live Admin Operations Portal: Support, Knowledge, Payment & Inventory (Next.js + Socket.io)

Goal: AI যেসব বিষয় সমাধান করতে পারে না সেগুলো লাইভ হ্যান্ডঅফ করা, বিকাশ/নগদ পেমেন্ট ১-ক্লিকে ভেরিফাই করা, ড্যাশবোর্ড থেকে নলেজ ম্যানেজ করা এবং প্রডাক্ট ও রিস্টক ইনভেন্টরি কন্ট্রোল করা।

Tasks:

- Next.js (App Router) + Tailwind CSS ভিত্তিক Admin Live Operations Portal
- Socket.io দিয়ে রিয়েল-টাইম চ্যাট ব্রডকাস্ট ও লাইভ নোটিফিকেশন
- **Admin Authentication & Route Protection (NextAuth / JWT):**
  - সিকিউর ওনার লগইন স্ক্রিন (`/login`) তৈরি (Email/Phone + Password)
  - পাসওয়ার্ড হ্যাশিং (`bcrypt`) ও সেশন ম্যানেজমেন্ট (JWT in HttpOnly Secure Cookie)
  - Next.js Middleware রুট প্রোটেকশন (ভ্যালিড সেশন ছাড়া `/admin/*` অ্যাক্সেস ব্লক)
  - Socket.io হ্যান্ডশেক অথেন্টিকেশন (শুধুমাত্র অথেন্টিকেটেড এডমিনই লাইভ চ্যাট দেখতে পারবে)
  - Brute-force আক্রমণ প্রতিরোধে Redis Rate Limiting (লগইন ট্রাই রেস্ট্রিকশন)
- **Product Catalog & Live Restock Module:**
  - ড্যাশবোর্ড থেকে সরাসরি নতুন প্রডাক্ট তৈরি, দাম/ওজন/ডেসক্রিপশন এডিট এবং ছবি আপডেট
  - প্রতিটি প্রডাক্টের জন্য `minThreshold` (মিনিমাম স্টক সীমা) কনফিগার করা
  - লো-স্টক ব্যানার ও রিয়েল-টাইম সাউন্ড অ্যালার্ট (ড্যাশবোর্ড + হোয়াটসঅ্যাপ)
  - **১-ক্লিকে Restock Action:** ওনার ড্যাশবোর্ডে **`[+ Restock]`** বাটনে ক্লিক করে নতুন স্টক (যেমন: +৫০ জার) অ্যাড করবেন, যা সাথে সাথে ডাটাবেজ ও AI-তে সিঙ্ক হবে
- **Dynamic Knowledge Base & FAQ Manager Module:**
  - ড্যাশবোর্ড থেকেই নতুন FAQ, পলিসি, ডেলিভারি রুল বা মধুর গাইড সংক্রান্ত তথ্য যুক্ত/এডিট/ডিলিট করা
  - ড্যাশবোর্ডে `[Publish to AI]` বাটন চাপামাত্র স্বয়ংক্রিয় ভেক্টর এমবেডিং জেনারেশন (`pgvector`)
  - এআই টেস্ট সিমুলেটর: ড্যাশবোর্ডে বসেই প্রশ্ন করে এআই-এর আউটপুট প্রিভিউ দেখা
- **Advance Payment Verification Module:**
  - বিকাশ/নগদ পেন্ডিং পেমেন্টের রিয়েল-টাইম লিস্ট ও অডিও অ্যালার্ট
  - কাস্টমারের পাঠানো স্ক্রিনশট প্রিভিউ ও এক্সট্র্যাক্ট করা TrxID ভিউ
  - **`[✅ Verify & Confirm Order]`** বাটন: ক্লিক করলেই অর্ডার `CONFIRMED` হবে, কুরিয়ার পার্সেল বুক হবে এবং কাস্টমারের চ্যাটে কনফার্মেশন যাবে
  - **`[❌ Invalid TrxID]`** বাটন: পেমেন্ট না মিললে কাস্টমারকে চ্যাটে স্বয়ংক্রিয়ভাবে জানানোর ব্যবস্থা
- 1-Click Human Takeover System (লাইভ চ্যাট নিজের নিয়ন্ত্রণে নেওয়া)
- Mobile WhatsApp Alert to Admin (ড্যাশবোর্ডের বাইরে থাকলে ওনারকে তাৎক্ষণিক অ্যালার্ট পাঠানো)
- Complete customer conversation context & summary passed to human agent

Workflow:

```text
Customer Message
       ↓
AI Intent & Confidence Check
       ↓
Can AI Confidently Handle?
    ↙                    ↘
  YES                    NO
   ↓                      ↓
Answer             Trigger Human Handoff
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
Next.js Live Dashboard             Admin WhatsApp Alert
 (Socket.io Realtime Alert)       (Mobile Context Summary)
         │
[Admin Takeover / Live Chat]
         │
[Admin Clicks "Resume AI"]
```

Output:

বিজনেস ওনার সম্পূর্ণ স্বাধীনভাবে ড্যাশবোর্ড থেকে প্রডাক্ট ও স্টক রিস্টক করতে পারবেন, AI Knowledge আপডেট করতে পারবেন, পেন্ডিং পেমেন্ট ১-ক্লিকে অ্যাপ্রুভ করতে পারবেন এবং যে কোনো জটিল চ্যাটে লাইভ হস্তক্ষেপ করতে পারবেন।

---

## Phase 7 — Voice Message Support

Goal: Customer voice message দিয়েও পুরো system ব্যবহার করতে পারবে।

Tasks:

- Voice message detection
- Audio download
- Speech-to-Text
- Bangla speech recognition
- Transcription
- Intent detection
- Customer information extraction
- Order information extraction
- Ambiguous transcription validation

Workflow:

```text
Voice
 ↓
Speech-to-Text
 ↓
Normalized Text
 ↓
AI Agent
 ↓
RAG / Order / Handoff
```

Output:

Customer voice message দিয়েও product inquiry এবং order করতে পারবে।

---

## Phase 8 — Image Understanding & Payment Proof OCR

Goal: Customer image পাঠালে AI image-এর context বুঝতে পারবে এবং বিকাশ/নগদ পেমেন্ট স্লিপের TrxID নির্ভুলভাবে এক্সট্র্যাক্ট করবে।

Tasks:

- Image message detection & secure cloud storage
- Vision model integration (Gemini / GPT-4o Vision)
- OCR for bKash & Nagad payment screenshots:
  - Extract Transaction ID (TrxID)
  - Extract Sent Amount & Recipient Number
  - Extract Timestamp
- Product image matching (মধু বা ঘিয়ের ছবি দেখে ক্যাটালগ মেলানো)
- Address screenshot understanding (হাতে লেখা বা টাইপ করা ঠিকানার ছবি)
- Order screenshot understanding (প্রিভিয়াস ইনভয়েসের ছবি)
- Complaint image understanding (ভাঙা বোতল বা প্যাকেজ ত্রুটি)
- Fraud Prevention:
  - এআই নিজে পেমেন্ট কনফার্ম করবে না
  - এক্সট্র্যাক্ট করা TrxID ও ইমেজ লিংক নিয়ে ওনারের ড্যাশবোর্ডে ভেরিফিকেশন টিকিট পুশ করবে

Important:

Image থেকে information পরিষ্কারভাবে বোঝা না গেলে Agent কখনো অনুমান করবে না; পরিষ্কার ছবি অথবা TrxID লিখে পাঠাতে বলবে।

Output:

Customer image-based query এবং পেমেন্ট স্লিপ স্বয়ংক্রিয়ভাবে রিড করে ওনারের ড্যাশবোর্ডে ভেরিফিকেশনের জন্য উপস্থাপন করতে পারবে।

---

## Phase 9 — Video Understanding

Goal: Customer video message analyse করা।

Tasks:

- Video message detection
- Video download
- Audio extraction
- Speech-to-Text
- Video frame extraction
- Vision analysis
- OCR if required
- Audio + visual context combine
- AI Agent processing

Workflow:

```text
Video
 ├── Audio → Speech-to-Text
 │
 └── Frames → Vision / OCR
          ↓
   Combined Context
          ↓
      AI Agent
```

Output:

Video-এর speech এবং visual information ব্যবহার করে customer query handle করা যাবে।

---

## Phase 10 — Unified Cross-Channel Customer Experience

Goal: Facebook এবং WhatsApp-এর মধ্যে customer state যতটা নির্ভরযোগ্যভাবে সম্ভব unified করা।

Tasks:

- Customer identity resolution
- Facebook customer mapping
- WhatsApp customer mapping
- Unified customer profile
- Shared cart/order state
- Shared conversation context
- Cross-channel order continuation

Architecture:

```text
Facebook ───┐
            ├──> Customer Identity
WhatsApp ───┘
                  ↓
          Unified Customer State
                  ↓
              AI Agent
```

Important:

Facebook এবং WhatsApp-এর জন্য আলাদা AI Agent তৈরি করা হবে না।

একটি common AI Agent এবং common business logic ব্যবহার করতে হবে।

---

## Phase 11 — Production Reliability, Security & CI/CD Pipeline

Goal: System-টিকে production-ready, secure এবং zero-downtime deployment-এর উপযোগী করা।

Tasks:

- Input & schema validation with Zod
- Webhook HMAC SHA-256 signature verification (Meta security)
- Express rate limiting & IP throttling
- Redis distributed lock for idempotency (duplicate message ও duplicate order prevention)
- Centralized error handling & Sentry tracking
- Structured logging (Winston / Pino)
- Multi-stage Dockerfile (API, Worker, Dashboard)
- Docker Compose production stack (App + Redis + PostgreSQL)
- GitHub Actions CI/CD pipeline (Lint, Typecheck, Test, Auto-build, SSH deploy)
- Database connection pooling & Prisma indexing
- Environment secret management (.env vault)

Important:

একই webhook বা message multiple times আসলেও Redis lock-এর কারণে কখনোই duplicate order তৈরি হবে না।

---

## Phase 12 — Analytics, Growth Suite & Scaling

Goal: বিজনেস ওনারের সিদ্ধান্ত গ্রহণের সুবিধার্থে Next.js Analytics ড্যাশবোর্ড এবং উচ্চ স্কেলে সিস্টেম অপ্টিমাইজেশন করা।

Tasks:

- Next.js Analytics & Business Intelligence Dashboard:
  - Daily / Monthly Revenue & Sales Chart
  - Best-selling product breakdown (কালোজিরা মধু vs সরিষা মধু vs সুন্দরবন মধু)
  - AI Chat Conversion Rate (কতজন চ্যাট করে অর্ডার কনফার্ম করেছে)
  - Human Handoff Rate & Reason analytics
  - Courier Delivery Success vs Return Rate metrics
- BullMQ dead-letter queue (DLQ) & automated retry dashboard
- Media processing worker scaling (horizontal scaling)
- Abandoned cart re-engagement trigger (কার্টে রেখে চলে যাওয়া কাস্টমারকে ফলো-আপ অফার)

Architecture:

```text
Incoming Webhook
       ↓
Express API Layer
       ↓
BullMQ Ingestion Queue (Redis)
       ↓
Horizontal Workers (Dockerized)
  ├── AI Agent & RAG Worker
  ├── Media (Audio/Video) Worker
  ├── Order & Courier Sync Worker
  └── Notification & Sheet Worker
       │
       ▼
Next.js Admin & Analytics Dashboard (Socket.io Realtime)
```

---

# 41. Recommended Implementation Order

Project development-এর সময় নিচের order follow করতে হবে:

```text
Phase 1: Business Foundation + Prisma DB + Docker Setup
         ↓
Phase 2: Async Text AI Support (BullMQ + RAG Engine)
         ↓
Phase 3: Customer State & Cart (Prisma + Redis Cache)
         ↓
Phase 4: Atomic Order Workflow & Stock Locking
         ↓
Phase 5: Courier API (Steadfast/Pathao) + Invoices + Sheet
         ↓
Phase 6: Live Admin Operations Portal (Auth, Support, Knowledge, Payment & Restock)
         ↓
Phase 7: Voice Message Processing (Bangla STT)
         ↓
Phase 8: Image Understanding & Receipt OCR
         ↓
Phase 9: Video Context Handling (Audio + Frame Vision)
         ↓
Phase 10: Unified Cross-Channel Customer Identity
         ↓
Phase 11: Production Security, Docker & CI/CD Pipeline
         ↓
Phase 12: Business Analytics Dashboard & Scaling
```

# 42. Development Principle

প্রতিটি phase-এর শেষে system-এর একটি working version থাকতে হবে।

একসাথে সব feature implement করা যাবে না।

Priority হবে:

```text
Accuracy
→ Business Logic
→ State Management
→ Order Reliability
→ Human Handoff
→ Multimedia
→ Security
→ Performance
→ Scaling
```

AI response সুন্দর হওয়া থেকে বেশি গুরুত্বপূর্ণ হলো:

- সঠিক information দেওয়া
- ভুল order না নেওয়া
- customer information ঠিকভাবে maintain করা
- duplicate order prevent করা
- explicit confirmation নেওয়া
- uncertain information validate করা
- unsupported query human-এর কাছে পাঠানো
- business data secure রাখা
- production environment-এ reliable থাকা
