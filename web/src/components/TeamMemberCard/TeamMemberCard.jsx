/*
 * TeamMemberCard.jsx
 *
 * Displays one team member with circular avatar, name, and role.
 *
 * Props:
 *   name           – full name
 *   role           – job title
 *   avatar         – image URL or imported asset (optional)
 *   avatarColor    – fallback color if no image
 *   bio            – short one-liner bio
 */

import React from 'react';
import './TeamMemberCard.css';

const TeamMemberCard = ({
  name        = 'Team Member',
  role        = 'Role',
  avatar      = null,
  avatarColor = '#C8B4D8',
  bio         = '',
}) => {
  return (
    <div className="tmc">
      <div className="tmc__avatar-wrap">
        {avatar ? (
          <img src={avatar} alt={name} className="tmc__avatar-img" />
        ) : (
          <div className="tmc__avatar-ph" style={{ background: avatarColor }}>
            {name.charAt(0)}
          </div>
        )}
      </div>
      <h3 className="tmc__name">{name}</h3>
      <p className="tmc__role">{role}</p>
      {bio && <p className="tmc__bio">{bio}</p>}
    </div>
  );
};

export default TeamMemberCard;