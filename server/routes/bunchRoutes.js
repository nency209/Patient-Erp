import express from 'express';
import { getBunches, createBunch, updateBunch, deleteBunch } from '../controller/bunchController.js';

const router = express.Router();

router.get('/', getBunches);
router.post('/', createBunch); // Create
router.put('/:id', updateBunch); // Update
router.delete('/:id', deleteBunch);

export default router;