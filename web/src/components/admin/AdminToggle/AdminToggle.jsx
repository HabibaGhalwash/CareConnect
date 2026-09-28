/*
 * AdminToggle.jsx
 * Reusable ON/OFF toggle switch.
 *
 * Props:
 *   value    – boolean
 *   onChange – callback(newValue)
 */

import React from 'react';

const AdminToggle = ({ value = true, onChange = () => {} }) => (
  <button
    className={`adm-toggle ${value ? 'on' : 'off'}`}
    onClick={() => onChange(!value)}
    aria-checked={value}
    role="switch"
    aria-label={value ? 'Enabled' : 'Disabled'}
  />
);

export default AdminToggle;