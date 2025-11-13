import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
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
      .populate('author', 'name avatar bio');

    const total = await Poll.countDocuments({ isActive: true });

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

// Get user's polls
router.get('/my-polls', authMiddleware, async (req, res) => {
  try {
    const polls = await Poll.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');

    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new poll
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { question, options, expiresAt, tags } = req.body;

    const poll = new Poll({
      question,
      options: options.map(opt => ({ text: opt })),
      author: req.user.id,
      expiresAt,
      tags
    });

    await poll.save();
    
    // Update user's poll count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPollsCreated': 1 },
      'stats.lastActive': new Date()
    });

    await poll.populate('author', 'name avatar');
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on a poll
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (poll.isExpired) {
      return res.status(400).json({ error: 'This poll has expired' });
    }

    await poll.vote(optionIndex);
    
    // Update author's vote count
    await User.findByIdAndUpdate(poll.author, {
      $inc: { 'stats.totalVotesReceived': 1 }
    });

    await poll.populate('author', 'name avatar');
    res.json(poll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update poll
router.put('/:id', authMiddleware, async (req, res) => {
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

    // Update poll
    if (question) poll.question = question;
    if (options) {
      poll.options = options.map(opt => ({ 
        text: opt, 
        votes: 0 // Reset votes when editing options
      }));
      poll.totalVotes = 0; // Reset total votes
    }

    await poll.save();
    await poll.populate('author', 'name');
    
    res.json(poll);
  } catch (err) {
    console.error('Edit poll error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
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
      return res.status(404).json({ error: 'Poll not found' });
    }

    await Poll.findByIdAndDelete(req.params.id);
    
    // Decrement user's poll count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalPollsCreated': -1 }
    });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    await poll.populate('author', 'name');
    await poll.populate('comments.author', 'name');
    
    res.json(poll);
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Add comment to poll
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await poll.addComment(text, req.user.id);
    
    // Populate necessary fields
    await poll.populate('author', 'name');
    await poll.populate('comments.author', 'name');
    
    res.json(poll);
  } catch (err) {
    console.error('Comment error:', err);
    if (err.message === 'Comment text is required') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
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
    await poll.populate('author', 'name');
    await poll.populate('comments.author', 'name');
    
    res.json(poll);
  } catch (err) {
    console.error('Delete comment error:', err);
    if (err.message === 'Comment not found or unauthorized') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;