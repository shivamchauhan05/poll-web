import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import Poll from '../models/Poll.js';
import User from '../models/User.js';

const router = express.Router();

// Get all polls (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const polls = await Poll.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar bio')
      .populate('comments.author', 'name avatar');

    const total = await Poll.countDocuments({ isActive: true });

    res.json({
      polls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPolls: total
    });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Get user's polls
router.get('/my-polls', authMiddleware, async (req, res) => {
  try {
    const polls = await Poll.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');

    res.json(polls);
  } catch (error) {
    console.error('Get user polls error:', error);
    res.status(500).json({ error: 'Failed to fetch your polls' });
  }
});

// Create new poll with image upload
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { question, options } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Poll question is required' });
    }

    if (!options) {
      return res.status(400).json({ error: 'Poll options are required' });
    }

    // Parse options
    let optionsArray;
    try {
      if (typeof options === 'string') {
        optionsArray = JSON.parse(options);
      } else if (Array.isArray(options)) {
        optionsArray = options;
      } else {
        return res.status(400).json({ error: 'Invalid options format' });
      }
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid options format' });
    }

    // Validate options
    if (optionsArray.length < 2) {
      return res.status(400).json({ error: 'Poll must have at least 2 options' });
    }

    if (optionsArray.length > 4) {
      return res.status(400).json({ error: 'Poll cannot have more than 4 options' });
    }

    // Check for empty options and duplicates
    const validOptions = optionsArray.map(opt => opt.trim()).filter(opt => opt.length > 0);
    if (validOptions.length < 2) {
      return res.status(400).json({ error: 'Poll must have at least 2 valid options' });
    }

    const uniqueOptions = [...new Set(validOptions)];
    if (uniqueOptions.length !== validOptions.length) {
      return res.status(400).json({ error: 'Poll options must be unique' });
    }

    const pollData = {
      question: question.trim(),
      options: validOptions.map(opt => ({ text: opt })),
      author: req.user.id
    };

    // Add image URL if file was uploaded
    if (req.file) {
      pollData.image = `/uploads/${req.file.filename}`;
    }

    const poll = new Poll(pollData);
    await poll.save();
    
    // Update user's poll count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPollsCreated': 1 },
      'stats.lastActive': new Date()
    });

    await poll.populate('author', 'name avatar');
    
    res.status(201).json({
      ...poll.toObject(),
      message: 'Poll created successfully'
    });
    
  } catch (error) {
    console.error('Create poll error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Poll with this question already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create poll. Please try again.' });
  }
});

// Vote on a poll
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    
    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ error: 'Option index is required' });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'This poll is no longer active' });
    }

    if (poll.isExpired) {
      return res.status(400).json({ error: 'This poll has expired' });
    }

    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option selected' });
    }

    // Use the vote method with user tracking
    await poll.vote(optionIndex, req.user.id);
    
    // Update author's vote count
    await User.findByIdAndUpdate(poll.author, {
      $inc: { 'stats.totalVotesReceived': 1 }
    });

    await poll.populate('author', 'name avatar');
    await poll.populate('comments.author', 'name avatar');
    
    res.json({
      ...poll.toObject(),
      message: 'Vote recorded successfully'
    });
    
  } catch (error) {
    console.error('Vote error:', error);
    
    if (error.message === 'You have already voted in this poll') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'Invalid option index') {
      return res.status(400).json({ error: 'Invalid option selected' });
    }
    
    res.status(500).json({ error: 'Failed to record vote. Please try again.' });
  }
});

// Get single poll
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .populate('voters', 'name');
    
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }
    
    res.json(poll);
  } catch (err) {
    console.error('Get single poll error:', err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({ error: "Poll not found" });
    }
    
    res.status(500).json({ error: "Failed to fetch poll" });
  }
});

// Update poll with image
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { question, options } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if user is the author
    if (poll.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this poll' });
    }

    // Check if poll has votes (prevent editing if votes exist)
    if (poll.totalVotes > 0) {
      return res.status(400).json({ error: 'Cannot edit poll that has received votes' });
    }

    // Update poll fields
    if (question && question.trim()) {
      poll.question = question.trim();
    }

    if (options) {
      let optionsArray;
      try {
        if (typeof options === 'string') {
          optionsArray = JSON.parse(options);
        } else if (Array.isArray(options)) {
          optionsArray = options;
        } else {
          return res.status(400).json({ error: 'Invalid options format' });
        }
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid options format' });
      }

      // Validate options
      if (optionsArray.length < 2 || optionsArray.length > 4) {
        return res.status(400).json({ error: 'Poll must have between 2 and 4 options' });
      }

      // Check for empty options and duplicates
      const validOptions = optionsArray.map(opt => opt.trim()).filter(opt => opt.length > 0);
      if (validOptions.length < 2) {
        return res.status(400).json({ error: 'Poll must have at least 2 valid options' });
      }

      const uniqueOptions = [...new Set(validOptions)];
      if (uniqueOptions.length !== validOptions.length) {
        return res.status(400).json({ error: 'Poll options must be unique' });
      }

      poll.options = validOptions.map(opt => ({ 
        text: opt, 
        votes: 0
      }));
    }

    // Update image if new file uploaded
    if (req.file) {
      poll.image = `/uploads/${req.file.filename}`;
    }

    await poll.save();
    await poll.populate('author', 'name avatar');
    await poll.populate('comments.author', 'name avatar');
    
    res.json({
      ...poll.toObject(),
      message: 'Poll updated successfully'
    });
    
  } catch (err) {
    console.error('Edit poll error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update poll. Please try again.' });
  }
});

// Delete poll
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const poll = await Poll.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found or you are not authorized to delete it' });
    }

    await Poll.findByIdAndDelete(req.params.id);
    
    // Decrement user's poll count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPollsCreated': -1 }
    });

    res.json({ 
      message: 'Poll deleted successfully',
      deletedPollId: req.params.id
    });
    
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ error: 'Failed to delete poll. Please try again.' });
  }
});

// Like/Unlike a poll
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await poll.toggleLike(req.user.id);
    
    // Populate necessary fields
    await poll.populate('author', 'name avatar');
    await poll.populate('comments.author', 'name avatar');
    
    res.json({
      ...poll.toObject(),
      message: poll.likes.includes(req.user.id) ? 'Poll liked' : 'Poll unliked'
    });
    
  } catch (err) {
    console.error('Like error:', err);
    
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.status(500).json({ error: 'Failed to update like. Please try again.' });
  }
});

// Add comment to poll
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await poll.addComment(text.trim(), req.user.id);
    
    // Populate necessary fields
    await poll.populate('author', 'name avatar');
    await poll.populate('comments.author', 'name avatar');
    
    res.json({
      ...poll.toObject(),
      message: 'Comment added successfully'
    });
    
  } catch (err) {
    console.error('Comment error:', err);
    
    if (err.message === 'Comment text is required') {
      return res.status(400).json({ error: err.message });
    }
    
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.status(500).json({ error: 'Failed to add comment. Please try again.' });
  }
});

// Delete comment from poll
router.delete('/:pollId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await poll.removeComment(req.params.commentId, req.user.id);
    
    // Populate necessary fields
    await poll.populate('author', 'name avatar');
    await poll.populate('comments.author', 'name avatar');
    
    res.json({
      ...poll.toObject(),
      message: 'Comment deleted successfully'
    });
    
  } catch (err) {
    console.error('Delete comment error:', err);
    
    if (err.message === 'Comment not found or unauthorized') {
      return res.status(403).json({ error: err.message });
    }
    
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'Poll or comment not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete comment. Please try again.' });
  }
});

export default router;