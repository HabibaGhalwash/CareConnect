/*
 * ChildInfoForm.jsx
 *
 * Right-side form for the Child Info page.
 * Fields:
 *  - Child's Name
 *  - Date of Birth  (with calendar icon)
 *  - Gender         (Female / Male radio)
 *  - Special Need Type (dropdown)
 *  - Specific Needs or Interests (textarea)
 *  - Add another child link
 *  - Complete Registration button
 *  - Skip for now link
 *
 * Props:
 *   onComplete  – callback when form is submitted
 *   onSkip      – callback for "skip for now"
 */

// ── Imports ────────────────────────────────────────────────────────────────
// axios handles all HTTP requests to the backend API
import axios from 'axios';

// Icons used inside the form (calendar, add child, success, remove child)
import {
  CalendarDays,
  CirclePlus,
  PartyPopper,
  Trash2,
} from 'lucide-react';

// React core + hooks: useRef to access date inputs, useState for form data
import React, { useRef, useState } from 'react';

// Base URL for all backend API calls
import { API_BASE } from '../../services/api';

// Component styles
import './ChildInfoForm.css';


// ── Default empty child object ──────────────────────────────────────────────
// Used as the starting template whenever a new child entry is created.
// Spread with { ...EMPTY_CHILD } so each child gets its own independent copy.
const EMPTY_CHILD = {
  name: '',
  dob: '',
  gender: 'female',
  specialNeeds: [],
  extradetails: '',
};

const ChildInfoForm = ({ onComplete = () => { }, onSkip = () => { } }) => {

  // ── State ──────────────────────────────────────────────────────────────────
  // children: array of child objects — starts with one empty child
  // submitted: switches the form to the success screen after registration
  // dateInputRefs: array of refs pointing to each date <input> (used to open the picker programmatically)
  // specialNeedsOptions: list of special need types fetched from the backend
  const [children, setChildren] = useState([{ ...EMPTY_CHILD }]);
  const [submitted, setSubmitted] = useState(false);
  const dateInputRefs = useRef([]);
  const [specialNeedsOptions, setSpecialNeedsOptions] = useState([]);

  // ── Fetch special needs list from backend on mount ─────────────────────────
  // Runs once when the component first loads.
  // Populates the checkbox group under "SPECIAL NEED TYPE".
  // Falls back to an empty array if the request fails.
  React.useEffect(() => {
    axios
      .get(`${API_BASE}/modules/special_need_type/special_need_type`)
      .then((res) => {
        // Ensure we`re setting an array
        const data = Array.isArray(res.data) ? res.data : [];
        setSpecialNeedsOptions(data);
      })
      .catch((err) => {
        console.error('Error fetching special needs:', err);
        setSpecialNeedsOptions([]);
      });
  }, []);


  // ── toggleSpecialNeed ──────────────────────────────────────────────────────
  // Adds or removes a special need ID from a specific child's specialNeeds array.
  // Called every time a checkbox in the "SPECIAL NEED TYPE" group is clicked.
  // idx = which child, value = the SNT_ID of the option ticked/unticked.
  const toggleSpecialNeed = (idx, value) => {
    setChildren((prev) =>
      prev.map((child, i) => {
        if (i !== idx) return child;

        const exists = child.specialNeeds.includes(value);

        return {
          ...child,
          specialNeeds: exists
            ? child.specialNeeds.filter((v) => v !== value)
            : [...child.specialNeeds, value],
        };
      })
    );
  };

  // ── setField ───────────────────────────────────────────────────────────────
  // Generic field updater — returns an onChange handler for any text input or textarea.
  // idx = which child, field = the key to update (e.g. 'name', 'dob', 'extradetails').
  const setField = (idx, field) => (e) => {
    setChildren((prev) =>
      prev.map((child, i) =>
        i === idx ? { ...child, [field]: e.target.value } : child
      )
    );
  };

  // ── setGender ─────────────────────────────────────────────────────────────
  // Updates the gender value for a specific child when a radio button is selected.
  const setGender = (idx, gender) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === idx ? { ...child, gender } : child))
    );
  };

  // ── addChild ──────────────────────────────────────────────────────────────
  // Appends a fresh empty child block to the form when "Add another child" is clicked.
  const addChild = () => {
    setChildren((prev) => [...prev, { ...EMPTY_CHILD }]);
  };

  // ── removeChild ───────────────────────────────────────────────────────────
  // Removes a specific child block by index.
  // The remove button only appears when there are 2 or more children.
  const removeChild = (idx) => {
    setChildren((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── openDatePicker ────────────────────────────────────────────────────────
  // Programmatically opens the browser's native date picker for a given child.
  // Triggered by clicking the calendar icon button next to the date input.
  const openDatePicker = (idx) => {
    const input = dateInputRefs.current[idx];
    if (input?.showPicker) input.showPicker();
    input?.focus();
  };

  // ── handleSubmit ──────────────────────────────────────────────────────────
  // Runs when the parent clicks "Complete Registration".
  // Step 1: Reads the parent's ID from localStorage (saved during signup).
  // Step 2: Loops through each child and POSTs it to the backend.
  // Step 3: For each child that has special needs selected, links them via a second POST.
  // Step 4: On success, flips submitted=true (shows the success screen) and calls onComplete.
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get parent ID from localStorage
      const parentData = localStorage.getItem('parent');
      console.log('📦 Parent data from localStorage:', parentData);

      if (!parentData) {
        console.error('❌ Parent information not found.');
        return;
      }

      const parent = JSON.parse(parentData);
      const parentId = parent.P_ID;

      console.log('👤 Parent ID extracted:', parentId);

      if (!parentId) {
        console.error('❌ Parent ID not found.');
        return;
      }

      // Save each child to the backend
      for (const child of children) {
        console.log(`➕ Saving child: ${child.name} with Parent ID: ${parentId}`);

        /* STEP 1: INSERT CHILD */
        let childId = null;
        try {
          const res = await axios.post(
            `${API_BASE}/modules/child/child`,
            {
              Full_Name: child.name,
              DOB: child.dob,
              Gender: child.gender,
              Extra_Details: child.extradetails,
              P_ID: parentId,
            },
            {
              headers: { 'Content-Type': 'application/json' }
            }
          );

          console.log('✅ Child created response:', res.data);

          if (res.data && res.data.Status === 'OK' && res.data.Child_ID) {
            childId = res.data.Child_ID;
            console.log(`✅ Child saved with ID: ${childId}`);
          }
          else {
            throw new Error(`Invalid response from server: ${JSON.stringify(res.data)}`);
          }
        } catch (err) {
          const errorMsg = err.response?.data?.Message || err.message || 'Failed to save child';
          console.error('❌ Child creation error:', errorMsg);
          return;
        }

        /* STEP 2: INSERT SPECIAL NEEDS FOR THIS CHILD */
        if (child.specialNeeds.length > 0) {
          try {
            console.log(`🔗 Linking special needs for child ${childId}:`, child.specialNeeds);

            const snRes = await axios.post(
              `${API_BASE}/modules/child_sn/child_sn`,
              {
                Child_ID: childId,
                specialNeeds: child.specialNeeds,
              },
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );

            console.log('✅ Special needs linked:', snRes.data);
          } catch (snErr) {
            const errorMsg = snErr.response?.data?.Message || snErr.message || 'Failed to link special needs';
            console.error('❌ Special needs error:', errorMsg);
          }
        }
      }

      console.log('✅ All children registered successfully');
      setSubmitted(true);
      onComplete(children);
    } catch (err) {
      console.error('❌ Unexpected error saving child data:', err);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  // Replaces the entire form once submitted=true.
  // Shows a party popper icon, a congratulations title, and a welcome message.
  if (submitted) {
    return (
      <div className="cif__success">
        <span className="cif__success-icon" aria-hidden="true">
          <PartyPopper size={32} strokeWidth={2.2} />
        </span>
        <h3 className="cif__success-title">You're all set!</h3>
        <p>Welcome to CareConnect. Let's find the right support for your child.</p>
      </div>
    );
  }


  // ── Render ─────────────────────────────────────────────────────────────────
  // Renders the full form: title → one block per child → add child → submit → skip.
  return (
    <form className="cif" onSubmit={handleSubmit} noValidate>

      {/* Page heading for the right panel */}
      <h2 className="cif__title">Tell us about your child</h2>

      {/* ── One block per child ──────────────────────────────────────────────
          Maps over the children array and renders a complete set of fields
          for each child. idx tracks which child is being edited. */}
      {children.map((child, idx) => (
        <div key={idx} className="cif__child-block">

          {/* Remove button — only shown when there are 2 or more children */}
          {children.length > 1 && (
            <div className="cif__child-header">
              <span className="cif__child-num">Child {idx + 1}</span>
              <button
                type="button"
                className="cif__remove-btn"
                onClick={() => removeChild(idx)}
                aria-label={`Remove child ${idx + 1}`}
              >
                <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
                Remove
              </button>
            </div>
          )}

          {/* ── Child's Name field ─────────────────────────────────────────── */}
          <div className="cif__field">
            <label className="cif__label">CHILD'S NAME</label>
            <input
              type="text"
              className="cif__input"
              placeholder="Enter name"
              value={child.name}
              onChange={setField(idx, 'name')}
              required
            />
          </div>

          {/* ── Date of Birth field ────────────────────────────────────────────
              The native date input is hidden behind a custom calendar icon button.
              Clicking the icon calls openDatePicker() to trigger the browser picker. */}
          <div className="cif__field">
            <label className="cif__label">DATE OF BIRTH</label>
            <div className="cif__date-wrap">
              <input
                type="date"
                className="cif__input cif__input--date"
                placeholder="Enter Date Of Birth"
                value={child.dob}
                onChange={setField(idx, 'dob')}
                ref={(el) => {
                  dateInputRefs.current[idx] = el;
                }}
                required
              />
              <button
                type="button"
                className="cif__date-icon"
                onClick={() => openDatePicker(idx)}
                aria-label={`Open date picker for child ${idx + 1}`}
              >
                <CalendarDays size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* ── Gender field ───────────────────────────────────────────────────
              Two custom radio buttons (Female / Male).
              The native radio input is hidden; a styled circle + dot replaces it. */}
          <div className="cif__field">
            <label className="cif__label">GENDER</label>
            <div className="cif__radio-row">
              <label className="cif__radio-label">
                <input
                  type="radio"
                  name={`gender-${idx}`}
                  value="female"
                  checked={child.gender === 'female'}
                  onChange={() => setGender(idx, 'female')}
                  className="cif__radio-input"
                />
                <span className="cif__radio-circle">
                  {child.gender === 'female' && <span className="cif__radio-dot" />}
                </span>
                <span className="cif__radio-text">Female</span>
              </label>

              <label className="cif__radio-label">
                <input
                  type="radio"
                  name={`gender-${idx}`}
                  value="male"
                  checked={child.gender === 'male'}
                  onChange={() => setGender(idx, 'male')}
                  className="cif__radio-input"
                />
                <span className="cif__radio-circle cif__radio-circle--empty">
                  {child.gender === 'male' && <span className="cif__radio-dot" />}
                </span>
                <span className="cif__radio-text">Male</span>
              </label>
            </div>
          </div>

          {/* ── Special Need Type field ────────────────────────────────────────
              Renders a checkbox for each option fetched from the backend.
              Multiple options can be selected at once (stored as an array of IDs). */}
          <div className="cif__field">
            <label className="cif__label">SPECIAL NEED TYPE</label>
            <div className="cif__select-wrap">

              <div className="cif__checkbox-group">
                {Array.isArray(specialNeedsOptions) && specialNeedsOptions.map((s) => (
                  <label key={s.SNT_ID} className="cif__checkbox-label">
                    <input
                      type="checkbox"
                      className="cif__checkbox-input"
                      checked={child.specialNeeds.includes(s.SNT_ID)}
                      onChange={() => toggleSpecialNeed(idx, s.SNT_ID)}
                    />
                    <span className="cif__checkbox-box" />
                    {typeof s.Special_Need_Types === 'string' ? s.Special_Need_Types : ''}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Extra Details textarea ─────────────────────────────────────────
              Free-text field for the parent to add anything extra about the child
              e.g. allergies, sensory sensitivities, favourite activities. */}
          <div className="cif__field">
            <label className="cif__label">EXTRA DETAILS</label>
            <textarea
              className="cif__input cif__textarea"
              placeholder="e.g. Sensory sensitivities, loves music, allergic to peanuts..."
              value={child.extradetails}
              onChange={setField(idx, 'extradetails')}
              rows={3}
            />
          </div>

        </div>
      ))}

      {/* ── Add another child button ───────────────────────────────────────────
          Appends a new empty child block above the submit button. */}
      <button
        type="button"
        className="cif__add-child"
        onClick={addChild}
      >
        <span className="cif__add-child-icon" aria-hidden="true">
          <CirclePlus size={18} strokeWidth={2.2} />
        </span>
        Add another child
      </button>

      {/* ── Complete Registration button ───────────────────────────────────────
          Primary submit button — triggers handleSubmit, saves all children,
          and redirects the parent to checkout or home. */}
      <button type="submit" className="cif__submit">
        Complete Registration
      </button>

      {/* ── Skip for now link ──────────────────────────────────────────────────
          Lets the parent skip adding children and go straight to the home page.
          Still marks them as logged in via handleSkip in ChildInfo.jsx. */}
      <button
        type="button"
        className="cif__skip"
        onClick={onSkip}
      >
        Skip for now, I'll add details later
      </button>
    </form>
  );
};

export default ChildInfoForm;