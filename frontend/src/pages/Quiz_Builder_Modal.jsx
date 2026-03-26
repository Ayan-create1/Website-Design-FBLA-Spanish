import { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import "./Quiz_Builder_Modal.css";

// A blank question template
const blankQuestion = () => ({
  id: Date.now() + Math.random(),
  question: "",
  answers: ["", "", "", ""],
  correctIndex: null, // 0-3
});

const STEPS = ["Title", "Visibility", "Description", "Questions"];

export default function QuizBuilderModal({ onClose, onSaveSuccess, onPublishSuccess, currentUser, draft }) {
  // If a draft is passed in, pre-populate all fields
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(draft?.title || "");
  const [visibility, setVisibility] = useState(draft?.visibility || "public");
  const [description, setDescription] = useState(draft?.description || "");
  const [questions, setQuestions] = useState(() => {
    if (!draft?.questions) return [blankQuestion()];
    try {
      const parsed = typeof draft.questions === "string"
        ? JSON.parse(draft.questions)
        : draft.questions;
      return Array.isArray(parsed) && parsed.length ? parsed : [blankQuestion()];
    } catch {
      return [blankQuestion()];
    }
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // ── Question helpers ──────────────────────────────────────────────────

  const updateQuestion = (qId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
    );
  };

  const updateAnswer = (qId, answerIdx, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: q.answers.map((a, i) => (i === answerIdx ? value : a)) }
          : q
      )
    );
  };

  const setCorrect = (qId, answerIdx) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, correctIndex: answerIdx } : q))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, blankQuestion()]);
    // Scroll to bottom after render
    setTimeout(() => {
      const el = document.querySelector(".qbm-questions-list");
      if (el) el.scrollTop = el.scrollHeight;
    }, 80);
  };

  const removeQuestion = (qId) => {
    if (questions.length === 1) return; // keep at least 1
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const duplicateQuestion = (qId) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;
    const copy = { ...q, id: Date.now() + Math.random() };
    const idx = questions.indexOf(q);
    setQuestions((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  // ── Validation ────────────────────────────────────────────────────────

  const validateStep = () => {
    if (step === 1 && !title.trim()) return "Please enter a title.";
    if (step === 4) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) return `Question ${i + 1} needs a question prompt.`;
        const filled = q.answers.filter((a) => a.trim());
        if (filled.length < 2) return `Question ${i + 1} needs at least 2 answer choices.`;
        if (q.correctIndex === null) return `Question ${i + 1} needs a correct answer selected.`;
        if (!q.answers[q.correctIndex]?.trim())
          return `Question ${i + 1}: the selected correct answer is empty.`;
      }
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };

  // ── Supabase persist helpers ──────────────────────────────────────────

  const buildPayload = (status) => ({
    title: title.trim(),
    description: description.trim(),
    visibility,
    type: "Quiz",
    status,                          // "draft" | "published"
    questions: JSON.stringify(questions),
    author_id: currentUser?.id,
    author_username: currentUser?.user_metadata?.username || currentUser?.email,
    likes: 0,
    dislikes: 0,
  });

  const persist = async (status) => {
    // If editing an existing draft, update it; otherwise insert
    if (draft?.id) {
      const { data, error: err } = await supabase
        .from("resources")
        .update({ ...buildPayload(status), updated_at: new Date().toISOString() })
        .eq("id", draft.id)
        .select()
        .single();
      if (err) throw err;
      return data;
    } else {
      const { data, error: err } = await supabase
        .from("resources")
        .insert([buildPayload(status)])
        .select()
        .single();
      if (err) throw err;
      return data;
    }
  };

  // ── Save as draft ─────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!title.trim()) { setError("Please enter a title before saving."); return; }
    setSaving(true);
    setError("");
    try {
      const saved = await persist("draft");
      onSaveSuccess?.(saved, !!draft?.id); // (record, isUpdate)
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  // ── Publish ───────────────────────────────────────────────────────────

  const handlePublish = async () => {
    const err = validateStep(); // revalidate questions step
    if (err) { setError(err); return; }
    setPublishing(true);
    setError("");
    try {
      const published = await persist("published");
      onPublishSuccess?.(published, !!draft?.id);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to publish quiz.");
    } finally {
      setPublishing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="qbm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qbm-modal">

        {/* ── Header ── */}
        <div className="qbm-header">
          <div className="qbm-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="18" rx="2"/>
              <polyline points="7,9 9,11 13,7"/>
              <polyline points="7,13 9,15 13,11"/>
              <line x1="15" y1="8" x2="19" y2="8"/>
              <line x1="15" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h2 className="qbm-title">{draft ? "Edit Quiz" : "Make a Quiz"}</h2>
            <p className="qbm-subtitle">
              {draft ? `Editing draft: ${draft.title}` : "Build a shareable multiple-choice quiz"}
            </p>
          </div>
          <button className="qbm-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Steps indicator ── */}
        <div className="qbm-steps">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`qbm-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}
            >
              <div className="qbm-step-dot">
                {step > i + 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                ) : (i + 1)}
              </div>
              <span className="qbm-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="qbm-body">

          {/* Step 1 — Title */}
          {step === 1 && (
            <div className="qbm-field-group">
              <label className="qbm-label">Give your quiz a title</label>
              <input
                className="qbm-input"
                type="text"
                placeholder="e.g. Chapter 3 Review"
                value={title}
                maxLength={80}
                autoFocus
                onChange={(e) => { setTitle(e.target.value); setError(""); }}
              />
              <span className="qbm-char-count">{title.length}/80</span>
            </div>
          )}

          {/* Step 2 — Visibility */}
          {step === 2 && (
            <div className="qbm-field-group">
              <label className="qbm-label">Who can see this quiz?</label>
              <div className="qbm-visibility-grid">
                {[
                  {
                    val: "public",
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    ),
                    label: "Public",
                    sub: "Visible to everyone in Resources",
                  },
                  {
                    val: "private",
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    ),
                    label: "Private",
                    sub: "Only visible to you in My Content",
                  },
                ].map(({ val, icon, label, sub }) => (
                  <button
                    key={val}
                    className={`qbm-vis-card ${visibility === val ? "selected" : ""}`}
                    onClick={() => setVisibility(val)}
                  >
                    <div className="qbm-vis-icon">{icon}</div>
                    <div className="qbm-vis-info">
                      <strong>{label}</strong>
                      <span>{sub}</span>
                    </div>
                    {visibility === val && <div className="qbm-vis-check">✓</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Description */}
          {step === 3 && (
            <div className="qbm-field-group">
              <label className="qbm-label">
                Add a short description <span className="qbm-optional">(optional)</span>
              </label>
              <textarea
                className="qbm-textarea"
                placeholder="What topics does this quiz cover? Who is it for?"
                value={description}
                maxLength={300}
                rows={4}
                autoFocus
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="qbm-char-count">{description.length}/300</span>
            </div>
          )}

          {/* Step 4 — Questions */}
          {step === 4 && (
            <div className="qbm-questions-wrap">
              <div className="qbm-questions-meta">
                <span className="qbm-questions-count">
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </span>
                <button className="qbm-add-btn" onClick={addQuestion}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Question
                </button>
              </div>

              <div className="qbm-questions-list">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="qbm-question-card">
                    {/* Question card header */}
                    <div className="qbm-qcard-header">
                      <span className="qbm-qcard-num">Q{qIdx + 1}</span>
                      <div className="qbm-qcard-actions">
                        <button
                          className="qbm-qcard-action"
                          title="Duplicate"
                          onClick={() => duplicateQuestion(q.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                        <button
                          className="qbm-qcard-action qbm-qcard-delete"
                          title="Remove"
                          disabled={questions.length === 1}
                          onClick={() => removeQuestion(q.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Question prompt */}
                    <input
                      className="qbm-input qbm-question-input"
                      type="text"
                      placeholder={`Question ${qIdx + 1}`}
                      value={q.question}
                      onChange={(e) => { updateQuestion(q.id, "question", e.target.value); setError(""); }}
                    />

                    {/* Answer choices */}
                    <div className="qbm-answers-grid">
                      {q.answers.map((ans, aIdx) => (
                        <div
                          key={aIdx}
                          className={`qbm-answer-row ${q.correctIndex === aIdx ? "qbm-answer-correct" : ""}`}
                        >
                          {/* Correct radio */}
                          <button
                            className={`qbm-correct-btn ${q.correctIndex === aIdx ? "selected" : ""}`}
                            title="Mark as correct answer"
                            onClick={() => { setCorrect(q.id, aIdx); setError(""); }}
                            aria-label={`Mark answer ${aIdx + 1} as correct`}
                          >
                            {q.correctIndex === aIdx ? (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="9,12 11,14 15,10" stroke="white" strokeWidth="2" fill="none"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9"/>
                              </svg>
                            )}
                          </button>

                          {/* Letter badge */}
                          <span className="qbm-answer-letter">
                            {["A", "B", "C", "D"][aIdx]}
                          </span>

                          {/* Answer input */}
                          <input
                            className="qbm-input qbm-answer-input"
                            type="text"
                            placeholder={`Answer ${["A", "B", "C", "D"][aIdx]}`}
                            value={ans}
                            onChange={(e) => updateAnswer(q.id, aIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Correct answer hint */}
                    {q.correctIndex !== null && q.answers[q.correctIndex]?.trim() && (
                      <div className="qbm-correct-hint">
                        ✓ Correct: {["A", "B", "C", "D"][q.correctIndex]}. {q.answers[q.correctIndex]}
                      </div>
                    )}
                  </div>
                ))}

                {/* Bottom add button */}
                <button className="qbm-add-question-bottom" onClick={addQuestion}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Another Question
                </button>
              </div>
            </div>
          )}

          {error && <div className="qbm-error">{error}</div>}
        </div>

        {/* ── Footer ── */}
        <div className="qbm-footer">
          <button
            className="qbm-btn qbm-btn-secondary"
            onClick={() => step > 1 ? (setStep((s) => s - 1), setError("")) : onClose()}
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          <div className="qbm-footer-right">
            {/* Save & Exit — always available from step 1 onward if title exists */}
            <button
              className="qbm-btn qbm-btn-draft"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              title="Save as draft to continue later"
            >
              {saving ? <span className="qbm-spinner" /> : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17,21 17,13 7,13 7,21"/>
                    <polyline points="7,3 7,8 15,8"/>
                  </svg>
                  Save & Exit
                </>
              )}
            </button>

            {step < 4 ? (
              <button className="qbm-btn qbm-btn-primary" onClick={nextStep}>
                Next →
              </button>
            ) : (
              <button
                className="qbm-btn qbm-btn-publish"
                onClick={handlePublish}
                disabled={publishing || saving}
              >
                {publishing ? <span className="qbm-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                    Publish
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}