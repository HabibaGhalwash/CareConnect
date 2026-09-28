/*
 * CommunitySidebar.jsx
 *
 * Left purple sidebar for the Community Center page.
 * Contains:
 *  - "Community Center" header
 *  - Nav items: Messages, We Are One, Favorites
 *  - User profile row at the bottom
 */

import React, { useState } from 'react';
import './CommunitySidebar.css';

/* ── Nav items data ──────────────────────────────── */
const navItems = [
    {
        id: 'messages',
        label: 'Messages',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <polyline points="2,4 12,13 22,4" />
            </svg>
        ),
    },
    {
        id: 'we-are-one',
        label: 'We Are One',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: 'favorites',
        label: 'Favorites',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
    },
];

/**
 * CommunitySidebar
 *
 * Props:
 *   activeItem     – id of active nav item ('messages' | 'we-are-one' | 'favorites')
 *   onItemClick    – callback(id)
 *   currentUser    – { name, avatar } for bottom profile row
 */
const CommunitySidebar = ({
    activeItem = 'we-are-one',
    onItemClick = () => { },
    currentUser = { name: 'Amira Ahmed', avatar: null },
}) => {
    const [open, setOpen] = useState(false);

    return (
        <aside className="cs">
            {/* Header — always visible, acts as toggle on mobile */}
            <button
                className="cs__toggle-btn"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <span className="cs__header-text">Community Center</span>
                <span className="cs__chevron">
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            {/* Nav + Profile — collapsible on mobile */}
            <div className={`cs__body ${open ? 'cs__body--open' : ''}`}>
                <nav className="cs__nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`cs__nav-item ${activeItem === item.id ? 'cs__nav-item--active' : ''}`}
                            onClick={() => { onItemClick(item.id); setOpen(false); }}
                            aria-current={activeItem === item.id ? 'page' : undefined}
                        >
                            <span className="cs__nav-icon">{item.icon}</span>
                            <span className="cs__nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User profile at bottom */}
                <div className="cs__profile">
                    <div className="cs__profile-avatar">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name} className="cs__profile-img" />
                        ) : (
                            <div className="cs__profile-initials">
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <span className="cs__profile-name">{currentUser?.name || 'User'}</span>
                </div>
            </div>
        </aside>
    );
};

export default CommunitySidebar;