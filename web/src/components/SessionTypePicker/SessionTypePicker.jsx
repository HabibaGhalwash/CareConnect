/*
 * SessionTypePicker.jsx
 *
 * Shows two session type options (In Person / Online) with photos
 * and radio-style selectors, matching the design screenshot.
 *
 * Props:
 *   value          – 'inperson' | 'online' | null
 *   onChange       – callback(value)
 *   inPersonImage  – imported image or URL (optional)
 *   onlineImage    – imported image or URL (optional)
 */

import React from 'react';
import './SessionTypePicker.css';

const SessionTypePicker = ({
  value,
  onChange,
  inPersonImage = null,
  onlineImage   = null,
}) => {
  return (
    <div className="stp">

      {/* In Person */}
      <div
        className={`stp__option ${value === 'inperson' ? 'stp__option--selected' : ''}`}
        onClick={() => onChange('inperson')}
        role="radio"
        aria-checked={value === 'inperson'}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onChange('inperson')}
      >
        <div className="stp__img-wrap">
          {inPersonImage ? (
            <img src={inPersonImage} alt="In Person Session" className="stp__img" />
          ) : (
            <div className="stp__img-ph stp__img-ph--inperson">
              <span>👩‍⚕️🧒</span>
            </div>
          )}
        </div>
        <div className="stp__label-row">
          <div className={`stp__radio ${value === 'inperson' ? 'stp__radio--checked' : ''}`}>
            {value === 'inperson' && <div className="stp__radio-dot" />}
          </div>
          <span className="stp__label">In Person Session</span>
        </div>
      </div>

      {/* Online */}
      <div
        className={`stp__option ${value === 'online' ? 'stp__option--selected' : ''}`}
        onClick={() => onChange('online')}
        role="radio"
        aria-checked={value === 'online'}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onChange('online')}
      >
        <div className="stp__img-wrap">
          {onlineImage ? (
            <img src={onlineImage} alt="Online Session" className="stp__img" />
          ) : (
            <div className="stp__img-ph stp__img-ph--online">
              <span>💻🧒</span>
            </div>
          )}
        </div>
        <div className="stp__label-row">
          <div className={`stp__radio ${value === 'online' ? 'stp__radio--checked stp__radio--purple' : ''}`}>
            {value === 'online' && <div className="stp__radio-dot" />}
          </div>
          <span className="stp__label">Online Session</span>
        </div>
      </div>

    </div>
  );
};

export default SessionTypePicker;