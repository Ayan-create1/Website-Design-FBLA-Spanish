import { useState, useRef } from "react";
import "./Pdfuploadmodal.css";
import supabase from "../helper/supabaseClient";

export default function PDFUploadModal({ onClose, onUploadSuccess, currentUser }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [pdfFile, setPdfFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Please enter a title.");
    if (!pdfFile) return setError("Please upload a PDF file.");

    setUploading(true);
    setError("");

    try {
      // Import supabase client — adjust path to your project's supabase client

      // 1. Upload PDF to Supabase Storage
      const fileName = `${Date.now()}_${pdfFile.name.replace(/\s+/g, "_")}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, pdfFile, { contentType: "application/pdf" });

      if (storageError) throw storageError;

      // 2. Get public URL (only used for public uploads; private ones still stored)
      const { data: urlData } = supabase.storage
        .from("pdfs")
        .getPublicUrl(fileName);

      // 3. Insert record into `resources` table
      const { data: insertData, error: insertError } = await supabase
        .from("resources")
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            visibility,
            file_path: storageData.path,
            file_url: urlData.publicUrl,
            type: "PDF",
            author_id: currentUser?.id,
            author_username: currentUser?.user_metadata?.username || currentUser?.email,
            likes: 0,
            dislikes: 0,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      onUploadSuccess(insertData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pum-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pum-modal">
        {/* Header */}
        <div className="pum-header">
          <div className="pum-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="pum-title">Upload PDF</h2>
            <p className="pum-subtitle">Share a resource with the community</p>
          </div>
          <button className="pum-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress steps */}
        <div className="pum-steps">
          {["Title", "Visibility", "Description", "Upload"].map((label, i) => (
            <div key={i} className={`pum-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}>
              <div className="pum-step-dot">
                {step > i + 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className="pum-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="pum-body">
          {step === 1 && (
            <div className="pum-field-group">
              <label className="pum-label">Give your PDF a title</label>
              <input
                className="pum-input"
                type="text"
                placeholder="e.g. Chapter 5 Study Notes"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(""); }}
                maxLength={80}
                autoFocus
              />
              <span className="pum-char-count">{title.length}/80</span>
            </div>
          )}

          {step === 2 && (
            <div className="pum-field-group">
              <label className="pum-label">Who can see this resource?</label>
              <div className="pum-visibility-grid">
                <button
                  className={`pum-vis-card ${visibility === "public" ? "selected" : ""}`}
                  onClick={() => setVisibility("public")}
                >
                  <div className="pum-vis-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className="pum-vis-info">
                    <strong>Public</strong>
                    <span>Visible to everyone in Resources</span>
                  </div>
                  {visibility === "public" && <div className="pum-vis-check">✓</div>}
                </button>

                <button
                  className={`pum-vis-card ${visibility === "private" ? "selected" : ""}`}
                  onClick={() => setVisibility("private")}
                >
                  <div className="pum-vis-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="pum-vis-info">
                    <strong>Private</strong>
                    <span>Only visible to you in My Content</span>
                  </div>
                  {visibility === "private" && <div className="pum-vis-check">✓</div>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="pum-field-group">
              <label className="pum-label">Add a short description <span className="pum-optional">(optional)</span></label>
              <textarea
                className="pum-textarea"
                placeholder="What's this PDF about? Help others understand what they'll find inside..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={4}
                autoFocus
              />
              <span className="pum-char-count">{description.length}/300</span>
            </div>
          )}

          {step === 4 && (
            <div className="pum-field-group">
              <label className="pum-label">Upload your PDF</label>
              <div
                className={`pum-dropzone ${dragOver ? "drag-over" : ""} ${pdfFile ? "has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {pdfFile ? (
                  <div className="pum-file-preview">
                    <div className="pum-file-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                    </div>
                    <div className="pum-file-info">
                      <span className="pum-file-name">{pdfFile.name}</span>
                      <span className="pum-file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button className="pum-file-remove" onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="pum-drop-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="pum-drop-text">Drag & drop your PDF here</p>
                    <p className="pum-drop-sub">or click to browse files</p>
                    <span className="pum-drop-hint">PDF files only • Max 50MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          )}

          {error && <div className="pum-error">{error}</div>}
        </div>

        {/* Footer nav */}
        <div className="pum-footer">
          <button
            className="pum-btn pum-btn-secondary"
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          {step < 4 ? (
            <button
              className="pum-btn pum-btn-primary"
              onClick={() => {
                if (step === 1 && !title.trim()) return setError("Please enter a title.");
                setError("");
                setStep(s => s + 1);
              }}
            >
              Next →
            </button>
          ) : (
            <button
              className="pum-btn pum-btn-primary pum-btn-submit"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <span className="pum-spinner" />
              ) : (
                "Upload PDF"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}