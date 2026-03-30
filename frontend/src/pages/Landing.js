import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎯',
    title: 'AI Company Matching',
    desc: 'Upload your resume and get a ranked list of best-fit companies at the career fair — scored by skills, location, and sponsorship needs.',
  },
  {
    icon: '📄',
    title: 'Resume Optimizer',
    desc: 'AI rewrites your resume with strong action verbs and recruiter-friendly phrasing, without inventing anything.',
  },
  {
    icon: '🎤',
    title: 'Elevator Pitch Generator',
    desc: 'Get a polished 45-second pitch tailored to a specific company — plus a 20-second version and delivery tips.',
  },
  {
    icon: '📸',
    title: 'Logo Scanner',
    desc: 'Snap a photo of a company booth logo and instantly see your fit score and action plan for that company.',
  },
];

const STEPS = [
  { num: '1', title: 'Upload Your Resume', desc: 'Drop in your PDF and let AI extract your skills and experience.' },
  { num: '2', title: 'Get Your Top Matches', desc: 'See which companies are the best fit for you, ranked and explained.' },
  { num: '3', title: 'Walk In Confident', desc: 'Use your custom pitch and action plan to make every conversation count.' },
];

// Fade-in on scroll hook
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('lp-visible'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeSection({ className, id, children }) {
  const ref = useFadeIn();
  return <section ref={ref} className={`lp-fade ${className || ''}`} id={id}>{children}</section>;
}

function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page">

      {/* Navbar */}
      <nav className={`landing-nav${scrolled ? ' landing-nav-scrolled' : ''}`}>
        <div className="landing-nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AI4Careers</div>
        <div className="landing-nav-links">
          <button className="landing-btn-outline" onClick={() => navigate('/login')}>Log In</button>
          <button className="landing-btn-solid" onClick={() => navigate('/signup')}>Sign Up Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">Built for University of Michigan Career Fair</div>
          <h1 className="landing-hero-title">
            Your AI Career Fair<br />Companion
          </h1>
          <p className="landing-hero-sub">
            Match with top companies, optimize your resume, and ace your pitch — all before you walk in the door.
          </p>
          <div className="landing-hero-ctas">
            <button className="landing-btn-solid landing-btn-lg landing-btn-hero" onClick={() => navigate('/signup')}>
              Get Started Free
            </button>
            <a className="landing-btn-ghost landing-btn-lg" href="#how-it-works">
              See How It Works ↓
            </a>
          </div>
          <p className="landing-hero-hint">No credit card required · Free for students</p>
        </div>
        <div className="landing-hero-glow" />
      </section>

      {/* Video */}
      <FadeSection className="landing-video-section">
        <p className="landing-section-eyebrow">Demo</p>
        <h2 className="landing-section-title">See AI4Careers in Action</h2>
        <div className="landing-video-wrapper">
          <video src="/demo.mp4" controls className="landing-video" preload="metadata" />
        </div>
      </FadeSection>

      {/* Features */}
      <FadeSection className="landing-features-section">
        <p className="landing-section-eyebrow">Features</p>
        <h2 className="landing-section-title">Everything You Need to Prepare</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* How it works */}
      <FadeSection className="landing-steps-section" id="how-it-works">
        <p className="landing-section-eyebrow">Process</p>
        <h2 className="landing-section-title">How It Works</h2>
        <div className="landing-steps-row">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="landing-step">
                <div className="landing-step-num">{s.num}</div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div className="landing-step-connector" />}
            </React.Fragment>
          ))}
        </div>
      </FadeSection>

      {/* CTA Banner */}
      <FadeSection className="landing-cta-banner">
        <h2 className="landing-cta-title">Ready for the career fair?</h2>
        <p className="landing-cta-sub">Join students who prep smarter with AI4Careers.</p>
        <button className="landing-btn-solid landing-btn-lg landing-btn-hero" onClick={() => navigate('/signup')}>
          Create Your Free Account →
        </button>
      </FadeSection>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">AI4Careers</div>
        <div className="landing-footer-links">
          <span onClick={() => navigate('/login')} className="landing-footer-link">Log In</span>
          <span onClick={() => navigate('/signup')} className="landing-footer-link">Sign Up</span>
        </div>
        <div className="landing-footer-copy">EECS 449 · University of Michigan · © 2026 AI4Careers</div>
      </footer>
    </div>
  );
}

export default Landing;
