import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthControllers } from './auth.controller';
import { AuthValidations } from './auth.validation';

const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidations.loginSchema),
  AuthControllers.loginAdmin,
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidations.refreshTokenSchema),
  AuthControllers.refreshToken,
);

router.get('/me', auth(), AuthControllers.getMyProfile);

router.post('/logout', auth(), AuthControllers.logoutAdmin);

export const AuthRoutes = router;

