/*
 * BookingCalendar.jsx
 *
 * Inline calendar component for date selection.
 * Shows a mini monthly calendar matching the design screenshot.
 *
 * This component:
 * 1. Shows the current month by default
 * 2. Lets the user move to previous / next months
 * 3. Shows weekday labels
 * 4. Builds the calendar grid dynamically
 * 5. Highlights today's date
 * 6. Highlights the selected date
 * 7. Disables past dates
 *
 * Props:
 *   selectedDate  – Date object controlled by the parent component
 *   onDateSelect  – callback function that receives the selected Date
 */

import React, { useState } from 'react';
import './BookingCalendar.css';

/*
   WEEKDAY LABELS

   These appear at the top of the calendar grid.
   The calendar starts from Monday.
*/
const DAYS = ['m', 't', 'w', 't', 'f', 's', 's'];

/*
   MONTH NAMES

   Used to display the current visible month in the header.
*/
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/*
   GET DAYS IN MONTH

   Returns how many days exist in the selected month.
   Example: February may return 28 or 29.
*/
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/*
   GET FIRST DAY OF MONTH

   Finds which weekday the month starts on.
   JavaScript getDay() returns:
   0 = Sunday, 1 = Monday, ... 6 = Saturday

   This function converts it so:
   Monday = 0, Tuesday = 1, ... Sunday = 6
*/
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const BookingCalendar = ({ selectedDate, onDateSelect }) => {
  /*
     TODAY

     Used to set the default calendar month
     and to detect today / past dates.
  */
  const today = new Date();

  /*
     CALENDAR VIEW STATE

     viewYear controls the year currently shown.
     viewMonth controls the month currently shown.
  */
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  /*
     MONTH CALCULATIONS

     daysInMonth: number of days in the visible month.
     firstDayIndex: how many empty cells appear before day 1.
  */
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfMonth(viewYear, viewMonth);

  /*
     PREVIOUS MONTH

     If current month is January, it moves to December
     and decreases the year by 1.
  */
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  /*
     NEXT MONTH

     If current month is December, it moves to January
     and increases the year by 1.
  */
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  /*
     CHECK SELECTED DATE

     Returns true if the day matches the selected date
     from the parent component.
  */
  const isSelected = (day) => {
    return (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  /*
     CHECK TODAY

     Returns true if the day is today's real date.
  */
  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  /*
     CHECK PAST DATE

     Returns true if the day is before today.
     Past dates are disabled and cannot be selected.
  */
  const isPast = (day) => {
    return (
      new Date(viewYear, viewMonth, day) <
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  };

  /*
     CALENDAR CELLS

     Builds the full grid:
     1. Empty cells before day 1
     2. Actual day numbers of the month
  */
  const cells = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bc">
      {/* 
         MONTH HEADER

         Shows previous button, month name, and next button.
      */}
      <div className="bc__header">
        <button
          className="bc__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>

        <span className="bc__month-label">{MONTHS[viewMonth]}</span>

        <button
          className="bc__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* 
         WEEKDAY HEADERS

         Shows m, t, w, t, f, s, s.
      */}
      <div className="bc__weekdays">
        {DAYS.map((d, i) => (
          <span key={i} className="bc__weekday">
            {d}
          </span>
        ))}
      </div>

      {/* 
         DAY GRID

         Shows empty cells first, then clickable day buttons.
      */}
      <div className="bc__grid">
        {cells.map((day, i) =>
          day === null ? (
            /*
               EMPTY CELL

               Used to align day 1 under the correct weekday.
            */
            <span key={`blank-${i}`} className="bc__cell bc__cell--blank" />
          ) : (
            /*
               DAY BUTTON

               Can be selected unless it is a past date.
               Classes change depending on selected / today / past state.
            */
            <button
              key={day}
              className={[
                'bc__cell',
                isSelected(day) ? 'bc__cell--selected' : '',
                isToday(day) && !isSelected(day) ? 'bc__cell--today' : '',
                isPast(day) ? 'bc__cell--past' : '',
              ].join(' ')}
              onClick={() =>
                !isPast(day) && onDateSelect(new Date(viewYear, viewMonth, day))
              }
              disabled={isPast(day)}
              aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
            >
              {String(day).padStart(2, '0')}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;