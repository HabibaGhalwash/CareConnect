/*
 * School.jsx — CareConnect Schools Page
 *
 * This page displays schools from the backend.
 * It includes:
 * 1. Navbar
 * 2. Search bar
 * 3. School list
 * 4. Star ratings
 * 5. Pagination
 * 6. Empty search result message
 * 7. Footer
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './School.css';

import axios from 'axios';
import { API_BASE } from '../../services/api';

/*
   RENDER STARS

   Converts the school rating into 5 visual stars.
   Filled stars appear based on the rating number.
*/
const renderStars = (rating) => {
  /*
     VALID RATING

     Makes sure the rating is always a number between 0 and 5.
  */
  const validRating = Math.min(Math.max(parseInt(rating) || 0, 0), 5);

  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= validRating ? 'filled' : 'empty'}`}
          title={`${validRating} out of 5 stars`}
        >
          ★
        </span>
      ))}

      <span className="rating-text">({validRating}/5)</span>
    </div>
  );
};

const School = () => {
  /*
     SEARCH STATE

     searchQuery stores what the user types in the search input.
  */
  const [searchQuery, setSearchQuery] = useState('');

  /*
     PAGINATION STATE

     currentPage controls which page of schools is currently visible.
  */
  const [currentPage, setCurrentPage] = useState(1);

  /*
     SCHOOLS DATA STATE

     schoolsData stores the schools fetched from the backend.
  */
  const [schoolsData, setSchoolsData] = useState([]);

  /*
     ITEMS PER PAGE

     Controls how many schools appear on each page.
  */
  const itemsPerPage = 5;

  /*
     FETCH SCHOOLS

     Loads all school records from the backend when the page opens.
  */
  useEffect(() => {
    axios
      .get(`${API_BASE}/modules/school/school`)
      .then((res) => {
        setSchoolsData(res.data);
      })
      .catch((err) => {
        console.error('Error fetching schools:', err);
      });
  }, []);

  /*
     FILTERED SCHOOLS

     Filters schools by:
     1. School name
     2. Special needs program / aim
  */
  const filteredSchools = schoolsData.filter(
    (school) =>
      school.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.Special_Need_Prog?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /*
     PAGINATION CALCULATIONS

     totalPages: total number of pages after filtering.
     startIndex: first school index for the current page.
     currentSchools: schools visible on the current page.
  */
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSchools = filteredSchools.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /*
     NEXT PAGE

     Moves to the next page if the user is not already on the last page.
     Then scrolls back to the top.
  */
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  /*
     PREVIOUS PAGE

     Moves to the previous page if the user is not already on the first page.
     Then scrolls back to the top.
  */
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  /*
     HANDLE SEARCH

     Updates the search query.
     Resets pagination to page 1 whenever the search changes.
  */
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="school-page">
        {/* Search section */}
        <div className="school-search">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for your school"
              value={searchQuery}
              onChange={handleSearch}
            />

            {/* Search icon button */}
            <div className="search-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="7" cy="7" r="5"></circle>
                <line x1="11" y1="11" x2="15" y2="15"></line>
              </svg>
            </div>
          </div>
        </div>

        {/* Schools list or empty state */}
        {filteredSchools.length > 0 ? (
          <>
            {/* Current page school cards */}
            {currentSchools.map((school, index) => (
              <section
                key={index}
                className={`school-section ${(startIndex + index) % 2 === 0 ? 'bg-beige' : 'bg-white'
                  }`}
              >
                <div
                  className={`school-item ${(startIndex + index) % 2 !== 0 ? 'reverse' : ''
                    }`}
                >
                  {/* School image */}
                  <img
                    src={school.Image ? `${API_BASE}/images/${school.Image}` : ''}
                    alt={school.Name}
                  />

                  {/* School information */}
                  <div className="school-info">
                    <h2>{school.Name}</h2>

                    <p>
                      <strong>Aim for:</strong> {school.Special_Need_Prog}
                    </p>

                    <p>
                      <strong>Address:</strong> {school.Address}
                    </p>

                    <p>
                      <strong>Website:</strong>{' '}
                      <a
                        href={`https://${school.Website_Link}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {school.Website_Link}
                      </a>
                    </p>

                    {/* School rating */}
                    {renderStars(school.Rating)}
                  </div>
                </div>
              </section>
            ))}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '40px 0',
                  background: '#F9F5F2',
                }}
              >
                {/* Previous page button */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    background: currentPage === 1 ? '#d1d5db' : '#9D64AA',
                    color: 'white',
                    transition: 'all 0.2s ease',
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </button>

                {/* Page counter */}
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    minWidth: '100px',
                    textAlign: 'center',
                  }}
                >
                  Page {currentPage} of {totalPages}
                </div>

                {/* Next page button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor:
                      currentPage === totalPages ? 'not-allowed' : 'pointer',
                    background:
                      currentPage === totalPages ? '#d1d5db' : '#9D64AA',
                    color: 'white',
                    transition: 'all 0.2s ease',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={24} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </>
        ) : (
          /*
             EMPTY SEARCH STATE

             Shows when no school matches the current search query.
          */
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              fontSize: '18px',
              color: '#666',
            }}
          >
            <p>No schools found matching "{searchQuery}"</p>

            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              Try searching by school name or aim
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default School;