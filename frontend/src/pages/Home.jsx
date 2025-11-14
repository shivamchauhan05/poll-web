import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PollCard from '../components/PollCard';
import api from '../api/api';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPolls = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await api.get('/polls');
      let pollsData = [];
      
      if (Array.isArray(response.data)) {
        pollsData = response.data;
      } else if (response.data && Array.isArray(response.data.polls)) {
        pollsData = response.data.polls;
      }
      
      // Sort by latest first
      pollsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPolls(pollsData);
      
      // Calculate stats
      const activePolls = pollsData.filter(poll => 
        poll && (!poll.expiresAt || new Date(poll.expiresAt) > new Date())
      ).length;
      
      setStats({
        total: pollsData.length,
        active: activePolls
      });
    } catch (err) {
      console.error('Error fetching polls:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch polls. Please try again.';
      setError(errorMessage);
      setPolls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleUpdate = useCallback((updatedPoll) => {
    setPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
  }, []);

  const handleDelete = useCallback((deletedId) => {
    setPolls(prev => prev.filter(p => p._id !== deletedId));
    setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }, []);

  const handleRefresh = () => {
    fetchPolls(true);
  };

  return (
    <div className="home-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome back, <span className="user-name">{user.name || 'User'}!</span>
          </h1>
          <p className="welcome-subtitle">Discover what people are voting on and share your opinion</p>
        </div>
        <button 
          className="btn btn-primary create-poll-btn"
          onClick={() => navigate('/add')}
        >
          <span className="btn-icon">+</span>
          Create Poll
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Polls</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active Polls</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0)}</div>
            <div className="stat-label">Total Votes</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/add')}
          >
            <div className="action-icon primary">✏️</div>
            <div className="action-content">
              <h3>Create Poll</h3>
              <p>Start a new poll and engage the community</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
          
          <button 
            className="action-card"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <div className="action-icon secondary">🔄</div>
            <div className="action-content">
              <h3>Refresh Feed</h3>
              <p>See the latest polls and updates</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
        </div>
      </div>

      {/* Polls Feed */}
      <div className="polls-feed">
        <div className="feed-header">
          <h2 className="section-title">Recent Polls</h2>
          <div className="feed-actions">
            <button 
              className="btn btn-secondary refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <p>{error}</p>
              <button onClick={() => setError('')} className="error-dismiss">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-content">
              <h3>No polls available</h3>
              <p>Be the first to create a poll and start the conversation</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/add')}
              >
                Create First Poll
              </button>
            </div>
          </div>
        ) : (
          <div className="polls-grid">
            {polls.map((poll) => (
              <PollCard 
                key={poll._id}
                poll={poll}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {refreshing && (
          <div className="refreshing-indicator">
            <div className="spinner small"></div>
            Updating feed...
          </div>
        )}
      </div>
    </div>
  );
}