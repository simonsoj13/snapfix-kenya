import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const WA_LINK = 'https://wa.me/254700815576';

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { overflow-x: hidden; }
      .fade { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
      .fade.in { opacity: 1; transform: none; }
      .card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.10); }
      .card { transition: transform 0.2s, box-shadow 0.2s; }
      .btn:hover { opacity: 0.88; transform: translateY(-1px); }
      .btn { transition: all 0.15s; cursor: pointer; border: none; }
      @media (max-width: 768px) {
        .two-col { grid-template-columns: 1fr !important; }
        .three-col { grid-template-columns: 1fr 1fr !important; }
        .four-col { grid-template-columns: 1fr 1fr !important; }
        .hero-h1 { font-size: 30px !important; }
        .section { padding: 48px 18px !important; }
        .nav-links { display: none !important; }
        .hide-mobile { display: none !important; }
      }
      @media (max-width: 480px) {
        .three-col { grid-template-columns: 1fr !important; }
        .hero-h1 { font-size: 26px !important; }
        .ctas { flex-direction: column !important; }
        .ctas button { width: 100%; }
      }
    `;
    document.head.appendChild(style);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    setTimeout(() => document.querySelectorAll('.fade').forEach(el => obs.observe(el)), 100);
    return () => { obs.disconnect(); document.head.removeChild(style); };
  }, []);

  const goApp = () => navigate('/login');

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', background: '#fff', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(10px)', height: 58, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontWeight: 800, fontSize: 19, color: '#fff', letterSpacing: '-0.02em' }}>
          Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 28 }}>
          {[['How It Works','how'],['Services','services'],['Pricing','pricing']].map(([l,id]) => (
            <span key={id} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" onClick={() => navigate('/login')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, padding: '8px 14px', borderRadius: 8 }}>Login</button>
          <button className="btn" onClick={goApp} style={{ background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, padding: '9px 18px', borderRadius: 9 }}>Get Started</button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 58, left: 0, right: 0, zIndex: 99, background: '#0a0f1e', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[['How It Works','how'],['Services','services'],['Pricing','pricing'],['Login',null]].map(([l,id]) => (
            <div key={l} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              onClick={() => { if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); else navigate('/login'); setMenuOpen(false); }}>{l}</div>
          ))}
        </div>
      )}

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d2818 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 20px 60px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%', textAlign: 'center' }}>
          <div className="fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 24, letterSpacing: '0.03em' }}>
            <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
            🇰🇪 Serving Nairobi · Mombasa · Kisumu
          </div>
          <h1 className="fade hero-h1" style={{ fontSize: 46, fontWeight: 800, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Your Home Needs Fixing?<br />
            <span style={{ color: '#22c55e' }}>We Send a Verified Fundi.</span>
          </h1>
          <p className="fade" style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
            Post your job, fundis bid, you pick the best one. Pay via M-Pesa only when the work is done. Simple.
          </p>
          <div className="fade ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={goApp} style={{ background: '#16a34a', color: '#fff', fontSize: 16, fontWeight: 600, padding: '14px 28px', borderRadius: 12 }}>
              📸 Post a Repair Job
            </button>
            <button className="btn" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', color: '#fff', fontSize: 16, padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)' }}>
              See How It Works →
            </button>
          </div>
          {/* Stats */}
          <div className="fade four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 56, maxWidth: 640, margin: '56px auto 0' }}>
            {[['500+','Jobs Done'],['4.8★','Average Rating'],['45min','Avg Response'],['100%','M-Pesa Safe']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ padding: '72px 20px', background: '#f8fafc' }} id="how">
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div className="fade" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Simple Process</div>
          <h2 className="fade" style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>How Snap-Fix Works</h2>
          <p className="fade" style={{ fontSize: 16, color: '#64748b', marginBottom: 48 }}>4 easy steps. Takes less than 3 minutes.</p>
          <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {[
              { step: '1', icon: '📸', title: 'Post Your Job', desc: 'Describe the problem, add a photo, set your budget.' },
              { step: '2', icon: '🙋', title: 'Fundis Apply', desc: 'Nearby verified fundis see your job and claim it.' },
              { step: '3', icon: '💳', title: 'Pay Deposit', desc: 'Pay 30% deposit via M-Pesa to confirm the booking.' },
              { step: '4', icon: '✅', title: 'Job Done!', desc: 'Fundi arrives, fixes it. Pay balance when satisfied.' },
            ].map(s => (
              <div key={s.step} className="fade card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 18px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', width: 26, height: 26, borderRadius: '50%', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.step}</div>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <button className="btn fade" onClick={goApp} style={{ background: '#16a34a', color: '#fff', fontSize: 15, fontWeight: 600, padding: '13px 28px', borderRadius: 12, marginTop: 40 }}>
            Post My First Job →
          </button>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" style={{ padding: '72px 20px', background: '#fff' }} id="services">
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="fade" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Services</div>
          <h2 className="fade" style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>What We Fix</h2>
          <p className="fade" style={{ fontSize: 16, color: '#64748b', marginBottom: 36 }}>From dripping taps to full electrical rewires.</p>
          <div className="three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { e: '🔧', n: 'Plumbing', d: 'Leaks, pipes, water heaters, drainage' },
              { e: '⚡', n: 'Electrical', d: 'Wiring, sockets, circuit breakers' },
              { e: '🪵', n: 'Carpentry', d: 'Doors, cabinets, furniture fitting' },
              { e: '🎨', n: 'Painting', d: 'Interior & exterior walls, ceilings' },
              { e: '🔩', n: 'Welding', d: 'Gates, grills, metal fabrication' },
              { e: '🛠️', n: 'General Repairs', d: 'Anything else that needs fixing' },
            ].map(s => (
              <div key={s.n} className="fade card" onClick={goApp} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 16px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{s.e}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.n}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" style={{ padding: '72px 20px', background: '#f8fafc' }} id="pricing">
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div className="fade" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Fair Pricing</div>
          <h2 className="fade" style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>No Surprises. Ever.</h2>
          <p className="fade" style={{ fontSize: 16, color: '#64748b', marginBottom: 48, maxWidth: 480, margin: '0 auto 48px' }}>You set your budget. Fundis apply. You only pay what was agreed — protected by M-Pesa.</p>
          <div className="three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { cat: 'Plumbing', min: '1,500', max: '8,000' },
              { cat: 'Electrical', min: '2,000', max: '10,000' },
              { cat: 'Carpentry', min: '2,500', max: '12,000' },
              { cat: 'Painting', min: '3,000', max: '20,000' },
              { cat: 'Welding', min: '3,000', max: '15,000' },
              { cat: 'General', min: '1,000', max: '5,000' },
            ].map(p => (
              <div key={p.cat} className="fade card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 18px', textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{p.cat}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>KES {p.min} – {p.max}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Deposit: 30% upfront</div>
              </div>
            ))}
          </div>
          <p className="fade" style={{ fontSize: 13, color: '#94a3b8', marginTop: 24 }}>Final price agreed with fundi before work begins. Balance paid only after completion.</p>
        </div>
      </section>

      {/* WHY SNAPFIX */}
      <section className="section" style={{ padding: '72px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="fade" style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Why Snap-Fix</div>
          <h2 className="fade" style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 36 }}>Built for Kenya. Built for Trust.</h2>
          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: '🪪', title: 'ID-Verified Fundis', desc: 'Every fundi is background-checked with a valid National ID before joining the platform.' },
              { icon: '💳', title: 'M-Pesa Payment Protection', desc: 'Your money is held safely. Released to the fundi only when you confirm the job is done right.' },
              { icon: '⭐', title: 'Rated by Real Customers', desc: 'See genuine reviews and star ratings before choosing your fundi. No fake profiles.' },
              { icon: '👩', title: 'Verified Female Fundis', desc: 'Book from our pool of verified female fundis for a safe, comfortable service experience.' },
            ].map(w => (
              <div key={w.title} className="fade card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 18px', display: 'flex', gap: 14 }}>
                <div style={{ width: 42, height: 42, background: '#dcfce7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{w.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>{w.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: '60px 20px', background: 'linear-gradient(135deg, #14532d, #16a34a)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div className="fade" style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>
            Ready to Get Your Home Fixed?
          </div>
          <p className="fade" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, lineHeight: 1.6 }}>
            Post your job in 2 minutes. Get matched with a verified fundi. Pay only when done.
          </p>
          <div className="fade ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={goApp} style={{ background: '#fff', color: '#16a34a', fontSize: 16, fontWeight: 700, padding: '14px 28px', borderRadius: 12 }}>
              📸 Post a Job Now
            </button>
            <a href={WA_LINK} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ background: 'transparent', color: '#fff', fontSize: 16, padding: '14px 28px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.4)' }}>
                💬 WhatsApp Us
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0a0f1e', color: 'rgba(255,255,255,0.4)', padding: '48px 20px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 36, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 10 }}>Snap<span style={{ color: '#22c55e' }}>Fix</span> Kenya</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.35)', marginBottom: 14, maxWidth: 320 }}>Connecting Kenyan homeowners with trusted, verified repair professionals since 2025.</p>
              <div style={{ fontSize: 13 }}>📱 +254 700 815 576</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>✉️ hello@snapfix.ke</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>Quick Links</div>
              {[['How It Works','how'],['Services','services'],['Pricing','pricing'],['Login',null]].map(([l,id]) => (
                <div key={l} style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => id ? document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) : navigate('/login')}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
            <span>© 2025 Snap-Fix Kenya. All rights reserved.</span>
            <span>Built with ❤️ for Kenyan homes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
