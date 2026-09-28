/*
 * ChildInfo.jsx — CareConnect Child Info Page
 *
 * Shown after a parent completes the Signup form.
 * Layout:
 *   - Lavender background (same as Signup page: #C4A0CC)
 *   - One large white rounded card (max-width ~780px, centered)
 *     ├── LEFT PANEL:  CareConnect logo text + tagline + child photo
 *     └── RIGHT PANEL: ChildInfoForm
 *   - Footer
 */

// ── Imports ────────────────────────────────────────────────────────────────
// React core and navigation hook
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Shared layout components used across all pages
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

// The form component that lives inside the right panel of this page
import ChildInfoForm from '../../components/ChildInfoForm/ChildInfoForm';

// The child illustration shown in the left panel
import childPhoto from '../../assets/childpic.png';

// Page-specific styles
import './ChildInfo.css';

const ChildInfo = () => {
  // useNavigate lets us redirect the user to another page after they finish
  const navigate = useNavigate();

  // ── handleComplete ────────────────────────────────────────────────────────
  // Called when the parent finishes filling in their children's info.
  // - Marks the user as logged in in localStorage so the Navbar updates.
  // - If the user was in the middle of choosing a subscription plan before
  //   signing up, sends them to checkout. Otherwise, goes to the home page.
  const handleComplete = (children) => {
    // Mark user as logged in
    localStorage.setItem('isLoggedIn', 'true');
    // Dispatch custom event to update Navbar
    window.dispatchEvent(new Event('userLogin'));
    console.log('Children registered:', children);

    // Check if there's a pending subscription plan
    const pendingPlan = sessionStorage.getItem('pendingPlan');
    if (pendingPlan) {
      const planData = JSON.parse(pendingPlan);
      console.log('📋 Pending plan found, redirecting to checkout:', planData);
      sessionStorage.removeItem('pendingPlan');
      navigate('/subscription-checkout', { state: planData });
    } else {
      // No subscription, go to home
      navigate('/');
    }
  };

  // ── handleSkip ────────────────────────────────────────────────────────────
  // Called when the parent clicks "Skip" — they don't want to add children now.
  // Still marks them as logged in and sends them to the home page.
  const handleSkip = () => {
    // Mark user as logged in even if skipping child info
    localStorage.setItem('isLoggedIn', 'true');
    // Dispatch custom event to update Navbar
    window.dispatchEvent(new Event('userLogin'));

    const pendingPlan = sessionStorage.getItem('pendingPlan');
    if (pendingPlan) {
      const planData = JSON.parse(pendingPlan);
      console.log('📋 Pending plan found, redirecting to checkout (skip):', planData);
      sessionStorage.removeItem('pendingPlan');
      navigate('/subscription-checkout', { state: planData });
    } else {
      navigate('/');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // Page structure: Navbar → Hero section (split card) → Footer
  return (
    <div className="ci-page">
      <Navbar />

      {/* ── Hero (lavender background) ─────────────── */}
      <section className="ci-hero">

        {/* White split card — holds both left and right panels side by side */}
        <div className="ci-card">

          {/* ── LEFT PANEL ─────────────────────────── */}
          {/* Shows the CareConnect branding and a child illustration */}
          <div className="ci-left">
            {/* Logo text + short tagline encouraging the parent */}
            <div className="ci-left__header">
              <span className="ci-left__logo">CareConnect</span>
              <p className="ci-left__tagline">
                Creating a digital sanctuary for your family's
                unique journey. Tell us a bit about your little ones.
              </p>
            </div>

            {/* Child illustration image imported from assets */}
            <div className="ci-left__photo-wrap">
              <img src={childPhoto} alt="Child drawing" className="ci-left__photo" />
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────── */}
          {/* Renders the ChildInfoForm component and passes the two handlers */}
          <div className="ci-right">
            {/* onComplete fires when parent submits the form */}
            {/* onSkip fires when parent clicks Skip */}
            <ChildInfoForm
              onComplete={handleComplete}
              onSkip={handleSkip}
            />
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ChildInfo;