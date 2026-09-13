# Royal Honey BD — Complete AI Automation & RAG Customer Support & Order Management System

## 1. Project Overview

আমি একটি real-world AI Automation + RAG based Customer Support এবং Order Management System তৈরি করতে চাই।

Business Name: **Royal Honey BD**

Business Type: Online Business + Cash on Delivery

Location: Dhaka, Bangladesh

Delivery: সারা বাংলাদেশে

Customer Support Time: সকাল ৯টা – রাত ১০টা

Customer Support Number: **01604121107**

Customer Facebook Messenger এবং WhatsApp—দুই জায়গা থেকেই text, image, voice এবং video message পাঠাতে পারবে।

AI Agent-এর কাজ হবে customer-এর message বুঝে product information দেওয়া, order নেওয়া, order information collect করা, existing information automatically reuse করা, order confirmation নেওয়া, confirmed order Google Sheet-এ save করা এবং business owner's WhatsApp-এ notification পাঠানো।

যে প্রশ্ন বা সমস্যা Agent confidently handle করতে পারবে না, সেটি human support-এর কাছে handoff করতে হবে এবং business owner's WhatsApp-এ notification পাঠাতে হবে।

---

# 2. Supported Customer Inputs

Customer শুধু text message পাঠাবে না।

AI Agent-কে নিচের সব ধরনের input handle করতে হবে:

### Text

উদাহরণ:

- "কালোজিরা মধুর দাম কত?"
- "আমি ২টা মধু নিতে চাই"
- "ঢাকার delivery charge কত?"

### Image

Customer product-এর ছবি, payment screenshot, address screenshot বা অন্য কোনো relevant image পাঠাতে পারে।

Agent image বুঝে context অনুযায়ী response দেবে।

যদি image-এর information নিশ্চিতভাবে বোঝা না যায়, Agent অনুমান করবে না।

### Voice / Audio

Customer voice message পাঠাতে পারে।

Workflow:

```text
Voice Message
→ Speech-to-Text
→ Customer Intent Detection
→ AI Agent
→ Response
```

Voice-এর মধ্যে order information থাকলে সেটাও extract করতে হবে।

Example:

"আমার নাম রহিম, আমি আদাবরে থাকি, দুইটা কালোজিরা মধু লাগবে।"

Agent extract করবে:

```text
Name = রহিম
District = Dhaka
Thana = Adabor
Product = কালোজিরা ফুলের মধু
Quantity = 2
```

তারপর শুধু missing information চাইবে।

### Video

Customer video message পাঠাতে পারে।

Video-এর ক্ষেত্রে Agent প্রয়োজন অনুযায়ী:

```text
Video
→ Extract Audio
→ Speech-to-Text
→ Extract Visual Information
→ Combine Audio + Visual Context
→ AI Agent
```

যদি video-তে কোনো product, screenshot, packaging, delivery issue বা অন্য relevant information থাকে, Agent সেটা analyse করার চেষ্টা করবে।

যদি video analysis থেকে reliable information পাওয়া না যায়, Agent কখনো hallucinate করবে না এবং প্রয়োজনে human support-এ handoff করবে।

---

# 3. Product Catalog

## Product 01

Product ID: 01

Name: কালোজিরা ফুলের মধু

Price: ৳200

Weight: 250 গ্রাম

Stock: Available

Description:
প্রাকৃতিক ফুলের উৎস থেকে সংগ্রহ করা মধু। এর স্বাদ ও ঘ্রাণ স্বাভাবিকভাবে মিষ্টি ও সুগন্ধযুক্ত। চা, রুটি, নাস্তা অথবা সরাসরি খাওয়ার জন্য ব্যবহার করা যায়।

---

## Product 02

Product ID: 02

Name: সরিষা ফুলের মধু

Price: ৳200

Weight: 250 গ্রাম

Stock: Available

Description:
সরিষা ফুল থেকে সংগ্রহ করা প্রাকৃতিক মধু। এতে হালকা মিষ্টি স্বাদ এবং সরিষা ফুলের স্বাভাবিক ঘ্রাণ পাওয়া যায়। দৈনন্দিন ব্যবহারের জন্য উপযোগী।

---

## Product 03

Product ID: 03

Name: সুন্দরবনের মধু

Price: ৳200

Weight: 250 গ্রাম

Stock: Available

Description:
সুন্দরবন এলাকার প্রাকৃতিক পরিবেশ থেকে সংগ্রহ করা মধু। এর স্বাভাবিক মিষ্টি স্বাদ ও ঘ্রাণ রয়েছে। যারা প্রাকৃতিক উৎসের মধু পছন্দ করেন তাদের জন্য এটি উপযোগী।

---

## Product 04

Product ID: 04

Name: স্পেশাল মিনি হানি কম্ব

Includes:

- কালোজিরা ফুলের মধু
- সরিষা ফুলের মধু
- সুন্দরবনের মধু

Price: ৳200

Weight: প্রতিটি 250 গ্রাম

Stock: Available

Description:
একসাথে তিন ধরনের মধুর স্বাদ নেওয়ার জন্য এই স্পেশাল মিনি হানি কম্ব তৈরি করা হয়েছে। যারা একসাথে বিভিন্ন ধরনের মধু ট্রাই করতে চান তাদের জন্য এটি উপযোগী।

---

## Product 05

Product ID: 05

Name: বিশুদ্ধ ঘি

Price: ৳500

Weight: 500 গ্রাম

Stock: Available

Description:
দুধের সর থেকে প্রস্তুত করা ঘি। রান্না, ভাত, রুটি অথবা বিভিন্ন খাবারের সঙ্গে ব্যবহার করা যায়। ঘন ও সুগন্ধযুক্ত।

---

## Product 06

Product ID: 06

Name: Honey Nut

Price: ৳600

Weight: 500 গ্রাম

Stock: Available

Description:
মধু ও বাদামের সমন্বয়ে তৈরি একটি সুস্বাদু খাবার। এতে মিষ্টি স্বাদের সঙ্গে বাদামের ক্রাঞ্চি টেক্সচার পাওয়া যায়। নাস্তা অথবা সরাসরি খাওয়ার জন্য ব্যবহার করা যায়।

---

### 📦 ড্যাশবোর্ড থেকে Product Management, Stock & Restock Alert

বিজনেস ওনার সম্পূর্ণ প্রডাক্ট ক্যাটালগ ও ইনভেন্টরি নিজের Next.js ড্যাশবোর্ড থেকে কন্ট্রোল করবেন:

1. **প্রডাক্ট ম্যানেজমেন্ট (CRUD):** নতুন প্রডাক্ট যোগ, দাম পরিবর্তন, ওজন, ছবি ও ডেসক্রিপশন এডিট করা যাবে।
2. **Min Threshold (নূন্যতম স্টক সীমা):** প্রতিটি প্রডাক্টের জন্য ওনার একটি মিনিমাম থ্রেশহোল্ড সেট করতে পারবেন (যেমন: ১০ জার)।
3. **Automated Restock Alert (ড্যাশবোর্ড + হোয়াটসঅ্যাপ):**
   - অর্ডারের পর স্টক কমে যখনই `stockCount <= minThreshold` হবে, সাথে সাথে ওনারের ড্যাশবোর্ডে সতর্কতা ব্যানার ও অ্যালার্ম বাজবে।
   - ওনারের হোয়াটসঅ্যাপে স্বয়ংক্রিয় রিস্টক অ্যালার্ট মেসেজ চলে যাবে।
4. **১-ক্লিকে Restock Action:**
   - ওনার ড্যাশবোর্ডের ইনভেন্টরি পেজ থেকে সরাসরি **`[+ Restock]`** বাটনে ক্লিক করে নতুন পরিমাণ (যেমন: +৫০ জার) যোগ করতে পারবেন।
   - রিস্টক করামাত্র AI লাইভ স্টক আপডেট জেনে যাবে এবং আগে যদি স্টক-আউট থাকে, পুনরায় কাস্টমারদের থেকে অর্ডার নেওয়া শুরু করবে।

---

# 4. Delivery Information

### Inside Dhaka

Delivery Charge: ৳60

Estimated Delivery: 1–2 days

### Outside Dhaka

Delivery Charge: ৳120

Estimated Delivery: 2–4 working days

Important:

একটি order-এ যতগুলো product থাকুক, delivery charge **শুধুমাত্র একবার** যোগ হবে।

Example:

2 products + 1 product হলেও:

```text
Delivery Charge = ৳60
```

দুইবার ৳60 হবে না।

---

# 5. Payment Methods & Advance Payment Verification Rules

### ১. Cash on Delivery (COD)

- কাস্টমার পণ্য হাতে পেয়ে ডেলিভারিম্যানকে ক্যাশ পেমেন্ট করবে।
- অর্ডার কনফার্মেশনের সাথে সাথেই স্বয়ংক্রিয়ভাবে প্রসেস হবে।

### ২. bKash / Nagad (অগ্রিম পেমেন্ট প্রসেস)

- **Number:** 01604121107 (Personal / Merchant)
- কাস্টমার বিকাশ বা নগদে অগ্রিম পেমেন্ট করতে চাইলে Agent এই নম্বর দিয়ে মোট প্রদেয় টাকা পাঠাতে বলবে।
- **TrxID / প্রুফ চাওয়া:** Agent কাস্টমারকে পেমেন্ট সম্পন্ন করে **Transaction ID (TrxID)** লিখে দিতে অথবা পেমেন্টের **স্ক্রিনশট (Screenshot)** পাঠাতে বলবে (Text, Image বা Voice যেকোনো মাধ্যমে)।
- **মাল্টিমোডাল রিডিং:** কাস্টমার স্ক্রিনশট পাঠালে Vision LLM / OCR স্বয়ংক্রিয়ভাবে TrxID ও পেমেন্ট অ্যামাউন্ট রিড করবে।

### ⚠️ গুরুত্বপূর্ণ ফ্রড প্রিভেনশন রুল (Crucial Rule):

- **AI কখনো নিজে থেকে অগ্রিম পেমেন্ট ভেরিফাই বা কনফার্ম করবে না।** বাংলাদেশে ভুয়া স্ক্রিনশট ও ফেক ট্রানজেকশন আইডি দিয়ে প্রতারণার ঝুঁকি থাকে।
- কাস্টমার TrxID বা স্ক্রিনশট দেওয়ার সাথে সাথে:
  1. অর্ডারের স্ট্যাটাস হবে `PAYMENT_VERIFICATION_PENDING`।
  2. কাস্টমারকে বলা হবে: _"আপনার পেমেন্টের তথ্য আমরা পেয়েছি। আমাদের টিম পেমেন্টটি ভেরিফাই করার সাথে সাথেই আপনার অর্ডারটি কনফার্ম করে জানানো হবে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। ❤️"_
  3. **ওনারের Next.js ড্যাশবোর্ডে হাই-প্রায়োরিটি অডিও অ্যালার্ম ও পপ-আপ যাবে** (স্ক্রিনশটের ছবি, TrxID, অ্যামাউন্ট ও কাস্টমারের ফোন নম্বরসহ)।
  4. **ওনারের WhatsApp-এ সরাসরি অ্যালার্ট যাবে** (TrxID ও ড্যাশবোর্ড ভেরিফিকেশন লিঙ্কসহ)।
  5. ওনার নিজের বিকাশ/নগদ স্টেটমেন্ট চেক করে ড্যাশবোর্ডে **`[Confirm Payment & Order]`** বাটনে চাপ দেবেন।
  6. ওনার কনফার্ম করলেই কেবল অর্ডারটি `CONFIRMED` হবে এবং স্বয়ংক্রিয়ভাবে কাস্টমারের কাছে কনফার্মেশন মেসেজ যাবে ও কুরিয়ার বুকিং হবে।

---

# 6. Customer Support

Support Time:

সকাল ৯টা – রাত ১০টা

Support Number:

01604121107

যদি Agent কোনো information confidently provide করতে না পারে, customer-কে support-এর মাধ্যমে human assistance নেওয়ার option দিতে হবে।

---

# 7. RAG Knowledge Base & Dashboard Management

RAG Knowledge Base-এ শুধুমাত্র আনস্ট্রাকচার্ড তথ্য (Unstructured Knowledge) থাকবে:

```text
Business Information (ঠিকানা, হেল্পলাইন, কাস্টমার কেয়ার সময়)
Business Policies & Medical Claim Rules (রোগ নিরাময় না করার ডিসক্লেইমার)
Delivery & Return Policies (ভাঙা জার বা পার্সেল সংক্রান্ত সাধারণ নিয়ম)
Payment FAQ (বিকাশ/নগদ পেমেন্ট করার সাধারণ নির্দেশিকা)
FAQ (কাস্টমারদের সাধারণ জিজ্ঞাসা ও উত্তর)
Honey Knowledge Guide (খাঁটি মধু চেনার উপায়, মধু জমে যাওয়ার বৈজ্ঞানিক কারণ, খাওয়ার নিয়ম)
Announcements (ছুটি, বিশেষ ক্যাম্পেইন বা ডেলিভারি বিলম্বের নোটিস)
```

> **⚠️ গুরুত্বপূর্ণ আর্কিটেকচার রুল:** প্রডাক্টের নাম, দাম, ওজন ও লাইভ স্টক RAG-এ ডুপ্লিকেট করা হবে না। এগুলো সরাসরি PostgreSQL-এর `Product` টেবিল থেকে আসবে, যাতে দাম বা স্টক পরিবর্তন হলে কখনোই ভুল তথ্য বা হ্যালুসিনেশন না হয়।

### 🖥️ Next.js ড্যাশবোর্ড থেকে নলেজ ম্যানেজমেন্ট (Dynamic Knowledge Management)

বিজনেস ওনার যেন কোনো কোড এডিট না করেই নিজের ড্যাশবোর্ড থেকে নলেজ আপডেট করতে পারেন:

1. **ড্যাশবোর্ডের ডেডিকেটেড পেজ:** ওনারের Next.js ড্যাশবোর্ডে **"Knowledge & FAQ Manager"** পেজ থাকবে।
2. **নতুন তথ্য বা FAQ যোগ করা:** ওনার যেকোনো সময় নতুন প্রশ্ন-উত্তর (যেমন: ঈদের ছুটি, বিশেষ ডিসকাউন্ট বা অফার) লিখে `[Publish to AI]` বাটনে ক্লিক করবেন।
3. **স্বয়ংক্রিয় ভেক্টর এমবেডিং:** ড্যাশবোর্ডে সেভ হওয়ামাত্র ব্যাকএন্ড টেক্সটটিকে ভেক্টর এমবেডিংয়ে (`pgvector` / OpenAI Embeddings) রূপান্তর করে ডাটাবেজে স্টোর করে নেবে।
4. **তাৎক্ষণিক এআই আপডেট:** কোনো সার্ভার রিস্টার্ট বা কোড পুশ ছাড়া রিয়েল-টাইমে এআই এজেন্ট ওই নতুন তথ্য জেনে কাস্টমারকে উত্তর দেওয়া শুরু করবে।
5. **এআই টেস্ট সিমুলেটর:** ড্যাশবোর্ডে ওনার একটি টেস্ট ইনপুটে প্রশ্ন লিখে দেখতে পারবেন এআই সঠিক উত্তর দিচ্ছে কি না।

Agent কখনো নলেজ বেসের তথ্যের বাইরে গিয়ে মনগড়া কোনো তথ্য তৈরি করবে না।

---

# 8. Product Inquiry Rule

Customer শুধু product সম্পর্কে জানতে চাইলে Agent শুধু product information দেবে।

Example:

Customer:
"কালোজিরা মধুর দাম কত?"

Agent:
"কালোজিরা ফুলের মধু ২৫০ গ্রাম, দাম ৳২০০।"

এখানে Agent order information চাইবে না।

---

# 9. Order Intent Detection

Customer order করতে চাইলে Agent order workflow শুরু করবে।

Examples:

```text
"আমি ২টা মধু নিতে চাই"
"একটা ঘি দেন"
"আমি order করতে চাই"
"কালোজিরা মধু ৩টা লাগবে"
```

Order intent detect হলে:

```text
Product
→ Availability
→ Quantity
→ Customer Information
→ Price Calculation
→ Order Summary
→ Confirmation
→ Create Order
```

---

# 10. Customer Information Required

Order নেওয়ার জন্য প্রয়োজন:

1. Customer Name
2. Phone Number
3. District
4. Thana
5. Delivery Address
6. Product Name / Product ID
7. Product Quantity

---

# 11. Existing Information Reuse

Customer আগে conversation-এর মধ্যে কোনো information দিলে Agent সেটি save করবে এবং পরে আবার জিজ্ঞেস করবে না।

Example:

Customer:
"আমার নাম Rahim, আমি Dhaka Adabor থাকি। ২টা কালোজিরা মধু চাই।"

Agent state:

```text
Name = Rahim ✓
District = Dhaka ✓
Thana = Adabor ✓
Product = কালোজিরা ফুলের মধু ✓
Quantity = 2 ✓

Phone = Missing
Address = Missing
```

Agent শুধু missing information চাইবে।

---

# 12. Customer Information Edit

Customer চাইলে previously provided information পরিবর্তন করতে পারবে।

Examples:

```text
"আমার address change করুন"
"Phone number change করতে চাই"
"আমি ২টার বদলে ৩টা নেব"
"ঘিটা বাদ দেন"
"আর একটা honey nut add করেন"
```

Agent existing order state update করবে এবং নতুন information অনুযায়ী calculation করবে।

---

# 13. Multiple Product Order

Customer একাধিক product order করতে পারবে।

Example:

```text
কালোজিরা ফুলের মধু × 2
বিশুদ্ধ ঘি × 1
Honey Nut × 1
```

প্রতিটি product আলাদাভাবে track করতে হবে।

---

# 14. Multiple Product Flow

Customer multiple products select করলে Agent জিজ্ঞেস করবে:

"আপনি আর কোনো Product অর্ডার করতে চান?"

Customer চাইলে আরও product add করতে পারবে।

Customer না চাইলে Agent missing customer information check করবে।

---

# 15. Order Price Calculation

Formula:

```text
Product Total = Unit Price × Quantity
```

Multiple products:

```text
কালোজিরা মধু:
2 × ৳200 = ৳400

ঘি:
1 × ৳500 = ৳500

Product Total = ৳900

Dhaka Delivery = ৳60

Final Payable = ৳960
```

Delivery charge একবারই যোগ হবে।

---

# 16. Order Summary

Final order summary table format-এ দেওয়া যাবে না।

Clean readable format ব্যবহার করতে হবে।

Example:

```text
📦 Order Summary

নাম: Rahim
ফোন: 016xxxxxxxx

জেলা: ঢাকা
থানা: আদাবর
ঠিকানা: Adabor Bazar

Products:
• কালোজিরা ফুলের মধু — 2 × ৳200 = ৳400
• বিশুদ্ধ ঘি — 1 × ৳500 = ৳500

Product Total: ৳900
Delivery Charge: ৳60

💰 মোট Payable: ৳960

আপনার অর্ডারটি কি Confirm করবেন?
```

---

# 17. Explicit Confirmation Required

Agent কখনো customer confirmation ছাড়া order create করবে না।

Customer অবশ্যই explicit confirmation দেবে।

Examples:

```text
"Confirm"
"হ্যাঁ"
"ঠিক আছে, order করুন"
"জি, অর্ডার করুন"
```

Confirmation পাওয়ার পর order create হবে।

---

# 18. Order Confirmation Automation (COD vs Advance Payment)

Customer order summary দেখে confirmation দিলে পেমেন্ট মেথড অনুযায়ী সিস্টেম দুটি ভিন্ন ফ্লোতে কাজ করবে:

### ফ্লো ১: Cash on Delivery (COD)

```text
Customer Confirms COD
        ↓
Atomic Order Creation (Prisma)
        ↓
Status: CONFIRMED
        ↓
Courier Auto-Booking (Steadfast/Pathao)
        ↓
Next.js Dashboard Alert + WhatsApp Notification
        ↓
Customer Confirmation Message
```

### ফ্লো ২: Advance Payment (bKash / Nagad)

```text
Customer Selects bKash/Nagad
        ↓
Agent gives Account Number (01604121107) & Total Payable
        ↓
Customer sends TrxID (Text/Voice) OR Payment Screenshot
        ↓
Vision Model / OCR extracts TrxID & Amount
        ↓
Order Created with Status: PAYMENT_VERIFICATION_PENDING
        ↓
Customer Message: "পেমেন্ট তথ্য পেয়েছি, ভেরিফিকেশনের পর কনফার্ম করা হবে"
        ↓
        ├──> Next.js Dashboard: Urgent Audio Alert + TrxID + Screenshot Preview
        └──> WhatsApp Admin Alert: "Verify TrxID & Confirm"
        ↓
Owner verifies bKash/Nagad Statement & Clicks [Confirm Payment & Order]
        ↓
Order Status updated to: CONFIRMED
        ↓
Courier Auto-Booking (Steadfast/Pathao) + Invoice PDF
        ↓
Automated WhatsApp/Messenger Message to Customer: "পেমেন্ট সফল! অর্ডার কনফার্মড"
```

---

# 19. Order Automation, Courier Booking & Google Sheet Backup

Confirmed order ডাটাবেজে সেভ হওয়ার পর স্বয়ংক্রিয়ভাবে কুরিয়ার বুকিং, ইনভয়েস জেনারেশন এবং গুগল শিট ব্যাকআপ সম্পন্ন হবে।

### ১. Courier API Integration (Steadfast / Pathao Courier)

অর্ডার কনফার্মেশনের সাথে সাথে:

- Steadfast বা Pathao API-তে পার্সেল বুকিং রিকোয়েস্ট যাবে।
- Consignment ID এবং Live Tracking Code পাওয়া যাবে।
- কাস্টমারের প্রিভিয়াস রিটার্ন রেট / ফ্রড স্কোর স্বয়ংক্রিয়ভাবে যাচাই হবে।

### ২. Packaging Slip & Invoice Generation

- ডেলিভারির জন্য কাস্টমারের নাম, ফোন, ঠিকানা ও আইটেম লিস্ট সংবলিত printable packaging label / PDF স্লিপ জেনারেট হবে।

### ৩. Google Sheet (Secondary Backup)

Recommended fields:

```text
Order ID
Consignment ID (Courier Tracking)
Date & Time
Customer Name
Phone Number
Delivery Address (District, Thana, Full Address)
Ordered Products & Quantities
Product Total (৳)
Delivery Charge (৳)
Total Payable (৳)
Payment Method (COD/bKash/Nagad)
Payment Status (PAID / COD / PENDING)
Transaction ID (TrxID)
Courier Status (Booked/Pending)
Order Status (Confirmed)
Source Channel (Facebook / WhatsApp)
Customer ID
```

---

# 20. Admin Notification & Live Dashboard Alerts

### ক. অগ্রিম পেমেন্ট ভেরিফিকেশন অ্যালার্ট (Advance Payment Pending Alert)

কাস্টমার বিকাশ বা নগদে TrxID বা স্ক্রিনশট পাঠালে:

**Next.js Dashboard View:**

- স্ক্রিনের ওপর লাল নোটিফিকেশন ব্যানার ও অডিও অ্যালার্ট
- কাস্টমারের পাঠানো স্ক্রিনশট প্রিভিউ (Zoom-in সুবিধা)
- Extracted TrxID ও পেমেন্ট টাকার পরিমাণ
- এক ক্লিকে **`[✅ Verify & Confirm Order]`** অথবা **`[❌ Invalid Payment]`** অ্যাকশন বাটন

**WhatsApp Admin Alert Example:**

```text
⚠️ ADVANCE PAYMENT VERIFICATION NEEDED!

Order ID: RHB-000128
Customer: Hasan Ali
Phone: 017xxxxxxxx
Channel: WhatsApp

Payment Method: bKash
Total Payable: ৳460
Customer TrxID: 9JH76BA2Q
Payment Proof: [Attached Screenshot Image / Link]

👉 Please check your bKash app and Confirm:
https://admin.royalhoneybd.com/orders/RHB-000128/verify
```

---

### খ. কনফার্মড অর্ডার নোটিফিকেশন (Confirmed Order Alert)

COD অর্ডার হলে সরাসরি অথবা অগ্রিম পেমেন্ট ওনার কনফার্ম করার পর এই নোটিফিকেশন জেনারেট হবে:

```text
🛒 NEW ORDER CONFIRMED!

Order ID: RHB-000125
Tracking ID: ST-9982412 (Steadfast)

Customer: Rahim
Phone: 016xxxxxxxx

Address:
Dhaka, Adabor, Adabor Bazar

Products:
• কালোজিরা ফুলের মধু (250g) × 2 = ৳400
• বিশুদ্ধ ঘি (500g) × 1 = ৳500

Product Total: ৳900
Delivery Charge: ৳60 (Inside Dhaka)
Total Payable: ৳960 [Payment: bKash - Verified]

Channel: Facebook Messenger
Courier Status: Auto-Booked in Steadfast

👉 Dashboard View: https://admin.royalhoneybd.com/orders/RHB-000125
```

---

### গ. লো-স্টক ও রিস্টক অ্যালার্ট (Low Stock / Restock Alert)

যখন কোনো প্রডাক্টের স্টক তার নির্ধারিত `minThreshold`-এর নিচে নেমে যাবে:

**Next.js Dashboard View:**

- ইনভেন্টরি পেজ ও হেডার নোটিফিকেশনে লাল ব্যাজ এবং ওয়ার্নিং সাউন্ড
- প্রডাক্ট নাম, বর্তমান স্টক এবং মিনিমাম থ্রেশহোল্ড ভিউ
- সরাসরি **`[+ Restock Now]`** বাটন (ক্লিক করে নতুন স্টক ইনপুট দেওয়া যাবে)

**WhatsApp Admin Alert Example:**

```text
🚨 LOW STOCK & RESTOCK ALERT!

Product: কালোজিরা ফুলের মধু (250g)
Current Stock: 4 jars
Minimum Threshold: 10 jars

Status: Critical Low Stock!
Customer orders will soon be affected if not restocked.

👉 1-Click Restock via Dashboard:
https://admin.royalhoneybd.com/inventory/01/restock
```

---

# 21. Customer Confirmation Messages

### ১. অগ্রিম পেমেন্ট TrxID / স্ক্রিনশট রিসিভ করার পর মেসেজ:

```text
আপনার পেমেন্টের তথ্য (TrxID: 9JH76BA2Q) আমরা পেয়েছি।

আমাদের অ্যাকাউন্টস টিম পেমেন্টটি ভেরিফাই করার সাথে সাথেই আপনার অর্ডারটি কনফার্ম করে জানিয়ে দেওয়া হবে। সাধারণত ৫-১০ মিনিট সময় লাগতে পারে।

ধৈর্য ধরার জন্য ধন্যবাদ ❤️
```

### ২. ওনার পেমেন্ট ভেরিফাই বা COD কনফার্ম করার পর ফাইনাল মেসেজ:

```text
✅ আপনার পেমেন্ট সফলভাবে ভেরিফাই হয়েছে এবং অর্ডারটি Confirm করা হয়েছে!

Order ID: RHB-000128
মোট Paid/Payable: ৳460
Courier Tracking ID: ST-9982412

আমাদের পক্ষ থেকে পার্সেলটি দ্রুত কুরিয়ারে হস্তান্তর করা হবে। Royal Honey BD-এর সাথে থাকার জন্য ধন্যবাদ ❤️
```

---

# 22. Human Handoff & Live Agent Takeover System

যদি Agent কোনো প্রশ্ন বা সমস্যা confidently handle করতে না পারে, Agent কখনো মনগড়া উত্তর দেবে না।

Possible handoff conditions:

```text
1. Knowledge Base-এ information নেই
2. Agent answer নিশ্চিতভাবে জানে না (Low confidence score)
3. Customer human agent চাইছে (যেমন: "মানুষের সাথে কথা বলব", "Agent please")
4. Complaint বা অভিযোগ
5. Refund / Return issue
6. Payment dispute বা টাকা কেটে নেওয়া সংক্রান্ত
7. Delivery tracking issue বা পার্সেল পৌঁছাতে দেরি হওয়া
8. Complex customized order
9. Angry customer sentiment
10. Unsupported multimedia/request
```

### Unified Live Takeover Architecture (Next.js + Socket.io):

1. **Real-time Alert:** ওনারের Next.js ড্যাশবোর্ডে সাথে সাথে লাল ব্যাজ ও অডিও অ্যালার্ম বাজবে।
2. **1-Click Takeover:** ড্যাশবোর্ডে চ্যাটের ওপর `[Takeover Chat]` বাটন চাপলে ওই ইউজারের জন্য AI অটো-মিউট হয়ে যাবে।
3. **Live Two-way Chat:** ওনার ড্যাশবোর্ড ইনবক্স থেকে সরাসরি রিপ্লাই পাঠাবেন, যা Socket.io ও Meta API হয়ে কাস্টমারের WhatsApp/Messenger-এ পৌঁছে যাবে।
4. **Resume AI:** সমস্যা সমাধান হলে ওনার `[Resume AI]` বাটনে ক্লিক করবেন, তখন আবার AI স্বাভাবিকভাবে কথা বলা শুরু করবে।
5. **Mobile WhatsApp Alert:** ওনার ড্যাশবোর্ডের বাইরে থাকলে হোয়াটসঅ্যাপে কনটেক্সটসহ অ্যালার্ট পাঠানো হবে।

---

# 23. Human Handoff Customer Response

Customer-কে বলা হবে:

```text
দুঃখিত, এই বিষয়টি আমি বর্তমানে নিশ্চিতভাবে জানাতে পারছি না।

আমাদের সাপোর্ট টিমকে বিষয়টি জানানো হয়েছে। খুব শীঘ্রই আমাদের একজন প্রতিনিধি আপনার সাথে কথা বলবেন। ❤️
```

একই সাথে সিস্টেমে `human_handoff` টিকিট ওপেন হবে এবং Live Dashboard-এ পুশ হবে।

---

# 24. Human Handoff Admin Alert (Dashboard & WhatsApp)

### ড্যাশবোর্ড রিয়েল-টাইম ভিউ (Next.js):

- Customer Profile, Phone & Channel (FB / WhatsApp)
- ফুল চ্যাট হিস্ট্রি
- বর্তমান কার্ট ও অর্ডারের স্ট্যাটাস
- AI কেন হ্যান্ডঅফ করেছে তার কারণ (Reason)
- `[Takeover Now]` বাটন

### Admin WhatsApp Fallback Alert:

```text
🚨 HUMAN SUPPORT REQUIRED!

Customer: Rahim
Phone: 016xxxxxxxx
Channel: Facebook Messenger

Last Message:
"আমার আগের order এখন কোথায় আছে?"

Trigger Reason: Delivery tracking inquiry / low confidence.

👉 Open & Takeover Chat: https://admin.royalhoneybd.com/inbox/conv_99214
```

---

# 24.1 Dashboard Authentication, Security & Role-Based Access Control (RBAC)

যেহেতু এডমিন ড্যাশবোর্ড থেকে লাইভ চ্যাট টেকওভার, কাস্টমারের সংবেদনশীল তথ্য, বিকাশ/নগদ পেমেন্ট অ্যাপ্রুভাল, প্রডাক্ট প্রাইসিং এবং ইনভেন্টরি রিস্টক করা যায়, তাই ড্যাশবোর্ডের সর্বোচ্চ নিরাপত্তা নিশ্চিত করতে হবে:

### ১. Secure Login & Session Management:

- **লগইন পোর্টাল (`/login`):** ওনার/এডমিনের ইমেইল বা ফোন নম্বর এবং সিকিউর পাসওয়ার্ড দিয়ে লগইন।
- **Password Hashing:** পাসওয়ার্ড কখনোই প্লেইন টেক্সটে সেভ হবে না; `bcrypt` (12 rounds) বা `Argon2` দিয়ে হ্যাশ করে PostgreSQL-এ সেভ থাকবে।
- **JWT & HttpOnly Cookies:** সেশন ম্যানেজমেন্টের জন্য JSON Web Token (JWT) ব্যবহার করা হবে, যা ব্রাউজারের `HttpOnly`, `Secure` এবং `SameSite=Strict` কুকিতে থাকবে—যাতে কোনো XSS অ্যাটাকে টোকেন চুরি না হতে পারে।
- **Next.js Middleware Route Protection:** `/admin/*`, `/orders/*`, `/inventory/*`, `/knowledge/*` সব রুট Next.js মিডলওয়্যার দ্বারা সুরক্ষিত থাকবে। ভ্যালিড সেশন ছাড়া কেউ সরাসরি কোনো পেজে ঢুকতে পারবে না।

### ২. Socket.io Authentication Handshake:

- Socket.io কানেকশন ওপেন হওয়ার আগে হ্যান্ডশেকে ক্লায়েন্টের JWT সেশন ভ্যালিডেট করা হবে। ভ্যালিড ওনার ছাড়া বাইরের কেউ লাইভ চ্যাট স্ট্রিম শুনতে পারবে না।

### ৩. Brute-Force Attack Prevention:

- ভুল পাসওয়ার্ড দিয়ে বারবার লগইন চেষ্টার বিরুদ্ধে Redis-বেজড Rate Limiting থাকবে (যেমন: ৫ বার ভুল পাসওয়ার্ড দিলে অ্যাকাউন্ট ১৫ মিনিটের জন্য লক)।

### ৪. Role-Based Access Control (RBAC):

- **OWNER:** সম্পূর্ণ এক্সেস (পেমেন্ট ভেরিফিকেশন, রিস্টক, প্রাইস চেঞ্জ, AI নলেজ এডিট, চ্যাট টেকওভার, রেভিনিউ রিপোর্ট)।
- **SUPPORT_AGENT (ভবিষ্যতের জন্য):** শুধুমাত্র চ্যাট টেকওভার ও অর্ডার স্ট্যাটাস ভিউ এক্সেস।

### ৫. Audit Trail Logs:

- কে কখন পেমেন্ট কনফার্ম করল, কে চ্যাট টেকওভার নিল এবং কে নতুন স্টক অ্যাড করল—সবকিছু এডমিন আইডি ও টাইমস্ট্যাম্পসহ ডাটাবেজে রেকর্ড থাকবে।

---

# 25. Cross-Channel Customer State

Facebook এবং WhatsApp-এর জন্য আলাদা customer state তৈরি করা উচিত নয়।

একই customer-এর unified state রাখতে হবে।

Example:

Customer Facebook-এ order শুরু করল:

```text
Name = Rahim
Product = Honey
Quantity = 2
```

পরে WhatsApp-এ message করল:

"আমার order-এর জন্য বাকি information দিচ্ছি।"

System customer identity resolve করতে পারলে আগের state retrieve করবে।

তাই architecture হবে:

```text
Facebook Messenger ──┐
                     ├──> Same AI Agent
WhatsApp ────────────┘
                           ↓
                    Unified Customer State
```

---

# 26. Conversation State

প্রতিটি customer-এর conversation/order state maintain করতে হবে।

Example:

```json
{
  "customerId": "customer_123",
  "channel": "facebook",
  "name": "Rahim",
  "phone": "016xxxxxxxx",
  "district": "Dhaka",
  "thana": "Adabor",
  "address": "Adabor Bazar",
  "items": [
    {
      "productId": "01",
      "productName": "কালোজিরা ফুলের মধু",
      "quantity": 2,
      "unitPrice": 200
    }
  ],
  "orderStatus": "collecting_information"
}
```

---

# 27. Recommended Database Structure (Prisma ORM + PostgreSQL)

Production-level implementation-এর জন্য customer, order, inventory এবং handoff state রিলেশনাল ডাটাবেজে (PostgreSQL via Prisma ORM) রাখা হবে।

Recommended Prisma Models:

```prisma
// ১. কাস্টমার ও চ্যানেল আইডেন্টিটি
model Customer {
  id            String         @id @default(uuid())
  phone         String?        @unique
  name          String?
  district      String?
  thana         String?
  fullAddress   String?
  fraudRiskRate Float?         // কুরিয়ার রিটার্ন রেট / ফ্রড স্কোর
  channelIds    ChannelUser[]  // FB PSID & WhatsApp Phone
  orders        Order[]
  carts         Cart[]
  conversations Conversation[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

// ২. প্রডাক্ট, লাইভ ইনভেন্টরি ও রিস্টক লগ
model Product {
  id                String       @id
  name              String
  price             Float
  weight            String
  description       String?
  stockCount        Int          @default(100)
  minThreshold      Int          @default(10)    // মিনিমাম স্টক সীমা (রিস্টক অ্যালার্ট ট্রিগার)
  lowStockAlertSent Boolean      @default(false) // ডুপ্লিকেট নোটিফিকেশন প্রতিরোধ
  isAvailable       Boolean      @default(true)
  orderItems        OrderItem[]
  cartItems         CartItem[]
  restockLogs       RestockLog[]
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}

// রিস্টক হিস্ট্রি লগ
model RestockLog {
  id            String   @id @default(uuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  quantityAdded Int
  previousStock Int
  newStock      Int
  restockedBy   String?  // ওনার বা এডমিনের নাম/আইডি
  createdAt     DateTime @default(now())
}

// ৩. চ্যাট ও কনভার্সন ট্র্যাকিং
model Conversation {
  id             String          @id @default(uuid())
  customerId     String
  channel        String          // "FACEBOOK" | "WHATSAPP"
  status         String          // "AI_ACTIVE" | "HUMAN_TAKEOVER"
  messages       Message[]
  humanHandoffs  HumanHandoff[]
}

// ৪. কার্ট ও কার্ট আইটেম
model Cart {
  id         String     @id @default(uuid())
  customerId String
  items      CartItem[]
  updatedAt  DateTime   @updatedAt
}

// ৫. অর্ডার, কুরিয়ার ট্র্যাকিং ও পেমেন্ট
model Order {
  id                String      @id // RHB-XXXXXX
  customerId        String
  items             OrderItem[]
  productTotal      Float
  deliveryCharge    Float
  totalAmount       Float
  paymentMethod     String      // "COD" | "BKASH" | "NAGAD"
  paymentStatus     String      // "UNPAID" | "VERIFICATION_PENDING" | "PAID" | "FAILED"
  transactionId     String?     // TrxID sent by customer
  paymentProofUrl   String?     // Screenshot image URL
  paymentVerifiedAt DateTime?   // When admin clicked verify
  paymentVerifiedBy String?     // Admin user ID
  orderStatus       String      // "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED"
  courierProvider   String?     // "STEADFAST" | "PATHAO"
  consignmentId     String?     // Courier Consignment Code
  trackingCode      String?     // Public Tracking URL/Code
  sourceChannel     String      // "FACEBOOK" | "WHATSAPP"
  createdAt         DateTime    @default(now())
}

// ৬. হিউম্যান হ্যান্ডঅফ ও লাইভ সাপোর্ট টিকেট
model HumanHandoff {
  id             String    @id @default(uuid())
  conversationId String
  reason         String
  status         String    // "OPEN" | "RESOLVED"
  assignedAdmin  String?
  createdAt      DateTime  @default(now())
}

// ৭. ওনার ড্যাশবোর্ড ম্যানেজড নলেজ বেস ও FAQ (Dynamic RAG)
model KnowledgeItem {
  id          String   @id @default(uuid())
  category    String   // "FAQ" | "POLICY" | "HONEY_GUIDE" | "ANNOUNCEMENT"
  question    String   // প্রশ্ন বা টাইটেল
  answer      String   // বিস্তারিত উত্তর বা পলিসি
  tags        String[] // কি-ওয়ার্ড সার্চ ফিল্টার
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ৮. এডমিন ও ওনার একাউন্টস (Dashboard Authentication & RBAC)
model AdminUser {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  phone        String?   @unique
  passwordHash String
  role         String    @default("OWNER") // "OWNER" | "SUPPORT_AGENT"
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

RAG knowledge ও FAQ ওনারের ড্যাশবোর্ড থেকে `KnowledgeItem` টেবিলে ম্যানেজ হবে এবং ব্যাকএন্ড স্বয়ংক্রিয়ভাবে `pgvector` দিয়ে এর ভেক্টর এমবেডিং আপডেট রাখবে।

---

# 28. RAG vs Database (কেন প্রডাক্ট তথ্য RAG-এ রাখা যাবে না)

প্রডাক্টের তথ্য (নাম, দাম, স্টক, ওজন) RAG-এ ডুপ্লিকেট করে রাখা যাবে না। কারণ ওনার যখন প্রডাক্ট টেবিল বা ড্যাশবোর্ড থেকে দাম/স্টক পরিবর্তন করবেন, RAG-এ পুরনো তথ্য থেকে গেলে AI বিভ্রান্ত হয়ে ভুল দাম বা স্টক-আউট হওয়া সত্ত্বেও অর্ডার নিয়ে ফেলবে।

### RAG নলেজ বেস (Semantic Vector Search):

```text
Business Overview & Support Timings
Business Policies (Medical disclaimers, Return/Refund rules)
Delivery FAQ & Area Timelines
Payment FAQ (বিকাশ/নগদ পাঠানোর নিয়ম)
General Customer FAQs
Honey Educational Guides (মধু কেন জমে, খাঁটি মধু চেনার উপায়, খাওয়ার নিয়ম)
Announcements & Holiday Notices
```

### Relational Database (Prisma Single Source of Truth):

```text
Products (Product ID, Name, Price, Weight, Live Stock, MinThreshold)
Customers (Name, Phone, Address, Past Delivery Success Rate)
Carts & CartItems (Active shopping sessions)
Orders & OrderItems (Order Status, Courier Tracking, Invoices)
Payment Transactions (TrxID, Payment Status, Verification logs)
Restock Logs (ইনভেন্টরি হিস্ট্রি)
```

> **গোল্ডেন রুল:** প্রডাক্টের মূল্য, স্টক এবং স্পেসিফিকেশন **সর্বদা ডাটাবেজ (SQL/Prisma Tool)** থেকে কোয়েরি হবে; আর নীতি ও ব্যাখ্যামূলক উত্তর **RAG** থেকে আসবে।

---

# 29. Multimedia Processing Architecture

Overall input processing:

```text
                    Customer
                       │
          ┌────────────┼────────────┐
          │            │            │
        Text         Image       Voice/Video
          │            │            │
          │       Vision Model   Media Processing
          │                         │
          │                   Speech-to-Text
          │                         │
          └────────────┬────────────┘
                       ↓
                Unified Message
                       ↓
                Intent Detection
                       ↓
                  AI Agent
                       ↓
            RAG / Order / Handoff
```

Agent-এর কাছে শেষ পর্যন্ত normalized context যাবে।

---

# 30. Image Handling Rules

Image থেকে information পাওয়া গেলে Agent context হিসেবে ব্যবহার করবে।

Examples:

```text
Product image (মধু/ঘি শনাক্তকরণ)
Payment screenshot (bKash/Nagad মানি রিসিপ্ট)
Address screenshot (ঠিকানার ছবি বা স্ক্রিনশট)
Order screenshot (প্রিভিয়াস অর্ডারের তথ্য)
Complaint image (ভাঙা জার বা প্যাকেজিং সমস্যা)
```

### বিকাশ / নগদ পেমেন্ট স্ক্রিনশট হ্যান্ডলিং রুল:

1. কাস্টমার পেমেন্ট স্ক্রিনশট পাঠালে Vision LLM / OCR দিয়ে:
   - **Transaction ID (TrxID)**
   - **Amount (টাকার পরিমাণ)**
   - **Time & Date**
     স্বয়ংক্রিয়ভাবে এক্সট্র্যাক্ট করা হবে।
2. স্ক্রিনশট ইমেজটি নিরাপদে স্টোর করে অর্ডারের `paymentProofUrl`-এ লিংক করা হবে।
3. **এআই কোনো অবস্থাতেই স্ক্রিনশট দেখে পেমেন্ট "Verified" ঘোষণা করবে না।**
4. ওনারের ড্যাশবোর্ডে ইমেজ প্রিভিউসহ ইনস্ট্যান্ট নোটিফিকেশন যাবে এবং হোয়াটসঅ্যাপ অ্যালার্ট যাবে। ওনার স্টেটমেন্ট চেক করে কনফার্ম বাটন চাপলে তবেই অর্ডার কনফার্ম হবে।

যদি image unclear বা ঝাপসা হয়:

```text
"আপনার পাঠানো ছবিটি পরিষ্কারভাবে বোঝা যাচ্ছে না। অনুগ্রহ করে পরিষ্কার ছবি অথবা Transaction ID (TrxID)-টি লিখে দিন।"
```

Agent কখনো অনুমান করবে না।

---

# 31. Voice Handling Rules

Voice message প্রথমে transcribe করতে হবে।

```text
Audio
→ Speech-to-Text
→ Text
→ Intent Detection
→ Agent
```

Transcription uncertain হলে Agent গুরুত্বপূর্ণ তথ্য assume করবে না।

বিশেষ করে:

```text
Phone Number
Quantity
Address
Product Name
```

এগুলো confirm করতে হবে যদি transcription ambiguous হয়।

---

# 32. Video Handling Rules

Video থেকে:

```text
Audio
Visual Frames
Text/OCR if required
```

extract করা যেতে পারে।

তারপর combined context Agent-কে দিতে হবে।

Example:

Customer একটি video পাঠিয়ে বলল:

"এই product-টা লাগবে।"

Video analysis থেকে product identify করা গেলে Agent product match করবে।

যদি নিশ্চিতভাবে identify করা না যায়:

```text
"ভিডিওটি দেখে Product টি নিশ্চিতভাবে শনাক্ত করতে পারছি না। আপনি Product-এর নামটি লিখে দিলে আমি সাহায্য করতে পারি।"
```

---

# 33. Hallucination Prevention

Agent-এর সবচেয়ে গুরুত্বপূর্ণ rule:

**Never Guess.**

Agent কখনো invent করবে না:

```text
Product
Price
Stock
Delivery Charge
Delivery Time
Payment Number
Order ID
Order Status
Customer Information
Business Policy
```

Unknown information হলে:

```text
I don't have reliable information about this.
```

এবং প্রয়োজন হলে human handoff করবে।

---

# 34. Medical Claim Policy

Honey বা Ghee সম্পর্কে কোনো medical claim করা যাবে না।

Agent বলবে না:

```text
"এই মধু diabetes cure করে"
"এটি রোগ ভালো করে"
"এটি নিশ্চিতভাবে immunity বাড়ায়"
```

যদি customer medical benefit জিজ্ঞেস করে এবং knowledge base-এ তথ্য না থাকে:

```text
এই বিষয়ে আমাদের নির্ভরযোগ্য তথ্য বর্তমানে available নেই।
```

---

# 35. Overall Automation Architecture (Modern Hybrid Pro)

Recommended production architecture:

```text
         [ Customer: Facebook Messenger / WhatsApp ]
                             │
                             ▼
               [ Webhook Layer (Express.js) ]
                             │
                  ( Immediate 200 OK )
                             │
                             ▼
              [ BullMQ Ingestion Queue (Redis) ]
                             │
           ┌─────────────────┴─────────────────┐
           ▼                                   ▼
    [ AI & Chat Worker ]                [ Media Worker ]
   (Node.js + TypeScript)            (Audio/Video/Vision/OCR)
           │                                   │
           ▼                                   │
    [ Customer Identification ]                │
    [ State & Cart Retrieval (Redis) ]         │
           │                                   │
           ▼                                   │
    [ Intent Detection ]                       │
           │                                   │
           ▼                                   ▼
       [ AI Agent ] ◄──────────────────────────┘
           │
    ┌──────┼────────────────────────┐
    ▼      ▼                        ▼
  [RAG] [Order Flow]       [Human Handoff Triggered]
    │      │                        │
    │      ▼                        ├──> [Admin WhatsApp Alert]
    │  [Atomic Confirmation]        └──> [Next.js Admin Live Portal]
    │      │                             (Socket.io Realtime Chat
    │      │                              & 1-Click Takeover)
    │      ├──> 1. DB Order Created (Prisma + PostgreSQL)
    │      ├──> 2. Courier API (Steadfast/Pathao Auto-Booking)
    │      ├──> 3. Generate Shipping Slip / Invoice PDF
    │      ├──> 4. Google Sheets (Secondary Backup)
    │      └──> 5. Admin WhatsApp Notification
    ▼
[ Customer Response via Meta Graph API / WhatsApp ]
```

---

# 36. Modern Hybrid Technology Stack

| Layer                    | Technology                                                  | Purpose                                                                                                                                                                                       |
| :----------------------- | :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ingestion / API**      | **Node.js, Express.js, TypeScript**                         | High-performance Webhook endpoint, instant 200 OK & payload validation.                                                                                                                       |
| **Message Queue**        | **BullMQ + Redis**                                          | Webhook de-coupling, retry mechanism, zero duplicate handling, rate limiting.                                                                                                                 |
| **Database & ORM**       | **PostgreSQL + Prisma ORM**                                 | Type-safe transactional data (Orders, Customers, Stock locking, Audit logs).                                                                                                                  |
| **Session & Cache**      | **Redis**                                                   | Active cart state, user session context, distributed idempotency lock.                                                                                                                        |
| **AI / NLP / RAG**       | **OpenAI / Anthropic / Gemini / pgvector**                  | Intent classification, Bangla natural language generation, and dynamic RAG knowledge retrieval.                                                                                               |
| **Media Processing**     | **Whisper API, Vision LLM, FFmpeg**                         | Bangla speech-to-text, receipt/payment screenshot OCR, video frame analysis.                                                                                                                  |
| **Admin Portal**         | **Next.js (App Router), Tailwind CSS**                      | Real-time live customer monitoring, 1-click takeover, payment verification, Dynamic Knowledge Base & FAQ, and **Product Catalog & Inventory Restock Management (with Min Threshold alerts)**. |
| **Auth & Security**      | **NextAuth.js / Auth.js / JWT, bcrypt, Next.js Middleware** | Secure Admin login, password hashing, protected routes, HttpOnly cookies, and brute-force prevention.                                                                                         |
| **Real-time Engine**     | **Socket.io**                                               | Live chat sync between customer channels and admin dashboard for 1-click takeover.                                                                                                            |
| **Logistics**            | **Steadfast / Pathao Courier API**                          | 1-click parcel booking, consignment tracking, customer delivery success rate check.                                                                                                           |
| **Orchestration / Sync** | **Google Sheets API & n8n**                                 | Secondary backup spreadsheets and external automation workflows.                                                                                                                              |
| **DevOps & Infra**       | **Docker, Docker Compose, GitHub Actions CI/CD**            | Multi-containerized production deployment, automated testing, and zero-downtime updates.                                                                                                      |

---

# 37. Core Business Workflow

The complete customer journey should be:

```text
Customer sends message
        ↓
Detect message type (Text / Image / Voice / Video)
        ↓
Process input & normalize text
        ↓
Identify customer & load previous state
        ↓
Understand intent
        ↓
Retrieve relevant RAG context
        ↓
Answer FAQ/Inquiry OR start order flow
        ↓
If order:
    Check product & validate stock
    Extract known customer info (Name, Phone, Address)
    Ask only missing info (progressive collection)
    Allow customer to edit if needed
    Calculate price & delivery charge
    Show order summary
    Ask payment method & explicit confirmation
        ↓
    Customer confirms:
        ├── IF Cash on Delivery (COD):
        │       ↓
        │   Create Order (Status: CONFIRMED)
        │       ↓
        │   Auto-Book Courier (Steadfast/Pathao)
        │       ↓
        │   Generate Invoice & Sync Google Sheet
        │       ↓
        │   Send Final Confirmation to Customer
        │
        └── IF Advance Payment (bKash / Nagad):
                ↓
            Provide Account Number (01604121107) & Amount
                ↓
            Customer sends TrxID (Text/Voice) or Screenshot
                ↓
            Extract TrxID & Amount (Vision LLM / OCR)
                ↓
            Create Order (Status: PAYMENT_VERIFICATION_PENDING)
                ↓
            Send Acknowledgment to Customer (Verification Pending)
                ↓
            Alert Owner on Next.js Dashboard & WhatsApp
                ↓
            Owner verifies Statement & Clicks [Confirm Payment]
                ↓
            Order Status updated to: CONFIRMED
                ↓
            Auto-Book Courier (Steadfast/Pathao)
                ↓
            Send Payment Success & Order Confirmation to Customer

If Agent cannot handle:
        ↓
    Do not guess / Do not hallucinate
        ↓
    Inform Customer politely
        ↓
    Trigger Human Handoff Ticket
        ↓
    Real-time Alert on Next.js Dashboard (Socket.io) + WhatsApp Alert
        ↓
    Admin can Takeover Chat in 1-Click
```

---

# 38. Important Agent Rules

The AI Agent must follow these rules strictly:

1. Never invent business information.
2. Never create an order without explicit confirmation.
3. Never ask for information that the customer already provided.
4. Always reuse previously collected customer information.
5. Allow customer to edit collected information.
6. Track multiple products separately.
7. Delivery charge is added only once per order.
8. Check stock before accepting an order.
9. Product price must come from the knowledge base/database.
10. Order summary must be shown before confirmation.
11. Customer must explicitly confirm.
12. Confirmed orders must be added to Google Sheet.
13. Confirmed orders must trigger WhatsApp admin notification.
14. Unsupported queries must trigger human handoff.
15. Human handoff notification must include customer context.
16. Text, image, voice and video inputs must be supported.
17. Important information extracted from voice/image/video must be validated when uncertain.
18. Never hallucinate unclear multimedia information.
19. Never make unsupported medical claims.
20. Keep responses short, friendly and professional in Bangla.
21. Customer should not feel like they are talking to a complicated AI system.
22. The same customer/order state should be reusable across Facebook and WhatsApp whenever identity can be reliably matched.
23. Never confirm advance payment automatically based on text or screenshots alone. Always require the business owner to verify against their actual bKash/Nagad statement and explicitly approve before marking payment as verified.

---

# 39. Main Goal of the Project

The goal is to build a **real-world production-style AI Customer Support + Order Management Automation System** for Royal Honey BD.

The system should behave like a human customer support representative who can:

- Understand text
- Understand images
- Understand voice
- Understand videos
- Answer product questions
- Search the business knowledge base
- Remember customer-provided information
- Collect missing order information
- Update customer information
- Handle multiple products
- Calculate order totals
- Confirm orders
- Create order records
- Update Google Sheets
- Notify the business owner on WhatsApp
- Detect unsupported questions
- Escalate difficult conversations to human support

The system should prioritize **accuracy, state management, reliability, validation, human handoff and prevention of hallucination** over simply generating conversational responses.
