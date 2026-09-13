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

