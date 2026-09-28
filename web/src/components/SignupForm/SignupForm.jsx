/*
 * SignupForm.jsx
 *
 * White card with two tabs: Parent Application / Specialist Application.
 */

import React, { useState } from 'react';
import FileUpload from '../FileUpload/FileUpload';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import './SignupForm.css';

const SPECIALIZATIONS = [
  'Therapist',
  'Shadow Teacher',
];

const ParentForm = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setPhone = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setForm((f) => ({ ...f, phone: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const newParent = {
        Full_Name: form.fullName,
        Email: form.email,
        Location: form.location,
        Password: form.password,
        Phone: form.phone,
      };

      console.log('Sending signup request with data:', newParent);

      const res = await axios.post(
        `${API_BASE}/modules/parent/parent`,
        newParent,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('Signup response:', res.data);

      if (res.data && res.data.Status === 'OK' && res.data.P_ID) {
        const parentData = {
          P_ID: res.data.P_ID,
          Full_Name: res.data.Full_Name,
          Email: res.data.Email,
          Location: res.data.Location,
          Phone: res.data.Phone,
          Password: res.data.Password,
        };

        localStorage.setItem('parent', JSON.stringify(parentData));
        localStorage.setItem('isLoggedIn', 'true');

        console.log('✅ Parent account created:', parentData);
        navigate('/child-info', { state: { parentId: res.data.P_ID } });
      } else {
        setError(res.data?.Message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMsg =
        err.response?.data?.Message ||
        err.message ||
        'Signup failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="sf__form" onSubmit={handleSubmit} noValidate>
      <h2 className="sf__form-title">Parent Application</h2>
      <p className="sf__form-sub">Tell us about you as a parent.</p>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe0e0',
            borderRadius: '5px',
          }}
        >
          {error}
        </div>
      )}

      <div className="sf__field sf__field--full">
        <label className="sf__label">FULL NAME</label>
        <input
          type="text"
          className="sf__input"
          placeholder="Enter your fullname"
          value={form.fullName}
          onChange={set('fullName')}
          required
        />
      </div>

      <div className="sf__field sf__field--full">
        <label className="sf__label">EMAIL ADDRESS</label>
        <input
          type="email"
          className="sf__input"
          placeholder="jane@clinic.com"
          value={form.email}
          onChange={set('email')}
          required
        />
      </div>

      <div className="sf__field sf__field--full">
        <label className="sf__label">PHONE NUMBER</label>
        <input
          type="tel"
          className="sf__input"
          placeholder="+20 100 174 5678"
          value={form.phone}
          onChange={setPhone}
          maxLength="11"
          required
        />
      </div>

      <div className="sf__field sf__field--full">
        <label className="sf__label">LOCATION</label>
        <input
          type="text"
          className="sf__input"
          placeholder="e.g. Cairo, Egypt"
          value={form.location}
          onChange={set('location')}
          required
        />
      </div>

      <div className="sf__field sf__field--full">
        <label className="sf__label">PASSWORD</label>
        <input
          type="password"
          className="sf__input"
          placeholder="••••••••••"
          value={form.password}
          onChange={set('password')}
          required
        />
      </div>

      <div className="sf__or">
        <span className="sf__or-line" />
        <span className="sf__or-text">OR</span>
        <span className="sf__or-line" />
      </div>

      <button type="button" className="sf__google">
        <span className="sf__google-g">G</span>
        Continue with Google
      </button>

      <button type="submit" className="sf__submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Add Child Info →'}
      </button>
    </form>
  );
};

/* ── Specialist form ─────────────────────────────── */

const SpecialistForm = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    specialization: '',
    yearsExp: '',
  });

  const [certFile, setCertFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = new FormData();

      payload.append('Fullname', form.fullName);
      payload.append('Email', form.email);
      payload.append('Password', form.password);
      payload.append('Experience', form.yearsExp);

      let apiUrl = '';

      if (form.specialization === 'Shadow Teacher') {
        apiUrl = `${API_BASE}/modules/shadow_teacher/shadow_teacher`;
        payload.append('Qualification', 'Shadow Teacher');
        if (certFile) payload.append('CV', certFile);
      } else if (form.specialization === 'Therapist') {
        apiUrl = `${API_BASE}/modules/therapist/therapist`;
        payload.append('Specialization', form.specialization);
        if (certFile) payload.append('CV', certFile);
      } else {
        setError('Please select a specialization.');
        setLoading(false);
        return;
      }

      console.log('📤 Submitting to:', apiUrl);

      const res = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });


      console.log('✅ Response:', res.data);

      if (res.data && res.data.Status === 'OK') {
        setSubmittedType(form.specialization);
        setSubmitted(true);
      } else {
        setError(res.data?.Message || 'Application submission failed.');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      console.error('Error response:', err.response?.data);
      setError(
        err.response?.data?.Message ||
        err.message ||
        'Application submission failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="sf__success">
        <span className="sf__success-icon">✅</span>
        <p>
          Your {submittedType.toLowerCase()} application has been submitted for
          review. Please wait for admin approval before logging in.
        </p>
      </div>
    );
  }

  return (
    <form className="sf__form" onSubmit={handleSubmit} noValidate>
      <h2 className="sf__form-title">Specialist Application</h2>
      <p className="sf__form-sub">Tell us about your professional background.</p>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe0e0',
            borderRadius: '5px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <div className="sf__row">
        <div className="sf__field">
          <label className="sf__label">FULL NAME</label>
          <input
            type="text"
            className="sf__input"
            placeholder="Dr. Jane Smith"
            value={form.fullName}
            onChange={set('fullName')}
            required
          />
        </div>

        <div className="sf__field">
          <label className="sf__label">EMAIL ADDRESS</label>
          <input
            type="email"
            className="sf__input"
            placeholder="jane@clinic.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>
      </div>

      <div className="sf__field sf__field--full">
        <label className="sf__label">PASSWORD</label>
        <input
          type="password"
          className="sf__input"
          placeholder="••••••••••"
          value={form.password}
          onChange={set('password')}
          required
        />
      </div>

      <div className="sf__row">
        <div className="sf__field">
          <label className="sf__label">SPECIALIZATION</label>
          <div className="sf__select-wrap">
            <select
              className="sf__input sf__select"
              value={form.specialization}
              onChange={set('specialization')}
              required
            >
              <option value="" disabled>
                Select specialization
              </option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="sf__select-arrow">&#8964;</span>
          </div>
        </div>

        <div className="sf__field">
          <label className="sf__label">YEARS OF EXPERIENCE</label>
          <input
            type="number"
            className="sf__input"
            placeholder="e.g. 5"
            min={0}
            max={50}
            value={form.yearsExp}
            onChange={set('yearsExp')}
            required
          />
        </div>
      </div>

      <FileUpload
        label="PROFESSIONAL CERTIFICATION OR ID"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={5}
        onFile={setCertFile}
      />

      <button type="submit" className="sf__submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit for Review  →'}
      </button>
    </form>
  );
};

/* ── Main SignupForm card ─────────────────────────── */

const SignupForm = ({ defaultTab = 'specialist' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="sf">
      <div className="sf__tabs">
        <button
          className={`sf__tab ${activeTab === 'parent' ? 'sf__tab--active' : ''}`}
          onClick={() => setActiveTab('parent')}
          type="button"
        >
          Parent Application
        </button>

        <button
          className={`sf__tab ${activeTab === 'specialist' ? 'sf__tab--active' : ''
            }`}
          onClick={() => setActiveTab('specialist')}
          type="button"
        >
          Specialist Application
        </button>
      </div>

      <div className="sf__body">
        {activeTab === 'parent' ? <ParentForm /> : <SpecialistForm />}
      </div>
    </div>
  );
};

export default SignupForm;