import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listCompanies } from '../services/api';

const EVENT_ID = 'evt_umich_fall_2025';

const SPONSOR_LABEL = {
  'Authorized to work in the United States and WILL NOT require future sponsorship': 'No Sponsorship',
  'Will need immediate sponsorship': 'Sponsors',
  'Work visa that will require future sponsorship (e.g., OPT, CPT, J1, etc.)': 'Sponsors OPT/CPT',
};

function sponsorSummary(sponsorship) {
  if (!sponsorship || sponsorship.length === 0) return { label: 'Unknown', color: '#a0aec0' };
  const text = sponsorship.join(' ').toLowerCase();
  if (text.includes('will not require')) return { label: 'No Sponsorship', color: '#e53e3e' };
  if (text.includes('immediate') || text.includes('opt') || text.includes('cpt')) return { label: 'Sponsors Visas', color: '#38a169' };
  return { label: 'Check Details', color: '#dd6b20' };
}

function CompanyCard({ company, onClick }) {
  const sponsor = sponsorSummary(company.sponsorship);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a202c' }}>{company.name}</h4>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
          borderRadius: '999px', background: sponsor.color + '18',
          color: sponsor.color, border: `1px solid ${sponsor.color}44`,
          whiteSpace: 'nowrap', marginLeft: '8px',
        }}>{sponsor.label}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {company.positions?.map(p => (
          <span key={p} style={{
            fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
            background: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8',
          }}>{p}</span>
        ))}
        <span style={{
          fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
          background: '#f0fff4', color: '#276749', border: '1px solid #c6f6d5',
        }}>{company.fair_day}</span>
      </div>

      {company.regions?.length > 0 && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#718096' }}>
          {company.regions.join(' · ')}
        </p>
      )}

      <p style={{
        margin: 0, fontSize: '0.78rem', color: '#4a5568',
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{company.description}</p>
    </div>
  );
}

function CompanyModal({ company, onClose }) {
  const sponsor = sponsorSummary(company.sponsorship);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '14px', padding: '28px',
          maxWidth: '600px', width: '100%', maxHeight: '80vh',
          overflowY: 'auto', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', fontSize: '1.4rem',
            cursor: 'pointer', color: '#718096',
          }}
        >×</button>

        <h2 style={{ margin: '0 0 4px 0' }}>{company.name}</h2>
        <span style={{
          display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
          padding: '3px 10px', borderRadius: '999px',
          background: sponsor.color + '18', color: sponsor.color,
          border: `1px solid ${sponsor.color}44`, marginBottom: '16px',
        }}>{sponsor.label}</span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {company.positions?.map(p => (
            <span key={p} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8' }}>{p}</span>
          ))}
          <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#f0fff4', color: '#276749', border: '1px solid #c6f6d5' }}>{company.fair_day}</span>
        </div>

        <p style={{ color: '#4a5568', lineHeight: 1.6, marginBottom: '16px' }}>{company.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
          {company.regions?.length > 0 && (
            <div><strong>Regions</strong><p style={{ margin: '4px 0', color: '#718096' }}>{company.regions.join(', ')}</p></div>
          )}
          {company.degree_levels?.length > 0 && (
            <div><strong>Degree Levels</strong><p style={{ margin: '4px 0', color: '#718096' }}>{company.degree_levels.join(', ')}</p></div>
          )}
          {company.sponsorship?.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Sponsorship Details</strong>
              <p style={{ margin: '4px 0', color: '#718096' }}>{company.sponsorship.join('; ')}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: '8px' }}>
              Website
            </a>
          )}
          {company.careers_url && (
            <a href={company.careers_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: '8px' }}>
              Careers Page
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Companies() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    listCompanies({
      event_id: EVENT_ID,
      fair_day: '', position_type: '', sponsors: '', region: '', major_search: '',
    }).then(data => {
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(sorted);
    }).catch(() => setError('Failed to load companies.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.positions?.some(p => p.toLowerCase().includes(q)) ||
      c.regions?.some(r => r.toLowerCase().includes(q)) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand"><h2>AI4Careers</h2></div>
        <div className="nav-links">
          <span className="user-name">Hello, {user?.name}</span>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>UMich Fall 2025 Career Fair</h1>
            <p style={{ color: '#718096', margin: 0 }}>{companies.length} companies · Sept 22–23, 2025</p>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by company name, position, region..."
          style={{
            width: '100%', padding: '10px 16px', fontSize: '0.95rem',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            marginBottom: '20px', boxSizing: 'border-box', outline: 'none',
          }}
        />

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading companies...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#888' }}>No companies match your search.</p>
        ) : (
          <>
            <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '12px' }}>
              {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}{search ? ` matching "${search}"` : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}>
              {filtered.map(c => (
                <CompanyCard key={c.company_id} company={c} onClick={() => setSelected(c)} />
              ))}
            </div>
          </>
        )}
      </div>

      {selected && <CompanyModal company={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default Companies;
