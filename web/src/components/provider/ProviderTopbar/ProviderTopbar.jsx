/*
 * ProviderTopbar.jsx
 *
 * Top bar for both provider interfaces.
 *
 * Props:
 *   title  – page title string
 *   role   – 'therapist' | 'shadow-teacher'
 *   extra  – optional React node (action buttons on right)
 */

import React from 'react';
import './ProviderTopbar.css';

const ProviderTopbar = ({ title = 'Dashboard', role = 'therapist', extra = null }) => {
  return (
    <div className="pvtb">
      <span className="pvtb__title">{title}</span>
      <div className="pvtb__actions">
        {extra}
      </div>
    </div>
  );
};

export default ProviderTopbar;