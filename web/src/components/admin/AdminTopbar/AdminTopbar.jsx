/*
 * AdminTopbar.jsx
 *
 * Props:
 *   title   – page title
 *   sub     – optional subtitle
 *   extra   – optional React node (right-side action buttons)
 *   showSearch – boolean (default true)
 *   searchValue – current search input value
 *   onSearchChange – callback(searchValue)
 */

import React from 'react';
import '../admin-base.css';

const AdminTopbar = ({ title = 'Dashboard', sub = null, extra = null, showSearch = true, showNotif = true, searchValue = '', onSearchChange = () => {} }) => (
  <div className="adm-topbar">
    <div className="adm-topbar-title">
      {title}
      {sub && <span className="adm-topbar-sub">{sub}</span>}
    </div>
    <div className="adm-tb-actions">
      {showSearch && (
        <div className="adm-tb-search">
          <span>🔍</span>
          <input
            placeholder={`Search ${title.toLowerCase()}…`}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {extra}
      {showNotif && (
        <button className="adm-icon-btn" aria-label="Notifications">
          🔔
          <span className="adm-notif-dot" />
        </button>
      )}
    </div>
  </div>
);

export default AdminTopbar;