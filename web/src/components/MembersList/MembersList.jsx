/*
 * MembersList.jsx
 *
 * Right panel — "Group Members" list with circular avatars.
 * On mobile (≤768px) the list is collapsible.
 *
 * Props:
 *   members – array of { id, name, avatar, avatarColor }
 */

import React, { useState } from 'react';
import './MembersList.css';

const ChevronIcon = ({ open }) => (
    <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const MembersList = ({ members = [] }) => {
    const colors = ['#c8b4d8', '#9CCFC9', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C'];
    const [open, setOpen] = useState(false);

    return (
        <aside className="ml">
            {/* Collapsible header — acts as toggle on mobile */}
            <button
                className="ml__toggle-btn"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <div className="ml__toggle-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <div>
                        <h3 className="ml__title">Group Members</h3>
                        <p className="ml__count">{members.length} members</p>
                    </div>
                </div>
                <span className="ml__chevron"><ChevronIcon open={open} /></span>
            </button>

            {/* List — always visible on desktop, toggleable on mobile */}
            <div className={`ml__body ${open ? 'ml__body--open' : ''}`}>
                <ul className="ml__list">
                    {members.map((member, index) => (
                        <li key={member.id} className="ml__item" title={member.email}>
                            <div className="ml__avatar">
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="ml__avatar-img"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div
                                        className="ml__avatar-ph"
                                        style={{ background: colors[index % colors.length] }}
                                    >
                                        {member.initial || member.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="ml__info">
                                <span className="ml__name">{member.name}</span>
                                {member.location && <span className="ml__location">{member.location}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default MembersList;