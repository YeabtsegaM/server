import express from 'express';
import { searchSlips } from '../controllers/slipController';

const router = express.Router();

// POST /api/slips/search - Admin search for slip details
router.post('/search', searchSlips);

export default router;
