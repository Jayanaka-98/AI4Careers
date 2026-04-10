import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { listCompanies, getCompany, saveCompany, unsaveCompany, listSavedCompanies, generateElevatorPitch, savePitch, rankCompanies } from '../services/api';
import Layout from '../components/Layout';

const EVENT_ID = 'evt_umich_fall_2025';

function sponsorSummary(sponsorship, sponsorshipFlag) {
  // Use clean sponsorship_flag if available
  if (sponsorshipFlag) {
    const flag = String(sponsorshipFlag).trim().toLowerCase();
    if (flag === 'yes') return { label: 'Sponsors Visas', color: '#38a169' };
    if (flag === 'no') return { label: 'No Sponsorship', color: '#e53e3e' };
    if (flag === 'maybe' || flag === 'limited' || flag === 'case-by-case') return { label: 'Check Details', color: '#dd6b20' };
  }

  // Fallback: string match on raw sponsorship array
  if (!Array.isArray(sponsorship) || sponsorship.length === 0) {
    return { label: 'Check Details', color: '#dd6b20' };
  }

  const text = sponsorship
    .map((item) => String(item).trim().toLowerCase())
    .join(' ');

  const hasNoSponsorship = text.includes(
    'authorized to work in the united states and will not require future sponsorship'
  );

  const hasFutureVisa = text.includes(
    'work visa that will require future sponsorship (e.g., opt, cpt, j1, etc.)'
  );

  if (hasNoSponsorship && hasFutureVisa) {
    return { label: 'Sponsors Visas', color: '#38a169' };
  }

  if (hasNoSponsorship && !hasFutureVisa) {
    return { label: 'No Sponsorship', color: '#e53e3e' };
  }

  return { label: 'Check Details', color: '#dd6b20' };
}

function regionLabel(region) {
  if (region === 'Remote work opportunities may be available') {
    return 'Remote';
  }
  return region;
}

function regionOrder(region) {
  const order = {
    Midwest: 1,
    Northeast: 2,
    Southeast: 3,
    Southwest: 4,
    West: 5,
    'Remote work opportunities may be available': 6,
    'Outside of the U.S.': 7,
  };

  return order[region] ?? 999;
}


function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', cursor: 'pointer',
        border: active ? '2px solid #1a1a18' : '1px solid #d4caba',
        background: active ? '#1a1a18' : '#fff',
        color: active ? '#f5f0e8' : '#7a7268',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >{label}</button>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 7 ? '#38a169' : score >= 5 ? '#dd6b20' : '#718096';
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
      background: color + '18', color, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>{score}/10</span>
  );
}

function CompanyCard({ company, isSaved, onSaveToggle, onClick, score }) {
  const sponsor = sponsorSummary(company.sponsorship, company.sponsorship_flag);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid #d4caba', borderRadius: '16px',
        padding: '16px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
        display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <button
        onClick={e => { e.stopPropagation(); onSaveToggle(company); }}
        title={isSaved ? 'Unsave' : 'Save'}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'none', border: 'none', cursor: 'pointer',
          width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', lineHeight: 1, padding: 0,
          color: isSaved ? '#e53e3e' : '#cbd5e0',
        }}
      >♥</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '28px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a1a18' }}>{company.name}</h4>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
          <ScoreBadge score={score} />
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
            background: sponsor.color + '18', color: sponsor.color, border: `1px solid ${sponsor.color}44`,
            whiteSpace: 'nowrap',
          }}>{sponsor.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {company.positions?.map(p => (
          <span key={p} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: '#ede8dc', color: '#5c574f', border: '1px solid #d4caba' }}>{p}</span>
        ))}
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: '#f5f0e8', color: '#7a7268', border: '1px solid #d4caba' }}>{company.is_multi_day ? 'Mon & Tue' : company.fair_day}</span>
      </div>

      {company.regions?.length > 0 && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#7a7268' }}>{company.regions.join(' · ')}</p>
      )}

      <p style={{
        margin: 0, fontSize: '0.78rem', color: '#7a7268',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{company.description}</p>
    </div>
  );
}

function CompanyModal({ company, onClose, isSaved, onSaveToggle, savedPitch, onPitchSaved, token, score }) {
  const navigate = useNavigate();
  const sponsor = sponsorSummary(company.sponsorship, company.sponsorship_flag);
  const [pitchDraft, setPitchDraft] = useState('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState('');
  const [pitchConfirmed, setPitchConfirmed] = useState(false);

  const handleGeneratePitch = async () => {
    setPitchLoading(true);
    setPitchError('');
    setPitchDraft('');
    setPitchConfirmed(false);
    const result = await generateElevatorPitch(token, company.company_id, EVENT_ID);
    if (result.error) {
      setPitchError(result.error === 'no_resume' ? 'Please upload a resume first.' : (result.details || 'Failed to generate pitch.'));
    } else {
      setPitchDraft(result.pitch || '');
    }
    setPitchLoading(false);
  };

  const handleConfirmPitch = async () => {
    await savePitch(token, company.company_id, EVENT_ID, pitchDraft);
    if (!isSaved) onSaveToggle(company);
    setPitchConfirmed(true);
    onPitchSaved(company.company_id, pitchDraft);
  };

  const activePitch = pitchConfirmed ? pitchDraft : (savedPitch || '');

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', border: '1px solid #d4caba', borderRadius: '16px', maxWidth: '740px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Sticky header — always visible */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #ede8dc', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a18' }}>{company.name}</h2>
            <ScoreBadge score={score} />
            <button
              onClick={() => onSaveToggle(company)}
              title={isSaved ? 'Unsave' : 'Save'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: isSaved ? '#e53e3e' : '#cbd5e0', padding: 0 }}
            >♥</button>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#7a7268', lineHeight: 1 }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 28px', flex: 1 }}>

          <span style={{
            display: 'inline-block', fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px',
            borderRadius: '999px', background: sponsor.color + '18', color: sponsor.color,
            border: `1px solid ${sponsor.color}44`, marginBottom: '16px',
          }}>{sponsor.label}</span>

          {/* Position / Day pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {company.positions?.map(p => (
              <span key={p} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#ede8dc', color: '#5c574f', border: '1px solid #d4caba' }}>{p}</span>
            ))}
            <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '999px', background: '#f5f0e8', color: '#7a7268', border: '1px solid #d4caba' }}>{company.is_multi_day ? 'Mon & Tue' : company.fair_day}</span>
          </div>

          <p style={{ color: '#7a7268', lineHeight: 1.6, marginBottom: '16px' }}>{company.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {company.regions?.length > 0 && (
              <div><strong style={{ color: '#1a1a18' }}>Regions</strong><p style={{ margin: '4px 0', color: '#7a7268' }}>{company.regions.join(', ')}</p></div>
            )}
            {company.degree_levels?.length > 0 && (
              <div><strong style={{ color: '#1a1a18' }}>Degree Levels</strong><p style={{ margin: '4px 0', color: '#7a7268' }}>{company.degree_levels.join(', ')}</p></div>
            )}
            {company.sponsorship?.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ color: '#1a1a18' }}>Sponsorship Details</strong>
                <p style={{ margin: '4px 0', color: '#7a7268' }}>{company.sponsorship.join('; ')}</p>
              </div>
            )}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: '10px', width: 'auto', background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer', display: 'inline-block', fontSize: '0.9rem' }}>Website</a>
            )}
            {company.careers_url && (
              <a href={company.careers_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: '10px', width: 'auto', background: 'transparent', color: '#1a1a18', border: '1px solid #d4caba', cursor: 'pointer', display: 'inline-block', fontSize: '0.9rem' }}>Careers Page</a>
            )}
          </div>

          {/* Prepare for this Company — resume + elevator pitch */}
          <div style={{ borderTop: '1px solid #ede8dc', paddingTop: '20px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a18' }}>Prepare for this Company</p>
            <button
              type="button"
              onClick={() => navigate(`/resume-lab?company=${encodeURIComponent(company.name)}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1a1a18',
                color: '#f5f0e8',
                borderRadius: 10,
                padding: '10px 18px',
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              <FileText size={18} strokeWidth={2} aria-hidden />
              Tailor Resume for {company.name}
            </button>

            <div style={{ borderTop: '1px solid #ede8dc', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '0.95rem', color: '#1a1a18' }}>Elevator Pitch</strong>
              <button
                onClick={handleGeneratePitch}
                disabled={pitchLoading}
                style={{ padding: '6px 14px', fontSize: '0.82rem', width: 'auto', background: 'transparent', color: '#1a1a18', border: '1px solid #d4caba', borderRadius: '10px', cursor: pitchLoading ? 'not-allowed' : 'pointer', opacity: pitchLoading ? 0.6 : 1 }}
              >{pitchLoading ? 'Generating...' : pitchDraft ? 'Regenerate' : 'Generate Pitch'}</button>
            </div>

            {pitchError && <p style={{ color: '#e53e3e', fontSize: '0.85rem' }}>{pitchError}</p>}

            {/* Saved pitch (if no active draft) */}
            {!pitchDraft && activePitch && (
              <div style={{ background: '#ede8dc', border: '1px solid #d4caba', borderRadius: '16px', padding: '14px' }}>
                <p style={{ fontSize: '0.75rem', color: '#5c574f', fontWeight: 600, marginBottom: '8px' }}>✓ Saved Pitch</p>
                <div className="chat-markdown" style={{ fontSize: '0.85rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activePitch}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Draft pitch */}
            {pitchDraft && (
              <div>
                <div style={{ background: '#f5f0e8', border: '1px solid #d4caba', borderRadius: '16px', padding: '14px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#7a7268', fontWeight: 600, marginBottom: '8px' }}>Draft — review before saving</p>
                  <div className="chat-markdown" style={{ fontSize: '0.85rem' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{pitchDraft}</ReactMarkdown>
                  </div>
                </div>
                {!pitchConfirmed ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleConfirmPitch} style={{ width: 'auto', padding: '8px 18px', background: '#1a1a18', color: '#f5f0e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      ✓ Confirm & Save Pitch
                    </button>
                    <button onClick={handleGeneratePitch} style={{ width: 'auto', padding: '8px 18px', background: 'transparent', color: '#1a1a18', border: '1px solid #d4caba', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Regenerate
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#5c574f', fontWeight: 600, fontSize: '0.88rem' }}>✓ Pitch saved to your saved companies!</p>
                )}
              </div>
            )}

            {!pitchDraft && !activePitch && !pitchLoading && (
              <p style={{ color: '#9a9288', fontSize: '0.85rem' }}>Click "Generate Pitch" to create a personalized elevator pitch for this company based on your resume.</p>
            )}
            </div>
          </div>
        </div> {/* end scrollable body */}
      </div>
    </div>
  );
}

function Companies() {
  const { user, token } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [savedMap, setSavedMap] = useState({}); // company_id -> { pitch }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Fit score state
  const [scoreMap, setScoreMap] = useState({}); // company_id -> score (0–10)
  const [scoresLoading, setScoresLoading] = useState(false);
  const [sortByFit, setSortByFit] = useState(false);

  // Filters — all multi-select (empty = show all)
  const [filterDays, setFilterDays] = useState([]);
  const [filterSponsorships, setFilterSponsorships] = useState([]);
  const [filterPositions, setFilterPositions] = useState([]);
  const [filterRegions, setFilterRegions] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    window.localStorage.setItem(`dashboard-companies-visited:${user.email}`, 'true');
  }, [user?.email]);

  useEffect(() => {
    listCompanies({ event_id: EVENT_ID, fair_day: '', position_type: '', sponsors: '', region: '', major_search: '' })
      .then(data => {
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => a.name.localeCompare(b.name));
        setCompanies(sorted);
      })
      .catch(() => setError('Failed to load companies.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    listSavedCompanies(token, EVENT_ID).then(data => {
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(item => { map[item.company_id] = { pitch: item.pitch }; });
        setSavedMap(map);
      }
    });
  }, [token]);

  // Fetch fit scores (pure computation, no OpenAI needed)
  useEffect(() => {
    if (!token) return;
    setScoresLoading(true);
    rankCompanies(token, EVENT_ID).then(result => {
      if (result && result.matches && Array.isArray(result.matches)) {
        const map = {};
        result.matches.forEach(m => { map[m.company_id] = m.score; });
        setScoreMap(map);
      }
    }).finally(() => setScoresLoading(false));
  }, [token]);

  const handleSaveToggle = useCallback(async (company) => {
    const isSaved = !!savedMap[company.company_id];
    if (isSaved) {
      await unsaveCompany(token, company.company_id, EVENT_ID);
      setSavedMap(prev => { const next = { ...prev }; delete next[company.company_id]; return next; });
    } else {
      await saveCompany(token, company.company_id, EVENT_ID);
      setSavedMap(prev => ({ ...prev, [company.company_id]: { pitch: '' } }));
    }
  }, [savedMap, token]);

  const handlePitchSaved = useCallback((company_id, pitch) => {
    setSavedMap(prev => ({ ...prev, [company_id]: { pitch } }));
  }, []);

  const handleCompanyClick = async (company) => {
    setModalLoading(true);
    setError('');
    try {
      const detail = await getCompany(EVENT_ID, company.company_id);
      if (detail.error) throw new Error(detail.error);
      setSelected(detail);
    } catch {
      setError('Failed to load company details.');
    } finally {
      setModalLoading(false);
    }
  };

  const allPositions = useMemo(() => {
    const set = new Set();
    companies.forEach(c => c.positions?.forEach(p => {
      if (!p.includes(',')) set.add(p);
    }));
    return Array.from(set).sort();
  }, [companies]);

  const allRegions = useMemo(() => {
    const set = new Set();
    companies.forEach((c) => c.regions?.forEach((r) => {
      // Skip entries that contain multiple regions (contain a comma)
      if (!r.includes(',')) set.add(r);
    }));

    return [
      'All',
      ...Array.from(set).sort((a, b) => {
        const orderDiff = regionOrder(a) - regionOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return a.localeCompare(b);
      }),
    ];
  }, [companies]);


  const hasActiveFilters = filterDays.length > 0 || filterSponsorships.length > 0 || filterPositions.length > 0 || filterRegions.length > 0 || search !== '' || sortByFit;

  const clearFilters = () => {
    setFilterDays([]);
    setFilterSponsorships([]);
    setFilterPositions([]);
    setFilterRegions([]);
    setSearch('');
    setSortByFit(false);
  };

  const toggle = (setter) => (val) => setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const filtered = useMemo(() => {
    let result = showSaved ? companies.filter(c => !!savedMap[c.company_id]) : companies;

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.positions?.some(p => p.toLowerCase().includes(q)) ||
        c.regions?.some(r => r.toLowerCase().includes(q)) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    if (filterDays.length > 0) {
      result = result.filter(c => filterDays.includes(c.fair_day) || c.is_multi_day);
    }
    if (filterSponsorships.length > 0) {
      result = result.filter(c => {
        const s = sponsorSummary(c.sponsorship, c.sponsorship_flag);
        return filterSponsorships.includes(s.label);
      });
    }
    if (filterPositions.length > 0) {
      result = result.filter(c => filterPositions.some(fp => c.positions?.includes(fp)));
    }
    if (filterRegions.length > 0) {
      result = result.filter(c => filterRegions.some(fr => c.regions?.includes(fr)));
    }
    if (sortByFit) {
      result = [...result].sort((a, b) => (scoreMap[b.company_id] ?? -1) - (scoreMap[a.company_id] ?? -1));
    }
    return result;
  }, [companies, search, savedMap, showSaved, filterDays, filterSponsorships, filterPositions, filterRegions, sortByFit, scoreMap]);

  const savedCount = Object.keys(savedMap).length;

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, backgroundColor: '#f5f0e8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px', color: '#1a1a18' }}>UMich Fall 2025 Career Fair</h1>
            <p style={{ color: '#7a7268', margin: 0 }}>{companies.length} companies · Sept 22–23, 2025</p>
          </div>
        </div>

        {/* Saved / All tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <FilterChip label="All Companies" active={!showSaved} onClick={() => setShowSaved(false)} />
          <FilterChip label={`Saved (${savedCount})`} active={showSaved} onClick={() => setShowSaved(true)} />
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by company name, position, region..."
          style={{
            width: '100%', padding: '10px 16px', fontSize: '0.95rem',
            border: '1px solid #d4caba', borderRadius: '10px',
            marginBottom: '12px', boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#1a1a18',
          }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, minWidth: '90px' }}>Day:</span>
            {['Monday', 'Tuesday'].map(d => (
              <FilterChip key={d} label={d} active={filterDays.includes(d)} onClick={() => toggle(setFilterDays)(d)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, minWidth: '90px' }}>Sponsorship:</span>
            {['Sponsors Visas', 'No Sponsorship', 'Check Details'].map(s => (
              <FilterChip key={s} label={s} active={filterSponsorships.includes(s)} onClick={() => toggle(setFilterSponsorships)(s)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, minWidth: '90px' }}>Position:</span>
            {allPositions.map(p => (
              <FilterChip key={p} label={p} active={filterPositions.includes(p)} onClick={() => toggle(setFilterPositions)(p)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, minWidth: '90px' }}>Region:</span>
            {allRegions.filter((r) => r !== 'All').map((r) => (
              <FilterChip
                key={r}
                label={regionLabel(r)}
                active={filterRegions.includes(r)}
                onClick={() => toggle(setFilterRegions)(r)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600, minWidth: '90px' }}>Sort:</span>
            <FilterChip label="A–Z" active={!sortByFit} onClick={() => setSortByFit(false)} />
            <FilterChip
              label={scoresLoading ? 'Loading scores…' : 'Fit Score'}
              active={sortByFit}
              onClick={() => { if (!scoresLoading) setSortByFit(true); }}
            />
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ padding: '5px 14px', borderRadius: '10px', fontSize: '0.82rem', border: '1px solid #b91c1c', background: 'transparent', color: '#b91c1c', cursor: 'pointer', fontWeight: 600 }}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading companies...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#888' }}>{showSaved ? 'No saved companies yet.' : 'No companies match your search.'}</p>
        ) : (
          <>
            <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '12px' }}>
              {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}{search ? ` matching "${search}"` : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filtered.map(c => (
                <CompanyCard
                  key={c.company_id}
                  company={c}
                  isSaved={!!savedMap[c.company_id]}
                  onSaveToggle={handleSaveToggle}
                  onClick={() => handleCompanyClick(c)}
                  score={scoreMap[c.company_id] ?? null}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {modalLoading && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
          Loading company details...
        </div>
      )}

      {selected && (
        <CompanyModal
          company={selected}
          onClose={() => setSelected(null)}
          isSaved={!!savedMap[selected.company_id]}
          onSaveToggle={handleSaveToggle}
          savedPitch={savedMap[selected.company_id]?.pitch || ''}
          onPitchSaved={handlePitchSaved}
          token={token}
          score={scoreMap[selected.company_id] ?? null}
        />
      )}
    </Layout>
  );
}

export default Companies;
