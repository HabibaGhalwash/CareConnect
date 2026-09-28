/*
 * Therapist.jsx — CareConnect Therapist Page
 *
 * This page displays public therapist listings.
 * It includes:
 * 1. Navbar
 * 2. Hero search section
 * 3. Featured therapist cards
 * 4. View More therapist grid
 * 5. Pagination
 * 6. Testimonials
 * 7. Online session steps
 * 8. Footer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import TherapistCard from '../../components/TherapistCard/TherapistCard';
import TestimonialSlider from '../../components/TestimonialSlider/TestimonialSlider';
import OnlineSteps from '../../components/OnlineSteps/OnlineSteps';

import './Therapist.css';

import axios from 'axios';
import { API_BASE } from '../../services/api';
import therapistFallbackImg from '../../assets/shadow-teacher.jpeg';

const Therapist = () => {
  /*
     NAVIGATION

     Used to move the user to the selected therapist profile page.
  */
  const navigate = useNavigate();

  /*
     STATE VARIABLES

     therapists: stores therapist data from backend.
     loading: shows loading state while fetching data.
     error: stores API error message.
     searchQuery: stores the search input value.
     searchFocused: controls focused styling for the search bar.
     currentPage: controls pagination in the View More section.
     showTherapists: shows or hides the additional therapist grid.
  */
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showTherapists, setShowTherapists] = useState(false);

  /*
     PAGINATION SETTING

     Controls how many therapists appear per page
     in the additional therapist grid.
  */
  const THERAPISTS_PER_PAGE = 8;

  /*
     FETCH THERAPISTS FROM BACKEND

     Runs once when the page opens.
     It gets all therapists from the API and saves them in state.
  */
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await axios.get(`${API_BASE}/modules/therapist/therapist`);
        setTherapists(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  /*
     FILTER THERAPISTS

     First keeps only accepted or verified therapists.
     Then filters by therapist name or specialization if search is active.
  */
  const getFilteredTherapists = () => {
    let filtered = therapists.filter(
      (t) =>
        typeof t.Status === 'string' &&
        (t.Status.toLowerCase() === 'accepted' ||
          t.Status.toLowerCase() === 'verified')
    );

    if (!searchQuery.trim()) {
      return filtered;
    }

    const query = searchQuery.toLowerCase();

    return filtered.filter(
      (t) =>
        (t.Fullname && t.Fullname.toLowerCase().includes(query)) ||
        (t.Specialization && t.Specialization.toLowerCase().includes(query))
    );
  };

  /*
     FILTERED DATA

     filteredTherapists: final list after status and search filtering.
     isSearchActive: checks whether user typed something in search.
  */
  const filteredTherapists = getFilteredTherapists();
  const isSearchActive = searchQuery.trim() !== '';

  /*
     PAGINATION LOGIC

     totalPages: number of pages.
     startIdx / endIdx: current slice range.
     paginatedTherapists: therapists shown on current page.
  */
  const totalPages = Math.ceil(filteredTherapists.length / THERAPISTS_PER_PAGE);
  const startIdx = currentPage * THERAPISTS_PER_PAGE;
  const endIdx = startIdx + THERAPISTS_PER_PAGE;
  const paginatedTherapists = filteredTherapists.slice(startIdx, endIdx);

  /*
     HERO DISPLAY LOGIC

     featuredTherapists: first 4 therapists shown in the hero.
     moreDisplayTherapists: therapists after the first 4.
  */
  const featuredTherapists = filteredTherapists.slice(0, 4);
  const moreDisplayTherapists = filteredTherapists.slice(4);

  /*
     HANDLE SEARCH

     Prevents page reload and resets pagination to the first page.
  */
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  /*
     PAGINATION HANDLERS

     Move between pages in the additional therapist grid.
  */
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="therapist-page">
      {/* 
         NAVBAR SECTION

         Shows the main website navigation.
      */}
      <Navbar />

      {/* 
         THERAPIST LOOKUP HERO SECTION

         Contains the page title, search bar,
         and the first 4 therapist cards.
      */}
      <section className="therapist-hero">
        <div className="therapist-hero__left">
          <h1 className="therapist-hero__title">Therapist Lookup</h1>

          {/* 
             SEARCH FORM

             Allows the user to search by therapist name or specialization.
          */}
          <form
            className={`therapist-hero__search ${searchFocused ? 'therapist-hero__search--focused' : ''
              }`}
            onSubmit={handleSearch}
          >
            <input
              type="text"
              className="therapist-hero__search-input"
              placeholder="Search by name or specialization…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search therapists"
            />

            <button
              type="submit"
              className="therapist-hero__search-btn"
              aria-label="Search"
            >
              {/* Search icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        {/* 
           HERO THERAPIST CARDS

           Shows loading, error, search results,
           or featured therapists depending on current state.
        */}
        <div className="therapist-hero__cards">
          {loading ? (
            <div className="therapist-hero__no-results">Loading therapists...</div>
          ) : error ? (
            <div className="therapist-hero__no-results">{error}</div>
          ) : isSearchActive ? (
            filteredTherapists.length > 0 ? (
              filteredTherapists.slice(0, 4).map((t) => (
                <TherapistCard
                  key={t.T_ID}
                  id={t.T_ID}
                  name={t.Fullname}
                  specialization={t.Specialization}
                  years={t.Experience}
                  image={t.Imagepath ? `${API_BASE}${t.Imagepath}` : therapistFallbackImg}
                  imagePlaceholder="#B8A9D9"
                  featured={false}
                  vertical={false}
                  onClick={() => navigate(`/therapist/${t.T_ID}`)}
                />
              ))
            ) : (
              <div className="therapist-hero__no-results">
                <p>No therapists found matching "{searchQuery}"</p>
              </div>
            )
          ) : featuredTherapists.length > 0 ? (
            featuredTherapists.map((t) => (
              <TherapistCard
                key={t.T_ID}
                id={t.T_ID}
                name={t.Fullname}
                specialization={t.Specialization}
                years={t.Experience}
                image={t.Imagepath ? `${API_BASE}${t.Imagepath}` : therapistFallbackImg}
                imagePlaceholder="#B8A9D9"
                featured={true}
                vertical={false}
                onClick={() => navigate(`/therapist/${t.T_ID}`)}
              />
            ))
          ) : (
            <div className="therapist-hero__no-results">
              <p>No therapists available</p>
            </div>
          )}
        </div>

        {/* 
           VIEW MORE BUTTON

           Appears only when there are more therapists after the first 4.
           It opens or hides the additional therapist grid.
        */}
        {!loading && !error && moreDisplayTherapists.length > 0 && !isSearchActive && (
          <button
            className="therapist-hero__view-more-btn"
            onClick={() => setShowTherapists(!showTherapists)}
          >
            {showTherapists ? 'Hide More' : 'View More'}
          </button>
        )}
      </section>

      {/* 
         ADDITIONAL THERAPISTS SECTION

         Appears after clicking View More.
         Shows all therapists in a grid with pagination.
      */}
      {showTherapists && filteredTherapists.length > 4 && (
        <section className="therapist-grid">
          <div className="therapist-grid__container">
            <h2 className="therapist-grid__title">Available Therapists</h2>

            {/* Therapist grid cards */}
            <div className="therapist-grid__cards">
              {paginatedTherapists.map((t) => (
                <div key={t.T_ID} className="therapist-grid__card-wrapper">
                  <TherapistCard
                    id={t.T_ID}
                    name={t.Fullname}
                    specialization={t.Specialization}
                    years={t.Experience}
                    image={t.Imagepath ? `${API_BASE}${t.Imagepath}` : therapistFallbackImg}
                    imagePlaceholder="#B8A9D9"
                    featured={false}
                    vertical={false}
                    onClick={() => navigate(`/therapist/${t.T_ID}`)}
                  />

                  {/* Extra information below each therapist card */}
                  <div className="therapist-grid__card-info">
                    <h3>{t.Fullname}</h3>
                    <p>{t.Specialization}</p>
                    <p className="therapist-grid__years">{t.Experience} </p>

                    <button
                      className="therapist-grid__book-btn"
                      onClick={() => navigate(`/therapist/${t.T_ID}`)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 
               PAGINATION CONTROLS

               Includes previous button, page dots, and next button.
            */}
            <div className="therapist-grid__pagination">
              <button
                className="therapist-grid__pagination-btn therapist-grid__pagination-btn--prev"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                <button
                  key={page}
                  className={`therapist-grid__pagination-dot ${currentPage === page ? 'therapist-grid__pagination-dot--active' : ''
                    }`}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page + 1}`}
                />
              ))}

              <button
                className="therapist-grid__pagination-btn therapist-grid__pagination-btn--next"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 
         TESTIMONIALS SECTION

         Shows user testimonials using TestimonialSlider component.
      */}
      <TestimonialSlider />

      {/* 
         ONLINE SESSION STEPS SECTION

         Explains how online therapy sessions work.
      */}
      <OnlineSteps
        sessionImage={null}
        imagePlaceholder="#9CCFC9"
      />

      {/* 
         FOOTER SECTION

         Shows website footer.
      */}
      <Footer />
    </div>
  );
};

export default Therapist;