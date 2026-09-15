import prisma from '../../libs/prisma';
import { CustomerSession, type ICustomerSession } from './customer.session';
import type { IExtractedEntities } from './customer.extractor';
import { CustomerIdentityService, normalizeBdPhone } from './customer.identity';

/**
 * Update customer profile details and sync both PostgreSQL and Redis,
 * automatically resolving and merging cross-channel identities if phone matches an existing customer.
 */
const updateCustomerProfile = async (
  customerId: string,
  info?: IExtractedEntities['customerInfo'],
): Promise<ICustomerSession> => {
  let activeCustomerId = customerId;
  let session = await CustomerSession.getSession(activeCustomerId);
  if (!info) return session;

  const updateData: Record<string, any> = {};

  if (info.name && info.name.trim().length >= 2) {
    updateData.name = info.name.trim();
  }

  if (info.phone) {
    const validPhone = normalizeBdPhone(info.phone);
    if (validPhone) {
      // Check if another customer already has this phone (Cross-channel match)
      const existingCustomerWithPhone = await prisma.customer.findUnique({
        where: { phone: validPhone },
      });

      if (existingCustomerWithPhone && existingCustomerWithPhone.id !== activeCustomerId) {
        console.log(
          `🔗 [CustomerService] Cross-channel match detected for phone ${validPhone}. Merging ${activeCustomerId} into ${existingCustomerWithPhone.id}...`,
        );
        const mergeResult = await CustomerIdentityService.mergeCustomerIdentities(
          activeCustomerId,
          existingCustomerWithPhone.id,
        );
        activeCustomerId = mergeResult.unifiedCustomerId;
      } else {
        updateData.phone = validPhone;
      }
    }
  }

  if (info.district && info.district.trim().length >= 2) {
    updateData.district = info.district.trim();
  }

  if (info.thana && info.thana.trim().length >= 2) {
    updateData.thana = info.thana.trim();
  }

  if (info.fullAddress && info.fullAddress.trim().length >= 5) {
    updateData.fullAddress = info.fullAddress.trim();
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.customer.update({
      where: { id: activeCustomerId },
      data: updateData,
    });
  }

  // Refresh and update session
  session = await CustomerSession.hydrateSessionFromDb(activeCustomerId);

  // Recalculate delivery fee if district changed
  if (info.district && session.cart.items.length > 0) {
    const isDhaka =
      session.district?.toLowerCase().includes('dhaka') ||
      session.district?.includes('ঢাকা');
    session.cart.deliveryCharge = isDhaka ? 60 : 120;
    session.cart.finalTotal =
      session.cart.productTotal + session.cart.deliveryCharge;
  }

  await CustomerSession.saveSession(session);
  return session;
};

/**
 * Format Smart Order Information Form (pre-filling known info, leaving missing empty)
 */
const formatOrderInformationForm = (session: ICustomerSession): string => {
  const cartItems = session.cart?.items || [];
  const productNames = cartItems.length > 0
    ? cartItems.map((item) => item.productName).join(', ')
    : '';
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return `আপনার নাম: ${session.name || ''}
ফোন নাম্বার: ${session.phone || ''}
জেলা: ${session.district || ''}
ডেলিভারি ঠিকানা: ${session.fullAddress || ''}
প্রোডাক্ট নাম: ${productNames}
প্রোডাক্ট সংখ্যা: ${totalQuantity > 0 ? totalQuantity : ''}`.trim();
};

/**
 * Format Order Summary Card (Exact format requested by user)
 */
const formatOrderSummary = (session: ICustomerSession): string => {
  const cart = session.cart;
  const cartItems = cart.items || [];
  const productNames = cartItems.map((item) => item.productName).join(', ');
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  let priceCalculation = '';
  if (cartItems.length === 1) {
    const item = cartItems[0];
    priceCalculation = `৳${item.unitPrice} × ${item.quantity} = ৳${item.totalPrice}`;
  } else {
    const lines = cartItems.map(
      (item) => `${item.productName} (৳${item.unitPrice} × ${item.quantity} = ৳${item.totalPrice})`,
    );
    priceCalculation = `${lines.join(' + ')} = ৳${cart.productTotal}`;
  }

  return `আপনার নাম: ${session.name || ''}
ফোন নাম্বার: ${session.phone || ''}
জেলা: ${session.district || ''}
ডেলিভারি ঠিকানা: ${session.fullAddress || ''}
প্রোডাক্ট নাম: ${productNames}
প্রোডাক্ট সংখ্যা: ${totalQuantity}
টোটাল প্রোডাক্ট প্রাইস : ${priceCalculation}
ডেলিভারি চার্জ : ৳${cart.deliveryCharge}
প্রদান করতে হবে : ৳${cart.finalTotal} টাকা

আপনার অর্ডারের সব তথ্য সঠিক আছে কি? আপনি Confirm করলে আপনার অর্ডারটি place করা হবে।`.trim();
};

/**
 * Calculate dynamic expected delivery timeline with Bengali days and dates
 */
export const getDeliveryTimelineString = (
  district?: string | null,
  orderDate: Date = new Date(),
): string => {
  const isDhaka = district?.toLowerCase().includes('dhaka') || district?.includes('ঢাকা');
  const minDays = isDhaka ? 1 : 2;
  const maxDays = isDhaka ? 2 : 3;

  const minDate = new Date(orderDate.getTime() + minDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(orderDate.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const banglaDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const toBn = (n: number) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

  const minDayName = banglaDays[minDate.getDay()];
  const maxDayName = banglaDays[maxDate.getDay()];
  const minDayNum = toBn(minDate.getDate());
  const maxDayNum = toBn(maxDate.getDate());
  const monthName = banglaMonths[minDate.getMonth()];

  if (minDate.getMonth() === maxDate.getMonth()) {
    return `ইনশাআল্লাহ আগামী ${minDayName} বা ${maxDayName} (${minDayNum}-${maxDayNum} ${monthName})-এর মধ্যে`;
  }
  return `ইনশাআল্লাহ আগামী ${minDayName} (${minDayNum} ${monthName}) বা ${maxDayName} (${maxDayNum} ${banglaMonths[maxDate.getMonth()]})-এর মধ্যে`;
};

/**
 * Describe remaining missing fields and provide smart order form template
 */
const formatMissingFieldsPrompt = (session: ICustomerSession): string => {
  const missingFields = session.missingFields;
  const hasItems = session.cart?.items && session.cart.items.length > 0;

  if (missingFields.length === 0 && hasItems) {
    return `【অর্ডার সামারি নির্দেশনা (পূর্ববর্তী কাস্টমার / সম্পূর্ণ তথ্য প্রাপ্ত)】:
গ্রাহকের নাম (${session.name}), ফোন (${session.phone}), জেলা (${session.district}), সম্পূর্ণ ডেলিভারি ঠিকানা (${session.fullAddress}) এবং কার্ট আইটেম অলরেডি সংরক্ষিত আছে!
⚠️ ভুলেও কাস্টমারকে নতুন করে নাম, ফোন বা ঠিকানার খালি ফর্ম পাঠাবেন না! পূর্বে দেওয়া তথ্য কখনোই আবার চাইবেন না!
গ্রাহক নিতে চাওয়া মাত্রই সরাসরি নিচের সম্পূর্ণ Order Summary হুবহু উপস্থাপন করুন এবং নিশ্চিত হোন:

${formatOrderSummary(session)}

ভাইয়া, আপনার পূর্বে সংরক্ষিত এই ঠিকানাতেই কি পার্সেলটি পাঠিয়ে দেব, নাকি কোনো তথ্য বা ঠিকানা পরিবর্তন করতে চান?
সব ঠিক থাকলে "Confirm" বা "পাঠিয়ে দিন" লিখলেই আমরা দ্রুত পার্সেল রেডি করে পাঠিয়ে দেব। আর কোনো কিছু পরিবর্তন করতে চাইলে লিখে জানান ভাইয়া। 😊`;
  }

  if (missingFields.length === 1 && missingFields[0] === 'items') {
    return `【পূর্ববর্তী কাস্টমার - শুধু পণ্য নির্বাচন প্রয়োজন】:
গ্রাহকের নাম (${session.name}), ফোন (${session.phone}), জেলা (${session.district}), এবং ঠিকানা (${session.fullAddress}) অলরেডি সংরক্ষিত আছে!
গ্রাহকের কাছে ভুলেও নাম, ফোন বা ঠিকানা পুনরায় চাইতে যাবেন না। শুধু বিনীতভাবে জানতে চান তিনি কোন প্রোডাক্ট কতটি নিতে চান।`;
  }

  const formTemplate = formatOrderInformationForm(session);

  const missingLabels = missingFields.map((f) => {
    switch (f) {
      case 'name':
        return 'আপনার নাম';
      case 'phone':
        return '১১ ডিজিটের সচল মোবাইল নম্বর';
      case 'district':
        return 'জেলা';
      case 'fullAddress':
        return 'ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা)';
      case 'items':
        return 'কোন প্রোডাক্ট কতটি লাগবে';
    }
  });

  const knownFields: string[] = [];
  if (session.name) knownFields.push(`নাম: ${session.name}`);
  if (session.phone) knownFields.push(`ফোন: ${session.phone}`);
  if (session.district) knownFields.push(`জেলা: ${session.district}`);
  if (session.fullAddress) knownFields.push(`ঠিকানা: ${session.fullAddress}`);

  return `【অর্ডার ফরম ও তথ্য সংগ্রহের নির্দেশনা】:
${knownFields.length > 0 ? `গ্রাহকের সংরক্ষিত তথ্য: ${knownFields.join(', ')}। এই তথ্যগুলো ফর্মে পূর্বনির্ধারিত থাকবে, কখনোই নতুন করে আবার চাইবেন না!` : ''}
বাকি থাকা প্রয়োজনীয় ফিল্ড: ${missingLabels.join(', ')}

কাস্টমার অর্ডার করতে চাইলে নিচের ফর্মে ইতোমধ্যে প্রাপ্ত তথ্য বসিয়ে বাকি খালি ফিল্ডগুলো বিনীতভাবে চেয়ে নিন:

${formTemplate}

নোট:
- গ্রাহক যে তথ্য একবার দিয়েছে (যেমন: নাম, ফোন বা ঠিকানা), তা ফর্মে বসিয়ে রাখবেন এবং ভুলেও পুনরায় চাইবেন না। শুধু অনুপস্থিত বা অসম্পূর্ণ তথ্য চেয়ে মিষ্টি করে মেসেজ দিন।
- ফোন নম্বর ভুল বা কম ডিজিটের হলে আবার সঠিক ১১ ডিজিটের নম্বর চাইবেন। ঠিকানা অসম্পূর্ণ হলে পূর্ণ বাসা/রোড/এলাকা চাইবেন।`;
};

export const CustomerServices = {
  updateCustomerProfile,
  formatOrderInformationForm,
  formatOrderSummary,
  formatMissingFieldsPrompt,
  getDeliveryTimelineString,
};


