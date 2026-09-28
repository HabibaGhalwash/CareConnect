import React from 'react';
import './Schoolcard.css';

const Schoolcard = ({ name, image, to }) => (
  <a href={to || '#'} className="school-card">
    <div className="school-card__img-wrap">
      <img src={image} alt={name} className="school-card__img" />
    </div>
    <div className="school-card__bubble">
      <span className="school-card__name">{name}</span>
    </div>
  </a>
);

export default Schoolcard;