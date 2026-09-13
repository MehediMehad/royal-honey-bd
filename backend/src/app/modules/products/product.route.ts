import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductControllers } from './product.controller';
import { ProductValidations } from './product.validation';

const router = express.Router();

router.get('/', ProductControllers.getAllProducts);

router.get(
  '/low-stock',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ProductControllers.getLowStockProducts,
);

router.get('/:id', ProductControllers.getProductById);

router.post(
  '/',
  auth(AdminRoleEnum.OWNER),
  validateRequest(ProductValidations.createProductSchema),
  ProductControllers.createProduct,
);

router.patch(
  '/:id',
  auth(AdminRoleEnum.OWNER),
  validateRequest(ProductValidations.updateProductSchema),
  ProductControllers.updateProduct,
);

router.post(
  '/:id/restock',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  validateRequest(ProductValidations.restockProductSchema),
  ProductControllers.restockProduct,
);

router.delete(
  '/:id',
  auth(AdminRoleEnum.OWNER),
  ProductControllers.deleteProduct,
);

export const ProductRoutes = router;
