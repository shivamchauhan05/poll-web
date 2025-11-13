import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import PollCard from '../components/PollCard';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [userPolls, setUserPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('polls');
  const [userStats, setUserStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    avgVotes: 0,
    mostPopularPoll: null
  });
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUserPolls();
    initializeUserData();
  }, []);

  const initializeUserData = () => {
    setUserData({
      name: user.name || '',
      bio: 'Poll enthusiast and community contributor',
      location: 'India',
      website: ''
    });
  };

  const fetchUserPolls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/polls/my-polls');
      setUserPolls(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching user polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (polls) => {
    const totalPolls = polls.length;
    const totalVotes = polls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);
    const avgVotes = totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0;
    
    const mostPopularPoll = polls.reduce((max, poll) => 
      (poll.totalVotes || 0) > (max?.totalVotes || 0) ? poll : max, null
    );

    setUserStats({
      totalPolls,
      totalVotes,
      avgVotes,
      mostPopularPoll
    });
  };

  const handleUpdate = (updatedPoll) => {
    setUserPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
  };

  const handleDelete = (deletedId) => {
    setUserPolls(prev => prev.filter(p => p._id !== deletedId));
  };

  const handleSaveProfile = async () => {
    try {
      // Update user data in backend
      await api.put('/user/profile', userData);
      
      // Update local storage
      const updatedUser = { ...user, name: userData.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setEditMode(false);
      window.location.reload();
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate image upload
      const reader = new FileReader();
      reader.onload = (e) => {
        // In real app, you would upload to server and get URL
        console.log('Image uploaded:', e.target.result);
        alert('Profile picture updated! (This is a demo)');
      };
      reader.readAsDataURL(file);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  if (!token) {
    return (
      <div className="profile-container">
        <div className="not-authorized">
          <h2>Access Denied</h2>
          <p>Please login to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <div className="user-avatar large">
              {getInitials(userData.name)}
            </div>
            <label htmlFor="avatar-upload" className="avatar-upload-btn">
              <span>📷</span>
              Change Photo
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="profile-info-section">
          {editMode ? (
            <div className="edit-form">
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                className="edit-input"
                placeholder="Full Name"
              />
              <textarea
                value={userData.bio}
                onChange={(e) => setUserData({...userData, bio: e.target.value})}
                className="edit-textarea"
                placeholder="Tell us about yourself..."
                rows="3"
              />
              <div className="edit-fields">
                <input
                  type="text"
                  value={userData.location}
                  onChange={(e) => setUserData({...userData, location: e.target.value})}
                  className="edit-input"
                  placeholder="Location"
                />
                <input
                  type="url"
                  value={userData.website}
                  onChange={(e) => setUserData({...userData, website: e.target.value})}
                  className="edit-input"
                  placeholder="Website URL"
                />
              </div>
              <div className="edit-actions">
                <button className="btn btn-primary" onClick={handleSaveProfile}>
                  Save Changes
                </button>
                <button className="btn btn-outline" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-main-info">
                <h1 className="profile-name">{userData.name}</h1>
                <p className="profile-email">{user.email}</p>
                <p className="profile-bio">{userData.bio}</p>
                
                <div className="profile-details">
                  {userData.location && (
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{userData.location}</span>
                    </div>
                  )}
                  {userData.website && (
                    <div className="detail-item">
                      <span className="detail-icon">🌐</span>
                      <a href={userData.website} target="_blank" rel="noopener noreferrer">
                        {userData.website}
                      </a>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setEditMode(true)}
                >
                  <span>✏️</span>
                  Edit Profile
                </button>
                <button className="btn btn-danger" onClick={logout}>
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{userStats.totalPolls}</div>
            <div className="stat-label">Polls Created</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <div className="stat-number">{userStats.totalVotes}</div>
            <div className="stat-label">Total Votes</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{userStats.avgVotes}</div>
            <div className="stat-label">Avg. Votes/Poll</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-number">
              {userStats.mostPopularPoll ? userStats.mostPopularPoll.totalVotes || 0 : 0}
            </div>
            <div className="stat-label">Most Popular Poll</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`}
          onClick={() => setActiveTab('polls')}
        >
          <span>📝</span>
          My Polls ({userPolls.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <span>📊</span>
          Activity Stats
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span>⚙️</span>
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'polls' && (
          <div className="polls-section">
            <div className="section-header">
              <h2>My Created Polls</h2>
              <button 
                className="btn btn-outline"
                onClick={fetchUserPolls}
                disabled={loading}
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your polls...</p>
              </div>
            ) : userPolls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No polls created yet</h3>
                <p>Start creating polls to engage with the community</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/add')}
                >
                  Create Your First Poll
                </button>
              </div>
            ) : (
              <div className="polls-list">
                {userPolls.map((poll) => (
                  <PollCard 
                    key={poll._id}
                    poll={poll}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            <h2>Activity Overview</h2>
            
            <div className="activity-stats">
              <div className="activity-chart">
                <h3>Poll Performance</h3>
                <div className="chart-placeholder">
                  <p>📊 Activity chart would be displayed here</p>
                  <small>Showing poll views, votes, and engagement metrics</small>
                </div>
              </div>
              
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {userPolls.slice(0, 5).map((poll, index) => (
                    <div key={poll._id} className="activity-item">
                      <div className="activity-icon">📝</div>
                      <div className="activity-details">
                        <p>Created poll: "{poll.question}"</p>
                        <span className="activity-time">
                          {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="activity-votes">
                        {poll.totalVotes || 0} votes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Account Settings</h2>
            
            <div className="settings-grid">
              <div className="setting-group">
                <h3>Preferences</h3>
                <div className="setting-item">
                  <label>Email Notifications</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="notifications" defaultChecked />
                    <label htmlFor="notifications" className="toggle-slider"></label>
                  </div>
                </div>
                
                <div className="setting-item">
                  <label>Public Profile</label>
                  <div className="toggle-switch">
                    <input type="checkbox" id="public-profile" defaultChecked />
                    <label htmlFor="public-profile" className="toggle-slider"></label>
                  </div>
                </div>
              </div>
              
              <div className="setting-group">
                <h3>Danger Zone</h3>
                <div className="danger-actions">
                  <button className="btn btn-outline">
                    <span>📥</span>
                    Export My Data
                  </button>
                  <button className="btn btn-danger">
                    <span>🗑️</span>
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}