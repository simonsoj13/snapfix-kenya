import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

const WA = '254700815576';
const WA_LINK = 'https://wa.me/' + WA;

function getBetaDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', whatsapp: '', location: 'Nairobi', description: ''
  });
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = document.querySelectorAll('.sf-fade');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(28px)';
      (el as HTMLElement).style.transition = 'opacity 0.65s ease, transform 0.65s ease';
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };
  const goForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.description) return;
    console.log('Snap-Fix Quote:', { ...formData, fileName, submittedAt: new Date().toISOString() });
    setSubmitted(true);
  };

  const s: Record<string, React.CSSProperties> = {
    // layout
    page: { fontFamily: "'DM Sans', sans-serif", color: '#1e293b', background: '#fff', overflowX: 'hidden' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
    // nav
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,15,30,0.93)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between' },
    navLogo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', cursor: 'pointer', letterSpacing: '-0.02em' },
    navLinks: { display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 },
    navLink: { color: 'rgba(255,255,255,0.65)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    navLogin: { color: 'rgba(255,255,255,0.45)', fontSize: 14, cursor: 'pointer', textDecoration: 'none' },
    btnNav: { background: '#16a34a', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
    // hero
    hero: { background: '#0a0f1e', minHeight: '100vh', padding: '120px 24px 80px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    heroInner: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', width: '100%' },
    heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '6px 14px', fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 24, letterSpacing: '0.04em' },
    heroH1: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(30px,4.5vw,50px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 },
    heroP: { fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 },
    heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap' as const },
    heroImg: { background: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '4/3', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.3)', fontSize: 14, position: 'relative' as const, overflow: 'hidden' },
    heroImgTag: { position: 'absolute' as const, bottom: 16, right: 16, background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 100 },
    // buttons
    btnPrimary: { background: '#16a34a', color: '#fff', border: 'none', padding: '13px 26px', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    btnOutline: { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '13px 26px', borderRadius: 12, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
    // trust
    trust: { background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' },
    trustGrid: { maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
    trustItem: { display: 'flex', alignItems: 'center', gap: 10 },
    trustIcon: { width: 38, height: 38, background: 'rgba(22,163,74,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 },
    // sections
    section: { padding: '80px 24px' },
    sectionWhite: { padding: '80px 24px', background: '#fff' },
    sectionGray: { padding: '80px 24px', background: '#f8fafc' },
    sectionDark: { padding: '80px 24px', background: '#0a0f1e' },
    eyebrow: { fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 },
    h2: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14 },
    h2dark: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14 },
    sub: { fontSize: 16, color: '#475569', lineHeight: 1.7, maxWidth: 540 },
    subdark: { fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 540 },
    // cards
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 24px', transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s' },
    // form
    input: { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 6 },
    btnSubmit: { width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: 15, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  };

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navLogo}>Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya</div>
        <ul style={{ ...s.navLinks, display: window.innerWidth < 768 ? 'none' : 'flex' }}>
          <li style={s.navLink} onClick={() => go('how')}>How It Works</li>
          <li style={s.navLink} onClick={() => go('services')}>Services</li>
          <li style={s.navLink} onClick={() => alert('Fundi sign-up coming soon!')}>Become a Fundi</li>
          <li style={s.navLink} onClick={goForm}>Contact</li>
        </ul>
        <div style={s.navRight}>
          <a href="/login" style={s.navLogin}>Login</a>
          <button style={s.btnNav} onClick={goForm}>Get Quote</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={s.hero} id="hero">
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, background: 'radial-gradient(circle, rgba(22,163,74,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={s.heroInner}>
          <div>
            <div className="sf-fade" style={s.heroBadge}>
              <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
              🇰🇪 Now serving Nairobi, Mombasa &amp; Kisumu
            </div>
            <h1 className="sf-fade" style={s.heroH1}>
              Get Your Home Fixed Today —{' '}
              <span style={{ color: '#22c55e' }}>Verified Fundis</span> at Your Door
            </h1>
            <p className="sf-fade" style={s.heroP}>
              No more Facebook posts, no-shows, or shoddy work. Background-checked professionals, M-Pesa payment protection, and a work guarantee.
            </p>
            <div className="sf-fade" style={s.heroCtas}>
              <button style={s.btnPrimary} onClick={goForm}>📸 Get a Free Quote</button>
              <button style={s.btnOutline} onClick={() => go('services')}>Browse Verified Fundis →</button>
            </div>
          </div>
          <div className="sf-fade" style={s.heroImg}>
            <span style={{ fontSize: 52, opacity: 0.35 }}>🏠</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Hero photo goes here</span>
            <div style={s.heroImgTag}>✓ Verified Fundi</div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={s.trust}>
        <div style={s.trustGrid}>
          {[
            { icon: '🪪', title: 'ID-Verified Workers', sub: 'Every fundi background-checked' },
            { icon: '📱', title: 'M-Pesa Protection', sub: 'Pay only when satisfied' },
            { icon: '🔒', title: 'Work Guarantee', sub: 'Free redo if not right' },
            { icon: '⚡', title: '45 Min Avg Response', sub: 'Fast dispatch, any day' },
          ].map((t) => (
            <div key={t.title} className="sf-fade" style={s.trustItem}>
              <div style={s.trustIcon}>{t.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section style={s.sectionGray} id="problem">
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div className="sf-fade">
            <div style={s.eyebrow}>The Problem</div>
            <h2 style={s.h2}>Tired of Fundis Who Ghost You?</h2>
            <p style={s.sub}>Finding a reliable fundi in Kenya has always been a gamble — Facebook posts, WhatsApp groups, with zero accountability.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0' }}>
              {['Fundis who confirm then never show up', 'No way to check their real skills or history', 'Prices change after work begins', 'No recourse when the job is done badly', 'Unsafe — no background checks at all'].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: 15, color: '#475569', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0 }}>✕</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-fade" style={{ background: '#0a0f1e', borderRadius: 20, padding: 36 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#22c55e', marginBottom: 16 }}>Snap-Fix Kenya fixes this.</div>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20 }}>Every fundi is vetted, prices are agreed upfront, and your M-Pesa payment is held securely until the job is done right.</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 28 }}>No more stress. No more wasted days. Just reliable home repairs, on demand.</p>
            <button style={s.btnPrimary} onClick={goForm}>Book a fundi now →</button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...s.sectionWhite, textAlign: 'center' }} id="how">
        <div style={s.container}>
          <div className="sf-fade" style={s.eyebrow}>How It Works</div>
          <h2 className="sf-fade" style={{ ...s.h2, textAlign: 'center' }}>Repairs sorted in 3 steps</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, margin: '48px 0' }}>
            {[
              { num: '1', icon: '📸', title: 'Snap It', desc: 'Describe the problem and upload a photo so fundis know exactly what is needed.' },
              { num: '2', icon: '🔍', title: 'Get Matched', desc: 'We connect you with nearby verified fundis and you compare quotes before choosing.' },
              { num: '3', icon: '✅', title: 'Fix It', desc: 'Fundi arrives, completes the job, and you release M-Pesa payment only when happy.' },
            ].map((step) => (
              <div key={step.num} className="sf-fade" style={{ ...s.card, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.num}</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <button className="sf-fade" style={s.btnPrimary} onClick={goForm}>Start Your Repair Request →</button>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={s.sectionGray} id="services">
        <div style={s.container}>
          <div className="sf-fade" style={s.eyebrow}>What We Fix</div>
          <h2 className="sf-fade" style={s.h2}>Our Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 40 }}>
            {[
              { emoji: '🔧', name: 'Plumbing', desc: 'Leaks, blockages, installations, water heaters' },
              { emoji: '⚡', name: 'Electrical', desc: 'Wiring, sockets, circuits, safety inspections' },
              { emoji: '🪵', name: 'Carpentry', desc: 'Doors, cabinets, furniture repair & fitting' },
              { emoji: '🎨', name: 'Painting', desc: 'Interior & exterior, walls, ceilings, trim' },
              { emoji: '🧱', name: 'Masonry', desc: 'Tiling, plastering, brickwork, waterproofing' },
              { emoji: '🛠️', name: 'General Repairs', desc: 'Anything else — if it is broken, we will fix it' },
            ].map((svc) => (
              <div key={svc.name} className="sf-fade" style={{ ...s.card, cursor: 'pointer' }} onClick={goForm}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{svc.emoji}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{svc.name}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{svc.desc}</div>
                <div style={{ color: '#16a34a', fontSize: 16 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SNAPFIX ── */}
      <section style={s.sectionWhite} id="why">
        <div style={s.container}>
          <div className="sf-fade" style={s.eyebrow}>Why Choose Us</div>
          <h2 className="sf-fade" style={s.h2}>Built for Kenyan homes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginTop: 40 }}>
            {[
              { icon: '🪪', title: 'Verified Fundis', desc: 'Every professional is ID-verified and background-checked. You see their real name, photo, and work history before booking.' },
              { icon: '🏷️', title: 'Transparent Pricing', desc: 'Get quotes upfront before any work begins. No hidden charges, no price changes halfway through.' },
              { icon: '📱', title: 'M-Pesa Protection', desc: 'Your payment is held securely and only released when you confirm the job is complete.' },
              { icon: '🛡️', title: 'Female-Safe Service', desc: 'Verified female-friendly fundis available, and companion-requests allowed for all home visit bookings.' },
            ].map((w) => (
              <div key={w.title} className="sf-fade" style={{ ...s.card, display: 'flex', gap: 18, alignItems: 'flex-start', background: '#f8fafc' }}>
                <div style={{ width: 48, height: 48, background: '#dcfce7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{w.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{w.title}</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA BANNER ── */}
      <section style={{ padding: '60px 24px', background: '#0a0f1e' }} id="beta">
        <div style={s.container}>
          <div className="sf-fade" style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', borderRadius: 20, padding: '44px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' as const }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '4px 12px', borderRadius: 100, marginBottom: 12 }}>🚀 Beta Launch Offer</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Be Among Our First 20 Homeowners</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 12 }}>First repair at <strong style={{ color: '#fff' }}>materials cost only</strong> — zero labor charges.</div>
              <div style={{ fontSize: 13, color: '#fbbf24' }}>⏳ Offer expires: <strong style={{ color: '#fff' }}>{getBetaDeadline()}</strong></div>
            </div>
            <button style={{ background: '#fbbf24', color: '#1c1600', border: 'none', padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }} onClick={goForm}>Claim My Beta Spot →</button>
          </div>
        </div>
      </section>

      {/* ── RECENT JOBS ── */}
      <section style={s.sectionGray} id="jobs">
        <div style={s.container}>
          <div className="sf-fade" style={s.eyebrow}>Recent Work</div>
          <h2 className="sf-fade" style={s.h2}>Jobs completed by our fundis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 40 }}>
            {[
              { cat: 'Plumbing', loc: 'Westlands, Nairobi', fundi: 'John Mwangi', quote: 'Pipe burst fixed in under an hour. Very professional, cleaned up after himself.' },
              { cat: 'Electrical', loc: 'Kilimani, Nairobi', fundi: 'Sarah Achieng', quote: 'Fixed my wiring fault same evening. Transparent pricing, no surprises.' },
            ].map((job) => (
              <div key={job.fundi} className="sf-fade" style={{ ...s.card, overflow: 'hidden', padding: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 130 }}>
                  <div style={{ background: '#f1f5f9', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#94a3b8', position: 'relative' as const }}>
                    <span style={{ fontSize: 24 }}>📷</span>
                    <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 100 }}>Before</span>
                  </div>
                  <div style={{ background: '#e8f5e9', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#94a3b8', position: 'relative' as const }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 100 }}>After</span>
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <span style={{ display: 'inline-block', background: '#dcfce7', color: '#14532d', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{job.cat}</span>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>📍 {job.loc}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Fundi: {job.fundi}</div>
                  <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 1.5, borderLeft: '3px solid #dcfce7', paddingLeft: 10 }}>"{job.quote}"</div>
                </div>
              </div>
            ))}
            <div className="sf-fade" style={{ border: '2px dashed #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 24px', textAlign: 'center' as const, color: '#94a3b8' }}>
              <span style={{ fontSize: 32 }}>🏠</span>
              <strong style={{ fontSize: 15, color: '#475569' }}>Be our next success story</strong>
              <p style={{ fontSize: 13 }}>Your before &amp; after could be right here.</p>
              <button style={{ ...s.btnPrimary, fontSize: 13, padding: '10px 20px', marginTop: 8 }} onClick={goForm}>Book a fundi</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE FORM ── */}
      <section style={s.sectionGray} id="quote">
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div className="sf-fade" ref={formRef}>
            <div style={s.eyebrow}>Free Quote</div>
            <h2 style={s.h2}>Stop Stressing.<br />Start Fixing.</h2>
            <p style={s.sub}>Tell us what's broken and we'll connect you with the right fundi, fast. No commitment required.</p>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginTop: 32 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>What happens next</div>
              {['We review your request within 30 minutes', 'You get matched with a verified fundi nearby', 'You receive a fixed quote before any work begins', 'Pay only when the job is done to your satisfaction'].map((p) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#16a34a' }}>✓</span> {p}
                </div>
              ))}
            </div>
          </div>
          <div className="sf-fade" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Quote submitted!</div>
                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>Thanks {formData.name}! We'll WhatsApp you within 30 minutes with a matched fundi.</p>
                <button style={{ ...s.btnPrimary, marginTop: 24 }} onClick={() => setSubmitted(false)}>Submit another request</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={s.label}>Your name</label>
                    <input style={s.input} type="text" placeholder="e.g. Jane Kamau" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={s.label}>Phone number</label>
                    <input style={s.input} type="tel" placeholder="0712 345 678" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>WhatsApp <span style={{ color: '#94a3b8', fontWeight: 400 }}>(if different)</span></label>
                  <input style={s.input} type="tel" placeholder="Same as above if same" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>Your location</label>
                  <select style={s.input} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}>
                    <option>Nairobi</option>
                    <option>Mombasa</option>
                    <option>Kisumu</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>What needs fixing?</label>
                  <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }} placeholder="e.g. Leaking pipe under the kitchen sink..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={s.label}>Upload a photo <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
                    <div style={{ fontSize: 14, color: fileName ? '#16a34a' : '#94a3b8', pointerEvents: 'none' }}>
                      {fileName ? `✅ ${fileName}` : '📷 Click to upload a photo'}
                    </div>
                  </div>
                </div>
                <button type="submit" style={s.btnSubmit}>Get My Free Quote →</button>
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, color: '#475569' }}>
                  Or WhatsApp us: <a href={WA_LINK} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 500 }}>+254 700 815 576</a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0f1e', color: 'rgba(255,255,255,0.5)', padding: '56px 24px 28px' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>Connecting Kenyan homeowners with trusted, verified repair professionals.</p>
            <div style={{ fontSize: 13, marginBottom: 6 }}>📱 WhatsApp: +254 700 815 576</div>
            <div style={{ fontSize: 13 }}>✉️ hello@snapfixkenya.co.ke</div>
          </div>
          {[
            { title: 'Services', links: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Masonry', 'General Repairs'] },
            { title: 'Quick Links', links: ['How It Works', 'Why Snap-Fix', 'Beta Offer', 'Become a Fundi', 'Login'] },
            { title: 'Locations', links: ['Nairobi', 'Mombasa', 'Kisumu', 'More cities soon'] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#fff', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((l) => (
                  <li key={l} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={l === 'Login' ? () => navigate('/login') : goForm}>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ ...s.container, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)', flexWrap: 'wrap' as const, gap: 10 }}>
          <span>© 2025 Snap-Fix Kenya. All rights reserved.</span>
          <span>Built with ❤️ for Kenyan homes</span>
        </div>
      </footer>
    </div>
  );
}
