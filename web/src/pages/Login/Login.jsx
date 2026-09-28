/*
 * Login.jsx — CareConnect Login Page
 *
 * Layout:
 *  - Warm off-white full-page background (#F6F2EE)
 *  - Centered white card
 *  - Fields: Email Address, Password
 *  - Log In button
 *  - OR divider
 *  - Continue with Google button
 *  - "Don't have an account? Sign Up" link
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      /* =========================
         1) Try Admin login first
      ========================= */
      try {
        const adminRes = await axios.get(
          `${API_BASE}/modules/Admin/search?keyword=Email&keyvalue=${encodeURIComponent(email)}`
        );

        console.log('Admin search response:', adminRes.data);

        if (Array.isArray(adminRes.data) && adminRes.data.length > 0) {
          const admin = adminRes.data[0];

          if (String(admin.Password).trim() === String(password).trim()) {
            const adminData = {
              Admin_ID: admin.Admin_ID,
              Email: admin.Email,
              role: 'admin',
            };

            localStorage.setItem('admin', JSON.stringify(adminData));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');

            console.log('✅ Admin logged in:', adminData);
            navigate('/admin-interface');
            return;
          }

          setError('Invalid admin credentials. Please check your email and password.');
          return;
        }
      } catch (adminErr) {
        console.warn('Admin search error:', adminErr.message);
        // Continue checking other user types.
      }

      /* =========================
         2) Try Shadow Teacher login
      ========================= */
      try {
        const stRes = await axios.get(
          `${API_BASE}/modules/shadow_teacher/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`
        );

        console.log('Shadow teacher login response:', stRes.data);

        if (stRes.data?.Status === 'Pending') {
          setError('Your shadow teacher account is pending admin approval. Please wait for admin verification.');
          return;
        }

        if (stRes.data?.Status === 'Rejected') {
          setError('Your shadow teacher account has been rejected. Please contact admin for more information.');
          return;
        }

        if (stRes.data?.Status === 'OK' && stRes.data?.ST_ID) {
          const shadowTeacherData = {
            ST_ID: stRes.data.ST_ID,
            Fullname: stRes.data.Fullname,
            Email: stRes.data.Email,
            Status: stRes.data.Status,
          };

          localStorage.setItem('shadowTeacher', JSON.stringify(shadowTeacherData));
          localStorage.setItem('userType', 'shadow_teacher');
          localStorage.setItem('isLoggedIn', 'true');

          navigate(`/shadow-teacher-interface/${stRes.data.ST_ID}`);
          return;
        }
      } catch (stErr) {
        console.warn('Shadow teacher login error:', stErr.message);
        // Continue checking therapist and parent.
      }

      /* =========================
         3) Try Therapist login
      ========================= */
      try {
        const therapistRes = await axios.get(
          `${API_BASE}/modules/therapist/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`
        );

        console.log('Therapist login response:', therapistRes.data);

        if (therapistRes.data?.Status === 'Pending') {
          setError('Your therapist account is pending admin approval. Please wait for admin verification.');
          return;
        }

        if (therapistRes.data?.Status === 'Rejected') {
          setError('Your therapist account has been rejected. Please contact admin for more information.');
          return;
        }

        if (therapistRes.data?.Status === 'OK' && therapistRes.data?.T_ID) {
          const therapistData = {
            T_ID: therapistRes.data.T_ID,
            Fullname: therapistRes.data.Fullname,
            Email: therapistRes.data.Email,
            Status: therapistRes.data.Status,
          };

          localStorage.setItem('therapist', JSON.stringify(therapistData));
          localStorage.setItem('userType', 'therapist');
          localStorage.setItem('isLoggedIn', 'true');

          navigate(`/therapist-interface/${therapistRes.data.T_ID}`);
          return;
        }
      } catch (therapistErr) {
        console.warn('Therapist login error:', therapistErr.message);
        // Continue checking parent.
      }

      /* =========================
         4) Try Parent login
      ========================= */
      try {
        const parentRes = await axios.get(
          `${API_BASE}/modules/parent/login?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`
        );

        console.log('Parent login response:', parentRes.data);

        if (parentRes.data?.Status === 'OK' && parentRes.data?.P_ID) {
          const parentData = {
            P_ID: parentRes.data.P_ID,
            Full_Name: parentRes.data.Full_Name,
            Email: parentRes.data.Email,
            Location: parentRes.data.Location,
            Phone: parentRes.data.Phone,
            Password: parentRes.data.Password,
          };

          localStorage.setItem('parent', JSON.stringify(parentData));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', 'parent');

          console.log('✅ Parent logged in:', parentData);

          try {
            const childRes = await axios.get(
              `${API_BASE}/modules/child/child/by-parent?P_ID=${parentRes.data.P_ID}`
            );

            const children = Array.isArray(childRes.data) ? childRes.data : [];
            console.log('Parent has', children.length, 'children');

            if (children.length > 0) {
              navigate('/ParentProfile');
            } else {
              navigate('/child-info');
            }

            return;
          } catch (childErr) {
            console.warn('Error checking children, redirecting to child-info:', childErr.message);
            navigate('/child-info');
            return;
          }
        }

        setError(parentRes.data?.Message || 'Invalid login credentials.');
      } catch (parentErr) {
        console.error('Parent login error:', parentErr);
        setError('Authentication failed. Check email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg =
        typeof err.response?.data?.Message === 'string'
          ? err.response.data.Message
          : 'Login failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-card__title">Log In</h1>
          <p className="login-card__sub">Welcome back to your supportive community.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label className="login-label">EMAIL ADDRESS</label>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <polyline points="2,4 12,13 22,4" />
                  </svg>
                </span>

                <input
                  type="email"
                  className="login-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label">PASSWORD</label>
                <Link to="/forgot-password" className="login-forgot">
                  Forgot Password?
                </Link>
              </div>

              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>

                <input
                  type={showPass ? 'text' : 'password'}
                  className="login-input login-input--password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>

            <div className="login-or">
              <span className="login-or__line" />
              <span className="login-or__text">OR</span>
              <span className="login-or__line" />
            </div>

            <button type="button" className="login-google">
              <svg
                className="login-google__icon"
                width="20"
                height="20"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.27-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="login-signup-link">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="login-signup-link__cta">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;