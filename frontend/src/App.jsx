import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AddPoll from './pages/AddPoll.jsx';
import EditPoll from './pages/EditPoll.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login';
import './App.css';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!token) return null;

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')}>
          <div className="logo-icon">📊</div>
          <span className="logo-text">VoteSphere</span>
        </div>

        {/* Navigation */}
       {/* <nav className="main-nav">
          <button 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </button>
          
          <button 
            className={`nav-link ${location.pathname === '/add' ? 'active' : ''}`}
            onClick={() => navigate('/add')}
          >
            <span className="nav-icon">✏️</span>
            <span className="nav-text">Create</span>
          </button>
        </nav> */}

        {/* User Menu */}
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="user-name">{user.name || 'User'}</span>
          </div>
          
          <div className="dropdown-menu">
            <button onClick={() => navigate('/profile')} className="dropdown-item">
              <span className="dropdown-icon">👤</span>
              Profile
            </button>
            <button onClick={logout} className="dropdown-item">
              <span className="dropdown-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) return null;

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </button>
      
      <button 
        className={`nav-item ${location.pathname === '/add' ? 'active' : ''}`}
        onClick={() => navigate('/add')}
      >
        <span className="nav-icon">✏️</span>
        <span className="nav-label">Create</span>
      </button>
      
      <button 
        className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
}

export default function App() {
  const navigate = useNavigate();

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
      navigate('/');
    }
  }, [navigate]);

  const token = localStorage.getItem('token');

  return (
    <div className="app">
      {token && <Header />}
      
      <main className={`main-content ${token ? 'with-nav' : ''}`}>
        <Routes>
          <Route path="/" element={token ? <Home /> : <Login />} />
          <Route path="/add" element={token ? <AddPoll /> : <Login />} />
          <Route path="/edit/:id" element={token ? <EditPoll /> : <Login />} />
          <Route path="/profile" element={token ? <Profile /> : <Login />} />
        </Routes>
      </main>

      {token && <BottomNav />}
    </div>
  );
}