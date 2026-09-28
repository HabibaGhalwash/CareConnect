/*
 * ShadowTeacherProfile.jsx — CareConnect Shadow Teacher Profile Page
 *
 * This page shows one shadow teacher's public profile.
 * It includes:
 * 1. Navbar
 * 2. Back button
 * 3. Shadow teacher profile hero
 * 4. Booking form
 * 5. Child selection dropdown
 * 6. Calendar selection
 * 7. Booking confirmation
 * 8. Shadow teacher details
 * 9. Footer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import BookingCalendar from '../../components/BookingCalendar/BookingCalendar';

import './st_profile.css';

import axios from 'axios';
import { API_BASE } from '../../services/api';
import fallbackImg from '../../assets/shadow-teacher.jpeg';

const ShadowTeacherProfile = () => {
  /*
     ROUTING

     id comes from the URL.
     navigate is used to move between pages.
  */
  const { id } = useParams();
  const navigate = useNavigate();

  /*
     SHADOW TEACHER DATA STATES

     teacher stores the shadow teacher profile from backend.
     loading controls the loading state while fetching teacher data.
  */
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
     BOOKING FORM STATES

     showBookingForm opens/closes the booking section.
     selectedDate stores the selected calendar date.
     sessionTime stores the selected time.
     sessionPeriod stores am/pm.
  */
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sessionTime, setSessionTime] = useState('');
  const [sessionPeriod, setSessionPeriod] = useState('am');

  /*
     CHILD SELECTION STATES

     children stores the parent's children from backend.
     selectedChild stores the child chosen for this booking.
     loadingChildren controls loading state for child data.
     childrenError stores any child-loading error.
  */
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState('');

  /*
     FETCH SHADOW TEACHER

     Loads the shadow teacher profile using the teacher ID from the URL.
  */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/modules/shadow_teacher/shadow_teacher?id=${id}`
        );

        const data = res.data;
        const record = Array.isArray(data) ? data[0] : null;

        setTeacher(record || null);
      } catch (err) {
        console.error(err);
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  /*
     FETCH PARENT CHILDREN

     Gets the parent ID either from URL query params or localStorage.
     Then fetches all children linked to this parent.
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

     Uses uploaded teacher image if available.
     Otherwise, uses fallback image.
  */
  const imageSrc = useMemo(() => {
    if (!teacher) return fallbackImg;

    return teacher.Imagepath
      ? `${API_BASE}${teacher.Imagepath}`
      : fallbackImg;
  }, [teacher]);

  /*
     CONFIRM BOOKING

     Validates booking fields.
     Calculates end time.
     Gets parent ID.
     Sends booking data to the booking page using navigate state.
  */
  const handleConfirmBooking = () => {
    if (!selectedDate || !sessionTime) {
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
        type: 'shadow_teacher',
        providerName: teacher.Fullname,
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
        hourlyRate: teacher.Hourly_Rate,
        hours: 1,
        ST_ID: teacher.ST_ID,
        Child_ID: selectedChild,
        parentId: parentId,
      },
    });
  };

  /*
     LOADING VIEW

     Shows while the shadow teacher profile is loading.
  */
  if (loading) {
    return (
      <div className="st-profile-page">
        <Navbar />

        <div className="st-profile__not-found">
          <p>Loading shadow teacher profile...</p>
        </div>

        <Footer />
      </div>
    );
  }

  /*
     NOT FOUND VIEW

     Shows if the teacher does not exist or backend returns no profile.
  */
  if (!teacher) {
    return (
      <div className="st-profile-page">
        <Navbar />

        <div className="st-profile__not-found">
          <h2>Shadow teacher not found</h2>

          <button
            onClick={() => navigate('/shadow-teacher')}
            className="st-profile__back-btn"
          >
            Back to Shadow Teachers
          </button>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="st-profile-page">
      {/* Navbar */}
      <Navbar />

      {/* Back button */}
      <button
        onClick={() => navigate('/shadow-teacher')}
        className="st-profile__back-btn"
      >
        ← Back to Shadow Teachers
      </button>

      {/* Shadow teacher profile hero */}
      <section className="st-profile__hero">
        <div className="st-profile__image-container">
          <img
            src={imageSrc}
            alt={teacher.Fullname}
            className="st-profile__image"
          />
        </div>

        <div className="st-profile__info">
          <h1 className="st-profile__name">{teacher.Fullname}</h1>

          <p className="st-profile__specialization">
            {teacher.Qualification}
          </p>

          <p className="st-profile__years">
            {teacher.Experience} Years of Experience
          </p>

          <div className="st-profile__bio">
            {teacher.bio ||
              `${teacher.Fullname} is a dedicated shadow teacher providing personalized support to help children thrive.`}
          </div>

          {/* Qualifications */}
          <div className="st-profile__qualifications">
            <h3>Qualifications &amp; Credentials</h3>

            <ul>
              <li>{teacher.Qualification}</li>
              <li>{teacher.Experience} years experience</li>
            </ul>
          </div>

          {/* Open / close booking form */}
          <button
            className="st-profile__book-btn"
            onClick={() => setShowBookingForm(!showBookingForm)}
          >
            {showBookingForm ? 'Close Booking' : 'Book an Appointment'}
          </button>
        </div>
      </section>

      {/* Booking form */}
      {showBookingForm && (
        <section className="st-profile__booking">
          <h2 className="st-profile__booking-title">Book a Session</h2>

          {/* Time selection */}
          <div className="st-profile__time-section">
            <label className="st-profile__booking-label">Time</label>

            <div className="st-profile__time-inputs">
              <input
                type="number"
                min="1"
                max="12"
                className="st-profile__time-input st-profile__time-hour"
                placeholder="7"
                value={sessionTime.split(':')[0] || ''}
                onChange={(e) => {
                  const hour = e.target.value;
                  const min = sessionTime.split(':')[1] || '00';
                  setSessionTime(`${hour}:${min}`);
                }}
              />

              <span className="st-profile__time-separator">:</span>

              <input
                type="number"
                min="0"
                max="59"
                className="st-profile__time-input st-profile__time-minute"
                placeholder="30"
                value={sessionTime.split(':')[1] || ''}
                onChange={(e) => {
                  const hour = sessionTime.split(':')[0] || '7';
                  const min = e.target.value.padStart(2, '0');
                  setSessionTime(`${hour}:${min}`);
                }}
              />

              <select
                className="st-profile__time-period"
                value={sessionPeriod}
                onChange={(e) => setSessionPeriod(e.target.value)}
              >
                <option value="am">am</option>
                <option value="pm">pm</option>
              </select>
            </div>
          </div>

          {/* Child selection dropdown */}
          <div className="st-profile__child-section">
            <label className="st-profile__booking-label">Select Child</label>

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
                className="st-profile__child-select"
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
          <div className="st-profile__calendar-section">
            <label className="st-profile__booking-label">Date</label>

            <BookingCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Booking action buttons */}
          <div className="st-profile__booking-actions">
            <button
              className="st-profile__confirm-btn"
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </button>

            <button
              className="st-profile__cancel-btn"
              onClick={() => {
                setShowBookingForm(false);
                setSelectedDate(null);
                setSessionTime('');
                setSelectedChild('');
              }}
            >
              Cancel Booking
            </button>
          </div>
        </section>
      )}

      {/* Shadow teacher details section */}
      <section className="st-profile__details">
        <div className="st-profile__details-box">
          <h3>Qualification</h3>
          <p>{teacher.Qualification}</p>
        </div>

        <div className="st-profile__details-box">
          <h3>Availability</h3>
          <p>{teacher.Availability || 'Available upon request'}</p>
        </div>

        <div className="st-profile__details-box">
          <h3>Rate</h3>
          <p>EGP {teacher.Hourly_Rate} per 60-minute session</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ShadowTeacherProfile;