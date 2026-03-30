import { useState, useEffect, useRef } from "react";
import supabase from '../helper/supabaseClient';
import ResourceCard from "./Resourcescard";
import ResourceDetailModal from "./Resourcesdetailmodal";
import "./History.css";
import welcomeBanner from "../assets/welcome.png";

// Formats an ISO timestamp into a readable string like "Fri, Nov 15, 2:00 PM"
function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function isPast(iso) {
  return new Date(iso) < new Date();
}

// ─── Component: StudySessionCard ──────────────────────────────────────────────
function StudySessionCard({ session, isOwner }) {
  const past = isPast(session.scheduled_at);
  const statusLabel = past ? "Past session" : "Upcoming session";
  const roleLabel = isOwner ? "Hosted by you" : "Registered";

  return (
    <article
      className="hp-study-card"
      aria-label={`${statusLabel}: ${session.title}, ${formatDate(session.scheduled_at)}, ${roleLabel}`}
    >
      <div className="hp-study-card-accent" aria-hidden="true" />
      <div className="hp-study-card-body">
        <div className="hp-study-card-meta">
          <span
            className={`hp-study-badge ${past ? "hp-study-badge-past" : "hp-study-badge-upcoming"}`}
            aria-label={statusLabel}
          >
            {past ? "📁 Past" : "🟠 Upcoming"}
          </span>
          <span className="hp-study-role" aria-label={`Your role: ${roleLabel}`}>
            {isOwner ? "Hosted by you" : "Registered"}
          </span>
        </div>
        <div className="hp-study-card-title">{session.title}</div>
        <div className="hp-study-card-date">
          <time dateTime={session.scheduled_at}>{formatDate(session.scheduled_at)}</time>
        </div>
        {session.description && (
          <p className="hp-study-card-desc">{session.description}</p>
        )}
      </div>
      <div className="hp-study-card-footer">
        <span className="hp-study-attendees" aria-label={`${session.registration_count ?? 0} people joined`}>
          {session.registration_count ?? 0} joined
        </span>
        <a
          href={session.meet_link}
          target="_blank"
          rel="noreferrer"
          className="hp-study-meet-btn"
          aria-label={`Open Google Meet link for ${session.title} (opens in new tab)`}
        >
          Open Meet Link ↗
        </a>
      </div>
    </article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [myContent, setMyContent] = useState([]);
  const [savedContent, setSavedContent] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyLoading, setStudyLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  const [studyFilter, setStudyFilter] = useState("upcoming"); // "upcoming" | "past" | "all"
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  // Live region for dynamic announcements
  const liveRef = useRef(null);
  const announce = (msg) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        fetchContent(data.user.id);
        fetchStudySessions(data.user.id);
      } else {
        setLoading(false);
        setStudyLoading(false);
      }
    });
  }, []);

  // Fetches sessions the user created OR registered for
  const fetchStudySessions = async (userId) => {
    setStudyLoading(true);

    const { data: created, error: createdError } = await supabase
      .from("study_sessions")
      .select(`*, registration_count:session_registrations(count)`)
      .eq("created_by", userId)
      .order("scheduled_at", { ascending: false });

    if (createdError) console.error("fetchStudySessions [created]:", createdError);

    const { data: registrations, error: regError } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("user_id", userId);

    if (regError) console.error("fetchStudySessions [registrations]:", regError);

    const registeredIds = registrations?.map((r) => r.session_id) ?? [];

    let registeredSessions = [];
    if (registeredIds.length > 0) {
      const { data: regSessions, error: regSessionsError } = await supabase
        .from("study_sessions")
        .select(`*, registration_count:session_registrations(count)`)
        .in("id", registeredIds)
        .neq("created_by", userId)
        .order("scheduled_at", { ascending: false });

      if (regSessionsError) console.error("fetchStudySessions [regSessions]:", regSessionsError);
      registeredSessions = regSessions ?? [];
    }

    const normalize = (s, isOwner) => ({
      ...s,
      registration_count: s.registration_count?.[0]?.count ?? 0,
      isOwner,
    });

    const all = [
      ...(created ?? []).map((s) => normalize(s, true)),
      ...registeredSessions.map((s) => normalize(s, false)),
    ];

    all.sort((a, b) => {
      const aPast = isPast(a.scheduled_at);
      const bPast = isPast(b.scheduled_at);
      if (aPast !== bPast) return aPast ? 1 : -1;
      return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    });

    setStudySessions(all);
    setStudyLoading(false);
  };

  const fetchContent = async (userId) => {
    setLoading(true);

    const { data: mine } = await supabase
      .from("resources")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    const { data: saved } = await supabase
      .from("saved_resources")
      .select("resource_id, resources(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setMyContent(mine || []);
    setSavedContent(saved?.map((s) => ({ ...s.resources, is_saved: true })) || []);

    const { data: completed } = await supabase
      .from("completed_quizzes")
      .select("resource_id, completed_at, resources(*)")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    setCompletedQuizzes(
      completed?.map((c) => ({ ...c.resources, completed_at: c.completed_at })) || []
    );
    setLoading(false);
  };

  const handleVote = async (resourceId, type, previousVote) => {
    if (!currentUser) return;
    const { data: existing } = await supabase
      .from("resource_votes")
      .select("*")
      .eq("resource_id", resourceId)
      .eq("user_id", currentUser.id)
      .single();

    if (existing) {
      if (existing.vote_type === type) {
        await supabase.from("resource_votes").delete().eq("id", existing.id);
        await supabase.rpc("decrement_vote", { resource_id: resourceId, col: type === "like" ? "likes" : "dislikes" });
      } else {
        await supabase.from("resource_votes").update({ vote_type: type }).eq("id", existing.id);
        await supabase.rpc("switch_vote", {
          resource_id: resourceId,
          add_col: type === "like" ? "likes" : "dislikes",
          remove_col: type === "like" ? "dislikes" : "likes",
        });
      }
    } else {
      await supabase.from("resource_votes").insert({ resource_id: resourceId, user_id: currentUser.id, vote_type: type });
      await supabase.rpc("increment_vote", { resource_id: resourceId, col: type === "like" ? "likes" : "dislikes" });
    }
  };

  const handleSave = async (resourceId, shouldSave) => {
    if (!currentUser) return;
    if (shouldSave) {
      await supabase.from("saved_resources").insert({ resource_id: resourceId, user_id: currentUser.id });
    } else {
      await supabase.from("saved_resources").delete()
        .eq("resource_id", resourceId)
        .eq("user_id", currentUser.id);
      setSavedContent((prev) => prev.filter((r) => r.id !== resourceId));
    }
  };

  const handlePerfectScore = async (resourceId) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ No current user");
      return;
    }
    console.log("🔥 handlePerfectScore fired", resourceId, user.id);

    const { error: upsertError } = await supabase.from("completed_quizzes").upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,resource_id" }
    );

    if (upsertError) {
      console.error("❌ upsert failed:", upsertError);
      return;
    }

    console.log("✅ upsert succeeded");

    const { data, error: fetchError } = await supabase
      .from("completed_quizzes")
      .select("resource_id, completed_at, resources(*)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (fetchError) {
      console.error("❌ re-fetch failed:", fetchError);
      return;
    }

    setCompletedQuizzes(
      data?.map((c) => ({ ...c.resources, completed_at: c.completed_at })) || []
    );
    announce("Quiz marked as completed with a perfect score.");
  };

  if (!currentUser && !loading && !studyLoading) {
    return (
      <div className="hp-page" role="main" aria-label="History page">
        <div className="hp-unauthenticated" role="alert">
          <p>Please sign in to view your content history.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="hp-page" aria-label="Your history and activity">

      {/* Visually hidden live region for dynamic announcements */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
      />

      <img
        src={welcomeBanner}
        alt="Bienvenidos a su Casa de Español"
        style={{ width: "100%", borderRadius: "30px", display: "block", marginBottom: "-110px", marginTop: "-100px" }}
      />

      {/* ── GROUP STUDY SESSIONS ── */}
      <section className="hp-section" aria-labelledby="study-sessions-heading">
        <div className="hp-section-header hp-section-header--study">
          <h2 id="study-sessions-heading" className="hp-section-title">GROUP STUDY SESSIONS</h2>
          {!studyLoading && (
            <span
              className="hp-section-count"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${studySessions.filter(s =>
                studyFilter === "all" ? true :
                studyFilter === "upcoming" ? !isPast(s.scheduled_at) :
                isPast(s.scheduled_at)
              ).length} sessions shown`}
            >
              {studySessions.filter(s =>
                studyFilter === "all" ? true :
                studyFilter === "upcoming" ? !isPast(s.scheduled_at) :
                isPast(s.scheduled_at)
              ).length} session{studySessions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filter toggle pills */}
        <div
          className="hp-study-filter-bar"
          role="group"
          aria-label="Filter study sessions by time"
        >
          {["upcoming", "past", "all"].map((f) => (
            <button
              key={f}
              className={`hp-study-filter-chip ${studyFilter === f ? "active" : ""}`}
              onClick={() => {
                setStudyFilter(f);
                announce(`Showing ${f} study sessions.`);
              }}
              aria-pressed={studyFilter === f}
              aria-label={`Show ${f} study sessions`}
            >
              {f === "upcoming" ? "🟠 Upcoming" : f === "past" ? "📁 Past" : "All"}
            </button>
          ))}
        </div>

        {studyLoading ? (
          <div className="hp-loading" role="status" aria-label="Loading study sessions">
            <div className="hp-spinner" aria-hidden="true" />
          </div>
        ) : (() => {
          const filtered = studySessions.filter(s =>
            studyFilter === "all" ? true :
            studyFilter === "upcoming" ? !isPast(s.scheduled_at) :
            isPast(s.scheduled_at)
          );
          return filtered.length === 0 ? (
            <p className="hp-empty-text" role="status">
              {studySessions.length === 0
                ? "No study sessions yet. Create or join one from the Group Study page!"
                : `No ${studyFilter} sessions.`}
            </p>
          ) : (
            <div
              className="hp-study-grid"
              role="list"
              aria-label={`${studyFilter} study sessions`}
            >
              {filtered.map((s) => (
                <div role="listitem" key={s.id}>
                  <StudySessionCard session={s} isOwner={s.isOwner} />
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* ── MY CONTENT ── */}
      <section className="hp-section" aria-labelledby="my-content-heading">
        <div className="hp-section-header">
          <h2 id="my-content-heading" className="hp-section-title">MY CONTENT</h2>
          {!loading && (
            <span
              className="hp-section-count"
              aria-label={`${myContent.length} item${myContent.length !== 1 ? "s" : ""} uploaded`}
            >
              {myContent.length} item{myContent.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="hp-loading" role="status" aria-label="Loading your content">
            <div className="hp-spinner" aria-hidden="true" />
          </div>
        ) : myContent.length === 0 ? (
          <p className="hp-empty-text" role="status">You haven't uploaded anything yet.</p>
        ) : (
          <div
            className="hp-cards-grid"
            role="list"
            aria-label={`Your uploaded resources, ${myContent.length} item${myContent.length !== 1 ? "s" : ""}`}
          >
            {myContent.map((r) => (
              <div role="listitem" key={r.id}>
                <ResourceCard
                  resource={{ ...r, author_username: "me" }}
                  currentUser={currentUser}
                  onVote={handleVote}
                  onSave={handleSave}
                  onClick={setSelectedResource}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SAVED CONTENT ── */}
      <section className="hp-section" aria-labelledby="saved-content-heading">
        <div className="hp-section-header">
          <h2 id="saved-content-heading" className="hp-section-title">SAVED CONTENT</h2>
          {!loading && (
            <span
              className="hp-section-count"
              aria-label={`${savedContent.length} saved item${savedContent.length !== 1 ? "s" : ""}`}
            >
              {savedContent.length} item{savedContent.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="hp-loading" role="status" aria-label="Loading saved content">
            <div className="hp-spinner" aria-hidden="true" />
          </div>
        ) : savedContent.length === 0 ? (
          <p className="hp-empty-text" role="status">
            No saved resources yet. Bookmark items from the Resources page!
          </p>
        ) : (
          <div
            className="hp-cards-grid"
            role="list"
            aria-label={`Saved resources, ${savedContent.length} item${savedContent.length !== 1 ? "s" : ""}`}
          >
            {savedContent.map((r) => (
              <div role="listitem" key={r.id}>
                <ResourceCard
                  resource={r}
                  currentUser={currentUser}
                  onVote={handleVote}
                  onSave={handleSave}
                  onClick={setSelectedResource}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMPLETED QUIZZES ── */}
      <section className="hp-section" aria-labelledby="completed-quizzes-heading">
        <div className="hp-section-header">
          <h2 id="completed-quizzes-heading" className="hp-section-title">
            COMPLETED QUIZZES (PERFECT SCORES)
          </h2>
          {!loading && (
            <span
              className="hp-section-count"
              aria-label={`${completedQuizzes.length} completed quiz${completedQuizzes.length !== 1 ? "zes" : ""}`}
            >
              {completedQuizzes.length} quiz{completedQuizzes.length !== 1 ? "zes" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="hp-loading" role="status" aria-label="Loading completed quizzes">
            <div className="hp-spinner" aria-hidden="true" />
          </div>
        ) : completedQuizzes.length === 0 ? (
          <p className="hp-empty-text" role="status">
            No completed quizzes yet — get a perfect score to earn one!
          </p>
        ) : (
          <div
            className="hp-cards-grid"
            role="list"
            aria-label={`Completed quizzes with perfect scores, ${completedQuizzes.length} quiz${completedQuizzes.length !== 1 ? "zes" : ""}`}
          >
            {completedQuizzes.map((r) => (
              <div role="listitem" key={r.id}>
                <ResourceCard
                  resource={r}
                  currentUser={currentUser}
                  onVote={handleVote}
                  onSave={handleSave}
                  onClick={setSelectedResource}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => {
            setSelectedResource(null);
            announce("Resource detail closed.");
          }}
          onPerfectScore={handlePerfectScore}
        />
      )}
    </main>
  );
}