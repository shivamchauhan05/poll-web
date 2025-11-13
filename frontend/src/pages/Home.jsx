import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PollCard from '../components/PollCard';
import api from '../api/api';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/polls');
      
      // Debug: Check what we're getting from API
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response formats
      let pollsData = [];
      
      if (Array.isArray(response.data)) {
        // If response.data is directly an array
        pollsData = response.data;
      } else if (response.data && Array.isArray(response.data.polls)) {
        // If response.data has a polls property
        pollsData = response.data.polls;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object but not array, try to extract polls
        pollsData = Object.values(response.data).find(Array.isArray) || [];
      }
      
      console.log('Processed polls data:', pollsData);
      
      // Ensure it's an array
      if (!Array.isArray(pollsData)) {
        pollsData = [];
      }
      
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
      setPolls([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleUpdate = useCallback((updatedPoll) => {
    setPolls(prev => {
      if (!Array.isArray(prev)) return [updatedPoll];
      return prev.map(p => p && p._id === updatedPoll._id ? updatedPoll : p);
    });
  }, []);

  const handleDelete = useCallback((deletedId) => {
    setPolls(prev => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(p => p && p._id !== deletedId);
    });
    setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }, []);

  // Safe array check and rendering
  const safePolls = Array.isArray(polls) ? polls : [];
  const displayPolls = safePolls.filter(poll => poll && typeof poll === 'object');

  return (
    <div className="home-page">
      <div className="container">
        {/* Header */}
        <div className="home-header">
          <h1>Community Polls</h1>
          <p>Discover what people are voting on and share your opinion</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Polls</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-number">{stats.active}</div>
              <div className="stat-label">Active Polls</div>
            </div>
          </div>
        </div>

        {/* Ad Space */}
        <div className="ad-space">
          <div className="ad-content">
            <h3>Premium Ad Space</h3>
            <p>Reach engaged audience with targeted campaigns</p>
            <div className="ad-placeholder">
              Your Ad Here • Contact: ads@votesphere.com
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Polls Section */}
        <div className="polls-section">
          <div className="section-header">
            <h2>Recent Polls</h2>
            <button 
              className="btn btn-outline"
              onClick={fetchPolls}
              disabled={loading}
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading polls...</p>
            </div>
          ) : displayPolls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No polls available</h3>
              <p>{error ? 'Failed to load polls' : 'Be the first to create a poll and start the conversation'}</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/add')}
              >
                Create First Poll
              </button>
            </div>
          ) : (
            <div className="polls-grid">
              {displayPolls.map((poll) => (
                <PollCard 
                  key={poll._id || Math.random()}
                  poll={poll}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}