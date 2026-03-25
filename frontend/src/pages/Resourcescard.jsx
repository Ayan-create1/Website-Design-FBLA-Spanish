import { useState } from "react";
import "./Resourcescard.css";

export default function ResourceCard({ resource, currentUser, onVote, onSave, onClick }) {
  const [saved, setSaved] = useState(resource.is_saved || false);
  const [userVote, setUserVote] = useState(resource.user_vote || null); // "like" | "dislike" | null
  const [likes, setLikes] = useState(resource.likes || 0);
  const [dislikes, setDislikes] = useState(resource.dislikes || 0);

  const isQuiz = resource.type === "Quiz";

  const handleSave = async (e) => {
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    try {
      await onSave?.(resource.id, next);
    } catch {
      setSaved(!next); // revert
    }
  };

  const handleVote = async (e, type) => {
    e.stopPropagation();

    let newLikes = likes;
    let newDislikes = dislikes;
    let newVote = userVote;

    if (userVote === type) {
      // undo vote
      if (type === "like") newLikes--;
      else newDislikes--;
      newVote = null;
    } else {
      // undo old vote if any
      if (userVote === "like") newLikes--;
      if (userVote === "dislike") newDislikes--;
      // apply new vote
      if (type === "like") newLikes++;
      else newDislikes++;
      newVote = type;
    }

    setLikes(newLikes);
    setDislikes(newDislikes);
    setUserVote(newVote);

    try {
      await onVote?.(resource.id, type, userVote);
    } catch {
      // revert
      setLikes(likes);
      setDislikes(dislikes);
      setUserVote(userVote);
    }
  };

  const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);

  return (
    <article
      className={`rc-card ${isQuiz ? "rc-quiz" : "rc-pdf"}`}
      onClick={() => onClick?.(resource)}
    >
      {/* Top badge + bookmark */}
      <div className="rc-top">
        <span className={`rc-badge ${isQuiz ? "rc-badge-quiz" : "rc-badge-pdf"}`}>
          {resource.title || "Untitled"}
        </span>
        {resource.is_public !== false && (
          <button
            className={`rc-bookmark ${saved ? "rc-saved" : ""}`}
            onClick={handleSave}
            title={saved ? "Remove bookmark" : "Save resource"}
            aria-label="Bookmark"
          >
            <svg 
              width="16"
              height="16"
              viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="rc-meta">
        <span className="rc-author">Author: @{resource.author_username || "unknown"}</span>
        <span className="rc-type">Type: {resource.type}</span>
      </div>

      {/* Votes */}
      <div className="rc-votes">
        <button
          className={`rc-vote-btn ${userVote === "like" ? "active-like" : ""}`}
          onClick={(e) => handleVote(e, "like")}
          aria-label="Like"
        >
          <svg viewBox="0 0 24 24" fill={userVote === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span>{formatCount(likes)}</span>
        </button>

        <button
          className={`rc-vote-btn ${userVote === "dislike" ? "active-dislike" : ""}`}
          onClick={(e) => handleVote(e, "dislike")}
          aria-label="Dislike"
        >
          <svg viewBox="0 0 24 24" fill={userVote === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          <span>{formatCount(dislikes)}</span>
        </button>
      </div>
    </article>
  );
}