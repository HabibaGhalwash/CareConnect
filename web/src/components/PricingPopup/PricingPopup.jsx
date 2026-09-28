import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import './PricingPopup.css';

/* ── Static features per tier (DB has no features column) ── */
const TIER_FEATURES = [
  [
    'Unlimited school search and reviews',
    'Unlimited marketplace access',
    'Join community groups',
    '1 free booking per month',
    'Basic child communication tools',
  ],
  [
    'Unlimited school search',
    'Unlimited marketplace',
    '5 free bookings per month',
    'Basic child communication tools',
    'Priority support',
  ],
  [
    'Unlimited school search',
    'Unlimited marketplace',
    '10 free bookings per month',
    'Advanced communication tools',
    'Priority support + dedicated manager',
  ],
];

const TIER_COLORS   = ['starter', 'support', 'premium'];
const TIER_FEATURED = [false, true, false]; // middle plan is highlighted

/* ─────────────────────────────────────────────────── */

const PricingPopup = ({ onClose, onSubscribe }) => {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/modules/subscription/subscription`)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setPlans(
          raw.map((p, i) => ({
            id:          p.SID,
            name:        p.Offer_Details,
            price:       `EGP ${p.Price}/month`,
            priceNumber: Number(p.Price),
            color:       TIER_COLORS[i]   ?? 'starter',
            featured:    TIER_FEATURED[i] ?? false,
            features:    TIER_FEATURES[i] ?? TIER_FEATURES[0],
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to fetch subscription plans:', err);
        setPlans([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="pricing-overlay" onClick={handleOverlayClick}>
      <div className="pricing-modal">

        {/* Close button */}
        <button className="pricing-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Header */}
        <div className="pricing-header">
          <h2 className="pricing-title">Choose Your Plan</h2>
          <p className="pricing-subtitle">Unlock Endless possibilities</p>
        </div>

        {/* Body */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#777' }}>
            Loading plans…
          </p>
        ) : plans.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#c00' }}>
            Could not load plans. Please try again later.
          </p>
        ) : (
          <div className="pricing-cards">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`pricing-card pricing-card--${plan.color}${plan.featured ? ' pricing-card--featured' : ''}`}
              >
                <h3 className="pricing-card-name">{plan.name}</h3>
                <p className="pricing-card-price">{plan.price}</p>

                <ul className="pricing-card-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="pricing-card-feature">
                      <span className="pricing-card-check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Pass full plan object so caller can navigate without re-fetching */}
                <button
                  className="pricing-card-btn"
                  onClick={() => onSubscribe && onSubscribe(plan.id, plan)}
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Login nudge */}
        <p className="pricing-login-nudge">
          Already have an account?{' '}
          <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default PricingPopup;