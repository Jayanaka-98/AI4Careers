import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rtListResumes, rtDeleteResume, updatePreferences } from '../services/api';
import Layout from '../components/Layout';

function PillGroup({ label, options, selected, onChange, hint }) {
  const toggle = (opt) => {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]);
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: 13, color: '#1a1a18' }}>{label}</label>
      {hint && <p style={{ color: '#9a9288', fontSize: 12, marginBottom: 8, marginTop: 0 }}>{hint}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: active ? '2px solid #1a1a18' : '1px solid #d4caba',
                background: active ? '#1a1a18' : '#fff',
                color: active ? '#f5f0e8' : '#7a7268',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const WORK_AUTH_OPTIONS = [
  'US Citizen',
  'US Permanent Resident (Green Card)',
  'OPT',
  'CPT',
  'H1B',
  'TN Visa',
  'O-1 Visa',
  'Other',
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];

const ROLE_TYPE_OPTIONS = ['Internship', 'Full-Time'];


function Profile() {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();

  const [resumes, setResumes] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeError, setResumeError] = useState('');

  const [prefs, setPrefs] = useState({
    needs_sponsorship: false,
    work_authorization: [],
    preferred_locations: [],
    work_modes: [],
    role_types: [],
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsStatus, setPrefsStatus] = useState('');
  const [prefsError, setPrefsError] = useState('');

  const fetchResumes = useCallback(async () => {
    setResumeLoading(true);
    setResumeError('');
    try {
      const result = await rtListResumes();
      const list = result?.resumes ?? (Array.isArray(result) ? result : []);
      setResumes(list);
    } catch {
      setResumeError('Failed to load resumes.');
    } finally {
      setResumeLoading(false);
    }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  useEffect(() => {
    if (user?.preferences) {
      const p = user.preferences;
      setPrefs({
        needs_sponsorship: p.needs_sponsorship || false,
        work_authorization: p.work_authorization || [],
        preferred_locations: p.preferred_locations || [],
        work_modes: p.work_modes || [],
        role_types: p.role_types || [],
      });
    }
  }, [user]);

  const handleDelete = async (rv_id) => {
    if (!window.confirm('Delete this resume version?')) return;
    try {
      await rtDeleteResume(rv_id);
      setResumes((prev) => prev.filter((r) => (r.rv_id || r.resume_id) !== rv_id));
      await refreshUser();
    } catch {
      setResumeError('Failed to delete resume.');
    }
  };

  const handlePrefsSubmit = async (e) => {
    e.preventDefault();
    setPrefsSaving(true);
    setPrefsStatus('');
    setPrefsError('');
    try {
      const result = await updatePreferences(token, {
        needs_sponsorship: prefs.needs_sponsorship,
        work_authorization: prefs.work_authorization,
        preferred_locations: prefs.preferred_locations,
        work_modes: prefs.work_modes,
        role_types: prefs.role_types,
      });
      if (result.error) throw new Error(result.error);
      setPrefsStatus('Preferences saved.');
      await refreshUser();
    } catch (err) {
      setPrefsError(err.message || 'Failed to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 24, color: '#1a1a18', fontSize: 22, fontWeight: 700 }}>My Profile & Preferences</h2>

        {/* Resumes — powered by Resume Lab */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d4caba', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a18', margin: 0 }}>My Resumes</h3>
            <button
              onClick={() => navigate('/resume-lab')}
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: '#1a1a18', color: '#f5f0e8', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >+ Upload New</button>
          </div>

          {resumeError && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{resumeError}</div>}

          {resumeLoading ? <p style={{ color: '#9a9288', fontSize: 14 }}>Loading resumes...</p> : resumes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <FileText size={32} style={{ color: '#d4caba', marginBottom: 8 }} />
              <p style={{ color: '#9a9288', fontSize: 14, margin: '0 0 12px' }}>No resumes yet.</p>
              <Link to="/resume-lab" style={{ color: '#1a1a18', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}>
                Go to Resume Lab to upload
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resumes.map((r) => {
                const id = r.rv_id || r.resume_id;
                const area = (r.label || 'general') === 'general' ? 'other' : r.label;
                const co = r.company_tag != null && String(r.company_tag).trim() !== '' ? String(r.company_tag).trim() : 'Other';
                const metaParts = [];
                if ((r.label || 'general') !== 'general') metaParts.push(area);
                if (co !== 'Other') metaParts.push(co);
                const meta = metaParts.length ? `${metaParts.join(' · ')} · ` : '';
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid #ede8dc', background: '#faf8f4' }}>
                    <FileText size={18} style={{ color: '#9a9288', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.version_name || r.file_name || 'Resume'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9a9288' }}>
                        {meta}
                        {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/resume-lab/${id}`)}
                      style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #d4caba', background: 'transparent', color: '#1a1a18', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >Open</button>
                    <button
                      onClick={() => handleDelete(id)}
                      style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #e8c4c4', background: 'transparent', color: '#b91c1c', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >Delete</button>
                  </div>
                );
              })}
              <Link to="/resume-lab" style={{ color: '#7a7268', fontSize: 13, textDecoration: 'underline', marginTop: 4 }}>
                Manage all in Resume Lab →
              </Link>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d4caba', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a18', margin: '0 0 16px' }}>Career Preferences</h3>

          {prefsError && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{prefsError}</div>}
          {prefsStatus && <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{prefsStatus}</div>}

          <form onSubmit={handlePrefsSubmit}>

            {/* Needs Sponsorship */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 13, color: '#1a1a18' }}>
                Do you need visa sponsorship?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Yes', 'No'].map((opt) => {
                  const active = prefs.needs_sponsorship === (opt === 'Yes');
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, needs_sponsorship: opt === 'Yes' })}
                      style={{
                        padding: '8px 28px',
                        borderRadius: 999,
                        border: active ? '2px solid #1a1a18' : '1px solid #d4caba',
                        background: active ? '#1a1a18' : '#fff',
                        color: active ? '#f5f0e8' : '#7a7268',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>

            <PillGroup
              label="Work Authorization"
              hint="Select all that apply"
              options={WORK_AUTH_OPTIONS}
              selected={prefs.work_authorization}
              onChange={(val) => setPrefs({ ...prefs, work_authorization: val })}
            />

            <PillGroup
              label="Preferred Locations"
              hint="Select states you're open to working in"
              options={US_STATES}
              selected={prefs.preferred_locations}
              onChange={(val) => setPrefs({ ...prefs, preferred_locations: val })}
            />

            <PillGroup
              label="Work Modes"
              options={WORK_MODE_OPTIONS}
              selected={prefs.work_modes}
              onChange={(val) => setPrefs({ ...prefs, work_modes: val })}
            />

            <PillGroup
              label="Role Types"
              options={ROLE_TYPE_OPTIONS}
              selected={prefs.role_types}
              onChange={(val) => setPrefs({ ...prefs, role_types: val })}
            />

            <button
              type="submit"
              disabled={prefsSaving}
              style={{
                marginTop: 16, padding: '12px 28px', borderRadius: 10,
                border: 'none', background: '#1a1a18', color: '#f5f0e8',
                fontSize: 14, fontWeight: 600, cursor: prefsSaving ? 'not-allowed' : 'pointer',
                opacity: prefsSaving ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!prefsSaving) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { if (!prefsSaving) e.currentTarget.style.opacity = '1'; }}
            >
              {prefsSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
