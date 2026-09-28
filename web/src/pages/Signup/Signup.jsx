/*
 * Signup.jsx — CareConnect Sign Up Service Page
 *
 * Sections:
 *  1. Navbar
 *  2. Hero section (lavender + dark purple circle + illustration + form)
 *  3. Footer
 */

import React from 'react';
import Navbar    from '../../components/Navbar/Navbar';
import Footer    from '../../components/Footer/Footer';
import SignupForm from '../../components/SignupForm/SignupForm';
import signupImage from '../../assets/Signuppic.jpg';
import './Signup.css';

const Signup = () => {
  return (
    <div className="signup-page">
      <Navbar />

      <section className="signup-hero">
        <div className="signup-hero__content">
          <div className="signup-hero__left">
            <div
              className="signup-hero__image-panel"
              style={{ '--signup-image': `url(${signupImage})` }}
              aria-label="Teacher with children"
              role="img"
            />
          </div>

          {/* Right: form card */}
          <div className="signup-hero__right">
            <SignupForm defaultTab="parent" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Signup;