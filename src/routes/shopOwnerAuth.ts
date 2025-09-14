import { Router } from 'express';
import { shopOwnerLogin, shopOwnerLogout, verifyShopOwnerToken } from '../controllers/shopOwnerAuthController';

const router = Router();

// Public routes (no authentication required)
router.post('/login', shopOwnerLogin);
router.post('/logout', shopOwnerLogout);
router.get('/verify', verifyShopOwnerToken);

export default router;
