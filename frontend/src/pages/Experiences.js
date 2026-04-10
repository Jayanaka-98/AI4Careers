import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  rtListExperiences,
  rtAddExperience,
  rtUpdateExperience,
  rtDeleteExperience,
  rtImportExperiences,
  rtListResumes,
} from '../services/api';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Loader2,
  BookOpen,
  ChevronDown,
  Download,
  Building2,
  MessageSquare,
} from 'lucide-react';

const INPUT = {
  background: '#f8f4ec',
  border: '1px solid #d4caba',
  color: '#0f0f0d',
  width: '100%',
  borderRadius: 10,
  padding: '14px 16px',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

function onFocusInput(e) {
  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)';
}
function onBlurInput(e) {
  e.currentTarget.style.borderColor = '#d4caba';
}

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#9a9288',
};

const SPIN = {
  display: 'inline-flex',
  animation: 'experiencesSpin 0.9s linear infinite',
};

const BUILD_STORY_BTN = {
  border: '1px solid #d4caba',
  background: 'transparent',
  color: '#1a1a18',
  borderRadius: 8,
  padding: '4px 12px',
  fontSize: 12,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontWeight: 500,
  transition: 'border-color 0.15s, background 0.15s',
};

function normalizeExperiences(data) {
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeBullets(exp) {
  const b = exp?.bullets;
  if (Array.isArray(b) && b.length > 0) return b.map(String);
  return [];
}

function ExperienceModal({ state, onClose, onSaved }) {
  const editing = state.mode === 'edit' && state.exp;
  const exp = state.exp;

  const [company, setCompany] = useState(editing ? exp.company || '' : '');
  const [role, setRole] = useState(editing ? exp.role || '' : '');
  const [dates, setDates] = useState(editing ? exp.dates || '' : '');
  const [location, setLocation] = useState(editing ? exp.location || '' : '');
  const [description, setDesc] = useState(editing ? exp.description || '' : '');
  const [bullets, setBullets] = useState(() => {
    if (editing && exp) {
      const nb = normalizeBullets(exp);
      return nb.length ? nb : [''];
    }
    return [''];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError('Company and role are required');
      return;
    }
    setLoading(true);
    setError('');
    const cleanBullets = bullets.filter((b) => b.trim());
    try {
      if (state.mode === 'add') {
        await rtAddExperience({
          company,
          role,
          dates,
          location,
          description,
          bullets: cleanBullets,
        });
      } else {
        await rtUpdateExperience({
          exp_id: exp.exp_id,
          company,
          role,
          dates,
          location,
          description,
          bullets: cleanBullets,
        });
      }
      onSaved();
    } catch {
      setError('Save failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  function setBullet(i, v) {
    setBullets((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }
  function removeBullet(i) {
    setBullets((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addBullet() {
    setBullets((prev) => [...prev, '']);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        background: 'rgba(15,15,13,0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          background: '#ede8dc',
          border: '1px solid #d4caba',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 28px',
            borderBottom: '1px solid #d4caba',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f0f0d', margin: 0 }}>
            {state.mode === 'add' ? 'Add Experience' : 'Edit Experience'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#9a9288',
              padding: 6,
              borderRadius: 8,
              lineHeight: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0f0f0d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9a9288';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>
                  Company <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>
                  Role <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>Dates</label>
                <input
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  placeholder="e.g. Jan 2022 – Present"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Seattle, WA"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Briefly describe your role, team size, scope, key projects — used to build BQ stories"
                rows={4}
                style={{ ...INPUT, resize: 'none' }}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={LABEL_STYLE}>Key Accomplishments</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 17, flexShrink: 0, fontSize: 12, color: '#9a9288' }}>
                      ·
                    </span>
                    <textarea
                      value={b}
                      onChange={(e) => setBullet(i, e.target.value)}
                      placeholder="e.g. Led migration of auth service, reducing latency by 40%"
                      rows={2}
                      style={{ ...INPUT, resize: 'none', flex: 1 }}
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                    />
                    {bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(i)}
                        style={{
                          marginTop: 12,
                          flexShrink: 0,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9a9288',
                          padding: 4,
                          lineHeight: 0,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#b91c1c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9a9288';
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBullet}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: '#7a7268',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    transition: 'color 0.15s',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0f0f0d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#7a7268';
                  }}
                >
                  <Plus size={14} /> Add bullet
                </button>
              </div>
            </div>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: '#b91c1c',
                  background: 'rgba(185,28,28,0.08)',
                  border: '1px solid rgba(185,28,28,0.2)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '20px 28px',
              borderTop: '1px solid #d4caba',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid #d4caba',
                background: 'transparent',
                color: '#7a7268',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0f0f0d';
                e.currentTarget.style.borderColor = '#b0a898';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7a7268';
                e.currentTarget.style.borderColor = '#d4caba';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                background: '#1a1a18',
                color: '#f5f0e8',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#2a2a28';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a18';
              }}
            >
              {loading ? (
                <>
                  <span style={SPIN}>
                    <Loader2 size={15} />
                  </span>
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  {state.mode === 'add' ? 'Add Experience' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportPanel({ onImported }) {
  const [resumes, setResumes] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    rtListResumes().then((r) => {
      const list = Array.isArray(r) ? r : [];
      setResumes(list);
      if (list[0]) setSelected(list[0].resume_id);
    });
  }, []);

  async function handleImport() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await rtImportExperiences(selected);
      const imported = res?.imported;
      const count = Array.isArray(imported) ? imported.length : 0;
      onImported(count);
    } catch {
      /* no toast on failure */
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 500,
          border: '1px solid #d4caba',
          color: '#7a7268',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#0f0f0d';
          e.currentTarget.style.borderColor = '#b0a898';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#7a7268';
          e.currentTarget.style.borderColor = '#d4caba';
        }}
      >
        <Download size={15} /> Import from Resume
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            background: '#f8f4ec',
            border: '1px solid #d4caba',
            color: '#0f0f0d',
            borderRadius: 10,
            padding: '12px 40px 12px 14px',
            fontSize: 14,
            outline: 'none',
            appearance: 'none',
            minWidth: 180,
          }}
        >
          {resumes.map((r) => (
            <option key={r.resume_id} value={r.resume_id}>
              {r.version_name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#7a7268',
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleImport}
        disabled={loading || !selected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          background: '#1a1a18',
          color: '#f5f0e8',
          border: 'none',
          cursor: loading || !selected ? 'not-allowed' : 'pointer',
          opacity: loading || !selected ? 0.5 : 1,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!loading && selected) e.currentTarget.style.background = '#2a2a28';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1a1a18';
        }}
      >
        {loading ? (
          <span style={SPIN}>
            <Loader2 size={14} />
          </span>
        ) : (
          <Download size={14} />
        )}
        Import
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          color: '#7a7268',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          lineHeight: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#0f0f0d';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#7a7268';
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}

function ExperienceCard({ exp, onEdit, onDelete, onBuildStory }) {
  const [hovered, setHovered] = useState(false);
  const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
  const storyCount = typeof exp.story_count === 'number' ? exp.story_count : 0;

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 28,
        position: 'relative',
        background: '#eae5da',
        border: '1px solid #d4caba',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        ...(hovered
          ? {
              borderColor: 'rgba(0,0,0,0.22)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.1)',
            }
          : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          style={{
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#7a7268',
            lineHeight: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f0f0d';
            e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7a7268';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Edit2 size={15} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          style={{
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#7a7268',
            lineHeight: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#b91c1c';
            e.currentTarget.style.background = 'rgba(185,28,28,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7a7268';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, paddingRight: 80 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: '#f0ebe2',
            border: '1px solid #d4caba',
          }}
        >
          <Building2 size={18} style={{ color: '#7a7268' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: '#0f0f0d',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {exp.role}
          </p>
          <p
            style={{
              fontSize: 14,
              color: '#7a7268',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 0,
            }}
          >
            {exp.company}
            {exp.location ? ` · ${exp.location}` : ''}
          </p>
          {exp.dates ? (
            <p style={{ fontSize: 12, color: '#9a9288', marginTop: 4, marginBottom: 0 }}>{exp.dates}</p>
          ) : null}
        </div>
      </div>

      {exp.description ? (
        <p
          style={{
            fontSize: 14,
            color: '#7a7268',
            marginBottom: 16,
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginTop: 0,
          }}
        >
          {exp.description}
        </p>
      ) : null}

      {bullets.length > 0 ? (
        <ul
          style={{
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            listStyle: 'none',
            padding: 0,
            marginTop: 0,
          }}
        >
          {bullets.slice(0, 2).map((b, i) => (
            <li key={i} style={{ fontSize: 14, display: 'flex', gap: 8, color: '#7a7268' }}>
              <span style={{ flexShrink: 0, marginTop: 2, color: '#9a9288' }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b}</span>
            </li>
          ))}
          {bullets.length > 2 ? (
            <li style={{ fontSize: 12, color: '#9a9288' }}>+{bullets.length - 2} more</li>
          ) : null}
        </ul>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.06)',
          }}
        >
          <BookOpen size={13} style={{ color: '#7a7268' }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: '#7a7268' }}>
            {storyCount === 0
              ? 'No stories yet'
              : `${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'}`}
          </span>
        </div>
        <button
          type="button"
          onClick={onBuildStory}
          style={BUILD_STORY_BTN}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#b0a898';
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d4caba';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <MessageSquare size={12} strokeWidth={2} />
          Build Story
        </button>
      </div>
    </div>
  );
}

export default function Experiences() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [importMsg, setImportMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await rtListExperiences();
      setExperiences(normalizeExperiences(data));
    } catch {
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(expId) {
    if (
      !window.confirm(
        'Delete this experience? Any stories attached to it will also be removed.'
      )
    ) {
      return;
    }
    try {
      await rtDeleteExperience(expId);
      setExperiences((prev) => prev.filter((e) => e.exp_id !== expId));
    } catch {
      /* ignore */
    }
  }

  function handleImported(count) {
    setImportMsg(`Imported ${count} experience${count !== 1 ? 's' : ''} from resume.`);
    load();
    setTimeout(() => setImportMsg(''), 4000);
  }

  return (
    <Layout>
      <style>{`@keyframes experiencesSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, position: 'relative', background: '#f5f0e8' }}>
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 2,
          }}
        >
          <ImportPanel onImported={handleImported} />
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              background: '#1a1a18',
              color: '#f5f0e8',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a28';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a18';
            }}
          >
            <Plus size={15} /> Add Experience
          </button>
        </div>

        <div>
          <div style={{ marginBottom: 48, paddingRight: 280 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Experiences</h1>
            <p style={{ fontSize: 15, color: '#7a7268', marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
              Your experience bank for BQ story preparation.{' '}
              <Link
                to="/bq"
                style={{
                  color: '#1a1a18',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(26,26,24,0.35)',
                }}
              >
                Go to BQ Prep →
              </Link>
            </p>
          </div>

          {importMsg ? (
            <div
              style={{
                marginBottom: 24,
                padding: '14px 20px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(22,101,52,0.12)',
                border: '1px solid rgba(22,101,52,0.25)',
              }}
            >
              <span style={{ fontSize: 14, color: '#14532d' }}>{importMsg}</span>
              <button
                type="button"
                onClick={() => setImportMsg('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#166534',
                  lineHeight: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#14532d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#166534';
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                color: '#7a7268',
                justifyContent: 'center',
                padding: '64px 0',
              }}
            >
              <span style={SPIN}>
                <Loader2 size={18} />
              </span>
              Loading experiences…
            </div>
          ) : experiences.length === 0 ? (
            <div
              style={{
                border: '2px dashed #d4caba',
                borderRadius: 16,
                padding: '112px 32px',
                textAlign: 'center',
                background: 'transparent',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  background: '#f0ebe2',
                  border: '1px solid #d4caba',
                }}
              >
                <Briefcase size={36} style={{ color: '#9a9288' }} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#0f0f0d', marginBottom: 12, marginTop: 0 }}>
                No experiences yet
              </p>
              <p
                style={{
                  fontSize: 15,
                  color: '#7a7268',
                  marginBottom: 32,
                  maxWidth: 360,
                  margin: '0 auto 32px',
                }}
              >
                Add your work history manually or import directly from a resume you&apos;ve uploaded
              </p>
              <button
                type="button"
                onClick={() => setModal({ mode: 'add' })}
                style={{
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  background: '#1a1a18',
                  color: '#f5f0e8',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a28';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1a1a18';
                }}
              >
                Add manually
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {experiences.map((exp) => (
                <ExperienceCard
                  key={exp.exp_id}
                  exp={exp}
                  onEdit={() => setModal({ mode: 'edit', exp })}
                  onDelete={() => handleDelete(exp.exp_id)}
                  onBuildStory={() => navigate(`/bq?exp_id=${encodeURIComponent(exp.exp_id)}`)}
                />
              ))}
            </div>
          )}
        </div>

        {modal ? (
          <ExperienceModal
            key={modal.mode === 'edit' ? modal.exp.exp_id : 'add'}
            state={modal}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              load();
            }}
          />
        ) : null}
      </div>
    </Layout>
  );
}
