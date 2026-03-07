import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import solarHero from '../assets/solar-hero.jpg';

const Auth = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Manager'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        console.log("Submitting Login...");
        const response = await axios.post('http://10.77.125.61:8000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        const loggedInUser = { email: formData.email, role: formData.role };
        setUser(loggedInUser);
        if (loggedInUser.role === 'Manager') {
          navigate('/dashboard');
        } else {
          navigate('/tickets');
        }
      } else {
        console.log("Submitting Register...");
        const response = await axios.post('http://10.77.125.61:8000/api/auth/register', {
          name: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        const newUser = { email: formData.email, role: formData.role };
        setUser(newUser);
        if (newUser.role === 'Manager') {
          navigate('/dashboard');
        } else {
          navigate('/tickets');
        }
      }
    } catch (error) {
      console.error("Authentication Error:", error.response ? error.response.data : error.message);
      alert("Authentication failed! Please check your details and try again.");
    }
  };

  return (
    <div className="auth-root">
      
      <div className="auth-panel-left">
        <img src={solarHero} alt="Solar Farm" className="auth-bg-image" />
        <div className="auth-overlay" />
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </div>
          <span className="auth-brand-name">SolarOps</span>
        </div>
        <div className="auth-hero-text">
          <h1>Intelligent Solar<br />Inverter Management</h1>
          <p>Monitor, predict, and manage your solar inverter fleet with AI-powered diagnostics and real-time operations.</p>
          <div className="auth-stats">
    
            <div className="auth-stat-divider" />
            <div className="auth-stat">
              <span className="auth-stat-value">AI</span>
              <span className="auth-stat-label">Powered</span>
            </div>
            <div className="auth-stat-divider" />
            <div className="auth-stat">
              <span className="auth-stat-value">Live</span>
              <span className="auth-stat-label">Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
            <p>{isLogin ? 'Sign in to your SolarOps dashboard' : 'Join your team on SolarOps'}</p>
          </div>
          
          <div className="auth-toggle">
            <button
              className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="auth-field">
                  <label>Username</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Role</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    <select name="role" value={formData.role} onChange={handleInputChange}>
                      <option value="Manager">Manager</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Engineer">Engineer</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="auth-field">
              <label>Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label>Password</label>
                {isLogin && <a href="#" className="auth-forgot">Forgot password?</a>}
              </div>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && (
              <div className="auth-field">
                <label>Sign in as</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="Manager">Manager</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Engineer">Engineer</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </form>

          <p className="auth-switch-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="auth-switch-link">
              {isLogin ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
