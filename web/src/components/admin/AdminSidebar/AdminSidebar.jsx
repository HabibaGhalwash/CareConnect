/*
 * AdminSidebar.jsx
 *
 * Left sidebar for the Admin Portal.
 * Matches ProviderSidebar design and styling.
 * Props:
 *   activeScreen – current screen id
 *   onNavigate   – callback(screenId)
 *   onLogout     – callback
 *   adminName    – string
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building,
  Gift,
  MessageSquare,
  Volume2,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import logoImg from '../../../assets/logo.jpeg';
import './AdminSidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'users', Icon: Users, label: 'User Management' },
  { id: 'bookings', Icon: Calendar, label: 'Bookings' },
  { id: 'schools', Icon: Building, label: 'Schools' },
  { id: 'donations', Icon: Gift, label: 'Donation Center' },
  { id: 'community', Icon: MessageSquare, label: 'Community' },
  { id: 'communication', Icon: Volume2, label: 'Comm. Tools' },
  { id: 'reports', Icon: BarChart3, label: 'Reports' },
  { id: 'settings', Icon: Settings, label: 'Settings' },
];

const AdminSidebar = ({
  activeScreen = 'dashboard',
  onNavigate = () => { },
  onLogout = () => { },
  adminName = 'Sara Admin',
  badges = {},
}) => {
  const initials = adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="ads ads--admin">
      {/* Logo */}
      <div className="ads__top">
        <img src={logoImg} alt="CareConnect" className="ads__logo-img" />
        <span className="ads__logo">CareConnect</span>
      </div>

      {/* Avatar + name */}
      <div className="ads__avatar-area">
        <div className="ads__avatar">{initials}</div>
        <div className="ads__name">{adminName}</div>
        <div className="ads__role">Super Administrator</div>
      </div>

      {/* Nav */}
      <nav className="ads__nav">
        {NAV_ITEMS.map((item) => {
          const badgeCount = badges[item.id] || 0;
          return (
          <button
            key={item.id}
            className={`ads__nav-item ${activeScreen === item.id ? 'ads__nav-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activeScreen === item.id ? 'page' : undefined}
          >
            <item.Icon className="ads__nav-icon-svg" size={18} strokeWidth={2} aria-hidden />
            <span className="ads__nav-label">{item.label}</span>
            {badgeCount > 0 && (
              <span className="ads__nav-badge">{badgeCount}</span>
            )}
          </button>
        )})}
      </nav>

      {/* Logout */}
      <button className="ads__logout" onClick={onLogout}>
        <LogOut className="ads__logout-icon" size={16} strokeWidth={2} aria-hidden />
        <span>Log Out</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;