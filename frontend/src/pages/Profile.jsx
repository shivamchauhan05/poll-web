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
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    bio: '',
    location: '',
    website: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchUserPolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/polls/my-polls');
      const sortedPolls = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setUserPolls(sortedPolls);
    } catch (error) {
      console.error('Error fetching user polls:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUserPolls();
    initializeUserData();
  }, [token, navigate, fetchUserPolls]);

  const initializeUserData = () => {
    setUserData({
      name: user.name || 'User',
      bio: user.bio || 'Poll enthusiast and community contributor',
      location: user.location || '',
      website: user.website || ''
    });
    
    // Reset avatar states
    setAvatarPreview('');
    setAvatarFile(null);
    setAvatarError(false);
  };

  const calculateStats = () => {
    const totalPolls = userPolls.length;
    const totalVotes = userPolls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);
    const avgVotes = totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0;
    
    const mostPopularPoll = userPolls.reduce((max, poll) => 
      (poll.totalVotes || 0) > (max?.totalVotes || 0) ? poll : max, null
    );

    return {
      totalPolls,
      totalVotes,
      avgVotes,
      mostPopularVotes: mostPopularPoll ? mostPopularPoll.totalVotes || 0 : 0
    };
  };

  const stats = calculateStats();

  const handleUpdate = useCallback((updatedPoll) => {
    setUserPolls(prev => prev.map(p => p._id === updatedPoll._id ? updatedPoll : p));
  }, []);

  const handleDelete = useCallback((deletedId) => {
    setUserPolls(prev => prev.filter(p => p._id !== deletedId));
  }, []);

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 2MB for avatars)
      if (file.size > 2 * 1024 * 1024) {
        alert('Avatar size should be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
        setAvatarFile(file);
        setAvatarError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    setAvatarError(false);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return true;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.put('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local storage with new user data
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setAvatarFile(null);
      setAvatarError(false);
      return true;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError(true);
      alert('Failed to update profile picture');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      let avatarUploaded = true;
      
      // First upload avatar if new one selected
      if (avatarFile) {
        avatarUploaded = await uploadAvatar();
      }

      // Only update profile data if avatar upload was successful or no avatar change
      if (avatarUploaded) {
        const response = await api.put('/user/profile', userData);
        
        // Update local storage with new user data
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setEditMode(false);
        alert('Profile updated successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile');
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

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    // Add base URL if it's a relative path
    if (avatarPath.startsWith('/uploads/')) {
      return `http://localhost:5000${avatarPath}`;
    }
    return avatarPath;
  };

  if (!token) {
    return (
      <div className="profile-container">
        <div className="not-authorized">
          <h2>Access Denied</h2>
          <p>Please login to view your profile</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="cover-image"></div>
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {/* Avatar Display Logic */}
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Profile" 
                  className="avatar-image"
                  onError={() => setAvatarError(true)}
                />
              ) : user.avatar ? (
                <img 
                  src={getAvatarUrl(user.avatar)} 
                  alt="Profile" 
                  className="avatar-image"
                  onError={() => setAvatarError(true)}
                />
              ) : null}
              
              {/* Show initials if no avatar or avatar failed to load */}
              {(!user.avatar && !avatarPreview) || avatarError ? (
                <span className="avatar-initials">{getInitials(userData.name)}</span>
              ) : null}
              
              {editMode && (
                <div className="avatar-actions">
                  <label htmlFor="avatar-upload" className="avatar-upload-btn">
                    <span className="upload-icon">📷</span>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {(avatarPreview || user.avatar) && (
                    <button 
                      className="avatar-remove-btn"
                      onClick={removeAvatar}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {editMode && avatarFile && (
              <div className="avatar-upload-notice">
                <span>New avatar selected</span>
                <small>Save profile to update</small>
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-main">
            {editMode ? (
              <div className="edit-profile-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea
                    value={userData.bio}
                    onChange={(e) => setUserData({...userData, bio: e.target.value})}
                    className="form-textarea"
                    placeholder="Tell us about yourself..."
                    rows="3"
                    maxLength="200"
                  />
                  <div className="char-count">{userData.bio.length}/200</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      value={userData.location}
                      onChange={(e) => setUserData({...userData, location: e.target.value})}
                      className="form-input"
                      placeholder="Your city or country"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="url"
                      value={userData.website}
                      onChange={(e) => setUserData({...userData, website: e.target.value})}
                      className="form-input"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveProfile}
                    disabled={uploading || !userData.name.trim()}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner-small"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setEditMode(false);
                      initializeUserData();
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-details">
                  <h1 className="profile-name">{userData.name}</h1>
                  <p className="profile-email">{user.email}</p>
                  <p className="profile-bio">{userData.bio}</p>
                  
                  <div className="profile-meta">
                    {userData.location && (
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{userData.location}</span>
                      </div>
                    )}
                    {userData.website && (
                      <div className="meta-item">
                        <span className="meta-icon">🌐</span>
                        <a href={userData.website} target="_blank" rel="noopener noreferrer" className="website-link">
                          {userData.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={logout}
                  >
                    🚪 Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalPolls}</div>
            <div className="stat-label">Polls Created</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.totalVotes}</div>
            <div className="stat-label">Total Votes</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.avgVotes}</div>
            <div className="stat-label">Avg. per Poll</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{stats.mostPopularVotes}</div>
            <div className="stat-label">Most Votes</div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => setActiveTab('polls')}
          >
            My Polls
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`tab ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            Help & Support
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'polls' && (
            <div className="polls-tab">
              <div className="tab-header">
                <h2>My Polls</h2>
                <button 
                  className="btn btn-secondary"
                  onClick={fetchUserPolls}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
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
            <div className="activity-tab">
              <h2>Activity Overview</h2>
              
              <div className="activity-content">
                <div className="activity-chart">
                  <h3>Poll Performance</h3>
                  <div className="chart-container">
                    {userPolls.slice(0, 6).map((poll) => (
                      <div key={poll._id} className="chart-bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            height: `${Math.min(100, (poll.totalVotes || 0) / Math.max(1, stats.mostPopularVotes) * 100)}%` 
                          }}
                        ></div>
                        <span className="bar-label">{poll.totalVotes || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="recent-activity">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {userPolls.slice(0, 5).map((poll) => (
                      <div key={poll._id} className="activity-item">
                        <div className="activity-dot"></div>
                        <div className="activity-details">
                          <p className="activity-text">Created poll: "{poll.question}"</p>
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
            <div className="settings-tab">
              <h2>Account Settings</h2>
              
              <div className="settings-content">
                <div className="setting-group">
                  <h3>Preferences</h3>
                  <div className="setting-item">
                    <label>Email Notifications</label>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <label>Public Profile</label>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <label>Push Notifications</label>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="setting-group">
                  <h3>Privacy</h3>
                  <div className="setting-item">
                    <label>Show email to public</label>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-item">
                    <label>Allow direct messages</label>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="setting-group">
                  <h3>Account Actions</h3>
                  <div className="action-buttons">
                    <button className="btn btn-secondary">
                      📥 Export My Data
                    </button>
                    <button className="btn btn-danger" onClick={logout}>
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="help-tab">
              <h2>Help & Support</h2>
              
              <div className="help-content">
                <div className="help-section">
                  <h3>📚 Help Center</h3>
                  <div className="help-links">
                    <div className="help-item">
                      <h4>How to create a poll?</h4>
                      <p>Click the "Create Poll" button, add your question, options, and an optional image.</p>
                    </div>
                    <div className="help-item">
                      <h4>Can I edit my poll after creating?</h4>
                      <p>Yes, you can edit your own polls by clicking the edit icon on your poll card.</p>
                    </div>
                    <div className="help-item">
                      <h4>How many options can I add?</h4>
                      <p>You can add between 2 to 4 options per poll.</p>
                    </div>
                    <div className="help-item">
                      <h4>Can I change my vote?</h4>
                      <p>No, votes are final once cast to maintain poll integrity.</p>
                    </div>
                  </div>
                </div>

                <div className="help-section">
                  <h3>📞 Contact Support</h3>
                  <div className="contact-options">
                    <div className="contact-item">
                      <div className="contact-icon">📧</div>
                      <div className="contact-info">
                        <h4>Email Support</h4>
                        <p>support@votesphere.com</p>
                        <small>Typically responds within 24 hours</small>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <div className="contact-icon">💬</div>
                      <div className="contact-info">
                        <h4>Live Chat</h4>
                        <p>Available Mon-Fri, 9AM-6PM</p>
                        <small>Click to start chat</small>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <div className="contact-icon">📖</div>
                      <div className="contact-info">
                        <h4>Documentation</h4>
                        <p>Complete user guide and FAQs</p>
                        <small>Visit help center</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="help-section">
                  <h3>🔧 Report Issues</h3>
                  <div className="report-options">
                    <button className="btn btn-outline">
                      Report a Bug
                    </button>
                    <button className="btn btn-outline">
                      Suggest a Feature
                    </button>
                    <button className="btn btn-outline">
                      Report Abuse
                    </button>
                  </div>
                </div>

                <div className="help-section">
                  <h3>ℹ️ App Information</h3>
                  <div className="app-info">
                    <div className="info-item">
                      <span>Version</span>
                      <span>1.0.0</span>
                    </div>
                    <div className="info-item">
                      <span>Last Updated</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <span>Terms of Service</span>
                      <a href="#">View</a>
                    </div>
                    <div className="info-item">
                      <span>Privacy Policy</span>
                      <a href="#">View</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}