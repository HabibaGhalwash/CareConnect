/*
 * Booking.jsx — CareConnect Booking Confirmation & Payment Page
 *
 * Reached after user confirms a booking from:
 *  - TherapistProfile  → type='therapist'
 *  - STProfile         → type='shadow-teacher'
 *
 * Route state (passed via navigate):
 * {
 *   type:         'therapist' | 'shadow-teacher'
 *   providerName: string
 *   date:         string   (formatted, e.g. "Tues, 2 December 2025")
 *   startTime:    string   (e.g. "7:30 pm")
 *   endTime:      string   (e.g. "8:30 pm")
 *   duration:     string   (e.g. "1 Hour")
 *   sessionType:  string   (therapist only, e.g. "Online Session")
 *   hourlyRate:   number
 *   hours:        number
 *   T_ID:         number   (if therapist booking)
 *   ST_ID:        number   (if shadow teacher booking)
 *   Child_ID:     number   (selected on profile page before booking)
 * }
 *
 * If no state is present (e.g. direct URL visit), shows demo data.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import BookingDetailsCard from '../../components/BookingDetailsCard/BookingDetailsCard';
import PaymentCard from '../../components/PaymentCard/PaymentCard';
import './Booking.css';


/* ── Demo fallback data ──────────────────────────── */
const DEMO_THERAPIST = {
  type: 'therapist',
  providerName: 'Dr. Maha El Sayed',
  date: 'Tuesday, 2 December 2025',
  startTime: '7:30 pm',
  endTime: '8:30 pm',
  duration: '1 Hour',
  sessionType: 'Online Session',
  hourlyRate: 450,
  hours: 1,
};

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Use state from navigation, or fall back to demo */
  const booking = location.state || DEMO_THERAPIST;

  const {
    type = 'therapist',
    providerName = '—',
    date = '—',
    startTime = '—',
    endTime = '—',
    duration = '—',
    sessionType = null,
    hourlyRate = 450,
    hours = 1,
    T_ID = null,
    ST_ID = null,
    Child_ID = null,
    parentId = null,
  } = booking;

  // Child_ID is selected on the profile page and passed via navigation state
  const selectedChild = Child_ID;

  // Handle payment confirmation and submit booking to database
  const handlePaymentConfirm = async (paymentData) => {
    console.log('💳 Payment confirmed:', paymentData);

    if (!selectedChild) {
      alert('❌ No child selected. Please go back and select a child.');
      return;
    }

    try {
      // Get parent ID from either passed state (mobile) or localStorage (web)
      const storageParent = JSON.parse(localStorage.getItem('parent'));
      const finalParentId = parentId || storageParent?.P_ID;

      if (!finalParentId) {
        alert('❌ Parent information not found. Please log in again.');
        return;
      }

      // ✅ Prepare booking data for backend
      // Convert time format to HH:MM (24-hour format)
      const parseTime = (timeStr) => {
        const lower = timeStr.toLowerCase();
        const match = timeStr.match(/(\d+):(\d+)/);
        if (!match) return '00:00';
        let [, h, m] = match;
        h = parseInt(h);
        if (lower.includes('pm') && h !== 12) h = h + 12;
        if (lower.includes('am') && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m.padStart(2, '0')}`;
      };

      // Convert date to YYYY-MM-DD format
      const parseDate = (dateStr) => {
        try {
          const dateObj = new Date(dateStr);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          return new Date().toISOString().split('T')[0];
        }
      };

      // Convert duration to hours
      const durationHours = hours || 1;
      const startTimeFormatted = parseTime(startTime);
      const [sH, sM] = startTimeFormatted.split(':').map(Number);
      const endH = sH + Math.floor(durationHours);
      const endM = sM + Math.round((durationHours % 1) * 60);
      const endTimeFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Calculate financial breakdown
      const totalPrice = hourlyRate * durationHours;
      const commission = Math.round(totalPrice * 0.1); // 10% commission
      const providerIncome = totalPrice - commission;

      // Note: type is 'therapist' or 'shadow_teacher' (underscore, from profile pages)
      const isShadowTeacher = type === 'shadow_teacher' || type === 'shadow-teacher';

      const bookingPayload = {
        Session_type: sessionType || (isShadowTeacher ? 'Shadow Teaching Session' : 'Therapy Session'),
        Duration: `${durationHours} Hour${durationHours > 1 ? 's' : ''}`,
        Start_time: startTimeFormatted,
        End_time: endTimeFormatted,
        Date: parseDate(date),
        Service_type: isShadowTeacher ? 'Shadow Teaching' : 'Therapy',
        Booking_status: 'Confirmed',
        Session_price: totalPrice,
        Comission_amount: commission,
        Provider_income: providerIncome,
        Visa: paymentData.method === 'card' ? 1 : 0,
        Instapay: paymentData.method === 'instapay' ? 1 : 0,
        T_ID: isShadowTeacher ? null : T_ID,
        ST_ID: isShadowTeacher ? ST_ID : null,
        Child_ID: parseInt(selectedChild),
        P_ID: finalParentId,
        Notes: null,
        // B_ID is NOT sent — MySQL auto-increments it
      };

      console.log('📤 Submitting booking:', bookingPayload);

      const response = await axios.post(
        `${API_BASE}/modules/booking/booking`,
        bookingPayload
      );

      console.log('✅ Booking created:', response.data);

      // Notify mobile app BEFORE the alert blocks execution
      if (window.ReactNativeWebView) {
        console.log('📱 Sending BOOKING_SUCCESS to mobile app...');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BOOKING_SUCCESS' }));
      } else {
        console.warn('⚠️ window.ReactNativeWebView not found. Not in a mobile app?');
      }

      alert('✅ Booking confirmed successfully!');

      // Unique 'Exit Signal' for the mobile app to close WebView
      setTimeout(() => {
        window.location.href = '/booking-success';
      }, 500);
    } catch (err) {
      console.error('❌ Booking submission error:', err);
      alert(`❌ Failed to create booking: ${err.response?.data?.Message || err.message}`);
    }
  };

  return (
    <div className="booking-page">
      <Navbar />

      <main className="booking-main">
        {/* LEFT panel — dark teal appointment summary */}
        <BookingDetailsCard
          type={type}
          providerName={providerName}
          date={date}
          startTime={startTime}
          endTime={endTime}
          duration={duration}
          sessionType={sessionType}
          hourlyRate={hourlyRate}
          hours={hours}
          onBack={() => navigate(-1)}
        />

        {/* RIGHT panel — payment form with enabled payment methods from settings */}
        <PaymentCard
          bookingPrice={hourlyRate}
          hours={hours}
          currency="EGP"
          onConfirm={handlePaymentConfirm}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Booking;