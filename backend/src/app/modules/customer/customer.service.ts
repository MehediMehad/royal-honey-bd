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
 * Describe remaining missing fields and provide smart order form template
 */
const formatMissingFieldsPrompt = (session: ICustomerSession): string => {
  const missingFields = session.missingFields;
  const hasItems = session.cart?.items && session.cart.items.length > 0;

  if (missingFields.length === 0 && hasItems) {
    return `【অর্ডার সামারি নির্দেশনা】:
গ্রাহকের নাম, ফোন, জেলা, ডেলিভারি ঠিকানা ও প্রোডাক্টের তথ্য সম্পূর্ণ পাওয়া গেছে!
এখন হুবহু নিচের Order Summary ফরম্যাটে উপস্থাপন করে কাস্টমারের কাছ থেকে কনফার্মেশন চেয়ে নিন:

${formatOrderSummary(session)}`;
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

  return `【অর্ডার ফরম ও তথ্য সংগ্রহের নির্দেশনা】:
কাস্টমার যখন অর্ডার করতে চায় বা নিতে চায়, তখন অর্ডারের জন্য প্রয়োজনীয় তথ্যগুলো ঠিক নিচের স্মার্ট ফরম্যাটে তুলে ধরুন:

${formTemplate}

নোট:
- উপরের ফর্মে ইতোমধ্যে প্রাপ্ত তথ্য (যেমন: জেলা, প্রোডাক্ট নাম, সংখ্যা) থাকলে তা বসিয়ে রাখবেন এবং বাকি খালি ফিল্ডগুলো (${missingLabels.join(', ')}) কাস্টমারের কাছ থেকে বিনীতভাবে চেয়ে নেবেন।
- ফোন নম্বর ভুল বা কম ডিজিটের হলে আবার সঠিক ১১ ডিজিটের নম্বর চাইবেন। ঠিকানা অসম্পূর্ণ হলে পূর্ণ বাসা/রোড/এলাকা চাইবেন।`;
};

export const CustomerServices = {
  updateCustomerProfile,
  formatOrderInformationForm,
  formatOrderSummary,
  formatMissingFieldsPrompt,
};


