/*
 * Donation.jsx — CareConnect Donation Center Page
 *
 * This page displays donation items from the backend.
 * It includes:
 * 1. Navbar
 * 2. Donation Center title
 * 3. Manage My Donations toggle
 * 4. Donate item banner
 * 5. Search bar
 * 6. Loading and error states
 * 7. My donations management view
 * 8. General donation gallery
 * 9. Pagination
 * 10. Footer
 */

import axios from "axios";
import { API_BASE } from "../../services/api";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import DonationCard from "../../components/Donationcard/Donationcard";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";

import "./Donation.css";

/*
   ITEMS PER PAGE

   Controls how many donation items appear on each gallery page.
*/
const ITEMS_PER_PAGE = 6;

const Donation = () => {
  /*
     MAIN DATA STATES

     allItems stores active donation items shown in the public gallery.
     myItems stores donation listings created by the current parent.
  */
  const [allItems, setAllItems] = useState([]);
  const [myItems, setMyItems] = useState([]);

  /*
     PAGINATION STATE

     currentPage controls which donation gallery page is visible.
  */
  const [currentPage, setCurrentPage] = useState(1);

  /*
     LOADING AND ERROR STATES

     loading shows loading text while fetching data.
     error stores any backend loading error.
  */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
     VIEW AND SEARCH STATES

     showMyDonations switches between:
     1. Public donation gallery
     2. Current user's donation listings

     searchQuery filters public donation items by item name.
  */
  const [showMyDonations, setShowMyDonations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /*
     ROUTING

     navigate is used to move to item details, edit form, or donate form.
  */
  const navigate = useNavigate();

  /*
     CURRENT PARENT ID

     Gets the logged-in parent from localStorage.
     Used to identify which donation items belong to this parent.
  */
  const storedParent = localStorage.getItem('parent');
  const parentData = storedParent ? JSON.parse(storedParent) : null;
  const currentPid = parentData?.P_ID;

  /*
     FETCH ITEMS

     Loads all marketplace donation items from backend.
     Then separates them into:
     1. Active public items
     2. My donation items for the logged-in parent
  */
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE}/modules/market_place/market_place`
      );

      /*
         ACTIVE ITEMS

         Only items with Status = Active appear in the public gallery.
      */
      const activeItems = response.data.filter(
        (item) => item.Status === 'Active'
      );

      setAllItems(activeItems);

      /*
         MY DONATIONS

         If a parent is logged in, show only items created by this parent.
      */
      if (currentPid) {
        const userItems = response.data.filter(
          (item) => item.P_ID === currentPid
        );

        setMyItems(userItems);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load donation items');
    } finally {
      setLoading(false);
    }
  }, [currentPid]);

  /*
     LOAD ITEMS ON PAGE OPEN

     Runs fetchItems when the component first renders.
  */
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /*
     DELETE DONATION ITEM

     Confirms with the user first.
     Then deletes the item from backend and removes it from local state.
  */
  const handleDeleteItem = async (mId) => {
    if (!window.confirm("Are you sure you want to delete this donation listing?")) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/modules/market_place/market_place?id=${mId}`
      );

      setMyItems((prev) => prev.filter((item) => item.M_ID !== mId));
      setAllItems((prev) => prev.filter((item) => item.M_ID !== mId));

      alert("Listing deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete item.");
    }
  };

  /*
     EDIT DONATION ITEM

     Opens the donate item form in edit mode
     by sending the selected item through route state.
  */
  const handleEditItem = (item) => {
    navigate("/donate-item-form", { state: { editItem: item } });
  };

  /*
     FILTERED ACTIVE ITEMS

     Filters public active items by item name using the search query.
  */
  const filteredActiveItems = allItems.filter((item) =>
    !searchQuery ||
    (item.Item_Name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  /*
     PAGINATION CALCULATIONS

     TOTAL_PAGES: number of available pages.
     startIdx: first item index on the current page.
     currentItems: donation cards visible on this page.
  */
  const TOTAL_PAGES = Math.ceil(filteredActiveItems.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredActiveItems.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );

  /*
     SELECT DONATION ITEM

     Saves selected item in sessionStorage
     and opens the donation item details page.
  */
  const handleSelect = (selectedItem) => {
    sessionStorage.setItem(
      "selectedDonationItem",
      JSON.stringify(selectedItem)
    );

    navigate("/donateditem", { state: { item: selectedItem } });
  };

  /*
     GO TO PAGE

     Changes current gallery page and scrolls to the top smoothly.
  */
  const goToPage = (page) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="donation-page">
        <div className="donation-page__container">
          {/* Page title and manage donations button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h1
              className="donation-page__title"
              style={{ marginBottom: 0 }}
            >
              Donation Center
            </h1>

            {/* Shows only if a parent is logged in */}
            {currentPid && (
              <button
                className="donation-page__donate-btn"
                onClick={() => setShowMyDonations(!showMyDonations)}
                style={{
                  background: showMyDonations ? '#fff' : '#9D64AA',
                  color: showMyDonations ? '#9D64AA' : '#fff',
                  border: showMyDonations ? '2px solid #9D64AA' : 'none',
                  padding: showMyDonations ? '9px 22px' : '11px 24px',
                }}
              >
                {showMyDonations ? '← View All Donations' : 'Manage My Donations'}
              </button>
            )}
          </div>

          {/* Public gallery banner and search */}
          {!showMyDonations && (
            <>
              {/* Donation banner */}
              <div className="donation-page__banner">
                <div className="donation-page__banner-text">
                  <span className="donation-page__banner-icon">🎁</span>

                  <div>
                    <p className="donation-page__banner-heading">
                      Have an item to donate?
                    </p>

                    <p className="donation-page__banner-sub">
                      List your equipment so families in need can find it.
                    </p>
                  </div>
                </div>

                <button
                  className="donation-page__donate-btn"
                  onClick={() => navigate("/donate-item-form")}
                >
                  Donate an Item
                </button>
              </div>

              {/* Search bar */}
              <div
                className="donation-page__search-container"
                style={{
                  marginBottom: '30px',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '450px',
                  margin: '0 auto 40px',
                }}
              >
                <input
                  type="text"
                  placeholder="Search for an item by name..."
                  className="donation-search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  /*search bar color and font size*/
                  style={{
                    width: '100%',
                    padding: '12px 20px 12px 48px',
                    borderRadius: '30px',
                    border: '2px solid #f0f0f0',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                  }}
                />

                {/* Search icon color */}
                <div
                  style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9D64AA',
                    display: 'flex',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* Loading state */}
          {loading && (
            <p style={{ textAlign: "center", padding: "40px" }}>
              Loading items...
            </p>
          )}

          {/* Error state */}
          {error && (
            <p
              style={{
                textAlign: "center",
                padding: "40px",
                color: "red",
              }}
            >
              {error}
            </p>
          )}

          {/* My donations management view */}
          {showMyDonations && !loading && (
            <div className="my-donations-section">
              <div
                style={{
                  marginBottom: '30px',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #eee',
                }}
              >
                <h2
                  style={{
                    fontSize: '18px',
                    color: '#333',
                    marginBottom: '15px',
                  }}
                >
                  My Donation Listings
                </h2>

                {myItems.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px' }}>
                    You haven't listed any items for donation yet.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {myItems.map((item) => (
                      <div
                        key={item.M_ID}
                        className="donation-card"
                        style={{
                          padding: '15px',
                          border: '1px solid #f0f0f0',
                          borderRadius: '12px',
                          background: '#fafafa',
                        }}
                      >
                        {/* My donation item image */}
                        <div
                          style={{
                            height: '150px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '12px',
                          }}
                        >
                          <img
                            src={
                              item.Image
                                ? `${API_BASE}/images/${item.Image}`
                                : ''
                            }
                            alt={item.Item_Name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </div>

                        {/* My donation item info */}
                        <h3
                          style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            marginBottom: '4px',
                          }}
                        >
                          {item.Item_Name}
                        </h3>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {item.Conditions}
                          </span>

                          {/* Item status badge */}
                          <span
                            className={`status-badge ${item.Status.toLowerCase()}`}
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background:
                                item.Status === 'Active' ? '#e6f4ea' : '#fff4e5',
                              color:
                                item.Status === 'Active' ? '#1e8e3e' : '#d93025',
                            }}
                          >
                            {item.Status}
                          </span>
                        </div>

                        {/* Edit and delete buttons */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleEditItem(item)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              background: '#fff',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.M_ID)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#feeef0',
                              color: '#d93025',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General donation gallery */}
          {!showMyDonations && !loading && !error && (
            <>
              <div className="donation-page__grid">
                {currentItems.map((item) => (
                  <DonationCard
                    key={item.M_ID}
                    id={item.M_ID}
                    image={
                      item.Image
                        ? `${API_BASE}/images/${item.Image}`
                        : ''
                    }
                    name={item.Item_Name}
                    usage={item.Years}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {filteredActiveItems.length > 0 && (
                <div className="donation-page__pagination">
                  <button
                    className="pagination__arrow"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    &#8249;
                  </button>

                  {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        className={`pagination__dot ${page === currentPage ? "pagination__dot--active" : ""
                          }`}
                        onClick={() => goToPage(page)}
                        aria-label={`Page ${page}`}
                      />
                    )
                  )}

                  <button
                    className="pagination__arrow"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === TOTAL_PAGES}
                    aria-label="Next page"
                  >
                    &#8250;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Donation;