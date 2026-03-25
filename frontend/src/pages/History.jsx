import { useState, useEffect } from "react";
import supabase from '../helper/supabaseClient';
import ResourceCard from "./Resourcescard";
import ResourceDetailModal from "./Resourcesdetailmodal";
import "./History.css";

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

  return (
    <div className="hp-study-card">
      <div className="hp-study-card-accent" />
      <div className="hp-study-card-body">
        <div className="hp-study-card-meta">
          <span className={`hp-study-badge ${past ? "hp-study-badge-past" : "hp-study-badge-upcoming"}`}>
            {past ? "📁 Past" : "🟠 Upcoming"}
          </span>
          <span className="hp-study-role">{isOwner ? "Hosted by you" : "Registered"}</span>
        </div>
        <div className="hp-study-card-title">{session.title}</div>
        <div className="hp-study-card-date">{formatDate(session.scheduled_at)}</div>
        {session.description && (
          <p className="hp-study-card-desc">{session.description}</p>
        )}
      </div>
      <div className="hp-study-card-footer">
        <span className="hp-study-attendees">
          {session.registration_count ?? 0} joined
        </span>
        <a
          href={session.meet_link}
          target="_blank"
          rel="noreferrer"
          className="hp-study-meet-btn"
        >
          Open Meet Link ↗
        </a>
      </div>
    </div>
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

    // Sessions the user created
    const { data: created, error: createdError } = await supabase
      .from("study_sessions")
      .select(`*, registration_count:session_registrations(count)`)
      .eq("created_by", userId)
      .order("scheduled_at", { ascending: false });

    if (createdError) console.error("fetchStudySessions [created]:", createdError);

    // Session IDs the user registered for (but didn't create)
    const { data: registrations, error: regError } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("user_id", userId);

    if (regError) console.error("fetchStudySessions [registrations]:", regError);

    const registeredIds = registrations?.map((r) => r.session_id) ?? [];

    // Fetch those registered sessions (excluding ones user already created)
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

    // Sort: upcoming first, then by date
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

    // My content = all resources uploaded by this user (public AND private)
    const { data: mine } = await supabase
      .from("resources")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    // Saved content = resources the user bookmarked
    const { data: saved } = await supabase
      .from("saved_resources")
      .select("resource_id, resources(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setMyContent(mine || []);
    setSavedContent(saved?.map((s) => ({ ...s.resources, is_saved: true })) || []);
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

  if (!currentUser && !loading && !studyLoading) {
    return (
      <div className="hp-page">
        <div className="hp-unauthenticated">
          <p>Please sign in to view your content history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-page">

      {/* ── GROUP STUDY SESSIONS ── */}
      <div className="hp-section">
        <div className="hp-section-header hp-section-header--study">
          <span className="hp-section-title">GROUP STUDY SESSIONS</span>
          {!studyLoading && (
            <span className="hp-section-count">
              {studySessions.filter(s =>
                studyFilter === "all" ? true :
                studyFilter === "upcoming" ? !isPast(s.scheduled_at) :
                isPast(s.scheduled_at)
              ).length} session{studySessions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filter toggle pills */}
        <div className="hp-study-filter-bar">
          {["upcoming", "past", "all"].map((f) => (
            <button
              key={f}
              className={`hp-study-filter-chip ${studyFilter === f ? "active" : ""}`}
              onClick={() => setStudyFilter(f)}
            >
              {f === "upcoming" ? "🟠 Upcoming" : f === "past" ? "📁 Past" : "All"}
            </button>
          ))}
        </div>

        {studyLoading ? (
          <div className="hp-loading"><div className="hp-spinner" /></div>
        ) : (() => {
          const filtered = studySessions.filter(s =>
            studyFilter === "all" ? true :
            studyFilter === "upcoming" ? !isPast(s.scheduled_at) :
            isPast(s.scheduled_at)
          );
          return filtered.length === 0 ? (
            <p className="hp-empty-text">
              {studySessions.length === 0
                ? "No study sessions yet. Create or join one from the Group Study page!"
                : `No ${studyFilter} sessions.`}
            </p>
          ) : (
            <div className="hp-study-grid">
              {filtered.map((s) => (
                <StudySessionCard key={s.id} session={s} isOwner={s.isOwner} />
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── MY CONTENT ── */}
      <div className="hp-section">
        <div className="hp-section-header">
          <span className="hp-section-title">MY CONTENT</span>
          {!loading && (
            <span className="hp-section-count">{myContent.length} item{myContent.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="hp-loading"><div className="hp-spinner" /></div>
        ) : myContent.length === 0 ? (
          <p className="hp-empty-text">You haven't uploaded anything yet.</p>
        ) : (
          <div className="hp-cards-grid">
            {myContent.map((r) => (
              <ResourceCard
                key={r.id}
                resource={{ ...r, author_username: "me" }}
                currentUser={currentUser}
                onVote={handleVote}
                onSave={handleSave}
                onClick={setSelectedResource}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── SAVED CONTENT ── */}
      <div className="hp-section">
        <div className="hp-section-header">
          <span className="hp-section-title">SAVED CONTENT</span>
          {!loading && (
            <span className="hp-section-count">{savedContent.length} item{savedContent.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="hp-loading"><div className="hp-spinner" /></div>
        ) : savedContent.length === 0 ? (
          <p className="hp-empty-text">No saved resources yet. Bookmark items from the Resources page!</p>
        ) : (
          <div className="hp-cards-grid">
            {savedContent.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                currentUser={currentUser}
                onVote={handleVote}
                onSave={handleSave}
                onClick={setSelectedResource}
              />
            ))}
          </div>
        )}
      </div>

      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}