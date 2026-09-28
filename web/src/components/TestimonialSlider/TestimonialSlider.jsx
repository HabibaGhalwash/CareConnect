/*
 * TestimonialSlider.jsx
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ORIGINAL SOURCE PROMPT (adapted for CRA + plain JSX):
 * ─────────────────────────────────────────────────────────────────────────────
 * Copy-paste this component to /components/ui folder:
 *
 * testimonial-slider.tsx / demo.tsx
 * "use client"
 * import React, { useState, useEffect, useRef } from 'react';
 * import { motion } from 'framer-motion';
 * import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
 * import Image from 'next/image';
 *
 * interface Testimonial {
 *   id: number;
 *   quote: string;
 *   name: string;
 *   username: string;
 *   avatar: string;
 * }
 *
 * ADAPTATIONS MADE FOR THIS PROJECT:
 *  - Removed TypeScript interfaces (plain JSX)
 *  - Replaced next/image with <img> tag (CRA, not Next.js)
 *  - Removed "use client" directive (not needed in CRA)
 *  - Replaced Tailwind classes with CSS module class names
 *  - Replaced primary/dark color tokens with CareConnect brand colors
 *  - Kept framer-motion (install: npm install framer-motion)
 *  - Kept lucide-react icons (install: npm install lucide-react)
 *  - Filled avatar images with real Unsplash stock photos
 *
 * DEPENDENCIES TO INSTALL:
 *   npm install framer-motion lucide-react
 *
 * INTEGRATION GUIDELINES (from original prompt):
 *  1. Analyze the component structure and identify all required dependencies
 *  2. Review the component's arguments and state
 *  3. Identify any required context providers or hooks and install them
 *  4. Questions to Ask:
 *     - What data/props will be passed to this component?
 *     - Are there any specific state management requirements?
 *     - Are there any required assets (images, icons, etc.)?
 *     - What is the expected responsive behavior?
 *     - What is the best place to use this component in the app?
 *
 * Steps to integrate:
 *  0. Copy paste all the code above in the correct directories
 *  1. Install external dependencies (framer-motion, lucide-react)
 *  2. Fill image assets with Unsplash stock images
 *  3. Use lucide-react icons for svgs or logos if component requires them
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import './TestimonialSlider.css';

/* ── Testimonial data ────────────────────────────── */
const testimonials = [
  {
    id: 1,
    quote: 'Dr.Mohamed is very patient with the kids and is very intelligent.',
    name: "Farida's Mom",
    username: '@faridas_mom',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 2,
    quote: 'I would love to give my appreciation to Dr. Yasmine for helping my child to communicate.',
    name: "Selim's Parent",
    username: '@selims_parent',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 3,
    quote: 'Thank you Dr.Mona, my child can sleep better and no more nightmares.',
    name: "Layla's Mom",
    username: '@laylas_mom',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 4,
    quote: 'The sessions helped my daughter gain confidence in social settings. Remarkable progress!',
    name: "Nour's Dad",
    username: '@nours_dad',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 5,
    quote: 'An innovative approach that truly solved my son\'s communication challenges.',
    name: "Omar's Mom",
    username: '@omars_mom',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face',
  },
];

/* ── Helpers ─────────────────────────────────────── */
const getVisibleCount = (width) => {
  if (width >= 1024) return 3;
  if (width >= 640)  return 2;
  return 1;
};

const TestimonialSlider = () => {
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [windowWidth, setWindowWidth]     = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection]         = useState(1);
  const autoPlayRef                       = useRef(null);

  /* resize listener */
  useEffect(() => {
    const handleResize = () => {
      const newW = window.innerWidth;
      setWindowWidth(newW);
      const maxIdx = testimonials.length - getVisibleCount(newW);
      if (currentIndex > maxIdx) setCurrentIndex(Math.max(0, maxIdx));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  /* autoplay */
  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = setInterval(() => {
      const visible = getVisibleCount(windowWidth);
      const maxIdx  = testimonials.length - visible;
      if (currentIndex >= maxIdx) {
        setDirection(-1);
        setCurrentIndex((p) => Math.max(0, p - 1));
      } else if (currentIndex <= 0) {
        setDirection(1);
        setCurrentIndex((p) => Math.min(maxIdx, p + 1));
      } else {
        setCurrentIndex((p) => p + direction);
      }
    }, 4000);
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, currentIndex, windowWidth, direction]);

  const visibleCount = getVisibleCount(windowWidth);
  const maxIndex     = testimonials.length - visibleCount;
  const canGoNext    = currentIndex < maxIndex;
  const canGoPrev    = currentIndex > 0;

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goNext = () => {
    if (!canGoNext) return;
    setDirection(1);
    setCurrentIndex((p) => Math.min(p + 1, maxIndex));
    pauseAutoPlay();
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    setDirection(-1);
    setCurrentIndex((p) => Math.max(p - 1, 0));
    pauseAutoPlay();
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
    pauseAutoPlay();
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -30 && canGoNext) goNext();
    else if (info.offset.x > 30 && canGoPrev) goPrev();
  };

  return (
    <div className="ts">
      <div className="ts__inner">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="ts__heading"
        >
          <h2 className="ts__title">Real Experiences, Real Impact</h2>
        </motion.div>

        <div className="ts__body">
          {/* Nav buttons */}
          <div className="ts__nav">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              disabled={!canGoPrev}
              className={`ts__nav-btn ${canGoPrev ? 'ts__nav-btn--active' : 'ts__nav-btn--disabled'}`}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              disabled={!canGoNext}
              className={`ts__nav-btn ${canGoNext ? 'ts__nav-btn--active' : 'ts__nav-btn--disabled'}`}
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>

          {/* Track */}
          <div className="ts__overflow">
            <motion.div
              className="ts__track"
              animate={{ x: `-${currentIndex * (100 / visibleCount)}%` }}
              transition={{ type: 'spring', stiffness: 70, damping: 20 }}
            >
              {testimonials.map((t) => (
                <motion.div
                  key={t.id}
                  className="ts__slide"
                  style={{ width: `${100 / visibleCount}%` }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="ts__card"
                    whileHover={{ boxShadow: '0 10px 24px rgba(123,92,191,0.15)' }}
                  >
                    {/* Quote icon watermark */}
                    <div className="ts__quote-icon">
                      <Quote size={48} />
                    </div>

                    <div className="ts__card-body">
                      <p className="ts__quote">&ldquo;{t.quote}&rdquo;</p>

                      <div className="ts__author">
                        <div className="ts__avatar-wrap">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="ts__avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {/* Pulse ring */}
                          <motion.div
                            className="ts__avatar-ring"
                            animate={{ scale: [1, 1.3, 1], opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          />
                        </div>
                        <div>
                          <p className="ts__author-name">{t.name}</p>
                          <p className="ts__author-handle">{t.username}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Dots */}
          <div className="ts__dots">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <motion.button
                key={i}
                onClick={() => goToSlide(i)}
                className="ts__dot-btn"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to testimonial ${i + 1}`}
              >
                <motion.div
                  className={`ts__dot ${i === currentIndex ? 'ts__dot--active' : ''}`}
                  animate={{ scale: i === currentIndex ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: i === currentIndex ? Infinity : 0, repeatDelay: 1 }}
                />
                {i === currentIndex && (
                  <motion.div
                    className="ts__dot-ring"
                    animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;