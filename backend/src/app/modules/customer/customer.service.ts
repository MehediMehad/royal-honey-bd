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
    return 'গ্রাহকের নাম, ফোন নম্বর, জেলা, ঠিকানা ও পণ্যের তথ্য সম্পূর্ণ পাওয়া গেছে। এখন মধুর নাম, ডেলিভারি চার্জসহ মোট বিল সুন্দরভাবে সাজিয়ে ক্যাশ অন ডেলিভারি বা বিকাশ/নগদ পেমেন্ট কনফার্মেশনের জন্য মিষ্টি করে বলুন।';
  }

  const fieldLabels: Record<string, string> = {
    items: 'কোন মধু কতটুকু লাগবে',
    name: 'নাম',
    phone: 'মোবাইল নম্বর',
    district: 'জেলা',
    fullAddress: 'ডেলিভারি ঠিকানা',
  };

  const missingLabels = missingFields.map((f) => fieldLabels[f]);

  return `[সিস্টেম নোট]: অর্ডারের জন্য এখনো বাকি: ${missingLabels.join(', ')}। কাস্টমার যদি শুধু দাম বা বিস্তারিত জানতে চান, তবে পণ্যের গুণাগুণ ও দাম বলুন এবং তিনি নিতে চান কি না জিজ্ঞেস করুন। কাস্টমার অর্ডার করতে চাইলে বা নাম/ঠিকানা দিলে শুধুমাত্র বাকি তথ্যগুলো মানুষের মতো স্বাভাবিক ও মিষ্টি ভাষায় চেয়ে নিন।`;
};

export const CustomerServices = {
  updateCustomerProfile,
  formatMissingFieldsPrompt,
};

