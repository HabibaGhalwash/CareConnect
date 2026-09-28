import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import logo from '../../assets/logo.jpeg';
import PricingPopup from '../PricingPopup/PricingPopup';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitials, setUserInitials] = useState('RM');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const closeTimeoutRef = useRef(null);

  // Helper to preserve parentId in URL (Mobile Bridge)
  const appendPId = (path) => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('parentId');
    if (!pId) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}parentId=${pId}`;
  };

  useEffect(() => {
    // 1. Sync identity from URL (Mobile Bridge)
    const syncIdentity = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlPId = params.get('parentId');
      const currentParent = JSON.parse(localStorage.getItem('parent'));

      if (urlPId && (!currentParent || String(currentParent.P_ID) !== String(urlPId))) {
        console.log('🔄 Syncing mobile identity for P_ID:', urlPId);

        // Initial set to allow immediate access
        localStorage.setItem('parent', JSON.stringify({ P_ID: urlPId }));
        localStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);

        // Fetch full info to get name, initials, etc.
        try {
          const res = await axios.get(`${API_BASE}/modules/parent/search?keyword=P_ID&keyvalue=${urlPId}`);
          if (Array.isArray(res.data) && res.data.length > 0) {
            localStorage.setItem('parent', JSON.stringify(res.data[0]));
            // Trigger a re-run of updateInitials
            window.dispatchEvent(new Event('userLogin'));
          }
        } catch (err) {
          console.error('Error fetching full parent info during sync:', err);
        }
      }
    };

    syncIdentity();

    // Check if user is logged in from localStorage
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    // Get initials from parent data
    const updateInitials = () => {
      let initials = 'U';
      try {
        const parent = JSON.parse(localStorage.getItem('parent'));
        if (parent?.Full_Name) {
          // Split by space and get first letter of first name and last name
          const nameParts = parent.Full_Name.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            // First letter of first name + first letter of last name
            const firstInitial = nameParts[0][0] || '';
            const lastInitial = nameParts[nameParts.length - 1][0] || '';
            initials = (firstInitial + lastInitial).toUpperCase();
          } else if (nameParts.length === 1 && nameParts[0].length >= 1) {
            // Only one name, use first letter
            initials = nameParts[0][0].toUpperCase();
          }
        }
      } catch (e) {
        console.error('Error parsing parent data:', e);
      }
      console.log('Updated initials:', initials);
      setUserInitials(initials);
    };

    updateInitials();

    // Listen for storage changes (logout from other tab/component)
    const handleStorageChange = () => {
      const updatedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(updatedLoggedIn);
      updateInitials();
    };

    // Listen for custom logout event
    const handleLogout = () => {
      setIsLoggedIn(false);
      setUserInitials('U');
    };

    // Listen for custom login event
    const handleLogin = () => {
      updateInitials();
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleLogout);
    window.addEventListener('userLogin', handleLogin);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleLogout);
      window.removeEventListener('userLogin', handleLogin);
    };
  }, []);

  const handleDropdownEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setServicesOpen(true);
  };

  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setServicesOpen(false);
    }, 200);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavClick = (callback) => {
    callback();
    closeMobileMenu();
  };

  const handleSubscribe = (planId, planData) => {
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
      navigate(appendPId(path));
      setServicesOpen(false);
      setMobileMenuOpen(false);
    } else {
      e.preventDefault();
      setShowPricing(true);
    }
  };

  return (
    <>
      {showPricing && (
        <PricingPopup
          onClose={() => setShowPricing(false)}
          onSubscribe={handleSubscribe}
        />
      )}
      <nav className="navbar">
        <div className="navbar__left">
          <Link to={appendPId("/")} className="navbar__link">Home</Link>
          <Link to={appendPId("/about")} className="navbar__link">About Us</Link>

          <div
            className="navbar__dropdown"
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <button className="navbar__link navbar__dropdown-trigger">
              Services <span className="navbar__chevron">&#8964;</span>
            </button>

            {servicesOpen && (
              <ul className="navbar__dropdown-menu">
                <li><a href={appendPId("/schools")} onClick={(e) => { e.preventDefault(); requireAuth('/schools')(e); }}>Schools</a></li>
                <li><a href={appendPId("/shadow-teacher")} onClick={(e) => { e.preventDefault(); requireAuth('/shadow-teacher')(e); }}>Shadow Teacher</a></li>
                <li><a href={appendPId("/therapist")} onClick={(e) => { e.preventDefault(); requireAuth('/therapist')(e); }}>Therapist</a></li>
                <li><a href={appendPId("/donation")} onClick={(e) => { e.preventDefault(); requireAuth('/donation')(e); }}>Donation</a></li>
                <li><a href={appendPId("/community-center")} onClick={(e) => { e.preventDefault(); requireAuth('/community-center')(e); }}>Community Center</a></li>
                <li><a href={appendPId("/communication-tools")} onClick={(e) => { e.preventDefault(); requireAuth('/communication-tools')(e); }}>Communication Tools</a></li>
              </ul>
            )}
          </div>
        </div>

        <div className="navbar__logo">
          <Link to={appendPId("/")}>
            <img src={logo} alt="CareConnect" className="navbar__logo-img" />
          </Link>
        </div>

        {/* Hamburger Menu Button */}
        <button
          className={`navbar__hamburger ${mobileMenuOpen ? 'navbar__hamburger--active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="navbar__hamburger-line"></span>
          <span className="navbar__hamburger-line"></span>
          <span className="navbar__hamburger-line"></span>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="navbar__mobile-menu">
            <div className="navbar__mobile-menu-content">
              <Link
                to={appendPId("/")}
                className="navbar__mobile-link"
                onClick={() => handleMobileNavClick(() => navigate(appendPId('/')))}
              >
                Home
              </Link>
              <Link
                to={appendPId("/about")}
                className="navbar__mobile-link"
                onClick={() => handleMobileNavClick(() => navigate(appendPId('/about')))}
              >
                About Us
              </Link>

              {/* Mobile Services Dropdown */}
              <button
                className="navbar__mobile-link navbar__mobile-dropdown-trigger"
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              >
                Services {mobileServicesOpen ? '▼' : '▶'}
              </button>
              {mobileServicesOpen && (
                <div className="navbar__mobile-submenu">
                  <a
                    href={appendPId("/schools")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/schools')(e); }}
                  >
                    Schools
                  </a>
                  <a
                    href={appendPId("/shadow-teacher")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/shadow-teacher')(e); }}
                  >
                    Shadow Teacher
                  </a>
                  <a
                    href={appendPId("/therapist")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/therapist')(e); }}
                  >
                    Therapist
                  </a>
                  <a
                    href={appendPId("/donation")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/donation')(e); }}
                  >
                    Donation
                  </a>
                  <a
                    href={appendPId("/community-center")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/community-center')(e); }}
                  >
                    Community Center
                  </a>
                  <a
                    href={appendPId("/communication-tools")}
                    className="navbar__mobile-sublink"
                    onClick={(e) => { e.preventDefault(); requireAuth('/communication-tools')(e); }}
                  >
                    Communication Tools
                  </a>
                </div>
              )}

              {/* Mobile Auth Section */}
              <div className="navbar__mobile-divider"></div>
              {isLoggedIn ? (
                <button
                  className="navbar__mobile-link navbar__mobile-profile"
                  onClick={() => handleMobileNavClick(() => navigate(appendPId('/parentprofile')))}
                >
                  <span className="navbar__mobile-profile-avatar">{userInitials}</span>
                  Profile
                </button>
              ) : (
                <>
                  <Link
                    to={appendPId("/login")}
                    className="navbar__mobile-link"
                    onClick={() => handleMobileNavClick(() => navigate(appendPId('/login')))}
                  >
                    Log In
                  </Link>
                  <Link
                    to={appendPId("/signup")}
                    className="navbar__mobile-link navbar__mobile-link--signup"
                    onClick={() => handleMobileNavClick(() => navigate(appendPId('/signup')))}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        <div className="navbar__right">
          {isLoggedIn ? (
            <button
              className="navbar__profile-icon"
              onClick={() => navigate(appendPId('/parentprofile'))}
              aria-label="Go to parent profile"
            >
              <div className="navbar__profile-avatar">{userInitials}</div>
            </button>
          ) : (
            <>
              <Link to={appendPId("/login")} className="navbar__link navbar__link--login">Log In</Link>
              <Link to={appendPId("/signup")} className="navbar__btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;