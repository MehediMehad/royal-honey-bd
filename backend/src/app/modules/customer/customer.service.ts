import prisma from '../../libs/prisma';
import { CustomerSession, type ICustomerSession } from './customer.session';
import type { IExtractedEntities } from './customer.extractor';

/**
 * Update customer profile details and sync both PostgreSQL and Redis
 */
const updateCustomerProfile = async (
  customerId: string,
  info?: IExtractedEntities['customerInfo'],
): Promise<ICustomerSession> => {
  const session = await CustomerSession.getSession(customerId);
  if (!info) return session;

  const updateData: Record<string, any> = {};

  if (info.name && info.name.trim().length >= 2) {
    updateData.name = info.name.trim();
    session.name = updateData.name;
  }

  if (info.phone) {
    const cleanPhone = info.phone.replace(/[\s-+]/g, '');
    const validPhone = cleanPhone.startsWith('01')
      ? cleanPhone
      : cleanPhone.slice(-11);

    if (/^01[3-9]\d{8}$/.test(validPhone)) {
      updateData.phone = validPhone;
      session.phone = validPhone;
    }
  }

  if (info.district && info.district.trim().length >= 2) {
    updateData.district = info.district.trim();
    session.district = updateData.district;
  }

  if (info.thana && info.thana.trim().length >= 2) {
    updateData.thana = info.thana.trim();
    session.thana = updateData.thana;
  }

  if (info.fullAddress && info.fullAddress.trim().length >= 5) {
    updateData.fullAddress = info.fullAddress.trim();
    session.fullAddress = updateData.fullAddress;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });
  }

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
 * Describe remaining missing fields in clear, polite Bangla
 */
const formatMissingFieldsPrompt = (
  missingFields: Array<'name' | 'phone' | 'fullAddress' | 'district' | 'items'>,
): string => {
  if (missingFields.length === 0) {
    return 'সব তথ্য সম্পূর্ণ পাওয়া গেছে! অনুগ্রহ করে নিচের অর্ডারের সারসংক্ষেপ দেখে নিশ্চিত (Confirm) করুন।';
  }

  const fieldLabels: Record<string, string> = {
    items: 'কোন মধু কতটুকু নেবেন',
    name: 'আপনার নাম',
    phone: '১১ ডিজিটের মোবাইল নম্বর',
    district: 'আপনার জেলা',
    fullAddress: 'পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা)',
  };

  const missingLabels = missingFields.map((f) => fieldLabels[f]);

  if (missingFields.length === 1) {
    return `অর্ডারটি সম্পন্ন করতে অনুগ্রহ করে শুধুমাত্র **${missingLabels[0]}** প্রদান করুন।`;
  }

  return `অর্ডারটি সম্পন্ন করতে অনুগ্রহ করে নিচের তথ্যগুলো দিন:\n- ${missingLabels.join('\n- ')}`;
};

export const CustomerServices = {
  updateCustomerProfile,
  formatMissingFieldsPrompt,
};

