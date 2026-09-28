/*
 * DonateItemForm.jsx — CareConnect Donate Item Form
 *
 * This page is used by parents to create or edit donation listings.
 * It includes:
 * 1. Navbar
 * 2. Back button
 * 3. Create / edit mode detection
 * 4. Form state
 * 5. Image upload and preview
 * 6. Validation
 * 7. Backend submit logic
 * 8. Mobile WebView close handling
 * 9. Success screen
 * 10. Footer
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// eslint-disable-next-line no-unused-vars
import axios from "axios";
import { API_BASE } from "../../services/api";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./DonateItemForm.css";

/*
   CONDITION OPTIONS

   These are the available condition values in the dropdown.
*/
const CONDITION_OPTIONS = [
  "Still New",
  "Like New",
  "Good Condition",
  "Fair Condition",
  "Needs Repair",
];

const DonateItemForm = () => {
  /*
     ROUTING

     navigate moves the user between pages.
     location reads data passed from another page, such as editItem.
  */
  const navigate = useNavigate();
  const location = useLocation();

  /*
     FILE INPUT REF

     Used to trigger the hidden file input when clicking the upload area.
  */
  const fileInputRef = useRef(null);

  /*
     EDIT MODE CHECK

     If editItem exists in route state, the form works as an edit form.
     Otherwise, it works as a new donation form.
  */
  const editItem = location.state?.editItem;
  const isEdit = !!editItem;

  /*
     FORM STATE

     Stores all form fields.
     If editing, fields are pre-filled with the selected item data.
  */
  const [form, setForm] = useState({
    itemName: editItem?.Item_Name || "",
    condition: editItem?.Conditions || "",
    yearsOfUse: editItem?.Years || "",
    description: editItem?.Description || "",
    ownerPhone: editItem?.Phone?.toString() || "",
    imageFile: null,
    imagePreview: editItem?.Image
      ? `${API_BASE}/images/${editItem.Image}`
      : null,
  });

  /*
     FORM STATUS STATES

     errors stores validation or submit errors.
     submitted controls the success screen.
     submitting disables buttons while saving.
  */
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /*
     INITIAL PAGE SETUP

     1. Reads parent data from URL for mobile WebView usage.
     2. Saves parent data into localStorage if received.
     3. Tests backend connection.
  */
  useEffect(() => {
    /*
       MOBILE AUTH BRIDGE

       If parent data is passed through the URL,
       it gets saved into localStorage.
    */
    const queryParams = new URLSearchParams(window.location.search);
    const parentDataParam = queryParams.get('parentData');

    if (parentDataParam) {
      try {
        const decodedData = decodeURIComponent(parentDataParam);
        localStorage.setItem('parent', decodedData);
        console.log('📱 Mobile Auth Bridge: Parent data synchronized from URL');
      } catch (e) {
        console.error('Failed to parse parent data from URL:', e);
      }
    }

    /*
       BACKEND CONNECTION TEST

       Checks if the marketplace endpoint is reachable.
    */
    const testBackend = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/modules/market_place/market_place`,
          {
            timeout: 5000,
          }
        );

        console.log('✓ Backend connection successful!', response.data);
      } catch (error) {
        console.warn(
          '⚠ Backend not responding. Make sure the backend server is running.'
        );
        console.error('Backend error:', error.message);
      }
    };

    testBackend();
  }, []);

  /*
     HANDLE INPUT CHANGE

     Updates the matching form field when the user types.
     Also clears that field's error if it already exists.
  */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  /*
     HANDLE IMAGE CHANGE

     Saves the selected image file.
     Creates a temporary preview URL to show the image before upload.
  */
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
    }));

    if (errors.imageFile) {
      setErrors((prev) => ({ ...prev, imageFile: "" }));
    }
  };

  /*
     VALIDATE FORM

     Checks required fields before submitting:
     1. Item name
     2. Condition
     3. Description
     4. Phone number
     5. Image for new items only
  */
  const validate = () => {
    const newErrors = {};

    if (!form.itemName.trim()) {
      newErrors.itemName = "Item name is required.";
    }

    if (!form.condition) {
      newErrors.condition = "Please select the condition.";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required.";
    }

    if (!form.ownerPhone.trim()) {
      newErrors.ownerPhone = "Phone number is required.";
    } else if (
      !/^[0-9]{7,15}$/.test(
        form.ownerPhone.trim().replace(/[\s()+-]/g, "")
      )
    ) {
      newErrors.ownerPhone = "Enter a valid phone number (digits only).";
    }

    /*
       IMAGE VALIDATION

       Image is required for new items.
       For edits, the old image can stay if no new image is uploaded.
    */
    if (!isEdit && !form.imageFile) {
      newErrors.imageFile = "Please upload a photo of the item.";
    }

    return newErrors;
  };

  /*
     HANDLE SUBMIT

     Validates the form.
     Gets the logged-in parent ID.
     Builds FormData.
     Sends POST request for new items or PUT request for edited items.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      const firstErrorKey = Object.keys(validationErrors)[0];

      document
        .getElementById(firstErrorKey)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }

    setSubmitting(true);

    try {
      /*
         GET LOGGED-IN PARENT

         Login.jsx stores parent data in localStorage under "parent".
      */
      const storedParent = localStorage.getItem('parent');

      if (!storedParent) {
        setErrors({ submit: "You must be logged in to donate an item." });
        setSubmitting(false);
        return;
      }

      const parentData = JSON.parse(storedParent);
      const P_ID = parentData.P_ID;

      if (!P_ID) {
        setErrors({
          submit: "Could not retrieve your parent ID. Please log in again.",
        });
        setSubmitting(false);
        return;
      }

      console.log('Logged-in parent P_ID:', P_ID);

      /*
         PREPARE FORM DATA

         FormData is used because the request may include an image file.
      */
      const formData = new FormData();

      formData.append('Item_Name', form.itemName);
      formData.append('Description', form.description);
      formData.append('Years', form.yearsOfUse || "Not specified");
      formData.append('Conditions', form.condition);

      /*
         PHONE NUMBER

         Removes spaces and symbols, then saves only digits.
      */
      const phoneDigits = parseInt(
        form.ownerPhone.trim().replace(/[\s()+-]/g, ''),
        10
      );

      formData.append('Phone', phoneDigits);

      /*
         IMAGE FILE

         Added only if user selected a new image.
      */
      if (form.imageFile) {
        formData.append('image', form.imageFile);
      }

      /*
         STATUS AND PARENT ID

         New items start as Pending.
         Edited items keep their current status.
      */
      formData.append('Status', isEdit ? editItem.Status : "Pending");
      formData.append('P_ID', P_ID);

      if (isEdit) {
        /*
           UPDATE EXISTING ITEM

           Sends PUT request using the existing marketplace item ID.
        */
        await axios.put(
          `${API_BASE}/modules/market_place/market_place?id=${editItem.M_ID}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000,
          }
        );

        alert("Item updated successfully!");
      } else {
        /*
           CREATE NEW ITEM

           Creates a simple generated M_ID before sending the POST request.
        */
        const M_ID =
          Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

        formData.append('M_ID', M_ID);

        await axios.post(
          `${API_BASE}/modules/market_place/market_place`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000,
          }
        );
      }

      console.log('✓ Success! Item saved.');
      setSubmitted(true);

      /*
         MOBILE WEBVIEW BEHAVIOR

         If this form is opened inside React Native WebView,
         it sends a close message to the mobile app and stops web navigation.
      */
      if (window.ReactNativeWebView) {
        setSubmitting(false);

        window.ReactNativeWebView.postMessage(
          JSON.stringify({ action: "close" })
        );

        return;
      }

      /*
         WEB BEHAVIOR

         On web, return to the donation list after a short delay.
      */
      setTimeout(() => {
        navigate("/Donation");
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting donation:');
      console.error('Full error:', error);

      let errorMsg = "Failed to submit donation.";

      /*
         SERVER ERROR

         Backend responded with an error status.
      */
      if (error.response) {
        console.error('❌ Server responded with error:');
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);

        errorMsg =
          error.response.data?.Message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      }

      /*
         NETWORK / NO RESPONSE ERROR

         Request was sent, but backend did not respond.
      */
      else if (error.request) {
        console.error('❌ No response from backend. Request made but no reply:');
        console.error('Request:', error.request);

        errorMsg =
          "No response from backend. Please check your connection and ensure the server is running.";
      }

      /*
         REQUEST SETUP ERROR

         Something failed before sending the request.
      */
      else {
        console.error('❌ Error setting up request:', error.message);
        errorMsg = error.message;
      }

      console.error('Final error message:', errorMsg);

      setErrors({ submit: errorMsg });
      alert(`Error: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  /*
     SUCCESS VIEW

     Shows after the donation item is submitted successfully.
  */
  if (submitted) {
    return (
      <>
        <Navbar />

        <div className="donate-form-page">
          <div className="donate-form__container">
            <div className="donate-form__success">
              <div className="donate-form__success-icon">✓</div>

              <h2 className="donate-form__success-title">Thank You!</h2>

              <p className="donate-form__success-msg">
                Your donation listing for <strong>{form.itemName}</strong> has
                been submitted. An admin will review and confirm it shortly.
                Once approved, it will appear on the Donation Center.
              </p>

              <button
                className="donate-form__success-btn"
                onClick={() => navigate("/Donation")}
              >
                Back to Donation Center
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="donate-form-page">
        <div className="donate-form__container">
          {/* Back button */}
          <button
            className="donate-form__back-btn"
            onClick={() => navigate("/Donation")}
          >
            ← Back to Donation Center
          </button>

          {/* Page header */}
          <div className="donate-form__header">
            <h1 className="donate-form__title">
              {isEdit ? "Update Your Item" : "Donate an Item"}
            </h1>

            <p className="donate-form__subtitle">
              {isEdit
                ? "Update the details of your listing below."
                : "Fill in the details below so families in need can find your item."}
              All fields marked{" "}
              <span className="donate-form__required-star">*</span> are
              required.
            </p>
          </div>

          {/* Donation form */}
          <form
            className="donate-form__form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Submit error message */}
            {errors.submit && (
              <div
                style={{
                  background: '#fff8f9',
                  border: '1px solid #c0547a',
                  color: '#c0547a',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {errors.submit}
              </div>
            )}

            {/* Item details section */}
            <div className="donate-form__section">
              <h2 className="donate-form__section-title">Item Details</h2>

              {/* Item name and phone row */}
              <div className="donate-form__row">
                <div className="donate-form__field">
                  <label className="donate-form__label" htmlFor="itemName">
                    Item Name{" "}
                    <span className="donate-form__required-star">*</span>
                  </label>

                  <input
                    id="itemName"
                    name="itemName"
                    type="text"
                    className={`donate-form__input ${errors.itemName ? "donate-form__input--error" : ""
                      }`}
                    placeholder="e.g. Wheelchair, Hearing Aid"
                    value={form.itemName}
                    onChange={handleChange}
                  />

                  {errors.itemName && (
                    <p className="donate-form__error">{errors.itemName}</p>
                  )}
                </div>

                <div className="donate-form__field">
                  <label className="donate-form__label" htmlFor="ownerPhone">
                    Phone Number{" "}
                    <span className="donate-form__required-star">*</span>
                  </label>

                  <input
                    id="ownerPhone"
                    name="ownerPhone"
                    type="tel"
                    className={`donate-form__input ${errors.ownerPhone ? "donate-form__input--error" : ""
                      }`}
                    placeholder="e.g. 01001234567"
                    value={form.ownerPhone}
                    onChange={handleChange}
                  />

                  {errors.ownerPhone && (
                    <p className="donate-form__error">{errors.ownerPhone}</p>
                  )}
                </div>
              </div>

              {/* Condition and years of use row */}
              <div className="donate-form__row">
                <div className="donate-form__field">
                  <label className="donate-form__label" htmlFor="condition">
                    Condition{" "}
                    <span className="donate-form__required-star">*</span>
                  </label>

                  <select
                    id="condition"
                    name="condition"
                    className={`donate-form__input donate-form__select ${errors.condition ? "donate-form__input--error" : ""
                      }`}
                    value={form.condition}
                    onChange={handleChange}
                  >
                    <option value="">Select condition</option>

                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {errors.condition && (
                    <p className="donate-form__error">{errors.condition}</p>
                  )}
                </div>

                <div className="donate-form__field">
                  <label className="donate-form__label" htmlFor="yearsOfUse">
                    Years / Duration of Use
                  </label>

                  <input
                    id="yearsOfUse"
                    name="yearsOfUse"
                    type="text"
                    className="donate-form__input"
                    placeholder="e.g. 2 years, 6 months"
                    value={form.yearsOfUse}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Description field */}
              <div className="donate-form__field">
                <label className="donate-form__label" htmlFor="description">
                  Description{" "}
                  <span className="donate-form__required-star">*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={`donate-form__input donate-form__textarea ${errors.description ? "donate-form__input--error" : ""
                    }`}
                  placeholder="Describe the item's condition, any features, or anything a recipient should know..."
                  value={form.description}
                  onChange={handleChange}
                />

                {errors.description && (
                  <p className="donate-form__error">{errors.description}</p>
                )}
              </div>

              {/* Image upload */}
              <div className="donate-form__field">
                <label className="donate-form__label">
                  Item Photo{" "}
                  <span className="donate-form__required-star">*</span>
                </label>

                <div
                  className={`donate-form__upload-zone ${errors.imageFile ? "donate-form__upload-zone--error" : ""
                    } ${form.imagePreview
                      ? "donate-form__upload-zone--has-image"
                      : ""
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.imagePreview ? (
                    <img
                      src={form.imagePreview}
                      alt="Preview"
                      className="donate-form__image-preview"
                    />
                  ) : (
                    <div className="donate-form__upload-placeholder">
                      <span className="donate-form__upload-icon">📷</span>

                      <p className="donate-form__upload-text">
                        Click to upload a photo
                      </p>

                      <p className="donate-form__upload-hint">
                        PNG, JPG or WEBP · Max 10MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                </div>

                {/* Remove selected image */}
                {form.imagePreview && (
                  <button
                    type="button"
                    className="donate-form__remove-image"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        imageFile: null,
                        imagePreview: null,
                      }))
                    }
                  >
                    Remove photo
                  </button>
                )}

                {errors.imageFile && (
                  <p className="donate-form__error">{errors.imageFile}</p>
                )}
              </div>
            </div>

            {/* Form action buttons */}
            <div className="donate-form__actions">
              <button
                type="button"
                className="donate-form__cancel-btn"
                onClick={() => navigate("/Donation")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="donate-form__submit-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : isEdit
                    ? "Save Changes"
                    : "Submit Donation"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default DonateItemForm;