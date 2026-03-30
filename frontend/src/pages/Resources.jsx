import { useState, useEffect } from "react";
import PDFUploadModal from "./Pdfuploadmodal";
import ResourceCard from "./Resourcescard";
import ResourceDetailModal from "./Resourcesdetailmodal";
import "./Resources.css";
import supabase from "../helper/supabaseClient";
import QuizBuilderModal from "./Quiz_Builder_Modal";
import QuizDetailModal from "./Quiz_Detail_Modal";


// Initialize Supabase — adjust to your project's client setup

export default function ResourcesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [publicResources, setPublicResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [draftsOpen, setDraftsOpen] = useState(false);

  const handlePerfectScore = async (resourceId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    await supabase.from("completed_quizzes").upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,resource_id" }
    );
  };

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

  useEffect(() => {
    if (currentUser) fetchDrafts(currentUser.id);
  }, [currentUser]);

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

  const fetchDrafts = async (userId) => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("author_id", userId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false });
    setDrafts(data || []);
  };

  // Called when a new upload finishes
  const handleUploadSuccess = (newResource) => {
    if (newResource.visibility === "public") {
      setPublicResources((prev) => [newResource, ...prev]);
    }
    // Private ones will appear in the History/My Content tab (handled there separately)
  };

  const handleDraftSaved = (savedDraft, wasUpdate) => {
    setDrafts((prev) =>
      wasUpdate
        ? prev.map((d) => (d.id === savedDraft.id ? savedDraft : d))
        : [savedDraft, ...prev]
    );
    setDraftsOpen(true); // auto-expand drafts panel so user sees it was saved
  };
 
  const handleQuizPublished = (publishedQuiz, wasDraft) => {
    if (wasDraft) setDrafts((prev) => prev.filter((d) => d.id !== publishedQuiz.id));
    if (publishedQuiz.visibility === "public") {
      setPublicResources((prev) => [publishedQuiz, ...prev]);
    }
  };
 
  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setShowQuizBuilder(true);
  };
 
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    const { error } = await supabase.from("resources").delete().eq("id", draftId);
    if (!error) setDrafts((prev) => prev.filter((d) => d.id !== draftId));
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

  const draftQuestionCount = (draft) => {
    try { return JSON.parse(draft.questions || "[]").length; } catch { return 0; }
  };

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
        <button
          className="rp-action-btn rp-quiz-btn"
          onClick={() => { setEditingDraft(null); setShowQuizBuilder(true); }} 
        >
          <div className="rp-action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="14" height="18" rx="2"/>
              <polyline points="7,9 9,11 13,7"/>
              <polyline points="7,14 9,16 13,12"/>
              
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
              <line x1="12" y1="17" x2="12" y2="11"/>
              <polyline points="9,14 12,17 15,14"/>
            </svg>
          </div>
          <span className="rp-action-label">UPLOAD PDF</span>
        </button>
      </div>

      {currentUser && drafts.length > 0 && (
        <div className="rp-section">
          <button
            className="rp-section-header rp-drafts-header"
            onClick={() => setDraftsOpen((o) => !o)}
          >
            <span className="rp-section-title">
              DRAFTS
              <span className="rp-drafts-badge">{drafts.length}</span>
            </span>
            <svg
              className={`rp-drafts-chevron ${draftsOpen ? "open" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
 
          {draftsOpen && (
            <div className="rp-drafts-list">
              {drafts.map((draft) => (
                <div key={draft.id} className="rp-draft-row">
                  <div className="rp-draft-info">
                    <span className="rp-draft-title">{draft.title || "Untitled Quiz"}</span>
                    <span className="rp-draft-meta">
                      {draftQuestionCount(draft)} question{draftQuestionCount(draft) !== 1 ? "s" : ""} • {draft.visibility}
                    </span>
                  </div>
                  <div className="rp-draft-actions">
                    <button className="rp-draft-btn rp-draft-edit" onClick={() => handleEditDraft(draft)} title="Continue editing">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Continue
                    </button>
                    <button className="rp-draft-btn rp-draft-delete" onClick={() => handleDeleteDraft(draft.id)} title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {showQuizBuilder && (
        <QuizBuilderModal
          onClose={() => { setShowQuizBuilder(false); setEditingDraft(null); }}
          onSaveSuccess={handleDraftSaved}
          onPublishSuccess={handleQuizPublished}
          currentUser={currentUser}
          draft={editingDraft}
        />
      )}

      {selectedResource?.type === "Quiz" && (
        <QuizDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onEdit={
            selectedResource.author_id === currentUser?.id
              ? (r) => { setSelectedResource(null); setEditingDraft(r); setShowQuizBuilder(true); }
              : null
          }
          onPerfectScore={handlePerfectScore}
        />
      )}
 
      {selectedResource?.type === "PDF" && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}