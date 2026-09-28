/*
 * AboutUs.jsx — CareConnect About Us Page
 *
 * Sections (top → bottom):
 *  1. Navbar
 *  2. Hero          — purple gradient banner with headline + tagline + CTA
 *  3. Mission       — two-column: large text left, mint accent card right
 *  4. Stats row     — 4 StatCards on warm bg
 *  5. Services      — "What We Offer" — 6 service tiles on alt bg
 *  6. How It Works  — 3-step numbered flow
 *  7. Values        — 4 ValueCards on white
 *  8. Team          — founder + core team members
 *  9. CTA banner    — join us / sign up strip
 * 10. Footer
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Backpack,
  CalendarCheck,
  Globe,
  HandHeart,
  Heart,
  Link2,
  MapPinned,
  MessageCircle,
  Mic,
  School,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Users,
} from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import StatCard from '../../components/StatCard/StatCard';
import ValueCard from '../../components/ValueCard/ValueCard';
import TeamMemberCard from '../../components/TeamMemberCard/TeamMemberCard';
import './AboutUs.css';

import habibaprof from '../../assets/habibaprof.png';
import nadaprof from '../../assets/nadaprof.png';
import maryamprof from '../../assets/marymprof.png';
import mariamprof from '../../assets/mariamprof.png';

/* ── Data ────────────────────────────────────────── */
const STATS = [
  { number: '1,200+', label: 'Families Supported', icon: Users, accent: '#9D64AA' },
  { number: '350+', label: 'Verified Specialists', icon: Stethoscope, accent: '#9CCFC9' },
  { number: '42', label: 'Partner Schools', icon: School, accent: '#7B4A87' },
  { number: '5,000+', label: 'Sessions Completed', icon: CalendarCheck, accent: '#63ADA8' },
];

const SERVICES = [
  {
    icon: School,
    title: 'Schools',
    desc: 'We connect families with inclusive schools that understand their child\'s needs — from neurodevelopmental support to sensory-friendly environments.',
  },
  {
    icon: Backpack,
    title: 'Shadow Teachers',
    desc: 'Certified shadow teachers provide personalised in-classroom support so every child can learn, grow, and thrive alongside their peers.',
  },
  {
    icon: Stethoscope,
    title: 'Therapists',
    desc: 'Book verified speech, occupational, and physical therapists online or in-person — sessions tailored to your child\'s pace and progress.',
  },
  {
    icon: HandHeart,
    title: 'Donations',
    desc: 'Give or receive assistive equipment — wheelchairs, shower chairs, communication tools — freely, from families who understand.',
  },
  {
    icon: MessageCircle,
    title: 'Community Center',
    desc: 'Join parent groups, share experiences, and find solidarity in a safe, moderated community that knows what you\'re going through.',
  },
  {
    icon: Mic,
    title: 'Communication Tools',
    desc: 'Our AAC board gives non-verbal children a voice — simple, expressive, and designed with inclusion at its heart.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up as a parent in minutes. Tell us about your child and what kind of support you\'re looking for.',
  },
  {
    step: '02',
    title: 'Explore & Connect',
    desc: 'Browse verified therapists, shadow teachers, and inclusive schools — filter by specialization, location, and session type.',
  },
  {
    step: '03',
    title: 'Book & Grow',
    desc: 'Confirm your booking, attend sessions, and watch your child flourish — with every tool you need in one place.',
  },
];

const VALUES = [
  {
    icon: Heart,
    title: 'Empathy First',
    desc: 'Every feature we build starts with listening. We are parents, caregivers, and specialists — we live this mission.',
    bg: '#f3effc',
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Trust',
    desc: 'Every specialist is manually verified. Every school is reviewed. Your family\'s safety is never a shortcut.',
    bg: '#E2F4F2',
  },
  {
    icon: Globe,
    title: 'Accessibility for All',
    desc: 'No family should be left without support because of geography or budget. We work to make care reachable.',
    bg: '#fef6e4',
  },
  {
    icon: Link2,
    title: 'Community Power',
    desc: 'Parenting a child with special needs is not a solo journey. We bring people together to lift each other up.',
    bg: '#f3effc',
  },
];

const TEAM = [
  {
    name: 'Habiba Ghalwash',
    role: 'Co-Founder & CEO',
    avatarColor: '#9D64AA',
    avatar: habibaprof,
    bio: 'Driven by a personal journey with a sibling who needed extra support.',
  },
  {
    name: 'Nada Khalil',
    role: 'Co-Founder & CEO',
    avatarColor: '#B8A9D9',
    avatar: nadaprof,
    bio: 'Speech-language therapist with 8 years specialising in early childhood.',
  },
  {
    name: 'Maryam Seddik',
    role: 'Co-Founder & CEO',
    avatarColor: '#63ADA8',
    avatar: maryamprof,
    bio: 'Certified shadow teacher and advocate for inclusive classroom design.',
  },
  {
    name: 'Mariam Mohamed',
    role: 'Co-Founder & CEO',
    avatarColor: '#C8B4D8',
    avatar: mariamprof,
    bio: 'Builds the spaces where parents find each other and find hope.',
  },
];

/* ── Component ────────────────────────────────────── */
const AboutUs = () => {
  return (
    <div className="about-page">
      <Navbar />

      {/* ── 1. HERO ───────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero__inner">
          <span className="about-hero__eyebrow">About CareConnect</span>
          <h1 className="about-hero__heading">
            Because every child deserves<br />
            the right support — and every<br />
            parent deserves a community.
          </h1>
          <p className="about-hero__sub">
            CareConnect was born from a simple belief: no family should have to
            navigate special needs support alone. We bring therapists, shadow
            teachers, inclusive schools, donations, and a caring community
            into one place — built with love, in Egypt, for families everywhere.
          </p>
          <div className="about-hero__ctas">
            <Link to="/signup" className="about-hero__cta about-hero__cta--primary">
              Join Our Community
            </Link>
            <Link to="/" className="about-hero__cta about-hero__cta--outline">
              Explore Services
            </Link>
          </div>
        </div>

        {/* Decorative mint blob */}
        <div className="about-hero__blob" aria-hidden="true" />
      </section>

      {/* ── 2. MISSION ────────────────────────────────── */}
      <section className="about-mission">
        <div className="about-mission__left">
          <span className="about-section-eyebrow">Our Mission</span>
          <h2 className="about-section-title">
            Connecting families with the care their children deserve
          </h2>
          <p className="about-mission__body">
            In Egypt and across the region, families of children with special
            needs face a scattered landscape — the right therapist is hard to
            find, inclusive schools are not always visible, and the emotional
            weight can be isolating.
          </p>
          <p className="about-mission__body">
            CareConnect changes that. We are a platform that centralises every
            resource a family needs: verified specialists, inclusive schools,
            assistive-device donations, a parent community, and AAC
            communication tools — all in one warm, trustworthy space.
          </p>
        </div>

        <div className="about-mission__right">
          <div className="about-mission__card about-mission__card--mint">
            <span className="about-mission__card-icon" aria-hidden="true">
              <Sprout size={24} strokeWidth={2.2} />
            </span>
            <h3>Founded in 2024</h3>
            <p>
              CareConnect started with a small team of parents, therapists,
              and technologists who had lived the gap first-hand and decided
              to close it.
            </p>
          </div>
          <div className="about-mission__card about-mission__card--purple">
            <span className="about-mission__card-icon" aria-hidden="true">
              <MapPinned size={24} strokeWidth={2.2} />
            </span>
            <h3>Cairo-Born, Region-Ready</h3>
            <p>
              We began in Cairo and are scaling across Egypt — with plans to
              reach every Arabic-speaking family that needs us.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. STATS ──────────────────────────────────── */}
      <section className="about-stats">
        <span className="about-section-eyebrow">Our Impact</span>
        <h2 className="about-section-title about-section-title--center">
          Numbers that matter to us
        </h2>
        <div className="about-stats__grid">
          {STATS.map((s) => (
            <StatCard
              key={s.label}
              number={s.number}
              label={s.label}
              icon={s.icon}
              accent={s.accent}
            />
          ))}
        </div>
      </section>

      {/* ── 4. SERVICES ───────────────────────────────── */}
      <section className="about-services">
        <span className="about-section-eyebrow">What We Offer</span>
        <h2 className="about-section-title about-section-title--center">
          Everything your family needs, in one place
        </h2>
        <div className="about-services__grid">
          {SERVICES.map((svc) => (
            <div key={svc.title} className="about-services__card">
              <span className="about-services__icon" aria-hidden="true">
                <svc.icon size={22} strokeWidth={2.2} />
              </span>
              <h3 className="about-services__title">{svc.title}</h3>
              <p className="about-services__desc">{svc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ───────────────────────────── */}
      <section className="about-how">
        <span className="about-section-eyebrow">How It Works</span>
        <h2 className="about-section-title about-section-title--center">
          Getting started is simple
        </h2>
        <div className="about-how__steps">
          {HOW_IT_WORKS.map((step, idx) => (
            <div key={step.step} className="about-how__step">
              <div className="about-how__step-number">{step.step}</div>
              {idx < HOW_IT_WORKS.length - 1 && (
                <div className="about-how__connector" aria-hidden="true">
                  <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
                    <path d="M0 10 Q40 0 80 10" stroke="#9CCFC9" strokeWidth="2.5"
                      fill="none" strokeDasharray="5 3" />
                  </svg>
                </div>
              )}
              <h3 className="about-how__step-title">{step.title}</h3>
              <p className="about-how__step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. VALUES ─────────────────────────────────── */}
      <section className="about-values">
        <span className="about-section-eyebrow">Our Values</span>
        <h2 className="about-section-title about-section-title--center">
          The principles that guide everything we do
        </h2>
        <div className="about-values__grid">
          {VALUES.map((v) => (
            <ValueCard
              key={v.title}
              icon={v.icon}
              title={v.title}
              desc={v.desc}
              bg={v.bg}
            />
          ))}
        </div>
      </section>

      {/* ── 7. TEAM ───────────────────────────────────── */}
      <section className="about-team">
        <span className="about-section-eyebrow">The Team</span>
        <h2 className="about-section-title about-section-title--center">
          Meet the people behind CareConnect
        </h2>
        <div className="about-team__grid">
          {TEAM.map((member) => (
            <TeamMemberCard
              key={member.name}
              name={member.name}
              role={member.role}
              avatar={member.avatar}
              avatarColor={member.avatarColor}
              bio={member.bio}
            />
          ))}
        </div>
      </section>

      {/* ── 8. CTA BANNER ─────────────────────────────── */}
      <section className="about-cta">
        <div className="about-cta__inner">
          <h2 className="about-cta__heading">
            Ready to find the right support for your child?
          </h2>
          <p className="about-cta__sub">
            Join thousands of families already using CareConnect.
            It only takes a minute to get started.
          </p>
          <div className="about-cta__btns">
            <Link to="/signup" className="about-cta__btn about-cta__btn--primary">
              Sign Up Free
            </Link>
            <Link to="/community-center" className="about-cta__btn about-cta__btn--outline">
              Join the Community
            </Link>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="about-cta__deco" aria-hidden="true" />
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;