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

  const vote = async (index) => {
    try {
      const res = await api.post(`/polls/${poll._id}/vote`, { optionIndex: index });
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Vote failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await api.delete(`/polls/${poll._id}`);
      onDelete(poll._id);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log("hello")
      const res = await api.post(`/polls/${poll._id}/like`);
      console.log(res)
      onUpdate(res.data);
    } catch (err) {
      console.error('Like error:', err);
      alert(err.response?.data?.error || 'Like failed. Please try again.');
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
      console.error('Comment error:', err);
      alert(err.response?.data?.error || 'Comment failed. Please try again.');
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

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);

  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatDate = (dateString) => {
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
    <div className="poll-container">
      {/* User Info - TOP SECTION */}
      <div className="user-header">
        <div className="user-avatar">
          {poll.author?.name?.charAt(0) || 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{poll.author?.name || 'Anonymous User'}</div>
          <div className="post-time">{formatDate(poll.createdAt)}</div>
        </div>
        {isOwner && (
          <div className="user-actions">
            <Link to={`/edit/${poll._id}`}className="action-btn edit-btn">
              <span>✏️</span>
            </Link>
            <button className="action-btn delete-btn" onClick={handleDelete}>
              <span>🗑️</span>
            </button>
          </div>
        )}
      </div>

      {/* Poll Card - BELOW USER INFO */}
      <div className="poll-card">
        {/* Poll Question */}
        <div className="poll-question-section">
          <h3 className="poll-question">{poll.question}</h3>
          <div className="poll-stats">
            <span className="stat-item">
              <span className="stat-icon">📊</span>
              {totalVotes} votes
            </span>
         { /*  <span className="stat-item">
              <span className="stat-icon">💬</span>
              {poll.comments?.length || 0} comments
            </span>
            <span className="stat-item">
              <span className="stat-icon">❤️</span>
              {poll.likes?.length || 0} likes
            </span>*/}
          </div>
        </div>

        {/* Poll Options */}
        <div className="poll-options">
          {poll.options.map((option, index) => {
            const percentage = getVotePercentage(option.votes || 0);
            const isLeading = option.votes === Math.max(...poll.options.map(opt => opt.votes || 0)) && totalVotes > 0;
            
            return (
              <div 
                key={index}
                className={`poll-option ${isLeading ? 'leading' : ''}`}
                onClick={() => vote(index)}
              >
                <div className="option-content">
                  <span className="option-text">{option.text}</span>
                  <div className="option-stats">
                    <span className="vote-count">{option.votes || 0}</span>
                    <span className="vote-percentage">{percentage}%</span>
                  </div>
                </div>
                <div className="vote-progress">
                  <div 
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {isLeading && totalVotes > 0 && (
                  <div className="leading-badge"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Social Actions */}
        <div className="social-actions">
          <button 
            className={`social-btn like-btn ${isLiked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleLike}
            disabled={loading}
          >
            <span className="social-icon">
              {loading ? '⏳' : (isLiked ? '❤️' : '🤍')}
            </span>
            <span className="social-count">{poll.likes?.length || 0}</span>
            <span className="social-text">
              {loading ? 'Loading...' : (isLiked ? 'Liked' : 'Like')}
            </span>
          </button>

          <button 
            className="social-btn comment-btn"
            onClick={() => setShowComments(!showComments)}
            disabled={loading}
          >
            <span className="social-icon">💬</span>
            <span className="social-count">{poll.comments?.length || 0}</span>
            <span className="social-text">Comment</span>
          </button>

          <button className="social-btn share-btn" onClick={handleShare}>
            <span className="social-icon">🔗</span>
            <span className="social-text">Share</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="comments-section">
            <div className="comments-list">
              {poll.comments?.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-avatar">
                    {comment.author?.name?.charAt(0) || 'U'}
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
              <button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="poll-footer">
          {totalVotes === 0 ? (
            <div className="poll-status new">
              <span>🎯</span>
              Be the first to vote!
            </div>
          ) : (
            <div className="poll-status active">
              <span>📈</span>
              Poll active • {totalVotes} total votes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}