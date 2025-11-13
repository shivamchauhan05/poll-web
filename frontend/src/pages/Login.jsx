import React from 'react';
import './Login.css';

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo and Brand */}
        <div className="login-header">
          <div className="site-logo">📊</div>
          <h1 className="site-name">PollMaster</h1>
          <p className="site-tagline">
            Create engaging polls, gather opinions, and make data-driven decisions
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="login-actions">
          <a 
            href="http://localhost:5000/auth/google" 
            className="google-login-btn"
          >
            <span className="google-icon">🔐</span>
            Sign in with Google
          </a>
        </div>

        {/* Features List */}
        <div className="login-features">
          <h3 className="features-title">Why Join PollMaster?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h4>Create Polls</h4>
              <p>Create unlimited polls with multiple options</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Real-time Results</h4>
              <p>See voting results update in real-time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h4>Easy Sharing</h4>
              <p>Share polls with anyone via link</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h4>Analytics</h4>
              <p>Get detailed insights on poll performance</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Join thousands of users creating amazing polls</p>
        </div>
      </div>
    </div>
  );
}