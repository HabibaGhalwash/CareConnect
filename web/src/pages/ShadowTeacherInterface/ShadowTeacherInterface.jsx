/*
 * ShadowTeacherInterface.jsx — CareConnect Shadow Teacher Portal
 *
 * This file contains the private portal used by shadow teachers.
 * It includes:
 * 1. Dashboard
 * 2. Schedule
 * 3. Students
 * 4. Earnings
 * 5. Profile
 * 6. Main layout with sidebar and topbar
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, Save } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import ProviderSidebar from '../../components/provider/ProviderSidebar/ProviderSidebar';
import ProviderTopbar from '../../components/provider/ProviderTopbar/ProviderTopbar';
import '../../components/provider/provider-base.css';
import './ShadowTeacherInterface.css';

/* =========================
   HELPERS

   These are reusable helper functions used across the portal.
   They format data, extract child/session info, and prepare students.
========================= */

/* 
   COLORS

   These colors are used for student avatars/cards.
*/
const COLORS = ['#63ADA8', '#FFB66E', '#9CCFC9', '#82C9A5', '#A48CD6'];

/* 
   GET CHILD NAME

   Gets the child name from different possible backend field names.
   If no name exists, it shows Child + child ID.
*/
const getChildName = (item) => {
  return (
    item.Child_Name ||
    item.Fullname ||
    item.Full_Name ||
    item.Name ||
    item.child_name ||
    `Child ${item.Child_ID}`
  );
};

/* 
   GET SESSION TAG

   Gets the session type/service type.
   If no type exists, it shows "Session".
*/
const getSessionTag = (item) => {
  return item.Service_type || item.Session_type || 'Session';
};

/* 
   GET SESSION STATUS

   Gets the booking/session status.
   If no status exists, it shows "Confirmed".
*/
const getSessionStatus = (item) => {
  return item.Booking_status || 'Confirmed';
};

/* 
   FORMAT FULL DATE

   Converts a date into a readable format like:
   Mon, May 15, 2026.
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

   Converts a date into a shorter format like:
   Mon, May 15.
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
   GET DURATION HOURS

   Converts duration values into hours.
   Example:
   "30 min" becomes 0.5
   "2 hours" becomes 2
   60 becomes 1
*/
const getDurationHours = (duration) => {
  if (!duration) return 1;

  const text = String(duration).toLowerCase();

  if (text.includes('hour')) {
    return Number(text.replace(/[^0-9.]/g, '')) || 1;
  }

  if (text.includes('min')) {
    return (Number(text.replace(/[^0-9.]/g, '')) || 60) / 60;
  }

  const number = Number(duration);

  if (!number) return 1;

  if (number > 10) {
    return number / 60;
  }

  return number;
};

/* 
   GET UNIQUE STUDENTS

   Takes all sessions and groups them by Child_ID.
   This prevents showing the same child many times.
   It also counts how many sessions each child has.
*/
const getUniqueStudents = (sessions = []) => {
  return Object.values(
    sessions.reduce((acc, item, index) => {
      const childId = item.Child_ID || `child-${index}`;
      const childName = getChildName(item);

      if (!acc[childId]) {
        acc[childId] = {
          id: childId,
          name: childName,
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

/* =========================
   DASHBOARD

   This component shows the shadow teacher overview:
   - Welcome message
   - Session statistics
   - Booked students
   - Student progress notes
========================= */

const STDashboard = ({ name, sessions = [] }) => {
  /*
     STATE

     showAllStudents controls whether the dashboard shows only 3 students
     or the full booked students list.
  */
  const [showAllStudents, setShowAllStudents] = useState(false);

  /*
     UNIQUE STUDENTS

     useMemo avoids recalculating students every render unless sessions change.
  */
  const uniqueStudents = useMemo(() => getUniqueStudents(sessions), [sessions]);

  /*
     DISPLAYED STUDENTS

     Shows either all students or only the first 3.
  */
  const studentsToDisplay = showAllStudents
    ? uniqueStudents
    : uniqueStudents.slice(0, 3);

  /*
     NOTES TO DISPLAY

     Filters sessions and keeps only sessions that have notes.
  */
  const notesToDisplay = sessions.filter(
    (item) => item.Notes && String(item.Notes).trim() !== ''
  );

  /*
     FIRST SESSION

     Sorts sessions by date/time and gets the earliest one.
  */
  const firstSession = [...sessions].sort((a, b) => {
    const dateA = new Date(`${a.Date || ''} ${a.Start_time || ''}`);
    const dateB = new Date(`${b.Date || ''} ${b.Start_time || ''}`);
    return dateA - dateB;
  })[0];

  return (
    <div className="pv-content">
      {/* Welcome banner */}
      <div
        className="pv-welcome"
        style={{ background: 'linear-gradient(135deg,#63ADA8,#1A4A47)' }}
      >
        <h2>Good morning, {name || 'Shadow Teacher'}!</h2>
        <p>
          You have {sessions.length} booked session(s).
          {firstSession?.Start_time
            ? ` Your first session starts at ${firstSession.Start_time}.`
            : ' No session time is scheduled yet.'}
        </p>
      </div>

      {/* Dashboard statistics cards */}
      <div className="pv-stats-grid" style={{ marginBottom: 20 }}>
        {[
          {
            label: "Today's Students",
            val: uniqueStudents.length,
            sub: 'Unique booked students',
            cls: 'teal',
          },
          {
            label: 'This Week',
            val: sessions.length,
            sub: 'Scheduled sessions',
            cls: 'teal',
          },
          {
            label: 'Total Students',
            val: uniqueStudents.length,
            sub: 'Linked to your bookings',
            cls: 'green',
          },
        ].map((s) => (
          <div key={s.label} className={`pv-stat ${s.cls}`}>
            <div className="pv-stat__val">{s.val}</div>
            <div className="pv-stat__label">{s.label}</div>
            <div className="pv-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Booked students table */}
      <div className="pv-card" style={{ marginBottom: 20 }}>
        <div className="pv-sec-head">
          <h3>Booked Students</h3>
          {uniqueStudents.length > 3 && (
            <button
              className="pv-link-btn st"
              onClick={() => setShowAllStudents(!showAllStudents)}
            >
              {showAllStudents ? 'Show less ↑' : 'View all →'}
            </button>
          )}
        </div>

        <table className="pv-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Sessions</th>
            </tr>
          </thead>

          <tbody>
            {studentsToDisplay.length === 0 ? (
              <tr>
                <td colSpan="2">No students booked with you yet.</td>
              </tr>
            ) : (
              studentsToDisplay.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="pv-user-cell">
                      <div
                        className="pv-mini-av"
                        style={{ background: student.color }}
                      >
                        {student.name?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="pv-user-name">{student.name}</div>
                        <div className="pv-user-sub">{student.age}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.sessions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Student progress notes */}
      <div className="pv-card" style={{ marginBottom: 20 }}>
        <div className="pv-sec-head">
          <h3>Student Progress Notes</h3>
        </div>

        <div
          style={{
            padding: '14px 22px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {notesToDisplay.length === 0 ? (
            <p style={{ color: '#6B6B6B', fontSize: 13 }}>
              No progress notes added yet.
            </p>
          ) : (
            notesToDisplay.map((item, index) => {
              const childName = getChildName(item);

              return (
                <div
                  key={`${item.B_ID}-note-${index}`}
                  style={{
                    background: '#F6F2EE',
                    borderRadius: 10,
                    padding: 13,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    className="pv-mini-av"
                    style={{
                      background: COLORS[index % COLORS.length],
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  >
                    {childName?.[0] || 'C'}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {childName}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#6B6B6B',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.Notes}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: '#9B9B9B',
                        marginTop: 4,
                      }}
                    >
                      {formatShortDate(item.Date)} · {item.Start_time || ''}
                    </div>
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
   MY SCHEDULE

   This component shows:
   - Available booked dates
   - Sessions for the selected date
   - Notes textarea for each session
   - Upcoming sessions table
========================= */

const STSchedule = ({ sessions = [], onSessionsUpdate }) => {
  /*
     STATE

     selectedDate controls which day is selected.
     sessionNotes stores notes before saving them to backend.
  */
  const [selectedDate, setSelectedDate] = useState('');
  const [sessionNotes, setSessionNotes] = useState({});

  /*
     SORT SESSIONS

     Sorts all sessions by date and start time.
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

     Extracts all unique session dates for the calendar strip.
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

     Shows only sessions for the selected date.
     If no date is selected, it shows all sessions.
  */
  const selectedDaySessions = selectedDate
    ? sortedSessions.filter((s) => s.Date === selectedDate)
    : sortedSessions;

  /*
     SAVE SESSION NOTE

     Sends the note to the backend and updates local sessions state.
  */
  const handleSaveSessionNote = async (item) => {
    if (!item) {
      alert('Session data not found.');
      return;
    }

    const noteText = sessionNotes[item.B_ID] ?? item.Notes ?? '';

    try {
      await axios.put(
        `${API_BASE}/modules/booking/booking-note?id=${item.B_ID}`,
        { Notes: noteText }
      );

      if (typeof onSessionsUpdate === 'function') {
        onSessionsUpdate((prev) =>
          prev.map((session) =>
            session.B_ID === item.B_ID
              ? { ...session, Notes: noteText }
              : session
          )
        );
      }

      alert('Session note saved successfully.');
    } catch (err) {
      console.error('Error saving session note:', err);
      alert('Could not save session note. Check backend console.');
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
                        border: '2px solid #63ADA8',
                        boxShadow: '0 0 0 1px #63ADA8',
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
                    {Number.isNaN(date.getTime())
                      ? dateValue
                      : date.getDate()}
                  </span>
                  <span className="dot" style={{ background: '#63ADA8' }} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Sessions and upcoming sessions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Sessions for selected day */}
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
              selectedDaySessions.map((item, index) => (
                <div key={`${item.B_ID}-${index}`} className="pv-slot">
                  <div className="pv-slot-time">
                    {item.Start_time || 'Time not set'}
                  </div>

                  <div className="pv-slot-event busy-st">
                    <div className="pv-slot-name">
                      {getChildName(item)}{' '}
                      {item.End_time ? `— Until ${item.End_time}` : ''}
                    </div>

                    <div className="pv-slot-sub">
                      {getSessionTag(item)} · {getSessionStatus(item)}
                    </div>

                    {/* Session note input */}
                    <textarea
                      value={sessionNotes[item.B_ID] ?? item.Notes ?? ''}
                      onChange={(e) =>
                        setSessionNotes((prev) => ({
                          ...prev,
                          [item.B_ID]: e.target.value,
                        }))
                      }
                      placeholder="Write session note..."
                      style={{
                        width: '100%',
                        marginTop: 10,
                        minHeight: 80,
                        padding: 10,
                        border: '1px solid #E0E0E0',
                        borderRadius: 8,
                        fontFamily: 'inherit',
                        fontSize: 13,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />

                    <button
                      onClick={() => handleSaveSessionNote(item)}
                      style={{
                        marginTop: 8,
                        padding: '8px 14px',
                        background: '#63ADA8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Save Session Note
                    </button>
                  </div>
                </div>
              ))
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
                <th>Student</th>
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
                  const nm = getChildName(item);
                  const status = getSessionStatus(item);
                  const color = COLORS[index % COLORS.length];

                  return (
                    <tr key={`${item.B_ID}-upcoming-${index}`}>
                      <td>
                        <div className="pv-user-cell">
                          <div
                            className="pv-mini-av"
                            style={{ background: color }}
                          >
                            {nm?.[0] || 'C'}
                          </div>
                          <div className="pv-user-name">{nm}</div>
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
   MY STUDENTS

   This component shows:
   - All students linked to this teacher
   - Filters for All / Active / New
   - Detailed student profile
   - Editable notes for each student
========================= */

const STStudents = ({ sessions = [], onSessionsUpdate }) => {
  /*
     STATE

     filter controls which student group is shown.
     selectedStudent controls whether we show the list or the details page.
     notes stores the edited notes before saving.
  */
  const [filter, setFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notes, setNotes] = useState({});

  /*
     STUDENT GROUPS

     Creates all students, active students, and new/pending students.
  */
  const allStudents = useMemo(() => getUniqueStudents(sessions), [sessions]);

  const activeStudents = allStudents.filter(
    (s) =>
      s.status === 'Active' ||
      s.status === 'Confirmed' ||
      s.status === 'Completed'
  );

  const newStudents = allStudents.filter(
    (s) => s.status === 'New' || s.status === 'Pending'
  );

  /*
     FILTERED STUDENTS

     Decides which students should appear based on the selected filter.
  */
  let displayedStudents = allStudents;
  if (filter === 'Active') displayedStudents = activeStudents;
  if (filter === 'New') displayedStudents = newStudents;

  /*
     FILTER BUTTONS

     These are the tabs shown above the students grid.
  */
  const filterOptions = [
    { label: `All (${allStudents.length})`, value: 'All' },
    { label: `Active (${activeStudents.length})`, value: 'Active' },
    { label: `New/Pending (${newStudents.length})`, value: 'New' },
  ];

  /*
     SELECT STUDENT

     Opens the detailed student view and loads existing notes.
  */
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);

    if (!notes[student.name]) {
      setNotes((prev) => ({
        ...prev,
        [student.name]: student.notesText || '',
      }));
    }
  };

  /*
     SAVE STUDENT NOTES

     Saves notes to the latest booking session for that student.
  */
  const handleSaveNotes = async () => {
    if (!selectedStudent?.latestSession) {
      alert('No booking session found for this student.');
      return;
    }

    const booking = selectedStudent.latestSession;
    const newNote = notes[selectedStudent.name] || '';

    try {
      await axios.put(
        `${API_BASE}/modules/booking/booking-note?id=${booking.B_ID}`,
        { Notes: newNote },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (typeof onSessionsUpdate === 'function') {
        onSessionsUpdate((prev) =>
          prev.map((item) =>
            item.B_ID === booking.B_ID ? { ...item, Notes: newNote } : item
          )
        );
      }

      alert(`Notes saved for ${selectedStudent.name}.`);
    } catch (err) {
      console.error('Error saving shadow teacher student notes:', err);
      alert('Could not save notes. Check backend console.');
    }
  };

  return (
    <div className="pv-content">
      {selectedStudent ? (
        /*
           SELECTED STUDENT DETAIL VIEW

           Shows one student with session types, status, sessions count,
           and editable notes.
        */
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <button
            className="pv-link-btn st"
            onClick={() => setSelectedStudent(null)}
            style={{ marginBottom: 24, fontSize: 14 }}
          >
            ← Back to Students
          </button>

          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(99, 173, 168, 0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${selectedStudent.color}, ${selectedStudent.color}dd)`,
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
                  {selectedStudent.name?.[0] || 'C'}
                </div>

                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>
                    {selectedStudent.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {selectedStudent.age}
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
                  }}
                >
                  Session Types
                </h3>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedStudent.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: `${selectedStudent.color}15`,
                        border: `1.5px solid ${selectedStudent.color}40`,
                        color: selectedStudent.color,
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

              {/* Student stats */}
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
                    background: `${selectedStudent.color}12`,
                    border: `1px solid ${selectedStudent.color}20`,
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
                    }}
                  >
                    Sessions
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: selectedStudent.color,
                    }}
                  >
                    {selectedStudent.sessions}
                  </div>
                </div>

                <div
                  style={{
                    background: '#82C9A515',
                    border: '1px solid #82C9A540',
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
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#82C9A5',
                    }}
                  >
                    {selectedStudent.status}
                  </div>
                </div>
              </div>

              {/* Student notes */}
              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2d2d2d',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  Student Notes
                </h3>

                <textarea
                  value={notes[selectedStudent.name] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [selectedStudent.name]: e.target.value,
                    }))
                  }
                  placeholder="Write observations, progress notes, behavioral notes, or recommendations..."
                  style={{
                    width: '100%',
                    minHeight: 160,
                    padding: 16,
                    border: '1.5px solid #E0E0E0',
                    borderRadius: 12,
                    fontFamily: 'inherit',
                    fontSize: 14,
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
                    background: selectedStudent.color,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /*
           STUDENTS LIST VIEW

           Shows filters and all student cards.
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
                  background: filter === f.value ? '#63ADA8' : '#F2F2F2',
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
            {displayedStudents.length === 0 ? (
              <p style={{ color: '#6B6B6B' }}>
                No students booked with you yet.
              </p>
            ) : (
              displayedStudents.map((s) => (
                <div
                  key={s.id}
                  className="pv-pcard"
                  onClick={() => handleSelectStudent(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pv-pcard-top">
                    <div
                      className="pv-pcard-av"
                      style={{ background: s.color }}
                    >
                      {s.name?.[0] || 'C'}
                    </div>

                    <div>
                      <div className="pv-pcard-name">{s.name}</div>
                      <div className="pv-pcard-age">{s.age}</div>
                    </div>
                  </div>

                  <div className="pv-pcard-tags">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="pv-pcard-tag"
                        style={{ background: '#E2F4F2', color: '#63ADA8' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pv-pcard-footer">
                    <div className="pv-pcard-sessions">
                      {s.sessions} session{s.sessions !== 1 ? 's' : ''}
                    </div>
                    <div
                      className={`pv-pcard-status ${s.status === 'Pending' ? 'new' : 'active'
                        }`}
                    >
                      {s.status}
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

   This component calculates and displays:
   - Total earnings after commission
   - Completed/confirmed earnings
   - Pending earnings
   - Transaction history
========================= */

const STEarnings = ({ sessions = [], teacher }) => {
  /*
     STATE AND SETTINGS

     payoutFilter controls the transaction history filter.
     settings and calculateEarnings come from platform settings context.
  */
  const [payoutFilter, setPayoutFilter] = useState('All');
  const { settings, calculateEarnings } = usePlatformSettings();

  /*
     HOURLY RATE

     Gets the shadow teacher hourly rate from teacher data.
  */
  const hourlyRate = Number(teacher?.Hourly_Rate || 0);

  /*
     APPLY COMMISSION

     Calculates net earnings after platform commission.
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
     GROSS AND NET AMOUNTS

     Gross amount currently uses the hourly rate.
     Net amount applies platform commission.
  */
  const getGrossAmount = (item) => {
    return hourlyRate;
  };

  const getNetAmount = (item) => {
    return applyCommission(getGrossAmount(item));
  };

  /*
     TOTAL EARNINGS CALCULATIONS

     Calculates total, completed/confirmed, and pending earnings.
  */
  const totalGrossIncome = sessions.reduce(
    (sum, item) => sum + getGrossAmount(item),
    0
  );

  const totalEarnings = applyCommission(totalGrossIncome);

  const completedEarnings = sessions
    .filter(
      (item) =>
        getSessionStatus(item) === 'Completed' ||
        getSessionStatus(item) === 'Confirmed'
    )
    .reduce((sum, item) => sum + getNetAmount(item), 0);

  const pendingEarnings = sessions
    .filter((item) => getSessionStatus(item) === 'Pending')
    .reduce((sum, item) => sum + getNetAmount(item), 0);

  /*
     TRANSACTION FILTER

     Filters sessions depending on selected payout status.
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
          background: 'linear-gradient(135deg, #63ADA8, #1A4A47)',
          borderRadius: 16,
          padding: '32px',
          color: '#fff',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(99, 173, 168, 0.2)',
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

          <h2 style={{ margin: '0 0 8px 0', fontSize: 36 }}>
            EGP {totalEarnings.toLocaleString()}
          </h2>

          <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>
            {sessions.length} booked session(s) · Hourly rate: EGP {hourlyRate}
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
          <div style={{ fontSize: 28, fontWeight: 700, color: '#63ADA8' }}>
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
            <h3 style={{ margin: 0, fontSize: 16 }}>Transaction History</h3>

            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Completed', 'Pending'].map((f) => (
                <button
                  key={f}
                  onClick={() => setPayoutFilter(f)}
                  style={{
                    background: payoutFilter === f ? '#63ADA8' : '#F2F2F2',
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
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              No transactions found.
            </div>
          ) : (
            filteredSessions.map((item, index) => {
              const grossAmount = getGrossAmount(item);
              const netAmount = getNetAmount(item);

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
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {getChildName(item)} — {getSessionTag(item)}
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
                          : '#63ADA8',
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
   PROFILE

   This component allows the shadow teacher to:
   - View profile information
   - Change profile photo
   - Edit name, email, rate, experience, availability, and bio
   - Save changes to backend
========================= */

const STProfile = ({ teacher, sessions = [], onTeacherUpdate }) => {
  /*
     PHOTO STATES

     photoPreview shows the selected image before upload.
     photoFile stores the real file for backend upload.
     fileInputRef lets us open the hidden file input by clicking the avatar.
  */
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  /*
     INITIAL NAME SPLIT

     Splits the full name into first name and last name.
  */
  const fullName = teacher?.Fullname || 'Shadow Teacher';
  const nameParts = fullName.split(' ');

  /*
     FORM DATA

     Stores all editable profile fields.
  */
  const [formData, setFormData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: teacher?.Email || '',
    hourlyRate: teacher?.Hourly_Rate || '',
    yearsOfExperience: teacher?.Experience || '',
    qualification: teacher?.Qualification || '',
    availability: teacher?.Availability || '',
    bio:
      teacher?.Qualification ||
      'Certified shadow teacher providing personalized classroom support.',
  });

  /*
     UPDATE FORM WHEN TEACHER CHANGES

     If teacher data is reloaded from backend,
     this updates the form with the newest data.
  */
  useEffect(() => {
    const updatedName = teacher?.Fullname || 'Shadow Teacher';
    const updatedParts = updatedName.split(' ');

    setFormData({
      firstName: updatedParts[0] || '',
      lastName: updatedParts.slice(1).join(' ') || '',
      email: teacher?.Email || '',
      hourlyRate: teacher?.Hourly_Rate || '',
      yearsOfExperience: teacher?.Experience || '',
      qualification: teacher?.Qualification || '',
      availability: teacher?.Availability || '',
      bio:
        teacher?.Qualification ||
        'Certified shadow teacher providing personalized classroom support.',
    });
  }, [teacher]);

  /*
     OPEN PHOTO INPUT

     Opens the hidden file input when clicking the avatar or button.
  */
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  /*
     HANDLE PHOTO CHANGE

     Saves selected file and creates a preview image.
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

     Sends updated profile data and optional photo to the backend.
     Then updates local teacher state and localStorage.
  */
  const handleSaveChanges = async () => {
    if (!teacher?.ST_ID) {
      alert('Shadow Teacher ID not found.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = new FormData();

      payload.append('ST_ID', teacher.ST_ID);
      payload.append('Fullname', `${formData.firstName} ${formData.lastName}`.trim());
      payload.append('Email', formData.email);
      payload.append('Hourly_Rate', formData.hourlyRate);
      payload.append('Experience', formData.yearsOfExperience);
      payload.append('Qualification', formData.qualification || formData.bio);
      payload.append('Availability', formData.availability);

      if (photoFile) {
        payload.append('image', photoFile);
      }

      await axios.put(
        `${API_BASE}/modules/shadow_teacher/shadow_teacher?id=${teacher.ST_ID}`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const updatedTeacher = {
        ...teacher,
        ST_ID: teacher.ST_ID,
        Fullname: `${formData.firstName} ${formData.lastName}`.trim(),
        Email: formData.email,
        Hourly_Rate: formData.hourlyRate,
        Experience: formData.yearsOfExperience,
        Qualification: formData.qualification || formData.bio,
        Availability: formData.availability,
      };

      onTeacherUpdate(updatedTeacher);

      const savedTeacher = JSON.parse(localStorage.getItem('shadowTeacher')) || {};

      localStorage.setItem(
        'shadowTeacher',
        JSON.stringify({
          ...savedTeacher,
          ST_ID: updatedTeacher.ST_ID,
          Fullname: updatedTeacher.Fullname,
          Email: updatedTeacher.Email,
        })
      );

      setPhotoFile(null);
      alert('Profile and photo saved successfully!');
    } catch (err) {
      console.error('Error saving shadow teacher profile:', err);
      alert('Could not save profile. Check backend console.');
    } finally {
      setIsSaving(false);
    }
  };

  /*
     AVATAR LETTER

     Used when there is no uploaded photo preview.
  */
  const avatarLetter = formData.firstName?.[0] || 'S';

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
              background: photoPreview ? `url(${photoPreview})` : '#63ADA8',
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
            {formData.qualification || 'Shadow Teacher'}
          </div>

          <button
            className="pv-btn outline-st"
            style={{ width: '100%', marginTop: 14, fontSize: 12 }}
            onClick={handlePhotoClick}
          >
            Change Photo
          </button>

          {/* Profile stats */}
          <div className="pv-profile-stats">
            {[
              [getUniqueStudents(sessions).length, 'Students'],
              [formData.yearsOfExperience || 'N/A', 'Experience'],
              [formData.availability || 'N/A', 'Availability'],
              [`EGP ${formData.hourlyRate || 0}`, 'Hourly Rate'],
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
                <label>Hourly Rate (EGP)</label>
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
              <label>Qualification / Bio</label>
              <textarea
                rows={3}
                style={{ resize: 'none' }}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </div>
          </div>

          {/* Save profile button */}
          <button
            className="pv-btn primary-st"
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

   This is the main shadow teacher portal wrapper.
   It:
   - Checks login
   - Loads teacher profile
   - Loads teacher sessions
   - Controls which screen is active
   - Renders sidebar, topbar, and selected screen
========================= */

/* 
   SCREEN TITLES

   These titles appear in the topbar depending on the active screen.
*/
const SCREEN_TITLES_ST = {
  dashboard: 'Dashboard',
  schedule: 'My Schedule',
  students: 'My Students',
  earnings: 'Earnings',
  profile: 'My Profile',
  settings: 'Settings',
};

const ShadowTeacherInterface = () => {
  /*
     ROUTING

     navigate moves user between routes.
     id gets the shadow teacher ID from the URL.
  */
  const navigate = useNavigate();
  const { id } = useParams();

  /*
     MAIN STATES

     screen controls the currently opened page.
     teacher stores logged-in teacher data.
     sessions stores all bookings linked to this teacher.
  */
  const [screen, setScreen] = useState('dashboard');
  const [teacher, setTeacher] = useState(null);
  const [sessions, setSessions] = useState([]);

  /*
     AUTH CHECK AND DATA LOADING

     Runs when the page opens.
     It checks localStorage login data.
     Then it fetches the latest teacher profile and sessions from backend.
  */
  useEffect(() => {
    const savedTeacher = JSON.parse(localStorage.getItem('shadowTeacher'));
    const userType = localStorage.getItem('userType');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!savedTeacher || userType !== 'shadow_teacher' || isLoggedIn !== 'true') {
      navigate('/login');
      return;
    }

    if (String(savedTeacher.ST_ID) !== String(id)) {
      navigate('/login');
      return;
    }

    setTeacher(savedTeacher);

    axios
      .get(
        `${API_BASE}/modules/shadow_teacher/shadow_teacher?id=${savedTeacher.ST_ID}`
      )
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTeacher(res.data[0]);
        }
      })
      .catch((err) => {
        console.error('Error loading shadow teacher profile:', err);
      });

    axios
      .get(
        `${API_BASE}/modules/booking/shadow-teacher-sessions?ST_ID=${savedTeacher.ST_ID}`
      )
      .then((res) => {
        console.log('Shadow teacher sessions:', res.data);
        setSessions(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Error loading shadow teacher sessions:', err);
        setSessions([]);
      });
  }, [id, navigate]);

  /*
     USER NAME

     Used in sidebar, topbar, and dashboard welcome.
  */
  const userName = teacher?.Fullname || 'Shadow Teacher';

  /*
     LOGOUT

     Clears login data from localStorage and sends user to login page.
  */
  const handleLogout = () => {
    localStorage.removeItem('shadowTeacher');
    localStorage.removeItem('userType');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  /*
     RENDER SCREEN

     Decides which screen component to display based on active screen state.
  */
  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <STDashboard name={userName} sessions={sessions} />;

      case 'schedule':
        return <STSchedule sessions={sessions} onSessionsUpdate={setSessions} />;

      case 'students':
        return (
          <STStudents
            sessions={sessions}
            onSessionsUpdate={setSessions}
          />
        );

      case 'earnings':
        return <STEarnings sessions={sessions} teacher={teacher} />;

      case 'profile':
        return (
          <STProfile
            teacher={teacher}
            sessions={sessions}
            onTeacherUpdate={setTeacher}
          />
        );

      case 'settings':
        return (
          <div className="pv-content">
            <div className="pv-card" style={{ padding: 32 }}>
              <h3 style={{ marginBottom: 12 }}>Settings</h3>
              <p style={{ color: '#6B6B6B', fontSize: 13 }}>
                Settings panel — coming soon.
              </p>
            </div>
          </div>
        );

      default:
        return <STDashboard name={userName} sessions={sessions} />;
    }
  };

  /*
     LOADING STATE

     Shows while teacher data is still loading.
  */
  if (!teacher) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  return (
    /*
       MAIN PORTAL LAYOUT

       Sidebar controls navigation.
       Topbar shows the current screen title.
       Main area renders the selected screen.
    */
    <div className="pv-shell sti-shell">
      <ProviderSidebar
        role="shadow-teacher"
        userName={userName}
        activeScreen={screen}
        onNavigate={setScreen}
        onLogout={handleLogout}
      />

      <div className="pv-main">
        <ProviderTopbar
          title={SCREEN_TITLES_ST[screen] || 'Dashboard'}
          role="shadow-teacher"
          extra={null}
        />

        {renderScreen()}
      </div>
    </div>
  );
};

export default ShadowTeacherInterface;