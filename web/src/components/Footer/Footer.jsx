import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PricingPopup from '../PricingPopup/PricingPopup';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSubscribePlan = (planId, planData) => {
    setShowPricing(false);
    sessionStorage.setItem('pendingPlan', JSON.stringify({
      planId,
      planName: planData?.name || '',
      planPrice: planData?.price || '',
      priceNumber: planData?.priceNumber || 0,
      features: planData?.features || [],
    }));
    navigate('/signup');
  };

  const requireAuth = (path) => (e) => {
    if (isLoggedIn) {
      if (path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:')) {
        window.open(path, '_blank');
      } else {
        navigate(path);
      }
    } else {
      e.preventDefault();
      setShowPricing(true);
    }
  };

  const requireAuthAnchor = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowPricing(true);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <>
      {showPricing && (
        <PricingPopup
          onClose={() => setShowPricing(false)}
          onSubscribe={handleSubscribePlan}
        />
      )}
      <footer className="footer">
        <div className="footer__inner">
          {/* Newsletter */}
        <div className="footer__newsletter">
          <p className="footer__newsletter-text">
            Sign up to our news letter to get 20% off your first Session!
          </p>
          <form className="footer__newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Your email"
              className="footer__newsletter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="footer__newsletter-btn">
              Subscribe
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="footer__links">
          <div className="footer__col">
            <h4 className="footer__col-title">Services</h4>
            <a href="/schools" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/schools')(e); }}>Schools</a>
            <a href="/shadow-teacher" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/shadow-teacher')(e); }}>Shadow Teacher</a>
            <a href="/therapist" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/therapist')(e); }}>Therapist</a>
            <a href="/donation" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/donation')(e); }}>Donations</a>
            <a href="/community-center" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/community-center')(e); }}>Community Center</a>
            <a href="/communication-tools" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/communication-tools')(e); }}>Communication Tools</a>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Contact Us</h4>
            <a href="mailto:hello@careconnect.eg" className="footer__col-link" onClick={requireAuthAnchor}>Email</a>
            <a href="tel:+201234567890" className="footer__col-link" onClick={requireAuthAnchor}>Phone Number</a>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">About</h4>
            <a href="/about" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/about')(e); }}>About Us</a>
            <a href="/journal" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/journal')(e); }}>Journal</a>
            <a href="/inspiration" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/inspiration')(e); }}>Inspiration</a>
            <a href="/careers" className="footer__col-link" onClick={(e) => { e.preventDefault(); requireAuth('/careers')(e); }}>Careers</a>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="footer__bottom">
        <div className="footer__socials">
          {/* Instagram */}
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__social-icon" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
          {/* Facebook */}
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer__social-icon" aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* Twitter/X */}
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer__social-icon footer__social-icon--twitter" aria-label="Twitter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9 9 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .36.04.7.11 1.03A12.83 12.83 0 0 1 1.64.83a4.52 4.52 0 0 0 1.4 6.04 4.5 4.5 0 0 1-2.05-.57v.06c0 2.19 1.56 4.02 3.63 4.44a4.54 4.54 0 0 1-2.04.08 4.53 4.53 0 0 0 4.23 3.14A9.07 9.07 0 0 1 0 15.54a12.8 12.8 0 0 0 6.92 2.03c8.3 0 12.85-6.88 12.85-12.85 0-.2 0-.39-.02-.58A9.17 9.17 0 0 0 23 3z" />
            </svg>
          </a>
          {/* YouTube */}
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer__social-icon" aria-label="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;