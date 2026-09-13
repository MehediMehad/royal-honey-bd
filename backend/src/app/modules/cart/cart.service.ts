import prisma from '../../libs/prisma';
import {
  CustomerSession,
  calculateDeliveryCharge,
  type ICartSessionItem,
  type ICustomerSession,
} from '../customer/customer.session';
import type { ICartModificationResult } from './cart.interface';

/**
 * Match product by exact ID or fuzzy keywords
 */
export const findProductByKeyword = async (keywordOrId: string) => {
  const clean = keywordOrId.toLowerCase().trim();

  // Try direct ID match first
  let product = await prisma.product.findUnique({
    where: { id: clean },
  });
  if (product) return product;

  // Search by name or description
  product = await prisma.product.findFirst({
    where: {
      isAvailable: true,
      OR: [
        { name: { contains: clean, mode: 'insensitive' } },
        { id: { contains: clean, mode: 'insensitive' } },
        { description: { contains: clean, mode: 'insensitive' } },
      ],
    },
  });

  if (product) return product;

  // Bangla keyword mapping
  if (clean.includes('সুন্দরবন') || clean.includes('sundarban')) {
    const is1kg = clean.includes('1') || clean.includes('১') || clean.includes('কেজি') || clean.includes('kg');
    return await prisma.product.findUnique({
      where: { id: is1kg ? 'sundarban_1kg' : 'sundarban_500g' },
    });
  }

  if (clean.includes('সরিষা') || clean.includes('mustard')) {
    const is1kg = clean.includes('1') || clean.includes('১') || clean.includes('কেজি') || clean.includes('kg');
    return await prisma.product.findUnique({
      where: { id: is1kg ? 'mustard_1kg' : 'mustard_500g' },
    });
  }

  if (clean.includes('কালোজিরা') || clean.includes('black_seed')) {
    const is1kg = clean.includes('1') || clean.includes('১') || clean.includes('কেজি') || clean.includes('kg');
    return await prisma.product.findUnique({
      where: { id: is1kg ? 'black_seed_1kg' : 'black_seed_500g' },
    });
  }

  return null;
};

const getOrCreateActiveCart = async (customerId: string) => {
  let cart = await prisma.cart.findFirst({
    where: { customerId },
    orderBy: { updatedAt: 'desc' },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { customerId },
    });
  }

  return cart;
};

const buildCartOutput = async (
  cartId: string,
  district?: string | null,
): Promise<{
  cartId: string;
  items: ICartSessionItem[];
  productTotal: number;
  deliveryCharge: number;
  finalTotal: number;
}> => {
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  const items: ICartSessionItem[] = cartItems.map((ci) => ({
    productId: ci.productId,
    productName: ci.product.name,
    weight: ci.product.weight,
    quantity: ci.quantity,
    unitPrice: ci.unitPrice,
    totalPrice: ci.quantity * ci.unitPrice,
  }));

  const productTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryCharge = calculateDeliveryCharge(district, items.length > 0);
  const finalTotal = productTotal + deliveryCharge;

  return {
    cartId,
    items,
    productTotal,
    deliveryCharge,
    finalTotal,
  };
};

const addItemToCart = async (
  customerId: string,
  productIdOrKeyword: string,
  quantity = 1,
  district?: string | null,
): Promise<ICartModificationResult> => {
  const product = await findProductByKeyword(productIdOrKeyword);
  if (!product) {
    return {
      success: false,
      message: `দুঃখিত, "${productIdOrKeyword}" নামের কোনো মধু পাওয়া যায়নি।`,
      cart: { cartId: null, items: [], productTotal: 0, deliveryCharge: 0, finalTotal: 0 },
    };
  }

  if (product.stockCount <= 0) {
    return {
      success: false,
      message: `দুঃখিত, ${product.name} বর্তমানে স্টক আউট।`,
      stockWarning: 'STOCK_OUT',
      cart: { cartId: null, items: [], productTotal: 0, deliveryCharge: 0, finalTotal: 0 },
    };
  }

  const cart = await getOrCreateActiveCart(customerId);
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: product.id,
      },
    },
  });

  const targetQuantity = (existingItem?.quantity || 0) + quantity;
  let finalQty = targetQuantity;
  let stockWarning: string | undefined;

  if (targetQuantity > product.stockCount) {
    finalQty = product.stockCount;
    stockWarning = `স্টকে মাত্র ${product.stockCount} টি থাকায় সর্বোচ্চ পরিমাণ যোগ করা হয়েছে।`;
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: product.id,
      },
    },
    update: {
      quantity: finalQty,
      unitPrice: product.price,
    },
    create: {
      cartId: cart.id,
      productId: product.id,
      quantity: finalQty,
      unitPrice: product.price,
    },
  });

  const cartData = await buildCartOutput(cart.id, district);

  // Sync to Redis Session
  const session = await CustomerSession.getSession(customerId);
  session.cart = cartData;
  await CustomerSession.saveSession(session);

  return {
    success: true,
    message: `${product.name} (${product.weight}) কার্টে যোগ করা হয়েছে।`,
    stockWarning,
    cart: cartData,
  };
};

const updateItemQuantity = async (
  customerId: string,
  productIdOrKeyword: string,
  newQuantity: number,
  district?: string | null,
): Promise<ICartModificationResult> => {
  const product = await findProductByKeyword(productIdOrKeyword);
  if (!product) {
    return {
      success: false,
      message: `দুঃখিত, "${productIdOrKeyword}" মধু পাওয়া যায়নি।`,
      cart: { cartId: null, items: [], productTotal: 0, deliveryCharge: 0, finalTotal: 0 },
    };
  }

  const cart = await getOrCreateActiveCart(customerId);

  if (newQuantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: product.id,
      },
    });
  } else {
    let finalQty = newQuantity;
    let stockWarning: string | undefined;

    if (newQuantity > product.stockCount) {
      finalQty = product.stockCount;
      stockWarning = `স্টকে মাত্র ${product.stockCount} টি অবশিষ্ট আছে।`;
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      update: {
        quantity: finalQty,
        unitPrice: product.price,
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity: finalQty,
        unitPrice: product.price,
      },
    });

    const cartData = await buildCartOutput(cart.id, district);
    const session = await CustomerSession.getSession(customerId);
    session.cart = cartData;
    await CustomerSession.saveSession(session);

    return {
      success: true,
      message: `${product.name}-এর পরিমাণ পরিবর্তন করে ${finalQty} টি করা হয়েছে।`,
      stockWarning,
      cart: cartData,
    };
  }

  const cartData = await buildCartOutput(cart.id, district);
  const session = await CustomerSession.getSession(customerId);
  session.cart = cartData;
  await CustomerSession.saveSession(session);

  return {
    success: true,
    message: `${product.name} কার্ট থেকে মুছে ফেলা হয়েছে।`,
    cart: cartData,
  };
};

const removeItemFromCart = async (
  customerId: string,
  productIdOrKeyword: string,
  district?: string | null,
): Promise<ICartModificationResult> => {
  return await updateItemQuantity(customerId, productIdOrKeyword, 0, district);
};

const clearCart = async (customerId: string): Promise<void> => {
  const cart = await prisma.cart.findFirst({
    where: { customerId },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  const session = await CustomerSession.getSession(customerId);
  session.cart = {
    cartId: cart?.id || null,
    items: [],
    productTotal: 0,
    deliveryCharge: 0,
    finalTotal: 0,
  };
  await CustomerSession.saveSession(session);
};

/**
 * Format clean, beautiful Bangla Cart Summary Card
 */
const formatCartSummary = (
  cart: ICustomerSession['cart'],
  district?: string | null,
): string => {
  if (!cart || cart.items.length === 0) {
    return '【🛒 কার্ট খালি: বর্তমানে কোনো পণ্য যোগ করা নেই】';
  }

  const itemLines = cart.items.map(
    (item: ICartSessionItem, idx: number) =>
      `${idx + 1}. ${item.productName} (${item.weight}) x ${item.quantity} = ৳${item.totalPrice.toLocaleString('bn-BD')}`,
  );

  const isDhaka = district?.toLowerCase().includes('dhaka') || district?.includes('ঢাকা');
  const deliveryText = district
    ? `৳${cart.deliveryCharge.toLocaleString('bn-BD')} (${isDhaka ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})`
    : `৳${cart.deliveryCharge.toLocaleString('bn-BD')} (ঢাকার ভেতরে ৬০ / বাইরে ১২০)`;

  return `【🛒 আপনার বর্তমান কার্ট বিবরণী】
${itemLines.join('\n')}
─────────────────────────
পণ্য সর্বমোট: ৳${cart.productTotal.toLocaleString('bn-BD')}
ডেলিভারি চার্জ: ${deliveryText}
সর্বমোট প্রদেয়: ৳${cart.finalTotal.toLocaleString('bn-BD')}`;
};

export const CartServices = {
  getOrCreateActiveCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  formatCartSummary,
  findProductByKeyword,
};
