/*
 * ValueCard.jsx
 *
 * Displays one of CareConnect's core values with an icon, title, and description.
 *
 * Props:
 *   icon    – emoji
 *   title   – value name
 *   desc    – short description
 *   bg      – card background color
 */

import React from 'react';
import './ValueCard.css';

const ValueCard = ({
  icon  = null,
  title = 'Value',
  desc  = '',
  bg    = '#F6F2EE',
}) => {
  const Icon = icon;

  return (
    <div className="value-card" style={{ background: bg }}>
      <div className="value-card__icon" aria-hidden="true">
        {Icon ? <Icon size={22} strokeWidth={2.2} /> : null}
      </div>
      <h3 className="value-card__title">{title}</h3>
      <p className="value-card__desc">{desc}</p>
    </div>
  );
};

export default ValueCard;