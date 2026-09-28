/*
 * TherapistCard.jsx
 *
 * INTEGRATION PROMPT REFERENCE:
 * ─────────────────────────────────────────────────────────────────────────────
 * You are given a task to integrate an existing React component in the codebase
 *
 * The codebase should support:
 * - shadcn project structure
 * - Tailwind CSS
 * - Typescript
 *
 * If it doesn't, provide instructions on how to setup project via shadcn CLI,
 * install Tailwind or Typescript.
 *
 * Determine the default path for components and styles.
 * If default path for components is not /components/ui, provide instructions
 * on why it's important to create this folder.
 *
 * NOTE FOR THIS PROJECT:
 * This project uses Create React App (CRA) with plain JSX + CSS modules.
 * No TypeScript, no Tailwind, no shadcn. Components live in /src/components/.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TherapistCard.css';

/**
 * TherapistCard
 *
 * Props:
 *   id              – therapist ID for routing
 *   name            – therapist full name
 *   specialization  – e.g. "Speech Delay"
 *   years           – years of experience (number or string)
 *   image           – image URL or imported asset
 *   imagePlaceholder– fallback color if no image
 *   featured        – boolean, makes card larger / front-facing
 *   vertical        – boolean, shows specialization label rotated vertically
 */
const TherapistCard = ({
  id = null,
  name = 'Dr. Therapist',
  specialization = 'Speech Therapy',
  years,
  image = null,
  imagePlaceholder = '#B87BC0',
  featured = false,
  vertical = false,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleCardClick = () => {
    if (id) {
      navigate(`/therapist/${id}`);
    }
  };

  return (
    <div 
      className={`therapist-card ${featured ? 'therapist-card--featured' : ''} ${vertical ? 'therapist-card--vertical' : 'therapist-card--vertical'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: id ? 'pointer' : 'default' }}
    >
      {/* Photo */}
      <div className="therapist-card__photo">
        {image ? (
          <img src={image} alt={name} className="therapist-card__img" />
        ) : (
          <div
            className="therapist-card__img-ph"
            style={{ background: imagePlaceholder }}
          />
        )}
      </div>

      {/* Bottom overlay with info - shows for featured cards or on hover */}
      {(featured || isHovered) && (
        <div className="therapist-card__info">
          <span className="therapist-card__spec">{specialization}</span>
          {years && <span className="therapist-card__years">{years} Years</span>}
        </div>
      )}

      {/* Vertical specialization label - show only for featured cards initially */}
      {featured && (
        <div className="therapist-card__vertical-label">
          <span>{specialization}</span>
        </div>
      )}
    </div>
  );
};

export default TherapistCard;