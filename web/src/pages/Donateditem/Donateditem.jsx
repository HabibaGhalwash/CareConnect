/*
 * DonatedItem.jsx — CareConnect Donated Item Details Page
 *
 * This page displays one selected donation item.
 * It includes:
 * 1. Navbar
 * 2. Item loading by route state, sessionStorage, or URL ID
 * 3. Loading state
 * 4. Back button
 * 5. Item image and details
 * 6. Confirm item selection
 * 7. Owner contact number
 * 8. Optional shipping address input
 * 9. Mobile WebView close handling
 * 10. Footer
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../../services/api";
import { useLocation, useNavigate } from "react-router-dom";

import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

import "./Donateditem.css";

const DonatedItem = () => {
  /*
     PAGE STATES

     address stores the optional shipping address typed by the user.
     confirmed controls whether the item was selected successfully.
     selecting controls the loading state while confirming selection.
     itemFromApi stores item data fetched by ID if needed.
     loading controls the item loading screen.
  */
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [itemFromApi, setItemFromApi] = useState(null);
  const [loading, setLoading] = useState(false);

  /*
     ROUTING

     location reads data passed through route state or URL query.
     navigate moves the user back to the donation page.
  */
  const location = useLocation();
  const navigate = useNavigate();

  /*
     URL ITEM ID

     Gets item ID from URL query params.
     This is useful for mobile or direct links.
  */
  const queryParams = new URLSearchParams(location.search);
  const itemIdFromUrl = queryParams.get('id');

  /*
     ROUTE STATE ITEM

     Gets item data passed from the donation listing page.
  */
  const itemFromState = location.state?.item;

  /*
     SESSION STORAGE FALLBACK

     Tries to load the selected donation item from sessionStorage.
     This helps if the page refreshes.
  */
  let itemFromStorage = null;

  try {
    const stored = sessionStorage.getItem("selectedDonationItem");

    if (stored) {
      itemFromStorage = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error parsing storage:", e);
  }

  /*
     FETCH ITEM BY ID

     If there is no route state item but there is an ID in the URL,
     fetch the item from the backend.
  */
  useEffect(() => {
    if (!itemFromState && itemIdFromUrl) {
      const fetchItem = async () => {
        try {
          setLoading(true);

          const res = await axios.get(
            `${API_BASE}/modules/market_place/market_place?id=${itemIdFromUrl}`
          );

          if (res.data && res.data.length > 0) {
            setItemFromApi(res.data[0]);
          }
        } catch (err) {
          console.error("Error fetching item by ID:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchItem();
    }
  }, [itemFromState, itemIdFromUrl]);

  /*
     DISPLAY ITEM

     Chooses the best available source for the item:
     1. Route state
     2. API fetch
     3. sessionStorage
     4. Default fallback object
  */
  const displayItem =
    itemFromState ||
    itemFromApi ||
    itemFromStorage || {
      M_ID: null,
      Item_Name: "No Item Selected",
      Description: "Please select an item from the donation center.",
      Years: "N/A",
      Conditions: "N/A",
      Phone: "N/A",
      Image: null,
    };

  /*
     LOADING VIEW

     Shows while fetching item details from backend.
  */
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#F6F2EE',
        }}
      >
        <h2 style={{ color: '#9D64AA' }}>Loading Item Details...</h2>
      </div>
    );
  }

  /*
     CONFIRM ITEM SELECTION

     Updates the item status to Taken in the backend.
     Then removes it from sessionStorage.
     On mobile WebView, closes the popup.
     On web, returns to Donation page.
  */
  const handleConfirm = async () => {
    if (!displayItem.M_ID) {
      alert("No item selected.");
      return;
    }

    try {
      setSelecting(true);

      /*
         FORM DATA

         Backend expects multipart/form-data with all item fields,
         so the existing item data is sent again with Status = Taken.
      */
      const formData = new FormData();

      formData.append("Item_Name", displayItem.Item_Name || "");
      formData.append("Description", displayItem.Description || "");
      formData.append("Years", displayItem.Years || "Not specified");
      formData.append("Conditions", displayItem.Conditions || "");
      formData.append("Phone", displayItem.Phone || "");
      formData.append("Status", "Taken");
      formData.append("P_ID", displayItem.P_ID || 0);

      await axios.put(
        `${API_BASE}/modules/market_place/market_place?id=${displayItem.M_ID}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setConfirmed(true);
      sessionStorage.removeItem("selectedDonationItem");

      /*
         MOBILE WEBVIEW BEHAVIOR

         If opened inside the mobile app WebView,
         notify React Native to close the popup.
      */
      if (window.ReactNativeWebView) {
        setSelecting(false);

        window.ReactNativeWebView.postMessage(
          JSON.stringify({ action: "close" })
        );

        return;
      }

      /*
         WEB BEHAVIOR

         Returns to the Donation Center after a short delay.
      */
      setTimeout(() => {
        navigate("/Donation");
      }, 800);
    } catch (err) {
      console.error("Error confirming item selection:", err);
      alert("Failed to confirm selection. Please try again.");
    } finally {
      setSelecting(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="donated-item-page">
        <div className="donated-item__container">
          {/* Back button */}
          <button
            onClick={() => navigate("/Donation")}
            className="donated-item__back-btn"
          >
            ← Back to Donation Center
          </button>

          {/* Main item card */}
          <div className="donated-item__card">
            {/* Item image */}
            <div className="donated-item__image-wrapper">
              <img
                src={
                  displayItem.Image
                    ? `${API_BASE}/images/${displayItem.Image}`
                    : ''
                }
                alt={displayItem.Item_Name}
                className="donated-item__image"
              />
            </div>

            {/* Item details */}
            <div className="donated-item__details">
              <h2 className="donated-item__name">
                {displayItem.Item_Name}
              </h2>

              <p className="donated-item__description">
                {displayItem.Description}
              </p>

              <p className="donated-item__usage">
                <strong>Condition: {displayItem.Conditions}</strong>
              </p>

              <p className="donated-item__usage">
                <strong>Duration: {displayItem.Years}</strong>
              </p>

              {/* Confirm selection button */}
              <button
                className={`donated-item__confirm-btn ${confirmed ? "donated-item__confirm-btn--confirmed" : ""
                  }`}
                onClick={handleConfirm}
                disabled={confirmed || selecting}
              >
                {selecting
                  ? "Selecting..."
                  : confirmed
                    ? "Item Selected ✓"
                    : "Confirm Item Selection"}
              </button>
            </div>
          </div>

          {/* Contact and shipping row */}
          <div className="donated-item__footer-row">
            {/* Owner phone number */}
            <p className="donated-item__contact">
              <span className="donated-item__contact-label">
                Contact Owner For Item Collection:
              </span>{" "}
              {displayItem.Phone}
            </p>

            {/* Optional shipping address */}
            <div className="donated-item__shipping">
              <label
                className="donated-item__shipping-label"
                htmlFor="address-input"
              >
                To Ship it to you:
              </label>

              <input
                id="address-input"
                type="text"
                className="donated-item__address-input"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default DonatedItem;