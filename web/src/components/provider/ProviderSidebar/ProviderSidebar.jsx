/*
 * ProviderSidebar.jsx
 *
 * Left sidebar — shared by Therapist and Shadow Teacher interfaces.
 * Colours and nav items change based on `role` prop.
 *
 * Props:
 *   role         – 'therapist' | 'shadow-teacher'
 *   userName     – display name  (e.g. "Dr. Maha El Sayed")
 *   activeScreen – current screen id  (e.g. 'dashboard')
 *   onNavigate   – callback(screenId)
 *   onLogout     – callback
 */

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  DollarSign,
  User,
  BookOpen,
  LogOut,
} from 'lucide-react';
import logoImg from '../../../assets/logo.jpeg';
import './ProviderSidebar.css';

/* ── Nav items per role ──────────────────────── */
const NAV_THERAPIST = [
  { id: 'dashboard',  Icon: LayoutDashboard, label: 'Dashboard'  },
  { id: 'schedule',   Icon: Calendar, label: 'My Schedule' },
  { id: 'patients',   Icon: Users, label: 'My Patients' },
  { id: 'earnings',   Icon: DollarSign, label: 'Earnings'    },
  { id: 'profile',    Icon: User, label: 'My Profile'  },
];

const NAV_SHADOW = [
  { id: 'dashboard',  Icon: LayoutDashboard, label: 'Dashboard'    },
  { id: 'schedule',   Icon: Calendar, label: 'My Schedule'   },
  { id: 'students',   Icon: BookOpen, label: 'My Students'   },
  { id: 'earnings',   Icon: DollarSign, label: 'Earnings'      },
  { id: 'profile',    Icon: User, label: 'My Profile'    },
];

const ProviderSidebar = ({
  role         = 'therapist',
  userName     = 'Provider',
  activeScreen = 'dashboard',
  onNavigate   = () => {},
  onLogout     = () => {},
}) => {
  const isTherapist = role === 'therapist';
  const navItems    = isTherapist ? NAV_THERAPIST : NAV_SHADOW;
  const initials    = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel   = isTherapist ? 'Therapist' : 'Shadow Teacher';

  return (
    <aside className={`pvs pvs--${role}`}>
      {/* Logo */}
      <div className="pvs__top">
        <img src={logoImg} alt="CareConnect" className="pvs__logo-img" />
        <span className="pvs__logo">CareConnect</span>
      </div>

      {/* Avatar + name */}
      <div className="pvs__avatar-area">
        <div className="pvs__avatar">{initials}</div>
        <div className="pvs__name">{userName}</div>
        <div className="pvs__role">{roleLabel}</div>
      </div>

      {/* Nav */}
      <nav className="pvs__nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`pvs__nav-item ${activeScreen === item.id ? 'pvs__nav-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activeScreen === item.id ? 'page' : undefined}
          >
            <item.Icon className="pvs__nav-icon-svg" size={18} strokeWidth={2} aria-hidden />
            <span className="pvs__nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button className="pvs__logout" onClick={onLogout}>
        <LogOut className="pvs__logout-icon" size={16} strokeWidth={2} aria-hidden />
        <span>Log Out</span>
      </button>
    </aside>
  );
};

export default ProviderSidebar;