/*
 * CommunicationTool.jsx — CareConnect Communication Tool Page
 *
 * This page displays communication cards from the backend.
 * It includes:
 * 1. Navbar
 * 2. Communication card loading from database
 * 3. Text-to-speech when a card is clicked
 * 4. Color rotation for visual variety
 * 5. Loading and error states
 * 6. Cards grid
 * 7. Speaking animation
 * 8. Pagination
 * 9. Footer
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../services/api';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';

import './communication_tool.css';

/* 
   COLOR ROTATION

   These classes are applied to cards one by one.
   This gives visual variety using the same color system as the admin panel.
*/
const COLORS = [
  'comm-card--green',
  'comm-card--blue',
  'comm-card--light-blue',
  'comm-card--purple',
  'comm-card--teal',
  'comm-card--mint',
];

/* 
   CARDS PER PAGE

   Controls how many communication cards appear on each page.
*/
const CARDS_PER_PAGE = 6;

/* 
   SPEAK PHRASE

   Uses the browser Web Speech API to read the phrase out loud.
*/
const speakPhrase = (phrase) => {
  /*
     CHECK SPEECH SUPPORT

     If the browser does not support speechSynthesis,
     the function stops safely.
  */
  if (!window.speechSynthesis) return;

  /*
     CANCEL CURRENT SPEECH

     Stops any currently spoken phrase before starting a new one.
  */
  window.speechSynthesis.cancel();

  /*
     CREATE SPEECH UTTERANCE

     Converts the phrase into a spoken sentence.
  */
  const utterance = new SpeechSynthesisUtterance(phrase);

  /*
     SPEECH SETTINGS

     lang sets the voice language.
     rate controls speaking speed.
  */
  utterance.lang = 'en-US';
  utterance.rate = 0.9;

  /*
     START SPEAKING

     Tells the browser to speak the phrase.
  */
  window.speechSynthesis.speak(utterance);
};

const CommunicationTool = () => {
  /*
     CARD DATA STATES

     cards stores all communication cards from the backend.
     loading shows loading state while fetching.
     error stores loading error message.
  */
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
     PAGINATION STATE

     page stores the current page index.
     It starts from 0, not 1.
  */
  const [page, setPage] = useState(0);

  /*
     SPEAKING STATE

     speaking stores the CT_ID of the card currently being spoken.
     This is used to animate the active card.
  */
  const [speaking, setSpeaking] = useState(null);

  /*
     FETCH COMMUNICATION CARDS

     Loads communication cards from the backend when the page opens.
  */
  useEffect(() => {
    axios
      .get(`${API_BASE}/modules/communicationtool/communication_tool`)
      .then((res) => {
        setCards(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setError('Could not load cards. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /*
     PAGINATION CALCULATIONS

     totalPages: number of card pages.
     visibleCards: the 6 cards shown on the current page.
  */
  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE) || 1;

  const visibleCards = cards.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  /*
     GO TO PAGE

     Moves directly to a selected page index.
  */
  const goTo = (index) => {
    setPage(index);
  };

  /*
     PREVIOUS PAGE

     Moves one page back, without going below page 0.
  */
  const prev = () => {
    setPage((p) => Math.max(p - 1, 0));
  };

  /*
     NEXT PAGE

     Moves one page forward, without going past the last page.
  */
  const next = () => {
    setPage((p) => Math.min(p + 1, totalPages - 1));
  };

  /*
     HANDLE CARD CLICK

     Sets the clicked card as active.
     Speaks its phrase or button label.
     Clears the active state after 1.5 seconds.
  */
  const handleCardClick = (card) => {
    setSpeaking(card.CT_ID);

    speakPhrase(card.Phrase || card.Button_Label);

    setTimeout(() => {
      setSpeaking(null);
    }, 1500);
  };

  /*
     PAGE TITLE

     Changes the title depending on the current group of cards.
  */
  const pageTitles = [
    'Tap to tell us what you need',
    'Tap to tell us what you need',
    'Tap to respond',
  ];

  const pageTitle = pageTitles[page] ?? 'Tap a card';

  return (
    <div className="comm-page">
      {/* Navbar */}
      <Navbar />

      <main className="comm-section">
        {/* Page title */}
        <h2 className="comm-section__title">{pageTitle}</h2>

        {/* Loading state */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#888',
              fontSize: 15,
            }}
          >
            Loading communication cards…
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#c0392b',
              background: '#fff0f0',
              borderRadius: 12,
              margin: '20px auto',
              maxWidth: 400,
            }}
          >
            {error}
          </div>
        )}

        {/* Cards grid and pagination */}
        {!loading && !error && (
          <>
            {cards.length === 0 ? (
              /*
                 EMPTY STATE

                 Shows when the backend returns no communication cards.
              */
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#888',
                  fontSize: 15,
                }}
              >
                No cards configured yet. Ask your admin to add some.
              </div>
            ) : (
              /*
                 COMMUNICATION CARDS GRID

                 Shows only the cards for the current page.
              */
              <div className="comm-grid">
                {visibleCards.map((card, idx) => {
                  /*
                     CARD COLOR CLASS

                     Rotates through color classes based on the card's global index.
                  */
                  const colorClass =
                    COLORS[(page * CARDS_PER_PAGE + idx) % COLORS.length];

                  /*
                     ACTIVE CARD CHECK

                     True when this card is currently being spoken.
                  */
                  const isActive = speaking === card.CT_ID;

                  return (
                    <div
                      key={card.CT_ID}
                      className={`comm-card ${colorClass}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCardClick(card)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleCardClick(card)
                      }
                      style={{
                        transform: isActive ? 'scale(1.06)' : undefined,
                        boxShadow: isActive
                          ? '0 8px 30px rgba(0,0,0,0.18)'
                          : undefined,
                        transition:
                          'transform 0.15s ease, box-shadow 0.15s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        outline: 'none',
                      }}
                    >
                      {/* Card image */}
                      <img
                        src={
                          card.Icon_Image
                            ? card.Icon_Image.startsWith('http')
                              ? card.Icon_Image
                              : `${API_BASE}/images/${card.Icon_Image}`
                            : 'https://via.placeholder.com/150?text=No+Image'
                        }
                        alt={card.Button_Label}
                        className="comm-card__image"
                        draggable={false}
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/150?text=Error';
                          e.target.style.opacity = '0.5';
                        }}
                      />

                      {/* Card label */}
                      <div className="comm-card__label">
                        {card.Button_Label}
                      </div>

                      {/* Speaking pulse indicator */}
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: '#6c5ce7',
                            animation:
                              'commPulse 0.6s ease infinite alternate',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="comm-pagination">
                {/* Previous page button */}
                <button
                  className="comm-pagination__arrow"
                  onClick={prev}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  &#8249;
                </button>

                {/* Pagination dots */}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`comm-pagination__dot ${i === page ? 'comm-pagination__dot--active' : ''
                      }`}
                    onClick={() => goTo(i)}
                    aria-label={`Page ${i + 1}`}
                  />
                ))}

                {/* Next page button */}
                <button
                  className="comm-pagination__arrow"
                  onClick={next}
                  disabled={page === totalPages - 1}
                  aria-label="Next page"
                >
                  &#8250;
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Pulse animation for speaking indicator */}
      <style>{`
        @keyframes commPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CommunicationTool;