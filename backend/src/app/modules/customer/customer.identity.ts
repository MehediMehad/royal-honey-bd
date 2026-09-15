import { CustomerChannelEnum, ConversationStatus } from '@prisma/client';
import prisma from '../../libs/prisma';
import { CustomerSession } from './customer.session';
import type { IProcessMessageJob } from '../chat/chat.interface';

/**
 * Standardize any Bangladeshi phone input into 11-digit format: 01[3-9]XXXXXXXX
 */
export const normalizeBdPhone = (rawPhone?: string | null): string | null => {
  if (!rawPhone) return null;

  // Remove spaces, hyphens, plus signs, brackets
  const clean = rawPhone.replace(/[\s\-+()]/g, '');

  let candidate = clean;
  if (candidate.startsWith('880')) {
    candidate = candidate.slice(2);
  } else if (candidate.startsWith('00880')) {
    candidate = candidate.slice(4);
  }

  // Ensure it has 11 digits starting with 01
  if (candidate.length > 11 && candidate.includes('01')) {
    const idx = candidate.indexOf('01');
    candidate = candidate.slice(idx, idx + 11);
  }

  if (/^01[3-9]\d{8}$/.test(candidate)) {
    return candidate;
  }

  return null;
};

/**
 * Merge two customer records atomically:
 * Merges sourceCustomerId into targetCustomerId, consolidating channelUsers,
 * conversations, orders, active carts, and customer profile details.
 */
export const mergeCustomerIdentities = async (
  sourceCustomerId: string,
  targetCustomerId: string,
): Promise<{ unifiedCustomerId: string }> => {
  if (sourceCustomerId === targetCustomerId) {
    return { unifiedCustomerId: targetCustomerId };
  }

  console.log(
    `🔀 [CustomerIdentity] Merging customer ${sourceCustomerId} into unified customer ${targetCustomerId}...`,
  );

  await prisma.$transaction(async (tx) => {
    // 1. Fetch both customers
    const sourceCustomer = await tx.customer.findUnique({
      where: { id: sourceCustomerId },
      include: {
        channelUsers: true,
        carts: {
          include: { items: true },
        },
      },
    });

    const targetCustomer = await tx.customer.findUnique({
      where: { id: targetCustomerId },
      include: {
        channelUsers: true,
        carts: {
          include: { items: true },
        },
      },
    });

    if (!sourceCustomer || !targetCustomer) {
      console.warn('⚠️ [CustomerIdentity] Source or target customer not found during merge');
      return;
    }

    // 2. Reassign or link ChannelUsers
    for (const scu of sourceCustomer.channelUsers) {
      const existingChannel = targetCustomer.channelUsers.find(
        (tcu) => tcu.channel === scu.channel && tcu.channelId === scu.channelId,
      );
      if (!existingChannel) {
        await tx.channelUser.update({
          where: { id: scu.id },
          data: { customerId: targetCustomerId },
        });
      } else {
        // Channel duplicate: delete source duplicate
        await tx.channelUser.delete({ where: { id: scu.id } });
      }
    }

    // 3. Reassign Conversations
    await tx.conversation.updateMany({
      where: { customerId: sourceCustomerId },
      data: { customerId: targetCustomerId },
    });

    // 4. Reassign Orders
    await tx.order.updateMany({
      where: { customerId: sourceCustomerId },
      data: { customerId: targetCustomerId },
    });

    // 5. Merge Carts & CartItems
    const sourceCart = sourceCustomer.carts[0];
    let targetCart = targetCustomer.carts[0];

    if (sourceCart && sourceCart.items.length > 0) {
      if (!targetCart) {
        // Just reassign source cart to target customer
        await tx.cart.update({
          where: { id: sourceCart.id },
          data: { customerId: targetCustomerId },
        });
      } else {
        // Source cart contains items currently being actively negotiated/ordered in the chat session.
        // Clear stale abandoned items from targetCart so ancient test/abandoned items do not pollute the new order.
        await tx.cartItem.deleteMany({ where: { cartId: targetCart.id } });
        for (const sItem of sourceCart.items) {
          await tx.cartItem.create({
            data: {
              cartId: targetCart.id,
              productId: sItem.productId,
              quantity: sItem.quantity,
              unitPrice: sItem.unitPrice,
            },
          });
        }
        // Delete source cart items & cart
        await tx.cartItem.deleteMany({ where: { cartId: sourceCart.id } });
        await tx.cart.delete({ where: { id: sourceCart.id } });
      }
    }

    // 6. Merge Profile Details (Preserve existing or fill with source details)
    const updateProfile: Record<string, any> = {};
    if (!targetCustomer.name && sourceCustomer.name) {
      updateProfile.name = sourceCustomer.name;
    }
    if (!targetCustomer.district && sourceCustomer.district) {
      updateProfile.district = sourceCustomer.district;
    }
    if (!targetCustomer.thana && sourceCustomer.thana) {
      updateProfile.thana = sourceCustomer.thana;
    }
    if (!targetCustomer.fullAddress && sourceCustomer.fullAddress) {
      updateProfile.fullAddress = sourceCustomer.fullAddress;
    }

    if (Object.keys(updateProfile).length > 0) {
      await tx.customer.update({
        where: { id: targetCustomerId },
        data: updateProfile,
      });
    }

    // 7. Delete source customer record
    await tx.customer.delete({ where: { id: sourceCustomerId } });
  });

  // Invalidate Redis sessions
  try {
    await CustomerSession.clearSession(sourceCustomerId);
    await CustomerSession.getSession(targetCustomerId); // re-hydrates target
  } catch (redisErr) {
    console.warn('⚠️ [CustomerIdentity] Redis session migration note:', redisErr);
  }

  console.log(`✅ [CustomerIdentity] Successfully unified into customer ${targetCustomerId}`);
  return { unifiedCustomerId: targetCustomerId };
};

/**
 * Resolves customer and active conversation across Facebook & WhatsApp channels.
 */
export const resolveCustomerIdentity = async (
  job: IProcessMessageJob,
): Promise<{
  customer: any;
  conversation: any;
  wasCrossChannelMerged: boolean;
}> => {
  const isWhatsApp = job.channel === CustomerChannelEnum.WHATSAPP;
  const normalizedPhone = isWhatsApp ? normalizeBdPhone(job.channelId) : null;

  // 1. Look up existing ChannelUser (exact channel + channelId match)
  let channelUser = await prisma.channelUser.findUnique({
    where: {
      channel_channelId: {
        channel: job.channel,
        channelId: job.channelId,
      },
    },
    include: {
      customer: {
        include: {
          channelUsers: true,
        },
      },
    },
  });

  let customerId: string;
  let wasCrossChannelMerged = false;

  if (channelUser) {
    customerId = channelUser.customerId;

    // If WhatsApp message and customer didn't have phone, attach it
    if (isWhatsApp && normalizedPhone && !channelUser.customer.phone) {
      // Check if another customer already has this phone
      const customerWithPhone = await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
      });
      if (customerWithPhone && customerWithPhone.id !== customerId) {
        // Merge!
        await mergeCustomerIdentities(customerId, customerWithPhone.id);
        customerId = customerWithPhone.id;
        wasCrossChannelMerged = true;
      } else {
        await prisma.customer.update({
          where: { id: customerId },
          data: { phone: normalizedPhone },
        });
      }
    } else if (!channelUser.customer.name && job.senderName) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { name: job.senderName },
      });
    }
  } else {
    // 2. ChannelUser not found yet. Check if a Customer exists with this phone
    let existingCustomer = normalizedPhone
      ? await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
        include: { channelUsers: true },
      })
      : null;

    if (existingCustomer) {
      console.log(
        `🔗 [CustomerIdentity] Recognized existing customer ${existingCustomer.id} from phone ${normalizedPhone}. Linking ${job.channel}...`,
      );
      customerId = existingCustomer.id;

      // Link new channel to existing customer
      channelUser = await prisma.channelUser.create({
        data: {
          customerId,
          channel: job.channel,
          channelId: job.channelId,
        },
        include: {
          customer: {
            include: { channelUsers: true },
          },
        },
      });

      if (!existingCustomer.name && job.senderName) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { name: job.senderName },
        });
      }
      wasCrossChannelMerged = true;
    } else {
      // Create new customer and channelUser
      const newCust = await prisma.customer.create({
        data: {
          name: job.senderName || null,
          phone: normalizedPhone,
        },
      });
      customerId = newCust.id;

      channelUser = await prisma.channelUser.create({
        data: {
          customerId,
          channel: job.channel,
          channelId: job.channelId,
        },
        include: {
          customer: {
            include: { channelUsers: true },
          },
        },
      });
    }
  }

  // 3. Find or create active conversation for this channel
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId,
      channel: job.channel,
      status: { in: [ConversationStatus.AI_ACTIVE, ConversationStatus.HUMAN_TAKEOVER] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId,
        channel: job.channel,
        status: ConversationStatus.AI_ACTIVE,
      },
    });
  }

  // Fetch updated customer with all channelUsers
  const finalCustomer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { channelUsers: true },
  });

  return {
    customer: finalCustomer,
    conversation,
    wasCrossChannelMerged,
  };
};

export const CustomerIdentityService = {
  normalizeBdPhone,
  mergeCustomerIdentities,
  resolveCustomerIdentity,
};
