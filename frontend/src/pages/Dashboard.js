import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const chip = (label, color = '#3182ce') => (
  <span key={label} style={{
    display: 'inline-block',
    background: color + '18',
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: '999px',
    padding: '2px 10px',
    fontSize: '0.78rem',
    fontWeight: 500,
    marginRight: '4px',
    marginBottom: '4px',
  }}>{label}</span>
);

function PrefsDisplay({ preferences }) {
  if (!preferences) return <p style={{ color: '#aaa' }}>No preferences set.</p>;
  const p = preferences;
  const hasAny = p.work_authorization?.length || p.preferred_locations?.length ||
    p.work_modes?.length || p.role_types?.length;

  return (
    <div style={{ fontSize: '0.9rem' }}>
      <div style={{ marginBottom: '6px' }}>
        <strong>Sponsorship: </strong>
        {chip(p.needs_sponsorship ? 'Needs Sponsorship' : 'No Sponsorship Needed', p.needs_sponsorship ? '#e53e3e' : '#38a169')}
      </div>
      {p.work_authorization?.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Work Auth: </strong>
          {p.work_authorization.map(a => chip(a, '#805ad5'))}
        </div>
      )}
      {p.work_modes?.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Work Mode: </strong>
          {p.work_modes.map(m => chip(m, '#dd6b20'))}
        </div>
      )}
      {p.role_types?.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Role Types: </strong>
          {p.role_types.map(r => chip(r, '#3182ce'))}
        </div>
      )}
      {p.preferred_locations?.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <strong>Locations: </strong>
          {p.preferred_locations.map(l => chip(l, '#2c7a7b'))}
        </div>
      )}
      {!hasAny && <span style={{ color: '#aaa' }}>No preferences set yet.</span>}
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("/")}><h2>AI4Careers</h2></div>
        <div className="nav-links">
          <span className="user-name">Hello, {user.name}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}!</h1>
          <p>Your career fair assistant is ready to help you succeed.</p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Profile</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Resumes uploaded:</strong> {user.resume_count ?? 0}</p>
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '8px' }}>Career Preferences</h4>
              <PrefsDisplay preferences={user.preferences} />
            </div>
          </div>

          <div className="card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="btn-action" onClick={() => navigate('/resume-upload')}>Upload Resume</button>
              <button className="btn-action" onClick={() => navigate('/profile')}>My Profile & Preferences</button>
              <button className="btn-action" onClick={() => navigate('/companies')}>Career Fair Companies</button>
              <button className="btn-action" onClick={() => navigate('/chat')}>Chat With AI</button>
            </div>
          </div>

          <div className="card">
            <h3>Getting Started</h3>
            <ul className="checklist">
              <li>✓ Create your account</li>
              <li>{(user.resume_count ?? 0) > 0 ? '✓' : '⃝'} Upload your resume</li>
              <li>{user.preferences?.work_modes?.length > 0 ? '✓' : '⃝'} Set your preferences</li>
              <li>⃝ Browse career fair companies</li>
              <li>⃝ Get your fit scores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
