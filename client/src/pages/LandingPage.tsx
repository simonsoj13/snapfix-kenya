import { useState, useEffect } from 'react';
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
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', location: 'Nairobi', description: '' });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { overflow-x: hidden; }
      .sf-fade { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
      .sf-fade.visible { opacity: 1; transform: none; }
      .sf-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); border-color: #22c55e !important; }
      .sf-card { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
      .sf-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      .sf-btn { transition: opacity 0.2s, transform 0.15s; }
      @media (max-width: 768px) {
        .sf-two-col { grid-template-columns: 1fr !important; }
        .sf-three-col { grid-template-columns: 1fr 1fr !important; }
        .sf-four-col { grid-template-columns: 1fr 1fr !important; }
        .sf-hide-mobile { display: none !important; }
        .sf-hero-h1 { font-size: 32px !important; }
        .sf-section { padding: 52px 20px !important; }
        .sf-nav-links { display: none !important; }
        .sf-form-row { grid-template-columns: 1fr !important; }
        .sf-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
      }
      @media (max-width: 480px) {
        .sf-three-col { grid-template-columns: 1fr !important; }
        .sf-four-col { grid-template-columns: 1fr 1fr !important; }
        .sf-hero-h1 { font-size: 28px !important; }
        .sf-ctas { flex-direction: column !important; }
        .sf-ctas button { width: 100%; justify-content: center; }
        .sf-footer-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    setTimeout(() => {
      document.querySelectorAll('.sf-fade').forEach(el => observer.observe(el));
    }, 100);
    return () => { observer.disconnect(); document.head.removeChild(style); };
  }, []);

  const goLogin = () => navigate('/login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.description) return;
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1e293b', background: 'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(/hero-bg.jpg) center/cover fixed no-repeat', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
          Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya
        </div>
        <ul className="sf-nav-links" style={{ display: 'flex', gap: 24, listStyle: 'none', margin: 0, padding: 0 }}>
          {[['How It Works','how'],['Services','services'],['Contact','quote']].map(([label, id]) => (
            <li key={id} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, cursor: 'pointer' }}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{label}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none' }}>Login</a>
          <button className="sf-btn" onClick={goLogin} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Get Quote</button>
          <div style={{ display: 'none' }} className="sf-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <div style={{ width: 22, height: 2, background: '#fff', marginBottom: 5, borderRadius: 2 }} />
            <div style={{ width: 22, height: 2, background: '#fff', marginBottom: 5, borderRadius: 2 }} />
            <div style={{ width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 99, background: 'rgba(10,15,30,0.98)', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {[['How It Works','how'],['Services','services'],['Contact','quote']].map(([label, id]) => (
            <div key={id} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
              onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }}>{label}</div>
          ))}
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, padding: '12px 0', cursor: 'pointer' }} onClick={() => { navigate('/login'); setMenuOpen(false); }}>Login</div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ background: '#0a0f1e', minHeight: '100vh', padding: '100px 20px 72px', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <div className="sf-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            🇰🇪 Now serving Nairobi, Mombasa & Kisumu
          </div>
          <h1 className="sf-fade sf-hero-h1" style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 18 }}>
            Get Your Home Fixed Today —{' '}
            <span style={{ color: '#22c55e' }}>Verified Fundis</span> at Your Door
          </h1>
          <p className="sf-fade" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 32, maxWidth: 520 }}>
            No more Facebook posts, no-shows, or shoddy work. Background-checked professionals, M-Pesa payment protection, and a work guarantee.
          </p>
          <div className="sf-fade sf-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="sf-btn" onClick={goLogin} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '13px 24px', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              📸 Get a Free Quote
            </button>
            <button className="sf-btn" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '13px 24px', borderRadius: 12, fontSize: 15, cursor: 'pointer' }}>
              Browse Services →
            </button>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px' }}>
        <div className="sf-four-col" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { icon: '🪪', title: 'ID-Verified Workers', sub: 'Background-checked' },
            { icon: '📱', title: 'M-Pesa Protection', sub: 'Pay when satisfied' },
            { icon: '🔒', title: 'Work Guarantee', sub: 'Free redo if wrong' },
            { icon: '⚡', title: '45 Min Response', sub: 'Fast dispatch, any day' },
          ].map(t => (
            <div key={t.title} className="sf-fade" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(22,163,74,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(248,250,252,0.85)' }} id="problem">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>The Problem</div>
          <h2 className="sf-fade" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 16, maxWidth: 480 }}>Tired of Fundis Who Ghost You?</h2>
          <p className="sf-fade" style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
            Finding a reliable fundi in Kenya has always been a gamble — Facebook posts, WhatsApp groups, with zero accountability.
          </p>
          <div className="sf-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="sf-fade">
              {['Fundis who confirm then never show up','No way to verify skills or work history','Prices change after work begins','No recourse when the job is done badly','Unsafe — no background checks'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, padding: '11px 0', borderBottom: '1px solid #e2e8f0', fontSize: 15, color: '#475569', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}>✕</span> {item}
                </div>
              ))}
            </div>
            <div className="sf-fade" style={{ background: '#0a0f1e', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: '#22c55e', marginBottom: 14 }}>Snap-Fix Kenya fixes this.</div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 18 }}>Every fundi is vetted, prices are agreed upfront, and your M-Pesa payment is held securely until the job is done right.</p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 24 }}>No more stress. No more wasted days. Reliable home repairs, on demand.</p>
              <button className="sf-btn" onClick={goLogin} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>Book a fundi now →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(255,255,255,0.85)', textAlign: 'center' }} id="how">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>How It Works</div>
          <h2 className="sf-fade" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 40 }}>Repairs sorted in 3 steps</h2>
          <div className="sf-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 36 }}>
            {[
              { num: '1', icon: '📸', title: 'Snap It', desc: 'Describe your problem and optionally upload a photo so fundis know what is needed.' },
              { num: '2', icon: '🔍', title: 'Get Matched', desc: 'We connect you with nearby verified fundis and you compare quotes before choosing.' },
              { num: '3', icon: '✅', title: 'Fix It', desc: 'Fundi arrives, completes the job, and you release M-Pesa payment only when happy.' },
            ].map(step => (
              <div key={step.num} className="sf-fade sf-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px 20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.num}</div>
                <div style={{ fontSize: 34, marginBottom: 14 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <button className="sf-btn" onClick={goLogin} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>Start Your Repair Request →</button>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(248,250,252,0.85)' }} id="services">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>What We Fix</div>
          <h2 className="sf-fade" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 8 }}>Our Services</h2>
          <p className="sf-fade" style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 36 }}>From small leaks to full rewires — our verified fundis cover it all.</p>
          <div className="sf-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { emoji: '🔧', name: 'Plumbing', desc: 'Leaks, blockages, installations, water heaters' },
              { emoji: '⚡', name: 'Electrical', desc: 'Wiring, sockets, circuits, safety inspections' },
              { emoji: '🪵', name: 'Carpentry', desc: 'Doors, cabinets, furniture repair & fitting' },
              { emoji: '🎨', name: 'Painting', desc: 'Interior & exterior, walls, ceilings, trim' },
              { emoji: '🧱', name: 'Masonry', desc: 'Tiling, plastering, brickwork, waterproofing' },
              { emoji: '🛠️', name: 'General Repairs', desc: 'If it is broken, we will fix it' },
            ].map(svc => (
              <div key={svc.name} className="sf-fade sf-card" onClick={goLogin} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 18px', cursor: 'pointer' }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{svc.emoji}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{svc.name}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, marginBottom: 10 }}>{svc.desc}</div>
                <div style={{ color: '#16a34a', fontSize: 15 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SNAPFIX ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(255,255,255,0.85)' }} id="why">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Why Choose Us</div>
          <h2 className="sf-fade" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 36 }}>Built for Kenyan homes</h2>
          <div className="sf-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { icon: '🪪', title: 'Verified Fundis', desc: 'Every professional is ID-verified and background-checked. See their real name, photo, and work history before booking.' },
              { icon: '🏷️', title: 'Transparent Pricing', desc: 'Get a fixed quote before any work begins. No hidden charges, no price changes halfway through the job.' },
              { icon: '📱', title: 'M-Pesa Protection', desc: 'Your payment is held securely and only released when you confirm the job is complete to your satisfaction.' },
              { icon: '🛡️', title: 'Verified Female Fundis', desc: 'Book from our pool of verified female fundis for a safe and comfortable home service experience.' },
            ].map(w => (
              <div key={w.title} className="sf-fade sf-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{w.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{w.title}</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA BANNER ── */}
      <section style={{ padding: '48px 20px', background: '#0a0f1e' }} id="beta">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', borderRadius: 16, padding: '36px 28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '4px 12px', borderRadius: 100, marginBottom: 14 }}>🚀 Beta Launch Offer</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Be Among Our First 20 Homeowners</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 10 }}>First repair at <strong style={{ color: '#fff' }}>materials cost only</strong> — zero labor charges.</div>
            <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 24 }}>⏳ Offer expires: <strong style={{ color: '#fff' }}>{getBetaDeadline()}</strong></div>
            <button className="sf-btn" onClick={goLogin} style={{ background: '#fbbf24', color: '#1c1600', border: 'none', padding: '13px 26px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Claim My Beta Spot →</button>
          </div>
        </div>
      </section>

      {/* ── RECENT JOBS ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(248,250,252,0.85)' }} id="jobs">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-fade" style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Work</div>
          <h2 className="sf-fade" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 36 }}>Jobs completed by our fundis</h2>
          <div className="sf-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { cat: 'Plumbing', loc: 'Westlands, Nairobi', fundi: 'John Mwangi', quote: 'Pipe burst fixed in under an hour. Very professional, cleaned up after himself.' },
              { cat: 'Electrical', loc: 'Kilimani, Nairobi', fundi: 'Sarah Achieng', quote: 'Fixed my wiring fault same evening. Transparent pricing, no surprises.' },
            ].map(job => (
              <div key={job.fundi} className="sf-fade sf-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 120 }}>
                  <div style={{ background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 28 }}>
                    📷
                    <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 100 }}>Before</span>
                  </div>
                  <div style={{ background: '#e8f5e9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 28 }}>
                    ✅
                    <span style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 100 }}>After</span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-block', background: '#dcfce7', color: '#14532d', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{job.cat}</span>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>📍 {job.loc}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Fundi: {job.fundi}</div>
                  <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 1.55, borderLeft: '3px solid #dcfce7', paddingLeft: 10 }}>"{job.quote}"</div>
                </div>
              </div>
            ))}
            <div className="sf-fade" style={{ border: '2px dashed #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 20px', textAlign: 'center', color: '#94a3b8', minHeight: 280 }}>
              <span style={{ fontSize: 36 }}>🏠</span>
              <strong style={{ fontSize: 15, color: '#475569' }}>Be our next success story</strong>
              <p style={{ fontSize: 13 }}>Your before & after could be right here.</p>
              <button className="sf-btn" onClick={goLogin} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>Book a fundi</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE FORM ── */}
      <section className="sf-section" style={{ padding: '72px 20px', background: 'rgba(255,255,255,0.85)' }} id="quote">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="sf-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            <div className="sf-fade">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Free Quote</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 14 }}>Stop Stressing.<br />Start Fixing.</h2>
              <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>Tell us what's broken and we'll connect you with the right fundi, fast.</p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 20px' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>What happens next</div>
                {['We review your request within 30 minutes','You get matched with a verified fundi nearby','You receive a fixed quote before any work begins','Pay only when the job is done to your satisfaction'].map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#475569', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="sf-fade" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Request received!</div>
                  <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>Thanks {formData.name}! We'll match you with a verified fundi shortly.</p>
                  <button onClick={() => setSubmitted(false)} style={{ marginTop: 20, background: '#16a34a', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Submit another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="sf-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Your name</label>
                      <input style={{ width: '100%', padding: '11px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} type="text" placeholder="e.g. Jane Kamau" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Phone number</label>
                      <input style={{ width: '100%', padding: '11px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} type="tel" placeholder="0712 345 678" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Your location</label>
                    <select style={{ width: '100%', padding: '11px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                      <option>Nairobi</option><option>Mombasa</option><option>Kisumu</option><option>Other</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>What needs fixing?</label>
                    <textarea style={{ width: '100%', padding: '11px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9, fontFamily: 'inherit', fontSize: 14, outline: 'none', minHeight: 88, resize: 'vertical' }} placeholder="e.g. Leaking pipe under the kitchen sink..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Upload a photo <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                    <div style={{ border: '2px dashed #e2e8f0', borderRadius: 9, padding: '16px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                      <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
                      <div style={{ fontSize: 14, color: fileName ? '#16a34a' : '#94a3b8', pointerEvents: 'none' }}>
                        {fileName ? `✅ ${fileName}` : '📷 Click to upload a photo'}
                      </div>
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Get My Free Quote →</button>
                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#475569' }}>
                    Need help? <a href={WA_LINK} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 500 }}>WhatsApp support</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0f1e', color: 'rgba(255,255,255,0.5)', padding: '52px 20px 28px' }}>
        <div className="sf-footer-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 36, paddingBottom: 36, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Connecting Kenyan homeowners with trusted, verified repair professionals.</p>
            <div style={{ fontSize: 13, marginBottom: 6 }}>📱 WhatsApp: +254 700 815 576</div>
            <div style={{ fontSize: 13 }}>✉️ hello@snapfixkenya.co.ke</div>
          </div>
          {[
            { title: 'Services', links: ['Plumbing','Electrical','Carpentry','Painting','Masonry','General Repairs'] },
            { title: 'Quick Links', links: ['How It Works','Why Snap-Fix','Beta Offer','Login'] },
            { title: 'Locations', links: ['Nairobi','Mombasa','Kisumu','More cities soon'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#fff', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map(l => (
                  <li key={l} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={l === 'Login' ? () => navigate('/login') : undefined}>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1100, margin: '20px auto 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          <span>© 2025 Snap-Fix Kenya. All rights reserved.</span>
          <span>Built with ❤️ for Kenyan homes</span>
        </div>
      </footer>
    </div>
  );
}
