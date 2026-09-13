import type { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../libs/prisma';
import type {
  ICreateProductPayload,
  IPaginationOptions,
  IProductFilterRequest,
  IRestockProductPayload,
  IUpdateProductPayload,
} from './product.interface';

const getAllProducts = async (
  filters: IProductFilterRequest,
  options: IPaginationOptions,
) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 20);
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const { searchTerm, isAvailable, minPrice, maxPrice } = filters;

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (isAvailable !== undefined) {
    const availableBool = isAvailable === 'true' || isAvailable === true;
    andConditions.push({ isAvailable: availableBool });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: Prisma.FloatFilter = {};
    if (minPrice !== undefined) priceFilter.gte = Number(minPrice);
    if (maxPrice !== undefined) priceFilter.lte = Number(maxPrice);
    andConditions.push({ price: priceFilter });
  }

  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.product.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      restockLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  return product;
};

const createProduct = async (payload: ICreateProductPayload) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: payload.id },
  });

  if (existingProduct) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Product with ID "${payload.id}" already exists`,
    );
  }

  const product = await prisma.product.create({
    data: {
      id: payload.id,
      name: payload.name,
      price: payload.price,
      weight: payload.weight,
      stockCount: payload.stockCount ?? 100,
      minThreshold: payload.minThreshold ?? 10,
      description: payload.description,
      isAvailable: payload.isAvailable ?? true,
      imageUrl: payload.imageUrl,
    },
  });

  return product;
};

const updateProduct = async (id: string, payload: IUpdateProductPayload) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: payload,
  });

  return updatedProduct;
};

const restockProduct = async (
  id: string,
  payload: IRestockProductPayload,
  restockedBy?: string,
) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const previousStock = product.stockCount;
  const newStock = previousStock + payload.quantityAdded;
  const shouldResetAlert = newStock > product.minThreshold;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        stockCount: newStock,
        lowStockAlertSent: shouldResetAlert ? false : product.lowStockAlertSent,
      },
    });

    const log = await tx.restockLog.create({
      data: {
        productId: id,
        quantityAdded: payload.quantityAdded,
        previousStock,
        newStock,
        restockedBy: restockedBy || null,
        note: payload.note || null,
      },
    });

    return { product: updated, restockLog: log };
  });

  try {
    const { emitSocketEvent } = await import('../../libs/socket');
    emitSocketEvent('inventory:low_stock', {
      productId: result.product.id,
      productName: result.product.name,
      remainingStock: result.product.stockCount,
      minThreshold: result.product.minThreshold,
      restocked: true,
    });
  } catch (socketErr) {
    console.warn('⚠️ [Socket.io] Failed to emit restock update:', socketErr);
  }

  return result;
};

const getLowStockProducts = async () => {
  const products = await prisma.$queryRaw<any[]>`
    SELECT * FROM "products"
    WHERE "isAvailable" = true AND "stockCount" <= "minThreshold"
    ORDER BY "stockCount" ASC
  `;

  return products;
};

const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  await prisma.product.delete({
    where: { id },
  });

  return { message: 'Product deleted successfully' };
};

export const ProductServices = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  restockProduct,
  getLowStockProducts,
  deleteProduct,
};
