import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import SchoolCard from '../../components/Schoolcard/Schoolcard';
import PricingPopup from '../../components/PricingPopup/PricingPopup'; // ← NEW
import './Home.css';

/* ── Placeholder images (replace with real assets) ─ */
import heroImg from '../../assets/hero.jpeg';
import school1Img from '../../assets/school1.jpeg';
import school2Img from '../../assets/school2.jpeg';
import school3Img from '../../assets/school3.jpeg';
import therapyOnline from '../../assets/therapy-online.jpeg';
import therapyPerson from '../../assets/therapy-person.jpeg';
import shadowTeacher from '../../assets/shadow-teacher.jpeg';
import wheelchairImg from '../../assets/wheelchair.jpeg';
import crutchSmall from '../../assets/Crutchsmall.jpeg';
import hearingSmall from '../../assets/Hearingsmall.jpeg';
import legSmall from '../../assets/legsmall.jpeg';
import stickSmall from '../../assets/sticksmall.jpeg';
import walkerSmall from '../../assets/walkersmall.jpeg';
import aacKid from '../../assets/aac-kid.jpeg';
import eatImg from '../../assets/eat.jpeg';
import drinkImg from '../../assets/drink.jpeg';
import bathroomImg from '../../assets/bathroom.jpeg';
import stomachImg from '../../assets/stomach.jpeg';
import playImg from '../../assets/play.jpeg';
import sleepImg from '../../assets/sleep.jpeg';
import arrowRight from '../../assets/Arrow 1.svg';
import arrowLeft from '../../assets/Arrow 2.svg';
import arrowDonation from '../../assets/Arrow 3.svg';
import logoImg from '../../assets/logo.jpeg';
import cursorIcon from '../../assets/tdesign_cursor.svg';


/* ── AAC tiles data ─────────────────────────────── */
const aacTiles = [
  { label: 'I Want To Eat', image: eatImg },
  { label: 'I Want To Drink', image: drinkImg },
  { label: 'I Need Bathroom', image: bathroomImg },
  { label: 'My Stomach Hurts', image: stomachImg },
  { label: 'I Want To Play', image: playImg },
  { label: 'I Want To Sleep', image: sleepImg },
];

const Home = () => {
  const [chatQuery, setChatQuery] = useState('');
  // eslint-disable-next-line
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ── NEW: Popup state ─────────────────────────────
  const [showPricing, setShowPricing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // ── Check login status from localStorage or URL parameters ────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLoggedIn = params.get('isLoggedIn') === 'true';
    
    if (urlLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
    }

    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    // Listen for storage changes (logout from other tab/component)
    const handleStorageChange = () => {
      const updated = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(updated);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── Responsive handler ──────────────────────────
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Call this instead of navigating / acting directly.
   * If the user is logged in it runs `action()`;
   * otherwise it pops up the pricing modal.
   */
  const requireAuth = (action) => (e) => {
    if (isLoggedIn) {
      action(e);
    } else {
      e.preventDefault();
      setShowPricing(true);
    }
  };

  // ────────────────────────────────────────────────
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setShowPricing(true); return; }
    // TODO: wire to AI chat handler
    setChatQuery('');
  };

  const handleSubscribe = (planId, planData) => {
    setShowPricing(false);
    // Save the chosen plan so SignupForm can redirect to checkout after signup
    sessionStorage.setItem('pendingPlan', JSON.stringify({
      planId,
      planName: planData?.name || '',
      planPrice: planData?.price || '',
      priceNumber: planData?.priceNumber || 0,
      features: planData?.features || [],
    }));
    navigate('/signup');
  };

  return (
    <div className="home">
      <Navbar />

      {/* ── PRICING POPUP (shown when not logged in + clicked) ── */}
      {showPricing && (
        <PricingPopup
          onClose={() => setShowPricing(false)}
          onSubscribe={handleSubscribe}
        />
      )}

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="home__hero">
        <img src={heroImg} alt="Teacher with children" className="home__hero-img" />
      </section>

      {/* ── SCHOOLS ──────────────────────────────────── */}
      <section className="home__section home__schools">
        <h2 className="home__section-title">Schools that may appeal to you</h2>
        <div className="home__schools-grid">
          {/*
           * SchoolCard uses <Link to="..."> internally.
           * Wrap each card in a div with onClick so we can intercept
           * navigation before it happens.
           */}
          <div onClick={requireAuth(() => navigate('/schools'))} style={{ cursor: 'pointer' }}>
            <SchoolCard
              name="Green Heights International School"
              image={school1Img}
              to="/schools"
            />
          </div>
          <div onClick={requireAuth(() => navigate('/schools'))} style={{ cursor: 'pointer' }}>
            <SchoolCard
              name="Ramses College School"
              image={school2Img}
              to="/schools"
            />
          </div>
          <div onClick={requireAuth(() => navigate('/schools'))} style={{ cursor: 'pointer' }}>
            <SchoolCard
              name="Windrose School"
              image={school3Img}
              to="/schools"
            />
          </div>
        </div>
      </section>

      {/* ── THERAPY + SHADOW TEACHER ──────────────────── */}
      <section className="home__section home__services-row">
        {/* Therapy */}
        <div className="home__service-block">
          <h3 className="home__service-title">Therapy That Fits Your Life</h3>

          <div className="home__therapy-options">

            {/* Search — clicking opens popup if not logged in */}
            <div
              className="home__therapy-search"
              onClick={requireAuth(() => navigate('/therapist'))}
              style={{ cursor: 'pointer' }}
            >
              <div className="home__therapy-search-bar">
                <span className="home__therapy-search-icon">🔍</span>
              </div>
            </div>

            {/* Flow */}
            <div className="home__therapy-flow">
              <div className="home__therapy-arrow-left">
                <img src={arrowLeft} alt="" className="home__therapy-arrow-img" aria-hidden="true" />
              </div>
              <p className="home__therapy-note">
                Look Online<br />or<br />Inperson
              </p>
              <div className="home__therapy-arrow-right">
                <img src={arrowRight} alt="" className="home__therapy-arrow-img" aria-hidden="true" />
              </div>
            </div>

            {/* Images — each clickable */}
            <div className="home__therapy-imgs">
              <img
                src={therapyPerson}
                alt="In-person therapy"
                className="home__therapy-img home__therapy-img--person"
                onClick={requireAuth(() => navigate('/therapist'))}
                style={{ cursor: 'pointer' }}
              />
              <img
                src={therapyOnline}
                alt="Online therapy"
                className="home__therapy-img home__therapy-img--online"
                onClick={requireAuth(() => navigate('/therapist'))}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        <div className="home__services-divider" />

        {/* Shadow Teacher */}
        <div className="home__service-block">
          <h3 className="home__service-title">Find Expert Shadow Teachers Fast</h3>

          <div
            className="home__shadow-img-wrap"
            onClick={requireAuth(() => navigate('/shadow-teacher'))}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={shadowTeacher}
              alt="Shadow teacher with child"
              className="home__shadow-img"
            />
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ─────────────────────────────────── */}
      <section className="home__section home__community">
        <h2 className="home__section-title">
          Join the conversation — because parenting is easier together.
        </h2>
        <div
          className="home__community-chat"
          onClick={requireAuth(() => navigate('/community-center'))}
          style={{ cursor: 'pointer' }}
        >
          <div className="home__chat-row home__chat-row--left">
            <div className="home__chat-label">Farida's Mom</div>
            <div className="home__bubble home__bubble--left">
              Hey Rania, I'm Farida's mom.
            </div>
          </div>
          <div className="home__chat-row home__chat-row--right">
            <div className="home__bubble home__bubble--right">
              Hey parents, I'm Selim's mom. I'm really happy to be in this group
            </div>
          </div>
        </div>

        {/* AI chat bar */}
        <form className="home__chat-bar" onSubmit={handleChatSubmit}>
          <input
            type="text"
            className="home__chat-input"
            placeholder="Tell me if Dr Mohamed is good for speech delay therapy?"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onFocus={() => { if (!isLoggedIn) setShowPricing(true); }}
            readOnly={!isLoggedIn}
          />
          <button type="submit" className="home__chat-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="12" y2="8" />
              <line x1="16" y1="12" x2="12" y2="8" />
            </svg>
          </button>
        </form>
      </section>

      {/* ── DONATION ──────────────────────────────────── */}
      <section className="home__section home__donation">
        <h2 className="home__section-title">
          Give what you can. Receive what you need
        </h2>

        <div className="home__donation-row">

          {/* LEFT: BIG WALKER */}
          <img
            src={walkerSmall}
            alt="Walker"
            className="home__donation-wheelchair-big"
            onClick={requireAuth(() => navigate('/donate-item-form'))}
            style={{ cursor: 'pointer' }}
          />

          {/* MIDDLE: ADD CARD + ARROW */}
          <div className="home__donation-middle">
            <img src={arrowDonation} alt="" className="home__donation-curve" aria-hidden="true" />
            <div className="home__donation-card">
              <button
                className="home__donation-btn"
                onClick={requireAuth(() => navigate('donate-item-form'))}
              >
                Add item
              </button>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="home__donation-divider" />

          {/* RIGHT: RECEIVE SIDE */}
          <div className="home__donation-right">

            <div
              className="home__donation-small-card"
              onClick={requireAuth(() => navigate('/donation'))}
              style={{ cursor: 'pointer' }}
            >
              <div className="home__donation-small-card-frame">
                <img src={wheelchairImg} alt="Wheelchair category" className="home__donation-small-card-img" />
                <button
                  className="home__donation-btn home__donation-btn--small"
                  onClick={requireAuth(() => navigate('/donation/add'))}
                >
                  Add item
                </button>
                <img src={cursorIcon} alt="" className="home__donation-small-card-cursor" aria-hidden="true" />
              </div>
            </div>

            <div
              className="home__donation-catalog"
              onClick={requireAuth(() => navigate('/donation'))}
              style={{ cursor: 'pointer' }}
            >
              <div className="home__donation-catalog-topbar">
                <img src={logoImg} alt="CareConnect logo" className="home__donation-catalog-logo" />
              </div>

              <div className="home__donation-catalog-body">
                <div className="home__donation-catalog-label">Donation Center</div>

                <div className="home__donation-catalog-grid">
                  <div className="home__donation-catalog-tile home__donation-catalog-tile--active">
                    <img src={wheelchairImg} alt="Wheelchair category" className="home__donation-catalog-icon" />
                    <button className="home__donation-btn home__donation-btn--tiny">Add item</button>
                  </div>
                  <div className="home__donation-catalog-tile">
                    <img src={legSmall} alt="Prosthetic leg item" className="home__donation-catalog-thumb home__donation-catalog-thumb--2" />
                  </div>
                  <div className="home__donation-catalog-tile">
                    <img src={stickSmall} alt="White cane item" className="home__donation-catalog-thumb home__donation-catalog-thumb--3" />
                  </div>
                  <div className="home__donation-catalog-tile">
                    <img src={walkerSmall} alt="Walker item" className="home__donation-catalog-thumb home__donation-catalog-thumb--4" />
                  </div>
                  <div className="home__donation-catalog-tile">
                    <img src={crutchSmall} alt="Crutches item" className="home__donation-catalog-thumb home__donation-catalog-thumb--5" />
                  </div>
                  <div className="home__donation-catalog-tile">
                    <img src={hearingSmall} alt="Hearing aid item" className="home__donation-catalog-thumb home__donation-catalog-thumb--6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AAC ───────────────────────────────────────── */}
      <section className="home__section home__aac">
        <h2 className="home__section-title">Because every child deserves a voice</h2>

        <div className="home__aac-bubble">I Want To Eat!</div>
        <div className="home__aac-bubble-tail">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <path d="M10 14 Q8 6 0 0 Q8 4 20 2 Q14 6 10 14Z" fill="#9CCFC9" />
          </svg>
        </div>

        <div className="home__aac-content">
          <img src={aacKid} alt="Child using communication device" className="home__aac-kid" />
          <div className="home__aac-device">
            <div className="home__aac-screen">
              {aacTiles.map((tile) => (
                <button
                  key={tile.label}
                  className="home__aac-tile"
                  aria-label={tile.label}
                  onClick={requireAuth(() => navigate('/communication-tools'))}
                >
                  <img src={tile.image} alt={tile.label} className="home__aac-tile-img" />
                </button>
              ))}
            </div>
            {/* AAC CTA — use a button instead of Link so requireAuth works cleanly */}
            <button
              className="home__aac-cta"
              onClick={requireAuth(() => navigate('/communication-tools'))}
            >
              Try Communication Tools
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;