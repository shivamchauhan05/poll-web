import express from 'express';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
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
    
    const updateData = { 
      name, 
      bio, 
      location, 
      website
    };

    // Update preferences if provided
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-googleId');

    // Update local storage data
    const updatedUserData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website
    };

    res.json({
      user: updatedUserData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar
router.put('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-googleId');

    // Update local storage
    const updatedUserData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website
    };

    res.json({
      user: updatedUserData,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Remove avatar
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: '' },
      { new: true }
    ).select('-googleId');

    // Update local storage
    const updatedUserData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website
    };

    res.json({
      user: updatedUserData,
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences data required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true }
    ).select('-googleId');

    res.json({
      preferences: user.preferences,
      message: 'Preferences updated successfully'
    });
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
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');

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

// Delete user account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const Poll = mongoose.model('Poll');
    
    // Delete all user's polls
    await Poll.deleteMany({ author: req.user.id });
    
    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export user data
router.get('/export-data', authMiddleware, async (req, res) => {
  try {
    const Poll = mongoose.model('Poll');
    
    const user = await User.findById(req.user.id).select('-googleId');
    const polls = await Poll.find({ author: req.user.id })
      .populate('comments.author', 'name')
      .lean();

    const exportData = {
      user: user.toObject(),
      polls: polls,
      exportedAt: new Date().toISOString()
    };

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;