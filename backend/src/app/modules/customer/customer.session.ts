import { CustomerChannelEnum } from '@prisma/client';
import { redis } from '../../libs/redis';
import prisma from '../../libs/prisma';

export interface ICartSessionItem {
  productId: string;
  productName: string;
  weight: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICustomerSession {
  customerId: string;
  name: string | null;
  phone: string | null;
  district: string | null;
  thana: string | null;
  fullAddress: string | null;
  linkedChannels?: CustomerChannelEnum[];
  cart: {
    cartId: string | null;
    items: ICartSessionItem[];
    productTotal: number;
    deliveryCharge: number;
    finalTotal: number;
  };
  missingFields: Array<'name' | 'phone' | 'fullAddress' | 'district' | 'items'>;
  lastActive: string;
}

const SESSION_TTL_SECONDS = 86400; // 24 hours

const getSessionKey = (customerId: string) => `session:${customerId}`;

/**
 * Calculate delivery charge based on district
 * Inside Dhaka = 60, Outside Dhaka = 120 (Single charge per order)
 */
export const calculateDeliveryCharge = (
  district?: string | null,
  hasItems = false,
): number => {
  if (!hasItems) return 0;
  if (!district) return 60; // Default estimation inside Dhaka

  const clean = district.toLowerCase().trim();
  if (clean.includes('dhaka') || clean.includes('ঢাকা')) {
    return 60;
  }
  return 120;
};

/**
 * Compute missing required fields for order placement
 */
export const computeMissingFields = (
  session: Partial<ICustomerSession>,
): Array<'name' | 'phone' | 'fullAddress' | 'district' | 'items'> => {
  const missing: Array<'name' | 'phone' | 'fullAddress' | 'district' | 'items'> = [];

  const items = session.cart?.items || [];
  if (items.length === 0) {
    missing.push('items');
  }

  if (!session.name || session.name.trim().length < 2) {
    missing.push('name');
  }

  // Validate Bangladesh 11-digit phone number
  const phone = session.phone ? session.phone.replace(/[\s-+]/g, '') : '';
  const isValidBdPhone = /^(?:8801|01)[3-9]\d{8}$/.test(phone);
  if (!isValidBdPhone) {
    missing.push('phone');
  }

  if (!session.district || session.district.trim().length < 2) {
    missing.push('district');
  }

  if (!session.fullAddress || session.fullAddress.trim().length < 5) {
    missing.push('fullAddress');
  }

  return missing;
};

/**
 * Hydrate customer session directly from PostgreSQL (Prisma)
 */
const hydrateSessionFromDb = async (
  customerId: string,
): Promise<ICustomerSession> => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      channelUsers: true,
      carts: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: {
          items: {
            include: { product: true },
          },
        },
      },
    },
  });

  const activeCart = customer?.carts?.[0];
  const items: ICartSessionItem[] = (activeCart?.items || []).map((ci) => ({
    productId: ci.productId,
    productName: ci.product.name,
    weight: ci.product.weight,
    quantity: ci.quantity,
    unitPrice: ci.unitPrice,
    totalPrice: ci.quantity * ci.unitPrice,
  }));

  const productTotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
  const deliveryCharge = calculateDeliveryCharge(
    customer?.district,
    items.length > 0,
  );
  const finalTotal = productTotal + deliveryCharge;

  const baseSession: Partial<ICustomerSession> = {
    customerId,
    name: customer?.name || null,
    phone: customer?.phone || null,
    district: customer?.district || null,
    thana: customer?.thana || null,
    fullAddress: customer?.fullAddress || null,
    linkedChannels: customer?.channelUsers?.map((cu) => cu.channel) || [],
    cart: {
      cartId: activeCart?.id || null,
      items,
      productTotal,
      deliveryCharge,
      finalTotal,
    },
  };

  const session: ICustomerSession = {
    ...(baseSession as any),
    missingFields: computeMissingFields(baseSession),
    lastActive: new Date().toISOString(),
  };

  await saveSession(session);
  return session;
};

/**
 * Retrieve session from Redis cache or fallback to database hydration
 */
const getSession = async (customerId: string): Promise<ICustomerSession> => {
  try {
    const raw = await redis.get(getSessionKey(customerId));
    if (raw) {
      return JSON.parse(raw) as ICustomerSession;
    }
  } catch (err) {
    // If Redis is temporarily unreachable, fallback gracefully to database
  }

  return await hydrateSessionFromDb(customerId);
};

/**
 * Save updated session to Redis cache
 */
const saveSession = async (session: ICustomerSession): Promise<void> => {
  try {
    session.missingFields = computeMissingFields(session);
    session.lastActive = new Date().toISOString();
    await redis.set(
      getSessionKey(session.customerId),
      JSON.stringify(session),
      'EX',
      SESSION_TTL_SECONDS,
    );
  } catch (err) {
    // Non-blocking Redis failure
  }
};

/**
 * Clear customer session from Redis
 */
const clearSession = async (customerId: string): Promise<void> => {
  try {
    await redis.del(getSessionKey(customerId));
  } catch (err) {
    // Non-blocking
  }
};

/**
 * Clear only the active cart in customer session while preserving personal info
 */
const clearSessionCart = async (customerId: string): Promise<ICustomerSession> => {
  const session = await getSession(customerId);
  session.cart = {
    cartId: null,
    items: [],
    productTotal: 0,
    deliveryCharge: 0,
    finalTotal: 0,
  };
  await saveSession(session);
  return session;
};

export const CustomerSession = {
  getSession,
  saveSession,
  clearSession,
  clearSessionCart,
  hydrateSessionFromDb,
  calculateDeliveryCharge,
  computeMissingFields,
};

