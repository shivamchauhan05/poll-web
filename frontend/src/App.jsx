import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import AddPoll from './pages/AddPoll.jsx';
import EditPoll from './pages/EditPoll.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login';
import './App.css';

function Nav() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); 
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            <span className="brand-icon">📊</span>
            <span className="brand-text">VoteSphere</span>
          </Link>
          
          <div className="nav-actions">
            {token ? (
              <>
                <Link to="/add" className="btn btn-primary">
                  <span>+</span>
                  <span className="btn-text">Create Poll</span>
                </Link>
                <Link to="/profile" className="user-menu">
                  <div className="user-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="user-name">{user.name || 'User'}</span>
                </Link>
                <button className="btn btn-outline logout-btn" onClick={logout}>
                  <span>🚪</span>
                  <span className="btn-text">Logout</span>
                </button>
              </>
            ) : (
              <a href="http://localhost:5000/auth/google" className="btn btn-primary">
                <span>🔐</span>
                <span className="btn-text">Sign In</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) { 
      localStorage.setItem('token', token);
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify({
          id: payload.id,
          name: payload.name,
          email: payload.email
        }));
      } catch (error) {
        console.error('Error decoding token:', error);
      }
      
      window.history.replaceState({}, document.title, '/');
      window.location.reload();
    }
  }, []);

  const token = localStorage.getItem('token');

  return (
    <div className="app">
      {token && <Nav />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={token ? <Home /> : <Login />} />
          <Route path="/add" element={token ? <AddPoll /> : <Login />} />
          <Route path="/edit/:id" element={token ? <EditPoll /> : <Login />} />
          <Route path="/profile" element={token ? <Profile /> : <Login />} />
        </Routes>
      </main>
    </div>
  );
}