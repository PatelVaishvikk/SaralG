'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function BabyShowerRSVP() {
  /* ── refs ── */
  const canvasRef = useRef(null);

  /* ── state ── */
  const [showGate, setShowGate] = useState(true);
  const [gateFading, setGateFading] = useState(false);
  const [entered, setEntered] = useState(false);
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [formData, setFormData] = useState({
    name: '',
    attending: 'yes',
    guestsCount: '1',
    genderGuess: '',
    excitedFor: '',
    message: '',
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'success' });

  /* ── Enter site ── */
  const enterSite = useCallback(() => {
    setGateFading(true);
    setTimeout(() => {
      setShowGate(false);
      setEntered(true);
      document.body.style.overflow = 'auto';
    }, 800);
  }, []);

  /* ── Petals canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#D4806A', '#E8C07A', '#C9963E', '#B85940', '#EEDDD3', '#F5E4C0'];
    const COUNT = window.innerWidth < 600 ? 28 : 52;
    const petals = [];

    class Petal {
      constructor() { this.reset(true); }
      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height * 2 - canvas.height : -20;
        this.r = 4 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = 0.6 + Math.random() * 1.2;
        this.rot = Math.random() * Math.PI * 2;
        this.drot = (Math.random() - 0.5) * 0.04;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.5 + Math.random() * 0.4;
      }
      update() {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.4;
        this.y += this.vy;
        this.rot += this.drot;
        if (this.y > canvas.height + 20) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());
    let raf;
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Countdown ── */
  useEffect(() => {
    const target = new Date('May 30, 2026 17:00:00 GMT-0400');
    const fmt = n => String(n).padStart(2, '0');

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ d: '🎉', h: '🎉', m: '🎉', s: '🎉' });
        return;
      }
      setCountdown({
        d: fmt(Math.floor(diff / 86400000)),
        h: fmt(Math.floor((diff % 86400000) / 3600000)),
        m: fmt(Math.floor((diff % 3600000) / 60000)),
        s: fmt(Math.floor((diff % 60000) / 1000)),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Scroll reveal ── */
  useEffect(() => {
    if (!entered) return;
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [entered]);

  /* ── Body overflow ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(p => ({ ...p, image: files[0] || null }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const body = new FormData();
    body.append('name', formData.name);
    body.append('attending', formData.attending);
    if (formData.guestsCount) body.append('guestsCount', formData.guestsCount);
    if (formData.genderGuess) body.append('genderGuess', formData.genderGuess);
    if (formData.excitedFor) body.append('excitedFor', formData.excitedFor);
    if (formData.message) body.append('message', formData.message);
    if (formData.image) body.append('image', formData.image);

    try {
      const res = await fetch('/api/rsvp', { method: 'POST', body });
      const data = await res.json();
      setModal({ open: true, type: data.success ? 'success' : 'error' });
      if (data.success) {
        setFormData({ name: '', attending: 'yes', guestsCount: '1', genderGuess: '', excitedFor: '', message: '', image: null });
      }
    } catch {
      setModal({ open: true, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     R E N D E R
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* Petals */}
      <canvas ref={canvasRef} className={`petals-canvas${entered ? ' active' : ''}`} />

      {/* ── ENTRY GATE ── */}
      {showGate && (
        <div className={`entry-gate${gateFading ? ' fade-out' : ''}`} onClick={enterSite}>
          <div className="gate-content">
            <div className="gate-icon">
              <span>🌙</span><span>⭐</span><span>🧸</span>
            </div>
            <p className="gate-label">You are cordially invited to</p>
            <h1 className="gate-title">Sonal&apos;s</h1>
            <h2 className="gate-subtitle">Baby Shower</h2>
            <div className="gate-divider" />
            <p className="gate-date">Saturday, May 30, 2026</p>
            <p className="gate-cta">Tap to Open</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className={`main-content${entered ? ' visible fade-in' : ''}`}>

        {/* ══ HERO ══ */}
        <section id="hero">
          <div className="hero-frame"><span></span></div>

          <div className="hero-card">
            <div className="card-corner tl" />
            <div className="card-corner tr" />
            <div className="card-corner bl" />
            <div className="card-corner br" />

            <div className="hero-emoji">
              <span>🌙</span><span>⭐</span><span>🧸</span>
            </div>

            <p className="blessings-text">
              With the divine grace of Aksharpurushottam Maharaj and the blessings
              of Guruhari Hariprasad Swamiji Maharaj and Guruhari Premswaroop Swamiji Maharaj
            </p>

            <div className="hero-ornament">
              <div className="hero-ornament-line" />
              <div className="hero-ornament-diamond" />
              <div className="hero-ornament-line" />
            </div>

            <p className="hero-event-label">Honouring the Mummy-to-be</p>
            <span className="hero-name shimmer-gold">Sonal</span>

            <p className="hero-desc">
              As Saral and Sonal prepare to welcome a sweet soul,
              we warmly invite you to the baby shower
            </p>

            <div className="date-display">
              <span className="date-num">30</span>
              <span className="date-divider-v" />
              <span className="date-month">MAY</span>
              <span className="date-divider-v" />
              <span className="date-num">26</span>
            </div>

            <p className="hero-day">Saturday · 5 o&apos;clock in the afternoon</p>
            <p className="hero-venue-line">1075 Ypres Ave, Windsor, ON</p>
          </div>

          <div className="scroll-cue">
            <p>Scroll</p>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* ══ COUNTDOWN ══ */}
        <section id="countdown-section">
          <div className="countdown-card reveal">
            <span className="section-label">The Special Day</span>
            <p className="countdown-quote">
              A precious little star is on its way to light up our world
            </p>
            <p className="countdown-date">Saturday · 30th May 2026</p>

            <div className="countdown-grid">
              {[
                { val: countdown.d, label: 'Days' },
                { val: countdown.h, label: 'Hours' },
                { val: countdown.m, label: 'Mins' },
                { val: countdown.s, label: 'Secs' },
              ].map(u => (
                <div className="countdown-unit" key={u.label}>
                  <span className="countdown-number">{u.val}</span>
                  <span className="countdown-label">{u.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ VENUE ══ */}
        <section id="venue-section">
          <div className="text-center reveal">
            <span className="section-label">Where Love Awaits</span>
            <h2 className="section-heading">The Venue</h2>
            <div className="ornament mt-4 mb-8">
              <div className="ornament-line rev" />
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <div className="ornament-line" />
            </div>
          </div>

          <div className="venue-card reveal reveal-delay-2">
            <div className="venue-info text-center">
              <h3 className="venue-name">Optimist Memorial Park</h3>
              <p className="venue-address">
                1075 Ypres Ave<br />
                Windsor, ON N8W 1S1
              </p>
              <iframe
                className="venue-map"
                src="https://maps.google.com/maps?q=1075+Ypres+Ave+Windsor+ON+N8W+1S1&t=&z=15&ie=UTF8&iwloc=&output=embed"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Venue map"
              />
              <br />
              <a
                className="directions-btn"
                href="https://www.google.com/maps/search/?api=1&query=1075+Ypres+Ave+Windsor+ON+N8W+1S1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </div>
          </div>
        </section>

        {/* ══ RSVP ══ */}
        <section id="rsvp-section">
          <div className="text-center reveal">
            <span className="section-label">Join the Celebration</span>
            <h2 className="section-heading">Celebrate<br />With Us</h2>
            <p className="reveal reveal-delay-2 mt-4" style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
              A few fun questions before the big day!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rsvp-form">

            {/* Guest Details */}
            <div className="form-card reveal">
              <p className="form-card-title">Guest Details</p>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor="f-name">Your Name</label>
                <input
                  className="field-input"
                  type="text"
                  id="f-name"
                  name="name"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Attending */}
            <div className="form-card reveal reveal-delay-1">
              <p className="form-card-title">Will you join us?</p>
              <div className="radio-pill-row">
                <label
                  className={`radio-pill${formData.attending === 'yes' ? ' selected' : ''}`}
                  onClick={() => setFormData(p => ({ ...p, attending: 'yes' }))}
                >
                  <input type="radio" name="attending" value="yes" readOnly checked={formData.attending === 'yes'} />
                  Joyfully Accept ✨
                </label>
                <label
                  className={`radio-pill${formData.attending === 'no' ? ' selected' : ''}`}
                  onClick={() => setFormData(p => ({ ...p, attending: 'no' }))}
                >
                  <input type="radio" name="attending" value="no" readOnly checked={formData.attending === 'no'} />
                  Regretfully Decline
                </label>
              </div>
            </div>

            {/* Guest Count */}
            <div className="form-card reveal reveal-delay-1">
              <p className="form-card-title">Party Size</p>
              <p className="form-card-subtitle">How many people will be attending?</p>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <select
                  className="field-input"
                  name="guestsCount"
                  value={formData.guestsCount}
                  onChange={handleChange}
                >
                  <option value="1">1 (Just me)</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6+">6+ Guests</option>
                </select>
              </div>
            </div>

            {/* Gender Guess */}
            <div className="form-card reveal reveal-delay-1">
              <p className="form-card-title">Make a Guess!</p>
              <p className="form-card-subtitle">Boy or Girl?</p>
              <div className="circle-select">
                {[
                  { val: 'Boy', icon: '👦', label: 'Boy' },
                  { val: 'Girl', icon: '👧', label: 'Girl' },
                  { val: 'Surprise', icon: '🎁', label: 'Surprise' },
                ].map(o => (
                  <label
                    key={o.val}
                    className={`circle-opt${formData.genderGuess === o.val ? ' selected' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, genderGuess: o.val }))}
                  >
                    <input type="radio" name="genderGuess" value={o.val} readOnly checked={formData.genderGuess === o.val} />
                    <div className="circle-face">{o.icon}</div>
                    <span className="circle-opt-label">{o.label}</span>
                  </label>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '1rem' }}>
                Reveal after the shower 😉
              </p>
            </div>


            {/* Photo Upload */}
            <div className="form-card reveal reveal-delay-2">
              <p className="form-card-title">A Little Surprise 🎉</p>
              <p className="form-card-subtitle">Upload your photo and get surprised at the event!</p>
              <div className={`upload-zone${formData.image ? ' active' : ''}`}>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                />
                <p className="upload-zone-text">
                  {formData.image
                    ? `${formData.image.name} attached ✓`
                    : 'Tap to choose a photo'
                  }
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="reveal reveal-delay-3" style={{ marginTop: '2rem' }}>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Love'}
              </button>
            </div>
          </form>
        </section>

        {/* ══ FOOTER ══ */}
        <section id="footer-section">
          <div className="reveal">
            <span className="footer-names">Saral &amp; Sonal</span>
            <div className="footer-divider">
              <div className="footer-divider-line" />
              <span className="footer-heart">♥</span>
              <div className="footer-divider-line" />
            </div>
            <p className="footer-info">
              May 30, 2026 · 1075 Ypres Ave, Windsor, ON
            </p>
          </div>
        </section>
      </div>

      {/* ── MODAL ── */}
      {modal.open && (
        <div className="rsvp-modal" onClick={e => { if (e.target === e.currentTarget) setModal({ open: false }); }}>
          <div className="modal-card">
            <div className="modal-icon-ring">
              {modal.type === 'success' ? '✓' : '✕'}
            </div>
            <h3 className="modal-title">
              {modal.type === 'success' ? 'Thank You!' : 'Oops!'}
            </h3>
            <p className="modal-msg">
              {modal.type === 'success'
                ? "We can't wait to celebrate with you on our special day!"
                : 'There was an error. Please try again.'
              }
            </p>
            <button className="modal-close-btn" onClick={() => setModal({ open: false })}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
