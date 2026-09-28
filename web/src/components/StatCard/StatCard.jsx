/*
 * StatCard.jsx
 *
 * Displays one impact metric with an icon, number, and label.
 */

import React from 'react';
import './StatCard.css';

const StatCard = ({
  icon = null,
  number = '0',
  label = 'Metric',
  accent = '#9D64AA',
}) => {
  const Icon = icon;

  return (
    <article className="stat-card" style={{ '--accent': accent }}>
      <span className="stat-card__icon" aria-hidden="true">
        {Icon ? <Icon size={21} strokeWidth={2.3} /> : null}
      </span>
      <div className="stat-card__number">{number}</div>
      <p className="stat-card__label">{label}</p>
    </article>
  );
};

export default StatCard;
