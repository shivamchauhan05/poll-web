import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import './PollCard.css';

export default function PollCard({ poll, onUpdate, onDelete }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = user.id === poll.author?._id;
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Check if current user has already voted
  const hasVoted = poll.voters?.includes(user.id);
  
  // Find which option user voted for
  const getUserVote = () => {
    if (!hasVoted) return null;
    
    // Backend should return which option user voted for
    // For now, we'll check local storage as fallback
    try {
      const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      return userVotes[poll._id];
    } catch (error) {
      return null;
    }
  };

  const userVotedOption = getUserVote();

  const vote = async (optionIndex) => {
    // Prevent multiple votes
    if (hasVoted || voteLoading !== null) return;
    
    setVoteLoading(optionIndex);
    try {
      const res = await api.post(`/polls/${poll._id}/vote`, { 
        optionIndex: optionIndex 
      });
      
      // Update local storage to track user's vote
      try {
        const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        userVotes[poll._id] = optionIndex;
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
      } catch (storageError) {
        console.error('Error saving vote to localStorage:', storageError);
      }
      
      onUpdate(res.data);
    } catch (err) {
      if (err.response?.data?.error === 'You have already voted in this poll') {
        alert('You have already voted in this poll!');
      } else {
        alert(err.response?.data?.error || 'Vote failed');
      }
    } finally {
      setVoteLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    
    try {
      await api.delete(`/polls/${poll._id}`);
      
      // Remove from local storage if deleted
      try {
        const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        delete userVotes[poll._id];
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
      } catch (storageError) {
        console.error('Error removing vote from localStorage:', storageError);
      }
      
      onDelete(poll._id);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await api.post(`/polls/${poll._id}/like`);
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Like failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await api.post(`/polls/${poll._id}/comment`, { 
        text: newComment 
      });
      setNewComment('');
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Comment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const pollUrl = `${window.location.origin}/poll/${poll._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.question,
          text: `Check out this poll: ${poll.question}`,
          url: pollUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(pollUrl).then(() => {
        alert('Poll link copied to clipboard!');
      });
    }
  };

  const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;

  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isLiked = poll.likes?.includes(user.id);

  return (
    <div className="poll-card">
      {/* User Header */}
      <div className="card-header">
        <div className="user-info">
          <div className="user-avatar">
            {poll.author?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{poll.author?.name || 'Anonymous User'}</div>
            <div className="post-time">{formatDate(poll.createdAt)}</div>
          </div>
        </div>
        
        {isOwner && (
          <div className="card-actions">
            <Link to={`/edit/${poll._id}`} className="action-btn">
              <span>✏️</span>
            </Link>
            <button className="action-btn" onClick={handleDelete}>
              <span>🗑️</span>
            </button>
          </div>
        )}
      </div>

      {/* Poll Content */}
      <div className="card-content">
        {/* Poll Image */}
        {poll.image && !imageError && (
          <div className="poll-image-container">
            <img 
              src={`http://localhost:5000${poll.image}`} 
              alt="Poll visual"
              className="poll-image"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        <h3 className="poll-question">{poll.question}</h3>
        
        {/* Poll Options */}
        <div className="poll-options">
          {poll.options?.map((option, index) => {
            const percentage = getVotePercentage(option.votes || 0);
            const isLeading = option.votes === Math.max(...poll.options.map(opt => opt.votes || 0)) && totalVotes > 0;
            const isUserVote = userVotedOption === index;
            
            return (
              <button
                key={index}
                className={`poll-option ${isLeading ? 'leading' : ''} ${
                  isUserVote ? 'user-vote' : ''
                } ${voteLoading === index ? 'loading' : ''}`}
                onClick={() => vote(index)}
                disabled={hasVoted || voteLoading !== null}
              >
                <div className="option-content">
                  <span className="option-text">{option.text}</span>
                  <div className="option-stats">
                    {hasVoted && (
                      <>
                        <span className="percentage">{percentage}%</span>
                        <span className="votes">({option.votes || 0})</span>
                      </>
                    )}
                    {isUserVote && (
                      <div className="user-vote-badge">✓ Your vote</div>
                    )}
                  </div>
                </div>
                
                {/* Show progress bar only after voting */}
                {hasVoted && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
                
                {isLeading && totalVotes > 0 && hasVoted && (
                  <div className="leading-badge">🔥</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Voting Status */}
        <div className="voting-status">
          {hasVoted ? (
            <div className="status-message voted">
              <span className="status-icon">✅</span>
              You've already voted in this poll • {totalVotes} total votes
            </div>
          ) : (
            <div className="status-message not-voted">
              <span className="status-icon">🗳️</span>
              Click an option to vote • {totalVotes} total votes
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="engagement-stats">
          {poll.comments?.length > 0 && (
            <span className="stat">{poll.comments.length} comments</span>
          )}
          {poll.likes?.length > 0 && (
            <span className="stat">{poll.likes.length} likes</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-actions-footer">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
          onClick={handleLike}
          disabled={loading}
        >
          <span className="action-icon">
            {loading ? '⏳' : (isLiked ? '❤️' : '🤍')}
          </span>
          <span className="action-count">{poll.likes?.length || 0}</span>
          <span className="action-text">
            {loading ? 'Loading...' : (isLiked ? 'Liked' : 'Like')}
          </span>
        </button>

        <button 
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
          disabled={loading}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{poll.comments?.length || 0}</span>
          <span className="action-text">Comment</span>
        </button>

        <button className="action-btn" onClick={handleShare}>
          <span className="action-icon">🔗</span>
          <span className="action-text">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {poll.comments?.map((comment, index) => (
              <div key={index} className="comment-item">
                <div className="comment-avatar">
                  {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author?.name || 'Anonymous'}</span>
                    <span className="comment-time">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
            {(!poll.comments || poll.comments.length === 0) && (
              <div className="no-comments">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
          
          <div className="comment-input">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              disabled={loading}
            />
            <button 
              onClick={handleAddComment} 
              disabled={loading || !newComment.trim()}
              className="comment-submit"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}