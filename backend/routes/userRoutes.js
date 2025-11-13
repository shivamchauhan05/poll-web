import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-googleId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, location, website, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name, 
        bio, 
        location, 
        website,
        preferences: preferences || {}
      },
      { new: true, runValidators: true }
    ).select('-googleId');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('stats');
    res.json(user.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's polls with pagination
router.get('/polls', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const Poll = mongoose.model('Poll');
    const polls = await Poll.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar');

    const total = await Poll.countDocuments({ author: req.user.id });

    res.json({
      polls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPolls: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;