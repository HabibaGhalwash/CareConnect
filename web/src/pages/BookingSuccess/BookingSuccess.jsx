import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './BookingSuccess.css';

const BookingSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Send a final success signal to the mobile app if it missed the one from the booking page
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BOOKING_SUCCESS_VIEWED' }));
    }
  }, []);

  return (
    <div className="booking-success-page">
      <Navbar />
      
      <main className="booking-success-main">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <div className="success-icon-circle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" 
                stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1 className="success-title">Booking Confirmed!</h1>
          <p className="success-message">
            Your appointment has been successfully scheduled and paid for. 
            A confirmation email has been sent to your registered address.
          </p>

          <div className="success-divider" />

          <div className="success-actions">
            <button 
              className="btn-primary" 
              onClick={() => navigate('/parent-profile')}
            >
              View My Bookings
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingSuccess;
