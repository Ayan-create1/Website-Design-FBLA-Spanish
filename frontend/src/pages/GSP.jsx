// ─────────────────────────────────────────────────────────────────────────────
// GroupStudyPage.jsx
//
// A full-page React component for browsing and creating group study sessions.
// Built with Supabase for the backend (auth + database).
//
// Features:
//   - View all study sessions in a card grid
//   - Filter by Upcoming / All / My Sessions (includes sessions you've joined)
//   - Create a new session with a real Google Meet link (logged-in users only)
//   - Register for a session — Join button becomes "View Meet Link" after joining
//   - Session creators can view their Meet link directly on the card
//   - Toast notifications for user feedback
//
// Supabase tables required:
//   - study_sessions        (see supabase_schema.sql)
//   - session_registrations (see supabase_schema.sql)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient"; // adjust path if needed

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .gsp-root {
    font-family: inherit;
    min-height: 100vh;
    color: #7A5230;
  }

  /* ── Header ── */
  .gsp-header {
    padding: 56px 48px 0;
    max-width: 1100px;
    margin: 0 auto;
  }
  .gsp-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 10px;
  }
  .gsp-title {
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.05;
    color: #111;
  }
  .gsp-title em { font-style: italic; color: #d4895c; }
  .gsp-subtitle {
    margin-top: 14px;
    font-size: 15px;
    color: #7A5230;
    font-weight: 400;
    max-width: 480px;
    line-height: 1.6;
    text-align: center;
    margin-left: auto;
    margin-right: auto;

  }
  .gsp-header-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 32px;
    padding-bottom: 28px;
    border-bottom: 1px solid #7A5230;
  }

  /* ── Buttons ── */
  .gsp-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s ease;
    border: none;
    letter-spacing: normal;

  }
  .gsp-btn-primary {letter-spacing: normal; background: #d4895c; color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 600}
  .gsp-btn-primary:hover { background: #faf2ed; transform: translateY(-1px); color: #111}
  .gsp-btn-ghost { background: transparent; color: #555; border: 1px solid #ddd; }
  .gsp-btn-ghost:hover { border-color: #aaa; color: #111; }
  .gsp-btn-green {
    background: #d4895c; color: #fff;
    width: 100%; justify-content: center;
    padding: 13px; font-size: 15px;
  }
  .gsp-btn-green:hover { background: #d4895c; }
  .gsp-btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 6px; }
  .gsp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  /* ── Toast ── */
  .gsp-toast {
    position: fixed;
    bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #1a1a1a; color: #fff;
    padding: 13px 22px; border-radius: 10px;
    font-size: 14px; font-weight: 500;
    z-index: 999; opacity: 0;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    white-space: nowrap;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  }
  .gsp-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .gsp-toast.success { background: #3d6b4f; }
  .gsp-toast.error   { background: #c0392b; }

  /* ── Modal ── */
  .gsp-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .gsp-modal {
    background: #fff; border-radius: 16px; padding: 36px;
    width: 100%; max-width: 520px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.14);
    animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .gsp-modal-title {font-size: 26px; font-weight: 700; margin-bottom: 6px; }
  .gsp-modal-sub { font-size: 13px; color: #888; margin-bottom: 28px; }

  /* ── Form ── */
  .gsp-field { margin-bottom: 18px; }
  .gsp-label {
    display: block; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em;
    color: #555; margin-bottom: 7px;
  }
  .gsp-input, .gsp-textarea {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid #e0ddd9; border-radius: 8px;
    color: #1a1a1a; background: #fdfcfb;
    transition: border-color 0.15s; outline: none;
  }
  .gsp-input:focus, .gsp-textarea:focus { border-color: #d4895c; }
  .gsp-textarea { resize: vertical; min-height: 88px; line-height: 1.5; }
  .gsp-modal-footer { display: flex; gap: 10px; margin-top: 24px; }

  /* ── Main / Grid ── */
  .gsp-main { max-width: 1100px; margin: 0 auto; padding: 36px 48px 80px; }
  .gsp-filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; flex-wrap: wrap; }
  .gsp-filter-label { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #7A5230; }
  .gsp-chip {
    font-family: 'DM Sans', sans-serif;
    padding: 6px 14px; border-radius: 99px;
    border: 1.5px solid #e0ddd9; font-size: 13px; font-weight: 500;
    color: #080300;; background: #faf2ed; cursor: pointer;
    transition: all 0.15s; 
  }
  .gsp-chip:hover { border-color: #d4895c; color: #d4895c; }
  .gsp-chip.active { background: #d4895c; border-color: #d4895c; color: #fff; }
  .gsp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

  /* ── Card ── */
  .gsp-card {
    background: #fff; border-radius: 14px; border: 1px solid #ece9e4;
    overflow: hidden; transition: box-shadow 0.2s, transform 0.2s;
    display: flex; flex-direction: column;
  }
  .gsp-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .gsp-card-accent { height: 4px; background: linear-gradient(90deg,#d4895c, #b87040); }
  .gsp-card-body { padding: 22px 24px; flex: 1; }
  .gsp-card-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; font-weight: 500; margin-bottom: 10px; }
  .gsp-card-dot { width: 3px; height: 3px; border-radius: 50%; background: #ccc; }
  .gsp-card-title { font-size: 1rem; font-weight: 700; line-height: 1.2; color: #111; margin-bottom: 10px; }
  .gsp-card-desc {
    font-size: 14px; color: #666; line-height: 1.6;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }
  .gsp-card-footer {
    padding: 16px 24px; border-top: 1px solid #f0ede9;
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .gsp-attendees { font-size: 12px; color: #888; font-weight: 500; }
  .gsp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .gsp-badge-upcoming { background: #faefe1; color: #d4895c }
  .gsp-badge-past     { background: #faefe1; color: #d4895c; }

  /* ── Meet link style (used on cards for owner + registered users) ── */
  .gsp-meet-link {
    font-size: 12px; color: #d4895c; font-weight: 600;
    text-decoration: none; border-bottom: 1px dashed #d4895c;
  }

  /* ── Empty state ── */
  .gsp-empty { grid-column: 1/-1; text-align: center; padding: 80px 20px; color: #aaa; }
  .gsp-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .gsp-empty-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #bbb; margin-bottom: 8px; }
  .gsp-empty-text { font-size: 14px; }

  /* ── Spinner ── */
  .gsp-spinner {
    width: 36px; height: 36px;
    border: 3px solid #eee; border-top-color: #d4895c;
    border-radius: 50%; animation: spin 0.7s linear infinite;
    margin: 60px auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .gsp-header, .gsp-main { padding-left: 20px; padding-right: 20px; }
    .gsp-header { padding-top: 36px; }
    .gsp-modal { padding: 24px 20px; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Formats an ISO timestamp into a readable string like "Fri, Nov 15, 2:00 PM"
function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// Returns true if the session's scheduled time has already passed
function isPast(iso) {
  return new Date(iso) < new Date();
}

// ─── Hook: useToast ───────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ msg: "", type: "", visible: false });
  const show = (msg, type = "success") => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3200);
  };
  return { toast, show };
}

// ─── Component: CreateModal ───────────────────────────────────────────────────
// Lets a logged-in user create a new study session.
// The creator pastes their own Google Meet link — no auto-generation.
function CreateModal({ onClose, onCreated, user }) {
  const [form, setForm] = useState({ title: "", scheduled_at: "", description: "", meet_link: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.scheduled_at || !form.meet_link.trim()) {
      setError("Title, time, and Meet link are required.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("study_sessions").insert([{
      title:         form.title.trim(),
      description:   form.description.trim(),
      scheduled_at:  new Date(form.scheduled_at).toISOString(),
      meet_link:     form.meet_link.trim(),
      created_by:    user.id,
      creator_email: user.email,
    }]);

    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated();
    onClose();
  };

  return (
    <div className="gsp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gsp-modal">
        <div className="gsp-modal-title">New Study Session</div>
        <div className="gsp-modal-sub">Fill in the details and paste your Google Meet link.</div>

        {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div className="gsp-field">
          <label className="gsp-label">Session Title</label>
          <input className="gsp-input" placeholder="e.g. Spanish Conjugation Practice" value={form.title} onChange={set("title")} />
        </div>
        <div className="gsp-field">
          <label className="gsp-label">Date & Time</label>
          <input className="gsp-input" type="datetime-local" value={form.scheduled_at} onChange={set("scheduled_at")} />
        </div>
        <div className="gsp-field">
          <label className="gsp-label">Description</label>
          <textarea className="gsp-textarea" placeholder="What will you cover? Any materials to bring?" value={form.description} onChange={set("description")} />
        </div>
        <div className="gsp-field">
          <label className="gsp-label">Google Meet Link</label>
          <input className="gsp-input" placeholder="https://meet.google.com/xxx-yyyy-zzz" value={form.meet_link} onChange={set("meet_link")} />
        </div>
        <div className="gsp-modal-footer">
          <button className="gsp-btn gsp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="gsp-btn gsp-btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component: RegisterModal ─────────────────────────────────────────────────
// Two-phase modal:
//   Phase 1 — shows session info and a "Register & Get Link" button
//   Phase 2 — shows the Google Meet link after successful registration
function RegisterModal({ session, onClose, user, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("session_registrations").insert([{
      session_id: session.id,
      user_id:    user.id,
      user_email: user.email,
    }]);

    setLoading(false);

    if (err) {
      // 23505 = unique_violation — user is already registered
      if (err.code === "23505") setError("You're already registered for this session.");
      else setError(err.message);
      return;
    }

    setDone(true);
    onRegistered?.();
  };

  return (
    <div className="gsp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gsp-modal">
        {!done ? (
          <>
            <div className="gsp-modal-title">Join Session</div>
            <div className="gsp-modal-sub">{formatDate(session.scheduled_at)}</div>
            <div style={{ fontSize: 20, margin: "16px 0 8px" }}>
              {session.title}
            </div>
            {session.description && (
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 16 }}>{session.description}</p>
            )}
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              Once you register, you'll get the Google Meet link to join this session.
            </p>
            {error && <div style={{ color: "#c0392b", fontSize: 13, marginTop: 12 }}>{error}</div>}
            <div className="gsp-modal-footer">
              <button className="gsp-btn gsp-btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="gsp-btn gsp-btn-green" style={{ flex: 2 }} onClick={handleRegister} disabled={loading}>
                {loading ? "Registering…" : "Register & Get Link"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div className="gsp-modal-title" style={{ marginBottom: 8 }}>You're registered!</div>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
              Here's your Google Meet link for <strong>{session.title}</strong>:
            </p>
            <a
              href={session.meet_link}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", background: "#f0f7f3",
                border: "1.5px solid #c5dfc9", borderRadius: 10,
                padding: "14px 16px", color: "#d4895c",
                fontWeight: 600, fontSize: 14,
                wordBreak: "break-all", textDecoration: "none",
              }}
            >
              {session.meet_link}
            </a>
            <button
              className="gsp-btn gsp-btn-primary"
              style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component: SessionCard ───────────────────────────────────────────────────
// Renders a single session card. The footer action changes based on context:
//   - Owner:           "View Meet Link" (always)
//   - Registered user: "View Meet Link" (replaces Join after registering)
//   - Unregistered:    "Join" button (only if session is upcoming)
//   - Not logged in:   nothing shown
function SessionCard({ session, user, onRegister, myRegistrations }) {
  const past = isPast(session.scheduled_at);
  const isOwner = user?.id === session.created_by;
  const isRegistered = myRegistrations?.includes(session.id);

  return (
    <div className="gsp-card">
      <div className="gsp-card-accent" />
      <div className="gsp-card-body">
        <div className="gsp-card-meta">
          <span>{formatDate(session.scheduled_at)}</span>
          <span className="gsp-card-dot" />
          <span>{session.creator_email?.split("@")[0]}</span>
        </div>
        <div className="gsp-card-title">{session.title}</div>
        {session.description && <p className="gsp-card-desc">{session.description}</p>}
      </div>

      <div className="gsp-card-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`gsp-badge ${past ? "gsp-badge-past" : "gsp-badge-upcoming"}`}>
            {past ? "📁 Past" : "🟠 Upcoming"}
          </span>
          <span className="gsp-attendees">{session.registration_count ?? 0} joined</span>
        </div>

        {/* Owner: always show their Meet link */}
        {isOwner && (
          <a href={session.meet_link} target="_blank" rel="noreferrer" className="gsp-meet-link">
            View Meet Link
          </a>
        )}

        {/* Non-owner, upcoming, not yet registered: show Join button */}
        {!isOwner && !past && user && !isRegistered && (
          <button className="gsp-btn gsp-btn-primary gsp-btn-sm" onClick={() => onRegister(session)}>
            Join
          </button>
        )}

        {/* Non-owner, upcoming, already registered: show Meet link */}
        {!isOwner && !past && user && isRegistered && (
          <a href={session.meet_link} target="_blank" rel="noreferrer" className="gsp-meet-link">
            View Meet Link
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Component: GroupStudyPage ────────────────────────────────────────────────
export default function GroupStudyPage() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [registerTarget, setRegisterTarget] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [myRegistrations, setMyRegistrations] = useState([]); // session_ids the user has joined
  const { toast, show: showToast } = useToast();

  // Fetches all sessions the current user has registered for.
  // Accepts the user object directly to avoid stale closure issues.
  const fetchMyRegistrations = async (currentUser) => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("user_id", currentUser.id);
    if (data) setMyRegistrations(data.map((r) => r.session_id));
  };

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Get the current user on mount, then immediately fetch their registrations
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      if (data?.user) fetchMyRegistrations(data.user);
    });

    // Keep user state in sync on login/logout events
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      setUser(s?.user ?? null);
      if (s?.user) fetchMyRegistrations(s.user);
      else setMyRegistrations([]); // clear registrations on logout
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Fetch all sessions ─────────────────────────────────────────────────────
  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_sessions")
      .select(`*, registration_count:session_registrations(count)`)
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setSessions(data.map((s) => ({
        ...s,
        registration_count: s.registration_count?.[0]?.count ?? 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  // "mine" includes both sessions you created AND sessions you've registered for
  const filtered = sessions.filter((s) => {
    if (filter === "upcoming") return !isPast(s.scheduled_at);
    if (filter === "mine") return s.created_by === user?.id || myRegistrations.includes(s.id);
    return true;
  });

  return (
    <>
      <style>{styles}</style>
      <div className="gsp-root">

        {/* ── Header ── */}
        <header className="gsp-header">
          <h1 className="gsp-title">Group Study Sessions </h1>
          <p className="gsp-subtitle">
            Browse upcoming study sessions or create one — paste your Google Meet link when creating.
          </p>
          <div className="gsp-header-row">
            <div className="gsp-filter-bar" style={{ margin: 0 }}>
              
              {["upcoming", "all", "mine"].map((f) => (
                <button
                  key={f}
                  className={`gsp-chip ${filter === f ? "active" : ""}`}
                  onClick={() => {
                    if (f === "mine" && !user) { showToast("Sign in to see your sessions", "error"); return; }
                    setFilter(f);
                  }}
                >
                  {f === "upcoming" ? "Upcoming" : f === "all" ? "All Sessions" : "My Sessions"}
                </button>
              ))}
            </div>
            {user ? (
              <button className="gsp-btn gsp-btn-primary" onClick={() => setShowCreate(true)}>
                +     NEW SESSION
              </button>
            ) : (
              <span style={{ fontSize: 13, color: "#aaa" }}>Sign in to create a session</span>
            )}
          </div>
        </header>

        {/* ── Grid ── */}
        <main className="gsp-main">
          {loading ? (
            <div className="gsp-spinner" />
          ) : (
            <div className="gsp-grid">
              {filtered.length === 0 ? (
                <div className="gsp-empty">
                  <div className="gsp-empty-icon">📚</div>
                  <div className="gsp-empty-title">
                    {filter === "mine" ? "No sessions yet" : "No sessions found"}
                  </div>
                  <p className="gsp-empty-text">
                    {filter === "mine" ? "Create or join a session to see it here." : "Be the first to schedule one!"}
                  </p>
                </div>
              ) : (
                filtered.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    user={user}
                    onRegister={setRegisterTarget}
                    myRegistrations={myRegistrations}
                  />
                ))
              )}
            </div>
          )}
        </main>

        {/* ── Modals ── */}
        {showCreate && (
          <CreateModal
            user={user}
            onClose={() => setShowCreate(false)}
            onCreated={() => { fetchSessions(); showToast("Session created! 🎉"); }}
          />
        )}
        {registerTarget && (
          <RegisterModal
            session={registerTarget}
            user={user}
            onClose={() => setRegisterTarget(null)}
            onRegistered={() => {
              fetchSessions();
              fetchMyRegistrations(user); // pass user directly to avoid stale closure
              showToast("Registered! Check your Meet link.");
            }}
          />
        )}

        {/* ── Toast ── */}
        <div className={`gsp-toast ${toast.type} ${toast.visible ? "show" : ""}`}>
          {toast.msg}
        </div>

      </div>
    </>
  );
}