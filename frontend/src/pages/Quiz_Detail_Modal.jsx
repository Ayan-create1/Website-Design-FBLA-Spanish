import { useState } from "react";
import "./Quiz_Detail_Modal.css";

export default function QuizDetailModal({ resource, onClose, onEdit, onPerfectScore }) {
  const [taking, setTaking] = useState(false);
  const [answers, setAnswers] = useState({});         // { questionId: answerIndex }
  const [submitted, setSubmitted] = useState(false);

  // Parse questions — stored as JSON string in DB
  let questions = [];
  try {
    questions = typeof resource.questions === "string"
      ? JSON.parse(resource.questions)
      : resource.questions || [];
  } catch {}

  const handleSelect = (qId, aIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: aIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    const finalScore = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    setSubmitted(true);
    if (onPerfectScore) {
      onPerfectScore(resource.id);
    }
  };

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="qdm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qdm-wrapper">
        <div className="qdm-stripe qdm-stripe-quiz" />

        <div className="qdm-content">
          {/* Header */}
          <div className="qdm-header">
            <div className="qdm-type-chip">Quiz • {questions.length} question{questions.length !== 1 ? "s" : ""}</div>
            <div className="qdm-header-actions">
              {onEdit && (
                <button className="qdm-edit-btn" onClick={() => onEdit(resource)} title="Edit quiz">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              <button className="qdm-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <h2 className="qdm-title">{resource.title || "Untitled Quiz"}</h2>

          <p className="qdm-author">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            @{resource.author_username || "unknown"}
          </p>

          {!taking ? (
            /* ── Overview panel ── */
            <>
              {resource.description ? (
                <div className="qdm-description">
                  <h3 className="qdm-desc-label">About this quiz</h3>
                  <p className="qdm-desc-text">{resource.description}</p>
                </div>
              ) : (
                <p className="qdm-no-desc">No description provided.</p>
              )}

              <div className="qdm-stats">
                <div className="qdm-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  {resource.likes || 0} likes
                </div>
                <div className="qdm-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </div>
              </div>

              {questions.length > 0 && (
                <button className="qdm-start-btn" onClick={() => setTaking(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21 5,3"/>
                  </svg>
                  Take Quiz
                </button>
              )}
            </>
          ) : (
            /* ── Quiz taking panel ── */
            <div className="qdm-quiz-area">
              {submitted && (
                <div className={`qdm-score-banner ${score === questions.length ? "perfect" : score >= questions.length / 2 ? "good" : "low"}`}>
                  <strong>{score}/{questions.length}</strong>
                  <span>
                    {score === questions.length
                      ? "🎉 Perfect score!"
                      : score >= questions.length / 2
                      ? "Good effort!"
                      : "Keep studying!"}
                  </span>
                </div>
              )}

              {questions.map((q, qIdx) => {
                const chosen = answers[q.id];
                const isCorrect = submitted && chosen === q.correctIndex;
                const isWrong = submitted && chosen !== undefined && chosen !== q.correctIndex;

                return (
                  <div key={q.id} className="qdm-question">
                    <p className="qdm-question-prompt">
                      <span className="qdm-q-num">Q{qIdx + 1}</span>
                      {q.question}
                    </p>

                    <div className="qdm-answer-list">
                      {q.answers.map((ans, aIdx) => {
                        const isChosen = chosen === aIdx;
                        const isCorrectAns = q.correctIndex === aIdx;
                        let cls = "qdm-answer-opt";
                        if (!submitted) {
                          if (isChosen) cls += " chosen";
                        } else {
                          if (isCorrectAns) cls += " reveal-correct";
                          else if (isChosen && !isCorrectAns) cls += " reveal-wrong";
                        }

                        return (
                          <button
                            key={aIdx}
                            className={cls}
                            onClick={() => handleSelect(q.id, aIdx)}
                            disabled={submitted}
                          >
                            <span className="qdm-opt-letter">{["A","B","C","D"][aIdx]}</span>
                            <span className="qdm-opt-text">{ans || <em className="qdm-opt-empty">—</em>}</span>
                            {submitted && isCorrectAns && (
                              <span className="qdm-opt-badge correct">✓</span>
                            )}
                            {submitted && isChosen && !isCorrectAns && (
                              <span className="qdm-opt-badge wrong">✗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="qdm-quiz-footer">
                {!submitted ? (
                  <button
                    className="qdm-submit-btn"
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < questions.length}
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button className="qdm-retry-btn" onClick={resetQuiz}>
                    Try Again
                  </button>
                )}
                <button className="qdm-back-btn" onClick={() => { resetQuiz(); setTaking(false); }}>
                  ← Back to overview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}