/*
 * BookingDetailsCard.jsx
 *
 * Left dark-teal panel — appointment summary.
 *
 * Props:
 *   type        – 'therapist' | 'shadow-teacher'
 *   providerName – string
 *   date        – string  e.g. "Tuesday, 2 December 2025"
 *   startTime   – string  e.g. "7:30 pm"
 *   endTime     – string  e.g. "8:30 pm"
 *   duration    – string  e.g. "1 Hour"
 *   sessionType – string  e.g. "Online Session"  (therapist only)
 *   hourlyRate  – number
 *   hours       – number
 *   onBack      – callback
 */

import React from 'react';
import './BookingDetailsCard.css';

/* ── SVG icon helpers ─────────────────────────────── */
const IconPerson = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7 7 0 0 1 13 0"/></svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconMonitor = () => (
  <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
);

const BookingDetailsCard = ({
  type         = 'therapist',
  providerName = '—',
  date         = '—',
  startTime    = '—',
  endTime      = '—',
  duration     = '—',
  sessionType  = null,
  hourlyRate   = 450,
  hours        = 1,
  onBack       = () => {},
}) => {
  const isTherapist = type === 'therapist';
  const totalDue = hourlyRate * hours;

  return (
    <div className="bdc">
      {/* Appointment Summary pill */}
      <div className="bdc__pill">
        <span className="bdc__pill-dot" />
        <span className="bdc__pill-text">Appointment Summary</span>
      </div>

      {/* Main heading */}
      <h1 className="bdc__heading">Your Session<br />is Almost Booked</h1>
      <p className="bdc__subtext">Review the details below before completing your payment.</p>

      <div className="bdc__divider" />

      {/* Fields */}
      <div className="bdc__fields">

        {/* Therapist / Shadow Teacher */}
        <div className="bdc__field-with-icon">
          <div className="bdc__icon"><IconPerson /></div>
          <div className="bdc__field">
            <p className="bdc__field-label">{isTherapist ? 'Therapist' : 'Shadow Teacher'}</p>
            <p className="bdc__field-value">{providerName}</p>
          </div>
        </div>

        {/* Date */}
        <div className="bdc__field-with-icon">
          <div className="bdc__icon"><IconCalendar /></div>
          <div className="bdc__field">
            <p className="bdc__field-label">Date</p>
            <p className="bdc__field-value">{date}</p>
          </div>
        </div>

        {/* Session Type (therapist only) */}
        {isTherapist && sessionType && (
          <div className="bdc__field-with-icon">
            <div className="bdc__icon"><IconMonitor /></div>
            <div className="bdc__field">
              <p className="bdc__field-label">Session Type</p>
              <p className="bdc__field-value">{sessionType}</p>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="bdc__field-with-icon">
          <div className="bdc__icon"><IconClock /></div>
          <div className="bdc__field">
            <p className="bdc__field-label">Duration</p>
            <p className="bdc__field-value">{duration}</p>
          </div>
        </div>

        {/* Time */}
        <div className="bdc__field-with-icon">
          <div className="bdc__icon"><IconClock /></div>
          <div className="bdc__field">
            <p className="bdc__field-label">Time</p>
            <p className="bdc__field-value">{startTime} – {endTime}</p>
          </div>
        </div>

      </div>

      {/* Total due box */}
      <div className="bdc__total-box">
        <div>
          <p className="bdc__total-label">Total Due</p>
          <p className="bdc__total-amount">EGP {totalDue}</p>
        </div>
        <span className="bdc__total-badge">{hours} Session{hours !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default BookingDetailsCard;