/*
 * PaymentCard.jsx
 *
 * Right panel — "Complete Payment" with tab switcher.
 * Credit/Debit Card tab: card visual + form fields.
 * Instapay tab: icon + address + "I've Sent the Payment" button.
 *
 * Props:
 *   bookingPrice   – number  e.g. 450
 *   hours          – number  e.g. 1
 *   currency       – string  e.g. "EGP"
 *   onConfirm      – callback(paymentData)
 */

import React, { useState } from 'react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import './PaymentCard.css';

const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const LightningIcon = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PaymentCard = ({
  bookingPrice = 450,
  hours = 1,
  currency = 'EGP',
  onConfirm = () => { },
  navigatesAway = false,   // set true when onConfirm will navigate away (skips internal success screen)
}) => {
  const { settings } = usePlatformSettings();

  // Get enabled payment methods from settings
  const visaEnabled = settings.visaEnabled !== false;
  const instapayEnabled = settings.instapayEnabled !== false;

  // Default to first available payment method
  const defaultTab = visaEnabled ? 'card' : instapayEnabled ? 'instapay' : 'card';

  const [tab, setTab] = useState(defaultTab); // 'card' | 'instapay'
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});

  const totalPrice = bookingPrice * hours;

  /* ── Format helpers ─────────────────────────────── */
  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2);
    return digits;
  };

  /* ── Validation ─────────────────────────────────── */
  const validate = () => {
    if (tab === 'instapay') return true;
    const errs = {};
    if (!cardholderName.trim()) errs.name = 'Required';
    if (cardNumber.replace(/\s/g, '').length < 16) errs.card = 'Enter a valid 16-digit card number';
    if (!expiry || expiry.length < 7) errs.expiry = 'Enter MM / YY';
    if (cvv.length < 3) errs.cvv = 'Enter a valid CVV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const paymentData = { method: tab, cardholderName, cardNumber, expiry, cvv, totalPrice };
    if (navigatesAway) {
      // Parent component (e.g. SubscriptionCheckout) will navigate away on its own
      onConfirm(paymentData);
    } else {
      setConfirmed(true);
      onConfirm(paymentData);
    }
  };

  /* ── Derive display values for card visual ──────── */
  const displayName   = cardholderName || 'Card Holder';
  const displayExpiry = expiry         || 'MM / YY';

  /* ── Success screen ─────────────────────────────── */
  if (confirmed) {
    return (
      <div className="pc pc--success">
        <div className="pc__success-icon">✅</div>
        <h2 className="pc__success-title">Payment Confirmed!</h2>
        <p className="pc__success-sub">
          Your booking has been confirmed and payment of{' '}
          <strong>{currency} {totalPrice}</strong> was processed successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="pc">
      {/* Step indicator */}
      <p className="pc__step">Step 3 of 3</p>

      {/* Title */}
      <h2 className="pc__title">Complete Payment</h2>
      <p className="pc__subtitle">Choose how you'd like to pay</p>

      {/* Tab switcher */}
      <div className="pc__tabs">
        {visaEnabled && (
          <button
            className={`pc__tab ${tab === 'card' ? 'pc__tab--active' : ''}`}
            onClick={() => setTab('card')}
          >
            <span className="pc__tab-icon">💳</span>
            Credit / Debit Card
          </button>
        )}
        {instapayEnabled && (
          <button
            className={`pc__tab ${tab === 'instapay' ? 'pc__tab--active' : ''}`}
            onClick={() => setTab('instapay')}
          >
            <span className="pc__tab-icon">⚡</span>
            Instapay
          </button>
        )}
      </div>

      {/* ── Credit/Debit Card panel ──────────────────── */}
      {tab === 'card' && (
        <>
          {/* Visual card */}
          <div className="pc__card-visual">
            <div className="pc__card-chip" />
            <div className="pc__card-number">
              {cardNumber
                ? cardNumber
                : '· · · · · · · · · · · · · · · ·'}
            </div>
            <div className="pc__card-bottom">
              <div>
                <p className="pc__card-info-label">Card Holder</p>
                <p className="pc__card-info-value">{displayName}</p>
              </div>
              <div>
                <p className="pc__card-info-label">Expires</p>
                <p className="pc__card-info-value">{displayExpiry}</p>
              </div>
              <div className="pc__mastercard">
                <div className="pc__mastercard-circle" />
                <div className="pc__mastercard-circle" />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="pc__form">
            {/* Cardholder Name */}
            <div className="pc__field-group">
              <label className="pc__field-label">Cardholder Name</label>
              <input
                type="text"
                className={`pc__input ${errors.name ? 'pc__input--error' : ''}`}
                placeholder="Maryam Ayman"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                autoComplete="cc-name"
              />
              {errors.name && <span className="pc__error">{errors.name}</span>}
            </div>

            {/* Card Number */}
            <div className="pc__field-group">
              <label className="pc__field-label">Card Number</label>
              <input
                type="text"
                className={`pc__input ${errors.card ? 'pc__input--error' : ''}`}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                maxLength={19}
                autoComplete="cc-number"
                inputMode="numeric"
              />
              {errors.card && <span className="pc__error">{errors.card}</span>}
            </div>

            {/* Expiry + CVV row */}
            <div className="pc__field-row">
              <div className="pc__field-group">
                <label className="pc__field-label">Expiry Date</label>
                <input
                  type="text"
                  className={`pc__input ${errors.expiry ? 'pc__input--error' : ''}`}
                  placeholder="MM / YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={7}
                  autoComplete="cc-exp"
                  inputMode="numeric"
                />
                {errors.expiry && <span className="pc__error">{errors.expiry}</span>}
              </div>
              <div className="pc__field-group">
                <label className="pc__field-label">CVV</label>
                <input
                  type="password"
                  className={`pc__input ${errors.cvv ? 'pc__input--error' : ''}`}
                  placeholder="···"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                />
                {errors.cvv && <span className="pc__error">{errors.cvv}</span>}
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="pc__security">
            <span className="pc__security-icon">🔒</span>
            <span className="pc__security-text">256-bit SSL encryption · Your data is safe</span>
          </div>

          {/* Pay button */}
          <button className="pc__pay-btn" onClick={handleConfirm}>
            <span className="pc__pay-btn-icon">
              <CreditCardIcon />
            </span>
            Pay {currency} {totalPrice}
          </button>

          <p className="pc__terms">
            By continuing you agree to our{' '}
            <button type="button" className="pc__link-btn" onClick={() => window.open('/terms', '_blank')}>
              Terms &amp; Conditions
            </button>
          </p>
        </>
      )}

      {/* ── Instapay panel ──────────────────────────── */}
      {tab === 'instapay' && (
        <>
          <div className="pc__instapay-panel">
            <div className="pc__instapay-icon-wrap">
              <LightningIcon />
            </div>
            <h3 className="pc__instapay-title">Pay via Instapay</h3>
            <p className="pc__instapay-send">
              Send <strong>{currency} {totalPrice}</strong> to
            </p>
            <div className="pc__instapay-address">CareConnect@instapay</div>
            <p className="pc__instapay-note">Include your full name in the payment note</p>
          </div>

          {/* Security note */}
          <div className="pc__security">
            <span className="pc__security-icon">🔒</span>
            <span className="pc__security-text">256-bit SSL encryption · Your data is safe</span>
          </div>

          {/* I've Sent the Payment button */}
          <button className="pc__sent-btn" onClick={handleConfirm}>
            <span className="pc__pay-btn-icon">
              <CreditCardIcon />
            </span>
            I've Sent the Payment
          </button>

          <p className="pc__terms">
            By continuing you agree to our{' '}
            <button type="button" className="pc__link-btn" onClick={() => window.open('/terms', '_blank')}>
              Terms &amp; Conditions
            </button>
          </p>
        </>
      )}
    </div>
  );
};

export default PaymentCard;