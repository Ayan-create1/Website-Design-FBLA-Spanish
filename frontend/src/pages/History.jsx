import { useState, useEffect } from "react";
import  supabase  from '../helper/supabaseClient';
import ResourceCard from "./Resourcescard";
import ResourceDetailModal from "./Resourcesdetailmodal";
import "./History.css";

export default function HistoryPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [myContent, setMyContent] = useState([]);
  const [savedContent, setSavedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        fetchContent(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

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
    // Same vote logic as ResourcesPage
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

  if (!currentUser && !loading) {
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
      {/* MY CONTENT */}
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

      {/* SAVED CONTENT */}
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