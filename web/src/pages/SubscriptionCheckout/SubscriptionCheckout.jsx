/*
 * SubscriptionCheckout.jsx — CareConnect Subscription Payment Page
 *
 * Flow:
 *   1. Receives { planId (SID), planName, planPrice, priceNumber, features }
 *      from router state (set by Home → Signup → here, or ParentProfile → here).
 *   2. Re-fetches the plan from DB by SID so the UI always shows live data.
 *   3. On payment confirm → PUT /parent to save SID → navigate to parent profile.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import PaymentCard from '../../components/PaymentCard/PaymentCard';
import './SubscriptionCheckout.css';

/* ── Fallback when no state / DB call fails ───────── */
const FALLBACK_FEATURES = [
  'Unlimited school search',
  'Unlimited marketplace',
  'Free bookings per month',
  'Basic child communication tools',
];

const DEMO_PLAN = {
  planId: null,
  planName: 'Premium Plan',
  planPrice: 'EGP 599/month',
  priceNumber: 599,
  features: FALLBACK_FEATURES,
};

/* ── Small check icon ────────────────────────────── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─────────────────────────────────────────────────── */

const SubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const urlPlanId = queryParams.get('planId');

  const passed = location.state || (urlPlanId ? { planId: urlPlanId } : null);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false); // shows success screen before navigate

  /* ── Fetch live plan data from DB by SID ───────── */
  useEffect(() => {
    const numericId = Number(passed?.planId);

    if (numericId > 0) {
      axios
        .get(`${API_BASE}/modules/subscription/subscription?id=${numericId}`)
        .then((res) => {
          const sub = Array.isArray(res.data) ? res.data[0] : null;
          if (sub) {
            setPlan({
              planId: sub.SID,
              planName: sub.Offer_Details,
              planPrice: `EGP ${sub.Price}/month`,
              priceNumber: Number(sub.Price),
              // DB has no features column — keep whatever was passed or use fallback
              features: passed?.features || FALLBACK_FEATURES,
            });
          } else {
            setPlan(passed || DEMO_PLAN);
          }
        })
        .catch(() => setPlan(passed || DEMO_PLAN))
        .finally(() => setLoading(false));
    } else {
      // planId is a string alias or missing — use passed state as-is
      setPlan(passed || DEMO_PLAN);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Save subscription to parent record on confirm ─ */
  const handlePaymentConfirm = async () => {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const urlParentId = queryParams.get('parentId');
      const raw = localStorage.getItem('parent');

      let parentId = urlParentId || (raw ? JSON.parse(raw).P_ID : null);

      if (parentId && plan?.planId) {
        // 1. Fetch current parent record to ensure we have all fields for the PUT
        const res = await axios.get(`${API_BASE}/modules/parent/parent?id=${parentId}`);
        const currentParent = Array.isArray(res.data) ? res.data[0] : res.data;

        if (currentParent) {
          const phoneInt = parseInt(String(currentParent.Phone || '').replace(/\D/g, ''), 10) || 0;

          // 2. Perform the update with the new SID
          await axios.put(
            `${API_BASE}/modules/parent/parent?id=${parentId}`,
            {
              Full_Name: currentParent.Full_Name,
              Email: currentParent.Email,
              Location: currentParent.Location,
              Password: currentParent.Password,
              Phone: phoneInt,
              SID: plan.planId,
              B_ID: currentParent.B_ID || null,
              CT_ID: currentParent.CT_ID || null,
            }
          );
          console.log('✅ Subscription saved — SID', plan.planId, 'linked to parent', parentId);
        }
      }
    } catch (err) {
      console.error('❌ Failed to save subscription:', err.response?.data || err.message);
    }

    // Show success screen, then navigate after 2.5 s
    setPaid(true);
    setTimeout(() => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'CHECKOUT_SUCCESS' }, '*');
      }
      navigate('/', { state: { subscribed: true } });
    }, 2500);
  };

  /* ── Success confirmation screen ───────────────── */
  if (paid) {
    const paidPlan = plan || DEMO_PLAN;
    return (
      <div className="sub-checkout-page">
        <Navbar />

        {/* Full-area success panel — teal background matches the checkout left panel */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#B5D5CF',           /* system teal */
          minHeight: 'calc(100vh - 128px)',
        }}>
          {/* Solid purple card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '56px 48px',
            borderRadius: '28px',
            background: '#C4A2CC',         /* system purple — fully opaque */
            boxShadow: '0 12px 50px rgba(0,0,0,0.35)',
            maxWidth: '460px',
            width: '90%',
            animation: 'fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1)',
          }}>

            {/* Animated checkmark circle */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(255,255,255,0.20)',
              animation: 'popIn 0.45s cubic-bezier(0.68,-0.55,0.27,1.55) 0.15s both',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="#C4A2CC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.3px',
              fontFamily: 'Poppins, sans-serif',
            }}>
              Payment Successful!
            </h2>

            <p style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: '15px',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.6,
              fontFamily: 'Poppins, sans-serif',
            }}>
              Your <strong style={{ color: '#fff' }}>{paidPlan.planName}</strong> is now active.
              <br />
              Redirecting you to your profile…
            </p>

            {/* Price pill — teal on purple */}
            <div style={{
              padding: '11px 32px',
              borderRadius: '50px',
              background: '#B5D5CF',       /* system teal as pill bg */
              color: '#fff',
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}>
              EGP {paidPlan.priceNumber}
              <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.8, marginLeft: '4px' }}>
                /month
              </span>
            </div>

            {/* Countdown hint */}
            <p style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '12px',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
            }}>
              You will be redirected in 2 seconds
            </p>
          </div>
        </main>

        <Footer />

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(36px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          @keyframes popIn {
            from { transform: scale(0) rotate(-45deg); }
            to   { transform: scale(1) rotate(0deg);   }
          }
        `}</style>
      </div>
    );
  }


  /* ── Loading state ───────────────────────────────── */
  if (loading) {
    return (
      <div className="sub-checkout-page">
        <Navbar />
        <main className="sub-checkout-main" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#fff', fontSize: '18px' }}>Loading plan details…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const { planName, planPrice, priceNumber, features = FALLBACK_FEATURES } = plan;

  return (
    <div className="sub-checkout-page">
      <Navbar />

      <main className="sub-checkout-main">

        {/* ── LEFT PANEL — Plan summary ─────────────── */}
        <div className="sub-left">

          {/* Pill */}
          <div className="sub-left__pill">
            <span className="sub-left__pill-dot" />
            <span className="sub-left__pill-text">Subscription Checkout</span>
          </div>

          {/* Heading */}
          <h1 className="sub-left__heading">You're one step<br />away from more care</h1>
          <p className="sub-left__subtext">Complete your payment to activate your plan.</p>

          <div className="sub-left__divider" />

          {/* Plan details — live from DB */}
          <div className="sub-left__plan-name">{planName}</div>
          <div className="sub-left__plan-price">{planPrice}</div>

          {/* Features */}
          <ul className="sub-left__features">
            {features.map((f, i) => (
              <li key={i} className="sub-left__feature">
                <span className="sub-left__check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>

          {/* Total box */}
          <div className="sub-left__total-box">
            <div>
              <p className="sub-left__total-label">Billed Monthly</p>
              <p className="sub-left__total-amount">EGP {priceNumber}</p>
            </div>
            <span className="sub-left__total-badge">Cancel Anytime</span>
          </div>

          {/* Back button */}
          <button className="sub-left__back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {/* ── RIGHT PANEL — Payment ─────────────────── */}
        <PaymentCard
          bookingPrice={priceNumber}
          hours={1}
          currency="EGP"
          onConfirm={handlePaymentConfirm}
          navigatesAway={true}
        />
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;