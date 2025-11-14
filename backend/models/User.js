import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: 'Poll enthusiast and community contributor',
    maxlength: 200
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    allowMessages: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalPollsCreated: {
      type: Number,
      default: 0
    },
    totalVotesReceived: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Update stats when user creates a poll
userSchema.methods.incrementPollsCount = function() {
  this.stats.totalPollsCreated += 1;
  this.stats.lastActive = new Date();
  return this.save();
};

// Update stats when user's poll receives a vote
userSchema.methods.incrementVotesCount = function(votes = 1) {
  this.stats.totalVotesReceived += votes;
  return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

export default mongoose.model('User', userSchema);