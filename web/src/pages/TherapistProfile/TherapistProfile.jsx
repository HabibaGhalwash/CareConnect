/*
 * TherapistProfile.jsx — CareConnect Therapist Profile Page
 *
 * This page shows one therapist's public profile.
 * It includes:
 * 1. Navbar
 * 2. Back button
 * 3. Therapist profile hero
 * 4. Booking form
 * 5. Child selection
 * 6. Calendar selection
 * 7. Session type picker
 * 8. Therapist details
 * 9. Footer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import BookingCalendar from '../../components/BookingCalendar/BookingCalendar';
import SessionTypePicker from '../../components/SessionTypePicker/SessionTypePicker';

import inPersonImage from '../../assets/inpers.png';
import onlineImage from '../../assets/onlin.png';
import fallbackImg from '../../assets/shadow-teacher.jpeg';

import './TherapistProfile.css';

import axios from 'axios';
import { API_BASE } from '../../services/api';

const TherapistProfile = () => {
  /*
     ROUTING

     id comes from the URL.
     navigate is used to move to other pages.
  */
  const { id } = useParams();
  const navigate = useNavigate();

  /*
     THERAPIST DATA STATES

     therapist stores the therapist profile from backend.
     loading controls the loading state while fetching therapist data.
  */
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
     BOOKING FORM STATES

     showBookingForm opens/closes the booking section.
     selectedDate stores the chosen calendar date.
     sessionTime stores the selected time.
     sessionPeriod stores am/pm.
     sessionType stores online or in-person.
  */
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sessionTime, setSessionTime] = useState('');
  const [sessionPeriod, setSessionPeriod] = useState('am');
  const [sessionType, setSessionType] = useState(null);

  /*
     CHILD SELECTION STATES

     children stores the parent's children from backend.
     selectedChild stores the child selected for the booking.
     loadingChildren controls loading state for children.
     childrenError stores any child-loading error.
  */
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState('');

  /*
     FETCH THERAPIST

     Loads the therapist profile using the therapist ID from the URL.
  */
  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/modules/therapist/therapist?id=${id}`
        );

        const data = res.data;
        const record = Array.isArray(data) ? data[0] : null;

        setTherapist(record || null);
      } catch (err) {
        console.error(err);
        setTherapist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [id]);

  /*
     FETCH PARENT CHILDREN

     Gets the parent ID either from URL query params or localStorage.
     Then loads all children linked to this parent.
  */
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const urlParentId = queryParams.get('parentId');
        const parentData = JSON.parse(localStorage.getItem('parent'));
        const parentId = urlParentId || (parentData ? parentData.P_ID : null);

        if (!parentId) {
          setChildrenError('Please log in as a parent to book a session.');
          setLoadingChildren(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE}/modules/child/search?keyword=P_ID&keyvalue=${parentId}`
        );

        console.log('✅ Children fetched:', response.data);
        setChildren(Array.isArray(response.data) ? response.data : []);

        if (Array.isArray(response.data) && response.data.length > 0) {
          setSelectedChild(response.data[0].Child_ID);
        }
      } catch (err) {
        console.error('❌ Error fetching children:', err);
        setChildrenError('Failed to load your children.');
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchChildren();
  }, []);

  /*
     IMAGE SOURCE

     Uses therapist uploaded image if available.
     Otherwise, it uses the fallback image.
  */
  const imageSrc = useMemo(() => {
    if (!therapist) return fallbackImg;

    return therapist.Imagepath
      ? `${API_BASE}${therapist.Imagepath}`
      : fallbackImg;
  }, [therapist]);

  /*
     CONFIRM BOOKING

     Validates booking fields.
     Calculates end time.
     Gets parent ID.
     Sends all booking details to the booking page using navigate state.
  */
  const handleConfirmBooking = () => {
    if (!selectedDate || !sessionTime || !sessionType) {
      alert('Please fill all booking details');
      return;
    }

    if (!selectedChild) {
      alert('Please select a child for this booking');
      return;
    }

    const [hour, minute] = sessionTime.split(':').map(Number);
    const endHour = hour + 1;
    const formattedEndTime = `${endHour}:${minute.toString().padStart(2, '0')}`;

    const queryParams = new URLSearchParams(window.location.search);
    const urlParentId = queryParams.get('parentId');
    const parentData = JSON.parse(localStorage.getItem('parent'));
    const parentId = urlParentId || (parentData ? parentData.P_ID : null);

    navigate('/booking', {
      state: {
        type: 'therapist',
        providerName: therapist.Fullname,
        date: selectedDate
          ? selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          : '-',
        startTime: `${sessionTime} ${sessionPeriod}`,
        endTime: `${formattedEndTime} ${sessionPeriod}`,
        duration: '1 Hour',
        sessionType:
          sessionType === 'online' ? 'Online Session' : 'In-Person Session',
        hourlyRate: therapist.Hourly_Rate,
        hours: 1,
        T_ID: therapist.T_ID,
        Child_ID: selectedChild,
        parentId: parentId,
      },
    });
  };

  /*
     LOADING VIEW

     Shows while therapist profile is loading.
  */
  if (loading) {
    return (
      <div className="therapist-profile-page">
        <Navbar />
        <div className="therapist-profile__not-found">
          <p>Loading therapist profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  /*
     NOT FOUND VIEW

     Shows if therapist does not exist or backend returns no profile.
  */
  if (!therapist) {
    return (
      <div className="therapist-profile-page">
        <Navbar />
        <div className="therapist-profile__not-found">
          <h2>Therapist not found</h2>
          <button
            onClick={() => navigate('/therapist')}
            className="therapist-profile__back-btn"
          >
            Back to Therapists
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="therapist-profile-page">
      {/* Navbar */}
      <Navbar />

      {/* Back button */}
      <button
        onClick={() => navigate('/therapist')}
        className="therapist-profile__back-btn"
      >
        ← Back to Therapists
      </button>

      {/* Therapist profile hero */}
      <section className="therapist-profile__hero">
        <div className="therapist-profile__image-container">
          <img
            src={imageSrc}
            alt={therapist.Fullname}
            className="therapist-profile__image"
          />
        </div>

        <div className="therapist-profile__info">
          <h1 className="therapist-profile__name">{therapist.Fullname}</h1>

          <p className="therapist-profile__specialization">
            {therapist.Specialization}
          </p>

          <p className="therapist-profile__years">
            {therapist.Experience} Years of Experience
          </p>

          <div className="therapist-profile__bio">
            {therapist.bio ||
              `${therapist.Fullname} is a dedicated therapist providing personalized support to help children thrive.`}
          </div>

          {/* Qualifications */}
          <div className="therapist-profile__qualifications">
            <h3>Qualifications & Credentials</h3>
            <ul>
              <li>{therapist.Specialization}</li>
              <li>{therapist.Experience} years experience</li>
            </ul>
          </div>

          {/* Open / close booking form */}
          <button
            className="therapist-profile__book-btn"
            onClick={() => setShowBookingForm(!showBookingForm)}
          >
            {showBookingForm ? 'Close Booking' : 'Book an Appointment'}
          </button>
        </div>
      </section>

      {/* Booking form */}
      {showBookingForm && (
        <section className="therapist-profile__booking">
          <h2 className="therapist-profile__booking-title">Book a Session</h2>

          {/* Time selection */}
          <div className="therapist-profile__time-section">
            <label className="therapist-profile__booking-label">Time</label>

            <div className="therapist-profile__time-inputs">
              <input
                type="number"
                min="1"
                max="12"
                className="therapist-profile__time-input therapist-profile__time-hour"
                placeholder="7"
                value={sessionTime.split(':')[0] || ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const min = sessionTime.split(':')[1] || '00';
                  setSessionTime(`${hour}:${min}`);
                }}
              />

              <span className="therapist-profile__time-separator">:</span>

              <input
                type="number"
                min="0"
                max="59"
                className="therapist-profile__time-input therapist-profile__time-minute"
                placeholder="30"
                value={sessionTime.split(':')[1] || ''}
                onChange={(e) => {
                  const hour = sessionTime.split(':')[0] || '7';
                  const min = e.target.value.padStart(2, '0');
                  setSessionTime(`${hour}:${min}`);
                }}
              />

              <select
                className="therapist-profile__time-period"
                value={sessionPeriod}
                onChange={(e) => setSessionPeriod(e.target.value)}
              >
                <option value="am">am</option>
                <option value="pm">pm</option>
              </select>
            </div>
          </div>

          {/* Child selection dropdown */}
          <div className="therapist-profile__child-section">
            <label className="therapist-profile__booking-label">Select Child</label>

            {loadingChildren ? (
              <p style={{ color: '#999', fontSize: '14px' }}>
                Loading children...
              </p>
            ) : childrenError ? (
              <p style={{ color: '#d32f2f', fontSize: '14px' }}>
                ⚠️ {childrenError}
              </p>
            ) : children.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>
                No children found.
              </p>
            ) : (
              <select
                className="therapist-profile__child-select"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
              >
                <option value="">-- Choose a child --</option>

                {children.map((child) => (
                  <option key={child.Child_ID} value={child.Child_ID}>
                    {child.Name || 'Unknown'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date selection */}
          <div className="therapist-profile__calendar-section">
            <label className="therapist-profile__booking-label">Date</label>

            <BookingCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Session type selection */}
          <div className="therapist-profile__session-type-section">
            <label className="therapist-profile__booking-label">
              Session Type
            </label>

            <SessionTypePicker
              value={sessionType}
              onChange={setSessionType}
              inPersonImage={inPersonImage}
              onlineImage={onlineImage}
            />
          </div>

          {/* Booking action buttons */}
          <div className="therapist-profile__booking-actions">
            <button
              className="therapist-profile__confirm-btn"
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </button>

            <button
              className="therapist-profile__cancel-btn"
              onClick={() => {
                setShowBookingForm(false);
                setSelectedDate(null);
                setSessionTime('');
                setSessionType(null);
                setSelectedChild('');
              }}
            >
              Cancel Booking
            </button>
          </div>
        </section>
      )}

      {/* Therapist details section */}
      <section className="therapist-profile__details">
        <div className="therapist-profile__details-box">
          <h3>Specialties</h3>
          <p>{therapist.Specialization}</p>
        </div>

        <div className="therapist-profile__details-box">
          <h3>Availability</h3>
          <p>{therapist.Availability || 'Available upon request'}</p>
        </div>

        <div className="therapist-profile__details-box">
          <h3>Rate</h3>
          <p>EGP {therapist.Hourly_Rate} per 60-minute session</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TherapistProfile;