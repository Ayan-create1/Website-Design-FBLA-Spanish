import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import PDFUploadModal from "./Pdfuploadmodal";
import ResourceCard from "./Resourcescard";
import ResourceDetailModal from "./Resourcesdetailmodal";
import "./Resources.css";
import supabase from "../helper/supabaseClient";

// Initialize Supabase — adjust to your project's client setup

export default function ResourcesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [publicResources, setPublicResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch public resources
  useEffect(() => {
    fetchPublicResources();
  }, []);

  const fetchPublicResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (!error) setPublicResources(data || []);
    setLoading(false);
  };

  // Called when a new upload finishes
  const handleUploadSuccess = (newResource) => {
    if (newResource.visibility === "public") {
      setPublicResources((prev) => [newResource, ...prev]);
    }
    // Private ones will appear in the History/My Content tab (handled there separately)
  };

  // Handle vote
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
        // Remove vote
        await supabase.from("resource_votes").delete().eq("id", existing.id);
        const col = type === "like" ? "likes" : "dislikes";
        await supabase.rpc("decrement_vote", { resource_id: resourceId, col });
      } else {
        // Switch vote
        await supabase
          .from("resource_votes")
          .update({ vote_type: type })
          .eq("id", existing.id);
        const addCol = type === "like" ? "likes" : "dislikes";
        const removeCol = type === "like" ? "dislikes" : "likes";
        await supabase.rpc("switch_vote", { resource_id: resourceId, add_col: addCol, remove_col: removeCol });
      }
    } else {
      await supabase.from("resource_votes").insert({ resource_id: resourceId, user_id: currentUser.id, vote_type: type });
      const col = type === "like" ? "likes" : "dislikes";
      await supabase.rpc("increment_vote", { resource_id: resourceId, col });
    }
  };

  // Handle save/bookmark
  const handleSave = async (resourceId, shouldSave) => {
    if (!currentUser) return;
    if (shouldSave) {
      await supabase.from("saved_resources").insert({ resource_id: resourceId, user_id: currentUser.id });
    } else {
      await supabase.from("saved_resources").delete()
        .eq("resource_id", resourceId)
        .eq("user_id", currentUser.id);
    }
  };

  // Filter by search
  const filtered = publicResources.filter((r) =>
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rp-page">
      {/* Search bar */}
      <div className="rp-search-wrap">
        <div className="rp-search-inner">
          <svg className="rp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="rp-search-input"
            type="text"
            placeholder="Search for a topic or idea"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rp-search-clear" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="rp-actions">
        <button className="rp-action-btn rp-quiz-btn" onClick={() => { /* your make quiz handler */ }}>
          <div className="rp-action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="14" height="18" rx="2"/>
              <polyline points="7,9 9,11 13,7"/>
              <polyline points="7,13 9,15 13,11"/>
              <polyline points="7,17 9,19 13,15"/>
              <line x1="15" y1="8" x2="21" y2="8"/>
              <line x1="15" y1="12" x2="21" y2="12"/>
              <line x1="15" y1="16" x2="21" y2="16"/>
            </svg>
          </div>
          <span className="rp-action-label">MAKE A QUIZ</span>
        </button>

        <button className="rp-action-btn rp-pdf-btn" onClick={() => setShowUploadModal(true)}>
          <div className="rp-action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <text x="6" y="17" fill="currentColor" stroke="none" fontSize="5" fontWeight="bold">PDF</text>
              <line x1="12" y1="21" x2="12" y2="15"/>
              <polyline points="9,18 12,21 15,18"/>
            </svg>
          </div>
          <span className="rp-action-label">UPLOAD PDF</span>
        </button>
      </div>

      {/* Resources section */}
      <div className="rp-section">
        <div className="rp-section-header">
          <span className="rp-section-title">RESOURCES</span>
          {!loading && (
            <span className="rp-section-count">{filtered.length} resource{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="rp-loading">
            <div className="rp-loading-spinner" />
            <span>Loading resources…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rp-empty">
            <div className="rp-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p>{searchQuery ? "No resources match your search." : "No public resources yet. Be the first to upload!"}</p>
            {!searchQuery && (
              <button className="rp-empty-cta" onClick={() => setShowUploadModal(true)}>
                Upload a PDF
              </button>
            )}
          </div>
        ) : (
          <div className="rp-cards-grid">
            {filtered.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                currentUser={currentUser}
                onVote={handleVote}
                onSave={handleSave}
                onClick={setSelectedResource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && (
        <PDFUploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
          currentUser={currentUser}
        />
      )}

      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}