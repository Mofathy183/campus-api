import { Router } from 'express';
import { validateBody } from '@shared/middleware';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginSchema } from './auth.schema';

/**
 * @module features/auth/auth.routes
 * @description Mounts the auth feature's single route. Mounted at
 * `/login` in app.ts, so this router's own path is `/`.
 */
const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/', validateBody(LoginSchema), authController.login);

export const authRouter = router;
