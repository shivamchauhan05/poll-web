import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
});

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  options: [optionSchema],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Image field added
  image: {
    type: String, // URL of the uploaded image
    default: null
  },
  // Vote tracking
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Vote method with voter tracking
pollSchema.methods.vote = function(optionIndex, userId) {
  if (this.voters.includes(userId)) {
    throw new Error('You have already voted in this poll');
  }

  if (optionIndex >= 0 && optionIndex < this.options.length) {
    this.options[optionIndex].votes += 1;
    this.totalVotes += 1;
    this.voters.push(userId);
    return this.save();
  }
  throw new Error('Invalid option index');
};

// Like/Unlike poll
pollSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex > -1) {
    // Unlike - remove user from likes array
    this.likes.splice(likeIndex, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
  } else {
    // Like - add user to likes array
    this.likes.push(userId);
    this.likesCount += 1;
  }
  
  return this.save();
};

// Add comment to poll
pollSchema.methods.addComment = function(text, authorId) {
  if (!text || text.trim() === '') {
    throw new Error('Comment text is required');
  }
  
  const newComment = {
    text: text.trim(),
    author: authorId
  };
  
  this.comments.push(newComment);
  this.commentsCount += 1;
  
  return this.save();
};

// Remove comment from poll
pollSchema.methods.removeComment = function(commentId, userId) {
  const commentIndex = this.comments.findIndex(
    comment => comment._id.toString() === commentId && 
    comment.author.toString() === userId
  );
  
  if (commentIndex === -1) {
    throw new Error('Comment not found or unauthorized');
  }
  
  this.comments.splice(commentIndex, 1);
  this.commentsCount = Math.max(0, this.commentsCount - 1);
  
  return this.save();
};

// Check if user has voted
pollSchema.methods.hasVoted = function(userId) {
  return this.voters.includes(userId);
};

// Check if user has liked the poll
pollSchema.methods.hasLiked = function(userId) {
  return this.likes.includes(userId);
};

// Virtual for checking if poll is expired
pollSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Virtual for active status (considers both isActive and expiration)
pollSchema.virtual('isActivePoll').get(function() {
  return this.isActive && !this.isExpired;
});

// Middleware to update counts before save
pollSchema.pre('save', function(next) {
  // Ensure counts are in sync with arrays
  if (this.isModified('likes')) {
    this.likesCount = this.likes.length;
  }
  
  if (this.isModified('comments')) {
    this.commentsCount = this.comments.length;
  }
  
  next();
});

// Index for better performance
pollSchema.index({ author: 1, createdAt: -1 });
pollSchema.index({ likesCount: -1 });
pollSchema.index({ commentsCount: -1 });
pollSchema.index({ expiresAt: 1 });
pollSchema.index({ voters: 1 });

export default mongoose.model('Poll', pollSchema);