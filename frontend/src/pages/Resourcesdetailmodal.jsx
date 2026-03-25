import "./Resourcesdetailmodal.css";

export default function ResourceDetailModal({ resource, onClose }) {
  if (!resource) return null;

  const isQuiz = resource.type === "Quiz";

  const handleViewPDF = () => {
    if (resource.file_url) {
      window.open(resource.file_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rdm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rdm-wrapper">
        {/* Color stripe */}
        <div className={`rdm-stripe ${isQuiz ? "rdm-stripe-quiz" : "rdm-stripe-pdf"}`} />

        <div className="rdm-content">
          {/* Header */}
          <div className="rdm-header">
            <div className="rdm-type-chip">{resource.type}</div>
            <button className="rdm-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <h2 className="rdm-title">{resource.title || "Untitled"}</h2>

          {/* Author */}
          <p className="rdm-author">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            @{resource.author_username || "unknown"}
          </p>

          {/* Description */}
          {resource.description ? (
            <div className="rdm-description">
              <h3 className="rdm-desc-label">About this resource</h3>
              <p className="rdm-desc-text">{resource.description}</p>
            </div>
          ) : (
            <p className="rdm-no-desc">No description provided.</p>
          )}

          {/* Stats */}
          <div className="rdm-stats">
            <div className="rdm-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              {resource.likes || 0} likes
            </div>
            <div className="rdm-stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
              {resource.dislikes || 0} dislikes
            </div>
          </div>

          {/* Actions */}
          {resource.type === "PDF" && resource.file_url && (
            <button
              className={`rdm-view-btn ${isQuiz ? "rdm-btn-quiz" : "rdm-btn-pdf"}`}
              onClick={handleViewPDF}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              View PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}