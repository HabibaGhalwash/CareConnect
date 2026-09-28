/*
 * TherapistInterface.jsx — CareConnect Therapist Portal
 *
 * This file contains the private portal used by therapists.
 * Therapist notes are saved in the therapy_session table, not the booking table.
 *
 * It includes:
 * 1. Dashboard
 * 2. Schedule
 * 3. Patients
 * 4. Earnings
 * 5. Profile
 * 6. Main layout with sidebar and topbar
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../../services/api';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Loader } from 'lucide-react';

import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import ProviderSidebar from '../../components/provider/ProviderSidebar/ProviderSidebar';
import ProviderTopbar from '../../components/provider/ProviderTopbar/ProviderTopbar';

import '../../components/provider/provider-base.css';
import './TherapistInterface.css';

/* =========================
   HELPERS

   Reusable functions used across the therapist portal.
   They format dates, extract patient/session info,
   group patients, and save therapist notes.
========================= */

/* 
   COLORS

   These colors are used for patient avatars, cards, and badges.
*/
const COLORS = ['#9D64AA', '#63ADA8', '#FFB66E', '#82C9A5', '#A48CD6'];

/* 
   GET PATIENT NAME

   Gets the child/patient name from different possible backend field names.
   If no name exists, it shows Child + child ID.
*/
const getPatientName = (item = {}) => {
  return (
    item.Child_Name ||
    item.Child_name ||
    item.child_name ||
    item.Fullname ||
    item.Full_Name ||
    item.Name ||
    `Child ${item.Child_ID || ''}`
  );
};

/* 
   GET PARENT ID

   Extracts parent ID from different possible backend field names.
*/
const getParentId = (item = {}) => {
  return item.P_ID || item.Parent_ID || item.parent_id || item.ParentId || null;
};

/* 
   GET SESSION TAG

   Gets the service/session type shown as a small label.
*/
const getSessionTag = (item = {}) => {
  return item.Service_type || item.Session_type || 'Session';
};

/* 
   GET SESSION MODE

   Gets whether the session is online, in-person, or another type.
*/
const getSessionMode = (item = {}) => {
  return item.Session_type || item.Service_type || 'Session';
};

/* 
   GET SESSION STATUS

   Gets the booking status.
   If no status exists, it defaults to Confirmed.
*/
const getSessionStatus = (item = {}) => {
  return item.Booking_status || 'Confirmed';
};

/* 
   CHECK ONLINE SESSION

   Looks inside session/service text and returns true if it includes "online".
*/
const isOnlineSession = (item = {}) => {
  const text = `${item.Session_type || ''} ${item.Service_type || ''}`.toLowerCase();
  return text.includes('online');
};

/* 
   FORMAT FULL DATE

   Converts a date into readable format:
   Mon, May 15, 2026
*/
const formatDate = (dateValue) => {
  if (!dateValue) return 'Date not set';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/* 
   FORMAT SHORT DATE

   Converts a date into shorter format:
   Mon, May 15
*/
const formatShortDate = (dateValue) => {
  if (!dateValue) return 'Date not set';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/* 
   GET FIRST NAME

   Gets the therapist first name for the welcome message.
*/
const getFirstName = (fullName) => {
  return (fullName || 'Doctor').split(' ')[0];
};

/* 
   GET UNIQUE PATIENTS

   Groups sessions by Child_ID.
   This prevents the same child from appearing multiple times.
   It also counts how many sessions each patient has.
*/
const getUniquePatients = (sessions = []) => {
  return Object.values(
    sessions.reduce((acc, item, index) => {
      const childId = item.Child_ID || `child-${index}`;
      const patientName = getPatientName(item);

      if (!acc[childId]) {
        acc[childId] = {
          id: childId,
          name: patientName,
          age: `Child ID: ${childId}`,
          tags: [],
          sessions: 0,
          color: COLORS[index % COLORS.length],
          status: getSessionStatus(item),
          notesText: '',
          latestSession: item,
        };
      }

      acc[childId].sessions += 1;
      acc[childId].latestSession = item;
      acc[childId].status = getSessionStatus(item);

      const tag = getSessionTag(item);
      if (tag && !acc[childId].tags.includes(tag)) {
        acc[childId].tags.push(tag);
      }

      if (item.Notes && String(item.Notes).trim() !== '') {
        acc[childId].notesText = item.Notes;
      }

      return acc;
    }, {})
  );
};

/* 
   SAVE THERAPIST NOTE

   Sends therapist notes to the therapy_session table.
   bookingId links the note to the related booking.
*/
const saveTherapistNote = async ({ bookingId, therapistId, parentId, notes }) => {
  return axios.put(
    `${API_BASE}/modules/therapy_session/therapy-session-note?id=${bookingId ?? 0}`,
    {
      T_ID: therapistId,
      P_ID: parentId || undefined,
      Notes: notes,
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
};

/* =========================
   DASHBOARD

   Shows therapist overview:
   - Welcome message
   - Stats cards
   - Booked sessions table
   - Patient progress notes
========================= */

const TDashboard = ({ therapist, sessions = [] }) => {
  /*
     STATE

     showAllSessions controls whether dashboard shows only 4 sessions
     or all booked sessions.
  */
  const [showAllSessions, setShowAllSessions] = useState(false);

  /*
     PLATFORM SETTINGS

     Used to calculate therapist earnings after commission.
  */
  const { settings, calculateEarnings } = usePlatformSettings();

  /*
     UNIQUE PATIENTS

     Groups sessions into unique patients.
  */
  const uniquePatients = useMemo(() => getUniquePatients(sessions), [sessions]);

  /*
     DISPLAYED SESSIONS

     Shows either all sessions or only first 4.
  */
  const sessionsToDisplay = showAllSessions ? sessions : sessions.slice(0, 4);

  /*
     EARNINGS SUMMARY

     Calculates gross and net income from therapist hourly/session rate.
  */
  const hourlyRate = Number(therapist?.Hourly_Rate || 0);
  const totalGross = sessions.reduce((sum) => sum + hourlyRate, 0);
  const totalNet =
    typeof calculateEarnings === 'function'
      ? Math.round(calculateEarnings(totalGross))
      : totalGross;

  /*
     SESSION TYPE COUNTS

     Counts how many sessions are online vs in-person/other.
  */
  const onlineCount = sessions.filter(isOnlineSession).length;
  const inPersonCount = sessions.length - onlineCount;

  /*
     FIRST SESSION

     Gets the earliest session by date and start time.
  */
  const firstSession = [...sessions].sort((a, b) => {
    const dateA = new Date(`${a.Date || ''} ${a.Start_time || ''}`);
    const dateB = new Date(`${b.Date || ''} ${b.Start_time || ''}`);
    return dateA - dateB;
  })[0];

  /*
     NOTES TO DISPLAY

     Keeps only sessions that already have therapist notes.
  */
  const notesToDisplay = sessions.filter(
    (item) => item.Notes && String(item.Notes).trim() !== ''
  );

  return (
    <div className="pv-content">
      {/* Welcome banner */}
      <div
        className="pv-welcome"
        style={{ background: 'linear-gradient(135deg, #9D64AA, #7B4A87)' }}
      >
        <h2>Good morning, {getFirstName(therapist?.Fullname)}!</h2>
        <p>
          You have {sessions.length} booked session(s).
          {firstSession?.Start_time
            ? ` Your next session starts at ${firstSession.Start_time}.`
            : ' No session time is scheduled yet.'}
        </p>
      </div>

      {/* Dashboard statistics cards */}
      <div className="pv-stats-grid" style={{ marginBottom: 20 }}>
        {[
          {
            label: "Today's Sessions",
            val: sessions.length,
            sub: `${onlineCount} online · ${inPersonCount} in-person/other`,
            cls: 't-main',
          },
          {
            label: 'This Week',
            val: `${sessions.length} sessions`,
            sub: 'Linked to your bookings',
            cls: 't-teal',
          },
          {
            label: 'Total Patients',
            val: uniquePatients.length,
            sub: 'Unique booked children',
            cls: 't-light',
          },
          {
            label: 'Total Earnings',
            val: `EGP ${totalNet.toLocaleString()}`,
            sub: `After ${settings?.platformCommission || 0}% commission`,
            cls: 't-main',
          },
        ].map((s) => (
          <div key={s.label} className={`pv-stat ${s.cls}`}>
            <div 
              className="pv-stat__val"
              style={{ fontSize: s.label === 'Total Earnings' ? 18 : 'inherit' }}
            >
              {s.val}
            </div>
            <div className="pv-stat__label">{s.label}</div>
            <div className="pv-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Booked sessions table */}
      <div className="pv-card" style={{ marginBottom: 20 }}>
        <div className="pv-sec-head">
          <h3>Booked Sessions</h3>

          {sessions.length > 4 && (
            <button
              className="pv-link-btn t"
              onClick={() => setShowAllSessions(!showAllSessions)}
            >
              {showAllSessions ? 'Show less ↑' : 'View all →'}
            </button>
          )}
        </div>

        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {sessionsToDisplay.length === 0 ? (
              <tr>
                <td colSpan="4">No booked sessions found.</td>
              </tr>
            ) : (
              sessionsToDisplay.map((item, index) => {
                const name = getPatientName(item);
                const mode = getSessionMode(item);
                const status = getSessionStatus(item);
                const color = COLORS[index % COLORS.length];

                return (
                  <tr key={`${item.B_ID}-dashboard-${index}`}>
                    <td>
                      <div className="pv-user-cell">
                        <div className="pv-mini-av" style={{ background: color }}>
                          {name?.[0] || 'C'}
                        </div>
                        <div>
                          <div className="pv-user-name">{name}</div>
                          <div className="pv-user-sub">{getSessionTag(item)}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.Start_time || 'Time not set'}
                      {item.End_time ? ` - ${item.End_time}` : ''}
                    </td>

                    <td>
                      <span
                        className={`pv-badge ${isOnlineSession(item) ? 'online' : 'inperson'
                          }`}
                      >
                        {mode}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`pv-badge ${status === 'Confirmed' || status === 'Completed'
                            ? 'confirmed'
                            : 'pending'
                          }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Patient progress notes */}
      <div className="pv-card">
        <div className="pv-sec-head">
          <h3>Patient Progress Notes</h3>
        </div>

        <div className="pv-review-grid">
          {notesToDisplay.length === 0 ? (
            <p style={{ color: '#6B6B6B', fontSize: 13, padding: '0 8px' }}>
              No progress notes added yet.
            </p>
          ) : (
            notesToDisplay.map((item, index) => (
              <div key={`${item.B_ID}-note-${index}`} className="pv-review-card">
                <div className="pv-review-text">{item.Notes}</div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div className="pv-review-author">{getPatientName(item)}</div>
                  <div className="pv-review-stars">{formatShortDate(item.Date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   MY SCHEDULE

   Shows therapist schedule:
   - Calendar date selector
   - Sessions for selected date
   - Editable therapist notes for each session
   - Upcoming sessions table
========================= */

const TSchedule = ({ sessions = [], onSessionsUpdate, therapistId }) => {
  /*
     STATE

     selectedDate controls active calendar date.
     noteDrafts stores unsaved note edits.
     savingNoteId tracks which note is currently saving.
  */
  const [selectedDate, setSelectedDate] = useState('');
  const [noteDrafts, setNoteDrafts] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);

  /*
     SORT SESSIONS

     Sorts sessions by date and start time.
  */
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateA = new Date(`${a.Date || ''} ${a.Start_time || ''}`);
      const dateB = new Date(`${b.Date || ''} ${b.Start_time || ''}`);
      return dateA - dateB;
    });
  }, [sessions]);

  /*
     UNIQUE DATES

     Extracts unique session dates for the calendar strip.
  */
  const uniqueDates = useMemo(() => {
    return [...new Set(sortedSessions.map((s) => s.Date).filter(Boolean))];
  }, [sortedSessions]);

  /*
     DEFAULT SELECTED DATE

     Automatically selects the first available date.
  */
  useEffect(() => {
    if (!selectedDate && uniqueDates.length > 0) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [selectedDate, uniqueDates]);

  /*
     SELECTED DAY SESSIONS

     Shows sessions for the selected date.
     If no date selected, shows all sessions.
  */
  const selectedDaySessions = selectedDate
    ? sortedSessions.filter((s) => s.Date === selectedDate)
    : sortedSessions;

  /*
     HANDLE NOTE CHANGE

     Updates the draft note for a specific booking/session.
  */
  const handleNoteChange = (bookingId, value) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [bookingId]: value,
    }));
  };

  /*
     SAVE SESSION NOTE

     Saves therapist note to therapy_session table,
     then updates local sessions state.
  */
  const handleSaveSessionNote = async (item) => {
    if (!item) {
      alert('Session data not found.');
      return;
    }

    const finalTherapistId = item.T_ID || therapistId;
    if (!finalTherapistId) {
      alert('Therapist ID not found for this session.');
      return;
    }

    const parentId = getParentId(item) || null;
    const newNote = noteDrafts[item.B_ID] ?? item.Notes ?? '';
    setSavingNoteId(item.B_ID);

    try {
      await saveTherapistNote({
        bookingId: item.B_ID ?? 0,
        therapistId: finalTherapistId,
        parentId,
        notes: newNote,
      });

      onSessionsUpdate((prev) =>
        prev.map((session) =>
          session.B_ID === item.B_ID ? { ...session, Notes: newNote } : session
        )
      );

      alert('Therapist session note saved successfully.');
    } catch (err) {
      console.error('Error saving therapist session note:', err);
      alert('Could not save therapist note. Check backend console.');
    } finally {
      setSavingNoteId(null);
    }
  };

  return (
    <div className="pv-content">
      {/* Calendar date selector */}
      <div className="pv-card" style={{ marginBottom: 16 }}>
        <div className="pv-sec-head">
          <h3>My Schedule</h3>
        </div>

        <div className="pv-cal-strip">
          {uniqueDates.length === 0 ? (
            <p style={{ padding: 16, color: '#6B6B6B' }}>
              No scheduled sessions found.
            </p>
          ) : (
            uniqueDates.map((dateValue) => {
              const date = new Date(dateValue);
              const isSelected = selectedDate === dateValue;

              return (
                <button
                  key={dateValue}
                  className={`pv-cal-day ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateValue)}
                  style={
                    isSelected
                      ? {
                        border: '2px solid #9D64AA',
                        boxShadow: '0 0 0 1px #9D64AA',
                      }
                      : {}
                  }
                >
                  <span className="dn">
                    {Number.isNaN(date.getTime())
                      ? 'DAY'
                      : date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="dd">
                    {Number.isNaN(date.getTime()) ? dateValue : date.getDate()}
                  </span>
                  <span className="dot" style={{ background: '#9D64AA' }} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Sessions and upcoming sessions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Selected day sessions */}
        <div className="pv-card">
          <div className="pv-sec-head">
            <h3>
              {selectedDate ? formatDate(selectedDate) : 'All Sessions'} (
              {selectedDaySessions.length} session
              {selectedDaySessions.length !== 1 ? 's' : ''})
            </h3>
          </div>

          <div className="pv-time-slots">
            {selectedDaySessions.length === 0 ? (
              <p style={{ padding: 16, color: '#6B6B6B' }}>
                No sessions on this day.
              </p>
            ) : (
              selectedDaySessions.map((item, index) => {
                const draftValue = noteDrafts[item.B_ID] ?? item.Notes ?? '';

                return (
                  <div key={`${item.B_ID}-${index}`} className="pv-slot">
                    <div className="pv-slot-time">
                      {item.Start_time || 'Time not set'}
                    </div>

                    <div className="pv-slot-event busy-t" style={{ width: '100%' }}>
                      <div className="pv-slot-name">
                        {getPatientName(item)}{' '}
                        {item.End_time ? `— Until ${item.End_time}` : ''}
                      </div>

                      <div className="pv-slot-sub">
                        {getSessionTag(item)} · {getSessionStatus(item)} · B_ID:{' '}
                        {item.B_ID}
                      </div>

                      {/* Therapist note textarea and save button */}
                      <div style={{ marginTop: 10 }}>
                        <textarea
                          value={draftValue}
                          onChange={(e) =>
                            handleNoteChange(item.B_ID, e.target.value)
                          }
                          placeholder="Write a therapist note for this specific session..."
                          style={{
                            width: '100%',
                            minHeight: 74,
                            padding: 10,
                            border: '1px solid #E0E0E0',
                            borderRadius: 8,
                            fontFamily: 'inherit',
                            fontSize: 12,
                            resize: 'vertical',
                            boxSizing: 'border-box',
                            outline: 'none',
                            background: '#fff',
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleSaveSessionNote(item)}
                          disabled={savingNoteId === item.B_ID}
                          style={{
                            marginTop: 8,
                            padding: '8px 14px',
                            background: '#9D64AA',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              savingNoteId === item.B_ID ? 'not-allowed' : 'pointer',
                            opacity: savingNoteId === item.B_ID ? 0.7 : 1,
                          }}
                        >
                          {savingNoteId === item.B_ID
                            ? 'Saving...'
                            : 'Save Therapist Note'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming sessions table */}
        <div className="pv-card">
          <div className="pv-sec-head">
            <h3>Upcoming Sessions</h3>
          </div>

          <table className="pv-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {sortedSessions.length === 0 ? (
                <tr>
                  <td colSpan="3">No upcoming sessions found.</td>
                </tr>
              ) : (
                sortedSessions.map((item, index) => {
                  const nm = getPatientName(item);
                  const status = getSessionStatus(item);
                  const color = COLORS[index % COLORS.length];

                  return (
                    <tr key={`${item.B_ID}-upcoming-${index}`}>
                      <td>
                        <div className="pv-user-cell">
                          <div className="pv-mini-av" style={{ background: color }}>
                            {nm?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="pv-user-name">{nm}</div>
                            <div className="pv-user-sub">{getSessionTag(item)}</div>
                          </div>
                        </div>
                      </td>

                      <td>{formatShortDate(item.Date)}</td>

                      <td>
                        <span
                          className={`pv-badge ${status === 'Confirmed' || status === 'Completed'
                              ? 'confirmed'
                              : 'pending'
                            }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================
   MY PATIENTS

   Shows therapist patients:
   - Patient filters
   - Patient cards
   - Selected patient details
   - Editable therapist notes
========================= */

const TPatients = ({ sessions = [], onSessionsUpdate, therapistId }) => {
  /*
     STATE

     filter controls All / Active / New patients.
     selectedPatient controls list view vs details view.
     notes stores editable notes before saving.
  */
  const [filter, setFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState({});

  /*
     PATIENT GROUPS

     Creates all patients, active patients, and new/pending patients.
  */
  const allPatients = useMemo(() => getUniquePatients(sessions), [sessions]);

  const activePatients = allPatients.filter(
    (p) =>
      p.status === 'Active' ||
      p.status === 'Confirmed' ||
      p.status === 'Completed'
  );

  const newPatients = allPatients.filter(
    (p) => p.status === 'New' || p.status === 'Pending'
  );

  /*
     FILTERED PATIENTS

     Decides which patient cards should appear.
  */
  let displayedPatients = allPatients;
  if (filter === 'Active') displayedPatients = activePatients;
  if (filter === 'New') displayedPatients = newPatients;

  /*
     FILTER BUTTONS

     Buttons shown above the patient cards.
  */
  const filterOptions = [
    { label: `All (${allPatients.length})`, value: 'All' },
    { label: `Active (${activePatients.length})`, value: 'Active' },
    { label: `New/Pending (${newPatients.length})`, value: 'New' },
  ];

  /*
     SELECT PATIENT

     Opens patient detail view and prepares their note text.
  */
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);

    setNotes((prev) => ({
      ...prev,
      [patient.name]: prev[patient.name] ?? patient.notesText ?? '',
    }));
  };

  /*
     SAVE PATIENT NOTES

     Saves notes for the selected patient using their latest booking session.
  */
  const handleSaveNotes = async () => {
    if (!selectedPatient?.latestSession) {
      alert('No booking session found for this patient.');
      return;
    }

    const booking = selectedPatient.latestSession;
    const finalTherapistId = booking.T_ID || therapistId;
    const parentId = getParentId(booking) || null;
    const newNote = notes[selectedPatient.name] || '';

    if (!finalTherapistId) {
      alert('Therapist ID not found for this patient.');
      return;
    }

    try {
      await saveTherapistNote({
        bookingId: booking.B_ID ?? 0,
        therapistId: finalTherapistId,
        parentId,
        notes: newNote,
      });

      onSessionsUpdate((prev) =>
        prev.map((item) =>
          item.B_ID === booking.B_ID ? { ...item, Notes: newNote } : item
        )
      );

      alert(`Therapist notes saved for ${selectedPatient.name}.`);
    } catch (err) {
      console.error('Error saving therapist patient notes:', err);
      alert('Could not save therapist notes. Check backend console.');
    }
  };

  return (
    <div className="pv-content">
      {selectedPatient ? (
        /*
           SELECTED PATIENT DETAIL VIEW

           Shows one patient with session types, status, number of sessions,
           and editable therapist notes.
        */
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <button
            className="pv-link-btn t"
            onClick={() => setSelectedPatient(null)}
            style={{ marginBottom: 24, fontSize: 14 }}
          >
            ← Back to Patients
          </button>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(123, 92, 191, 0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${selectedPatient.color}, ${selectedPatient.color}dd)`,
                padding: '32px 28px',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    border: '3px solid rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    fontWeight: 'bold',
                  }}
                >
                  {selectedPatient.name?.[0] || 'C'}
                </div>

                <div>
                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: 24,
                      fontWeight: 700,
                    }}
                  >
                    {selectedPatient.name}
                  </h2>

                  <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>
                    {selectedPatient.age}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '32px 28px' }}>
              {/* Session types */}
              <div style={{ marginBottom: 28 }}>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2d2d2d',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    opacity: 0.7,
                  }}
                >
                  Session Types
                </h3>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedPatient.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: `${selectedPatient.color}15`,
                        border: `1.5px solid ${selectedPatient.color}40`,
                        color: selectedPatient.color,
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Patient stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, ${selectedPatient.color}12, ${selectedPatient.color}08)`,
                    border: `1px solid ${selectedPatient.color}20`,
                    padding: 18,
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6B6B6B',
                      marginBottom: 8,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    Sessions
                  </div>

                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: selectedPatient.color,
                    }}
                  >
                    {selectedPatient.sessions}
                  </div>
                </div>

                <div
                  style={{
                    background:
                      selectedPatient.status === 'Pending'
                        ? '#FFB66E15'
                        : '#82C9A515',
                    border: `1px solid ${selectedPatient.status === 'Pending'
                        ? '#FFB66E40'
                        : '#82C9A540'
                      }`,
                    padding: 18,
                    borderRadius: 12,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6B6B6B',
                      marginBottom: 8,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </div>

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color:
                        selectedPatient.status === 'Pending'
                          ? '#FFB66E'
                          : '#82C9A5',
                    }}
                  >
                    {selectedPatient.status}
                  </div>
                </div>
              </div>

              {/* Therapist notes textarea */}
              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2d2d2d',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    opacity: 0.7,
                  }}
                >
                  Therapist Notes
                </h3>

                <textarea
                  value={notes[selectedPatient.name] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [selectedPatient.name]: e.target.value,
                    }))
                  }
                  placeholder="Write therapist observations, progress notes, recommendations, or any important details about this patient..."
                  style={{
                    width: '100%',
                    minHeight: 160,
                    padding: 16,
                    border: '1.5px solid #E0E0E0',
                    borderRadius: 12,
                    fontFamily: 'inherit',
                    fontSize: 14,
                    color: '#2d2d2d',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                <button
                  onClick={handleSaveNotes}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    padding: '14px 20px',
                    background: `linear-gradient(135deg, ${selectedPatient.color}, ${selectedPatient.color}ee)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Therapist Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /*
           PATIENT LIST VIEW

           Shows filters and all patient cards.
        */
        <>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {filterOptions.map((f) => (
              <span
                key={f.value}
                className="pv-badge"
                onClick={() => setFilter(f.value)}
                style={{
                  background: filter === f.value ? '#9D64AA' : '#F2F2F2',
                  color: filter === f.value ? '#fff' : '#6B6B6B',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 14,
            }}
          >
            {displayedPatients.length === 0 ? (
              <p style={{ color: '#6B6B6B' }}>
                No patients booked with you yet.
              </p>
            ) : (
              displayedPatients.map((p) => (
                <div
                  key={p.id}
                  className="pv-pcard"
                  onClick={() => handleSelectPatient(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pv-pcard-top">
                    <div className="pv-pcard-av" style={{ background: p.color }}>
                      {p.name?.[0] || 'C'}
                    </div>

                    <div>
                      <div className="pv-pcard-name">{p.name}</div>
                      <div className="pv-pcard-age">{p.age}</div>
                    </div>
                  </div>

                  <div className="pv-pcard-tags">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="pv-pcard-tag"
                        style={{ background: '#EFF0F9', color: '#9D64AA' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pv-pcard-footer">
                    <div className="pv-pcard-sessions">
                      {p.sessions} session{p.sessions !== 1 ? 's' : ''}
                    </div>

                    <div
                      className={`pv-pcard-status ${p.status === 'Pending' ? 'new' : 'active'
                        }`}
                    >
                      {p.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* =========================
   EARNINGS

   Shows therapist earnings:
   - Total earnings
   - Completed/confirmed earnings
   - Pending earnings
   - Transaction history
========================= */

const TEarnings = ({ therapist, sessions = [] }) => {
  /*
     STATE AND SETTINGS

     payoutFilter controls transaction history filter.
     settings and calculateEarnings calculate commission.
  */
  const [payoutFilter, setPayoutFilter] = useState('All');
  const { settings, calculateEarnings } = usePlatformSettings();

  /*
     SESSION RATE

     Gets therapist hourly/session rate from profile data.
  */
  const hourlyRate = Number(therapist?.Hourly_Rate || 0);

  /*
     APPLY COMMISSION

     Calculates net amount after platform commission.
  */
  const applyCommission = (grossAmount) => {
    const amount = Number(grossAmount || 0);

    if (typeof calculateEarnings === 'function') {
      return Math.round(calculateEarnings(amount));
    }

    const commission = Number(settings?.platformCommission || 0);
    return Math.round(amount * (1 - commission / 100));
  };

  /*
     GROSS AND NET AMOUNT HELPERS

     Gross is currently equal to session rate.
     Net applies platform commission.
  */
  const getGrossAmount = () => hourlyRate;
  const getNetAmount = () => applyCommission(hourlyRate);

  /*
     TOTAL EARNINGS CALCULATIONS

     Calculates total, completed/confirmed, and pending earnings.
  */
  const totalGrossIncome = sessions.reduce((sum) => sum + getGrossAmount(), 0);
  const totalEarnings = applyCommission(totalGrossIncome);

  const completedEarnings = sessions
    .filter(
      (item) =>
        getSessionStatus(item) === 'Completed' ||
        getSessionStatus(item) === 'Confirmed'
    )
    .reduce((sum) => sum + getNetAmount(), 0);

  const pendingEarnings = sessions
    .filter((item) => getSessionStatus(item) === 'Pending')
    .reduce((sum) => sum + getNetAmount(), 0);

  /*
     TRANSACTION FILTER

     Filters earning rows based on payoutFilter.
  */
  let filteredSessions = sessions;

  if (payoutFilter === 'Completed') {
    filteredSessions = sessions.filter(
      (item) =>
        getSessionStatus(item) === 'Completed' ||
        getSessionStatus(item) === 'Confirmed'
    );
  }

  if (payoutFilter === 'Pending') {
    filteredSessions = sessions.filter(
      (item) => getSessionStatus(item) === 'Pending'
    );
  }

  return (
    <div className="pv-content">
      {/* Earnings hero card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #9D64AA, #7B4A87)',
          borderRadius: 16,
          padding: '32px',
          color: '#fff',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(157, 100, 170, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Total Earnings After {settings?.platformCommission || 0}% Commission
          </div>

          <h2 style={{ margin: '0 0 8px 0', fontSize: 36, fontWeight: 700 }}>
            EGP {totalEarnings.toLocaleString()}
          </h2>

          <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>
            {sessions.length} booked session(s) · Session rate: EGP {hourlyRate}
          </p>
        </div>
      </div>

      {/* Earnings summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 8 }}>
            Total Earnings
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#9D64AA' }}>
            EGP {totalEarnings.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E0E0E0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 8 }}>
            Completed/Confirmed
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#82C9A5' }}>
            EGP {completedEarnings.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: '#FFB66E10',
            border: '1px solid #FFB66E40',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 8 }}>
            Pending
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#FFB66E' }}>
            EGP {pendingEarnings.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E0E0E0',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #E0E0E0' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: '#2d2d2d',
              }}
            >
              Transaction History
            </h3>

            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Completed', 'Pending'].map((f) => (
                <button
                  key={f}
                  onClick={() => setPayoutFilter(f)}
                  style={{
                    background: payoutFilter === f ? '#9D64AA' : '#F2F2F2',
                    color: payoutFilter === f ? '#fff' : '#6B6B6B',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          {filteredSessions.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: '#9B9B9B',
              }}
            >
              No transactions found.
            </div>
          ) : (
            filteredSessions.map((item, index) => {
              const grossAmount = getGrossAmount();
              const netAmount = getNetAmount();

              return (
                <div
                  key={`${item.B_ID}-earning-${index}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom:
                      index < filteredSessions.length - 1
                        ? '1px solid #F0F0F0'
                        : 'none',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#2d2d2d',
                        marginBottom: 4,
                      }}
                    >
                      {getPatientName(item)} — {getSessionTag(item)}
                    </div>

                    <div style={{ fontSize: 12, color: '#9B9B9B' }}>
                      {formatDate(item.Date)} · {item.Start_time || ''}
                    </div>

                    <div style={{ fontSize: 11, color: '#9B9B9B' }}>
                      Gross: EGP {Math.round(grossAmount).toLocaleString()} ·
                      After {settings?.platformCommission || 0}% commission
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        getSessionStatus(item) === 'Pending'
                          ? '#FFB66E'
                          : '#82C9A5',
                    }}
                  >
                    EGP {netAmount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================
   MY PROFILE

   Lets therapist:
   - View profile summary
   - Change profile photo
   - Edit basic information
   - Save profile updates
========================= */

const TProfile = ({ therapist, sessions = [], onTherapistUpdate }) => {
  /*
     PHOTO STATES

     photoPreview shows selected image before upload.
     photoFile stores actual file.
     fileInputRef opens hidden file input.
     isSaving controls save button state.
  */
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  /*
     NAME SPLIT

     Splits therapist full name into first and last name.
  */
  const fullName = therapist?.Fullname || 'Therapist';
  const nameParts = fullName.split(' ');

  /*
     FORM DATA

     Stores editable profile fields.
  */
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: therapist?.Email || '',
    hourlyRate: therapist?.Hourly_Rate || '',
    yearsOfExperience: therapist?.Experience || '',
    specialization: therapist?.Specialization || '',
    availability: therapist?.Availability || '',
    bio: therapist?.Specialization || 'Therapist profile.',
  });

  /*
     UPDATE FORM WHEN THERAPIST CHANGES

     When therapist data is loaded again from backend,
     the form updates with the latest values.
  */
  useEffect(() => {
    const updatedName = therapist?.Fullname || 'Therapist';
    const updatedParts = updatedName.split(' ');

    setFormData({
      firstName: updatedParts[0] || '',
      lastName: updatedParts.slice(1).join(' ') || '',
      email: therapist?.Email || '',
      hourlyRate: therapist?.Hourly_Rate || '',
      yearsOfExperience: therapist?.Experience || '',
      specialization: therapist?.Specialization || '',
      availability: therapist?.Availability || '',
      bio: therapist?.Specialization || 'Therapist profile.',
    });
  }, [therapist]);

  /*
     OPEN PHOTO INPUT

     Opens hidden file input when avatar or Change Photo is clicked.
  */
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  /*
     HANDLE PHOTO CHANGE

     Stores selected image file and creates preview.
  */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();

      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };

      reader.readAsDataURL(file);
    }
  };

  /*
     HANDLE INPUT CHANGE

     Updates one field inside formData.
  */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /*
     SAVE PROFILE CHANGES

     Sends updated therapist profile data and optional photo to backend.
     Then updates local therapist state and localStorage.
  */
  const handleSaveChanges = async () => {
    if (!therapist?.T_ID) {
      alert('Therapist ID not found.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = new FormData();

      payload.append('T_ID', therapist.T_ID);
      payload.append('Fullname', `${formData.firstName} ${formData.lastName}`.trim());
      payload.append('Email', formData.email);
      payload.append('Hourly_Rate', formData.hourlyRate);
      payload.append('Experience', formData.yearsOfExperience);
      payload.append('Specialization', formData.specialization || formData.bio);
      payload.append('Availability', formData.availability);

      if (photoFile) {
        payload.append('image', photoFile);
      }

      await axios.put(
        `${API_BASE}/modules/therapist/therapist?id=${therapist.T_ID}`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const updatedTherapist = {
        ...therapist,
        T_ID: therapist.T_ID,
        Fullname: `${formData.firstName} ${formData.lastName}`.trim(),
        Email: formData.email,
        Hourly_Rate: formData.hourlyRate,
        Experience: formData.yearsOfExperience,
        Specialization: formData.specialization || formData.bio,
        Availability: formData.availability,
      };

      onTherapistUpdate(updatedTherapist);

      const savedTherapist = JSON.parse(localStorage.getItem('therapist')) || {};

      localStorage.setItem(
        'therapist',
        JSON.stringify({
          ...savedTherapist,
          T_ID: updatedTherapist.T_ID,
          Fullname: updatedTherapist.Fullname,
          Email: updatedTherapist.Email,
        })
      );

      setPhotoFile(null);
      alert('Profile and photo saved successfully!');
    } catch (err) {
      console.error('Error saving therapist profile:', err);
      alert('Could not save profile. Check backend console.');
    } finally {
      setIsSaving(false);
    }
  };

  /*
     AVATAR LETTER

     Used when there is no photo preview.
  */
  const avatarLetter = formData.firstName?.[0] || 'T';

  return (
    <div className="pv-content">
      <div className="pv-profile-layout">
        {/* Profile summary card */}
        <div className="pv-card pv-profile-card">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />

          <div
            className="pv-profile-big-av"
            style={{
              background: photoPreview ? `url(${photoPreview})` : '#A48CD6',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
            }}
            onClick={handlePhotoClick}
          >
            {!photoPreview && avatarLetter}
          </div>

          <div className="pv-profile-name">
            {formData.firstName} {formData.lastName}
          </div>

          <div className="pv-profile-role">
            {formData.specialization || 'Therapist'}
          </div>

          <button
            className="pv-btn outline-t"
            style={{ width: '100%', marginTop: 14, fontSize: 12 }}
            onClick={handlePhotoClick}
          >
            Change Photo
          </button>

          {/* Profile stats */}
          <div className="pv-profile-stats">
            {[
              [getUniquePatients(sessions).length, 'Patients'],
              [formData.yearsOfExperience || 'N/A', 'Experience'],
              [sessions.length, 'Sessions'],
              [`EGP ${formData.hourlyRate || 0}`, 'Session Rate'],
            ].map(([v, l]) => (
              <div key={l} className="pv-psm-item">
                <div className="pv-psm-val">{v}</div>
                <div className="pv-psm-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable profile form */}
        <div className="pv-card">
          <div className="pv-form-section">
            <h4>Basic Information</h4>

            <div className="pv-form-row">
              <div className="pv-form-group">
                <label>First Name</label>
                <input
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange('firstName', e.target.value)
                  }
                />
              </div>

              <div className="pv-form-group">
                <label>Last Name</label>
                <input
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange('lastName', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="pv-form-row">
              <div className="pv-form-group">
                <label>Email</label>
                <input
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="pv-form-group">
                <label>Session Rate (EGP)</label>
                <input
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    handleInputChange('hourlyRate', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="pv-form-row">
              <div className="pv-form-group">
                <label>Years of Experience</label>
                <input
                  value={formData.yearsOfExperience}
                  onChange={(e) =>
                    handleInputChange('yearsOfExperience', e.target.value)
                  }
                />
              </div>

              <div className="pv-form-group">
                <label>Availability</label>
                <input
                  value={formData.availability}
                  onChange={(e) =>
                    handleInputChange('availability', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="pv-form-group">
              <label>Specialization / Bio</label>
              <textarea
                rows={3}
                style={{ resize: 'none' }}
                value={formData.specialization}
                onChange={(e) =>
                  handleInputChange('specialization', e.target.value)
                }
              />
            </div>
          </div>

          {/* Save profile button */}
          <button
            className="pv-btn primary-t"
            style={{
              width: 'auto',
              padding: '14px 40px',
              margin: '20px auto 0',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader
                  size={16}
                  strokeWidth={2}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={2} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
   MAIN COMPONENT

   Main therapist portal wrapper.
   It:
   - Checks login
   - Loads therapist profile
   - Loads therapist bookings
   - Loads therapist notes from therapy_session
   - Merges notes with bookings
   - Renders sidebar, topbar, and selected screen
========================= */

/* 
   SCREEN TITLES

   These titles appear in the topbar depending on selected screen.
*/
const SCREEN_TITLES_T = {
  dashboard: 'Dashboard',
  schedule: 'My Schedule',
  patients: 'My Patients',
  earnings: 'Earnings',
  profile: 'My Profile',
};

const TherapistInterface = () => {
  /*
     ROUTING

     navigate moves user between routes.
     id gets therapist ID from URL.
  */
  const navigate = useNavigate();
  const { id } = useParams();

  /*
     MAIN STATES

     screen controls the active portal page.
     therapist stores logged-in therapist data.
     sessions stores therapist sessions with merged notes.
  */
  const [screen, setScreen] = useState('dashboard');
  const [therapist, setTherapist] = useState(null);
  const [sessions, setSessions] = useState([]);

  /*
     AUTH CHECK AND DATA LOADING

     Runs when page opens.
     Checks localStorage login data.
     Loads therapist profile.
     Loads booking sessions.
     Loads therapy_session notes and merges them by B_ID.
  */
  useEffect(() => {
    const savedTherapist = JSON.parse(localStorage.getItem('therapist'));
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!savedTherapist || userType !== 'therapist' || isLoggedIn !== 'true') {
      navigate('/login');
      return;
    }

    if (String(savedTherapist.T_ID) !== String(id)) {
      navigate('/login');
      return;
    }

    setTherapist(savedTherapist);

    axios
      .get(`${API_BASE}/modules/therapist/therapist?id=${savedTherapist.T_ID}`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTherapist(res.data[0]);
        }
      })
      .catch((err) => {
        console.error('Error loading therapist profile:', err);
      });

    axios
      .get(`${API_BASE}/modules/booking/therapist-sessions?T_ID=${savedTherapist.T_ID}`)
      .then(async (res) => {
        const bookingSessions = Array.isArray(res.data) ? res.data : [];

        try {
          const notesRes = await axios.get(
            `${API_BASE}/modules/therapy_session/therapy_session?T_ID=${savedTherapist.T_ID}`
          );

          const therapyNotes = Array.isArray(notesRes.data) ? notesRes.data : [];

          const noteByBookingId = new Map(
            therapyNotes
              .filter((note) => note.B_ID !== null && note.B_ID !== undefined)
              .map((note) => [String(note.B_ID), note.Notes || ''])
          );

          const mergedSessions = bookingSessions.map((session) => ({
            ...session,
            Notes: noteByBookingId.get(String(session.B_ID)) || '',
          }));

          console.log('Therapist sessions with therapy notes:', mergedSessions);
          setSessions(mergedSessions);
        } catch (noteErr) {
          console.error('Error loading therapist notes:', noteErr);

          const sessionsWithoutBookingNotes = bookingSessions.map((session) => ({
            ...session,
            Notes: '',
          }));

          setSessions(sessionsWithoutBookingNotes);
        }
      })
      .catch((err) => {
        console.error('Error loading therapist sessions:', err);
        setSessions([]);
      });
  }, [id, navigate]);

  /*
     USER NAME

     Used in sidebar and topbar.
  */
  const userName = therapist?.Fullname || 'Therapist';

  /*
     LOGOUT

     Clears therapist login data and returns user to login page.
  */
  const handleLogout = () => {
    localStorage.removeItem('therapist');
    localStorage.removeItem('userType');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  /*
     RENDER SCREEN

     Decides which portal screen should appear.
  */
  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <TDashboard therapist={therapist} sessions={sessions} />;

      case 'schedule':
        return (
          <TSchedule
            sessions={sessions}
            onSessionsUpdate={setSessions}
            therapistId={therapist?.T_ID}
          />
        );

      case 'patients':
        return (
          <TPatients
            sessions={sessions}
            onSessionsUpdate={setSessions}
            therapistId={therapist?.T_ID}
          />
        );

      case 'earnings':
        return <TEarnings therapist={therapist} sessions={sessions} />;

      case 'profile':
        return (
          <TProfile
            therapist={therapist}
            sessions={sessions}
            onTherapistUpdate={setTherapist}
          />
        );

      default:
        return <TDashboard therapist={therapist} sessions={sessions} />;
    }
  };

  /*
     LOADING STATE

     Shows while therapist profile is still loading.
  */
  if (!therapist) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  return (
    /*
       MAIN PORTAL LAYOUT

       Sidebar controls navigation.
       Topbar shows current screen title.
       Main area renders selected screen.
    */
    <div className="pv-shell ti-shell">
      <ProviderSidebar
        role="therapist"
        userName={userName}
        activeScreen={screen}
        onNavigate={setScreen}
        onLogout={handleLogout}
      />

      <div className="pv-main">
        <ProviderTopbar
          title={SCREEN_TITLES_T[screen] || 'Dashboard'}
          role="therapist"
        />

        {renderScreen()}
      </div>
    </div>
  );
};

export default TherapistInterface;