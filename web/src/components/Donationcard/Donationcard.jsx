import "./Donationcard.css";

const DonationCard = ({ id, image, name, usage, onSelect }) => {
  return (
    <div className="donation-card">
      <div className="donation-card__image-wrapper">
        <img src={image} alt={name} className="donation-card__image" />
      </div>
      <div className="donation-card__info">
        <div className="donation-card__text">
          <h3 className="donation-card__name">{name}</h3>
          <p className="donation-card__usage">{usage}</p>
        </div>
        <button
          type="button"
          className="donation-card__btn"
          onClick={() => onSelect && onSelect({ id, image, name, usage })}
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default DonationCard;