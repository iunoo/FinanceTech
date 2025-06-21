import express from 'express';
import Debt from '../models/Debt.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all debts for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.userId })
      .sort({ dueDate: 1, createdAt: -1 });
    
    res.json(debts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create debt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const debt = new Debt({
      ...req.body,
      userId: req.userId
    });
    
    await debt.save();
    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update debt
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete debt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    res.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark debt as paid
router.patch('/:id/paid', authenticateToken, async (req, res) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isPaid: true },
      { new: true }
    );
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }
    
    res.json(debt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming debts
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const upcomingDebts = await Debt.find({
      userId: req.userId,
      isPaid: false,
      dueDate: {
        $gte: new Date(),
        $lte: threeDaysFromNow
      }
    }).sort({ dueDate: 1 });
    
    res.json(upcomingDebts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;