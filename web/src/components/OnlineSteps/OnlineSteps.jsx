/*
 * OnlineSteps.jsx
 *
 * "How Our Online Sessions Work" — two-column layout (steps + video).
 */

import React from 'react';
import { LogIn, Link2, MousePointerClick } from 'lucide-react';
import './OnlineSteps.css';

const steps = [
  {
    Icon: LogIn,
    title: 'Login',
    description: 'Enter your account and explore',
  },
  {
    Icon: Link2,
    title: 'Meeting Link',
    description: 'Press on the meeting link and enter',
  },
  {
    Icon: MousePointerClick,
    title: 'Participate',
    description: 'Engage with the therapist in the session',
  },
];

/**
 * @param {string|null} sessionVideo – URL to MP4 (e.g. file in /public/videos)
 * @param {string|null} sessionImage – optional still image instead of video
 * @param {string} imagePlaceholder – fallback panel color when no media
 */
const OnlineSteps = ({
  sessionVideo = '/videos/online-session-demo.mp4',
  sessionImage = null,
  imagePlaceholder = '#9CCFC9',
}) => {
  const showVideo = Boolean(sessionVideo);
  const showImage = Boolean(sessionImage) && !showVideo;

  return (
    <section className="online-steps">
      <div className="online-steps__inner">
        <div className="online-steps__list">
          <h2 className="online-steps__title">How Our Online Sessions Work</h2>

          <div className="online-steps__steps">
            {steps.map((step, idx) => (
              <div key={step.title} className="online-steps__step">
                <div className="online-steps__icon-col">
                  <div className="online-steps__icon-bubble">
                    <step.Icon className="online-steps__icon-svg" size={22} strokeWidth={2} aria-hidden />
                  </div>
                  {idx < steps.length - 1 && <div className="online-steps__connector" />}
                </div>

                <div className="online-steps__text">
                  <h3 className="online-steps__step-title">{step.title}</h3>
                  <p className="online-steps__step-desc">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="online-steps__media">
          {showVideo ? (
            <video
              className="online-steps__video"
              controls
              playsInline
              preload="metadata"
              title="How our online sessions work"
            >
              <source src={sessionVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : showImage ? (
            <img
              src={sessionImage}
              alt="Online session example"
              className="online-steps__img"
            />
          ) : (
            <div
              className="online-steps__img-ph"
              style={{ background: imagePlaceholder }}
            >
              <div className="online-steps__play-btn">
                <span>▶️</span>
              </div>
            </div>
          )}

          {!showVideo && (
            <div className="online-steps__progress-bar">
              <div className="online-steps__progress-fill" />
              <div className="online-steps__progress-dot" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OnlineSteps;