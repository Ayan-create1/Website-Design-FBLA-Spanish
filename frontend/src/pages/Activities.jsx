import { useState, useEffect } from "react";
import WordSearch from "./WordSearch.jsx";
import CrossWord from "./Crossword.jsx";
import { X } from "lucide-react";
import word from "../assets/WORD.png";
import cross from "../assets/CROSS_WORD.png";
import { fetchStats, recordSession } from "../helper/supabase.js"

function fmtTime(s) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function StatRow({ label, value }) {
  return (
    <div className="act-stat-row">
      <span className="act-stat-label">{label}</span>
      <span className="act-stat-value">{value}</span>
    </div>
  );
}

function GameCard({ title, image, stats, onPlay }) {
  return (
    <div className="act-card">
      <button className="act-card-btn" onClick={onPlay} aria-label={`Play ${title}`}>
        <img src={image} alt={title} className="act-card-img" />
        <div className="act-card-play-label">TAP TO PLAY</div>
      </button>
      <div className="act-stats-panel">
        {stats ? (
          <>
            <StatRow label="Total Played"        value={stats.totalPlayed} />
            <StatRow label="Best Time"           value={fmtTime(stats.bestTime)} />
            <StatRow label="Played This Week"    value={stats.weekPlayed} />
            <StatRow label="Best Time This Week" value={fmtTime(stats.bestTimeWeek)} />
          </>
        ) : (
          <div className="act-stats-loading">Loading stats...</div>
        )}
      </div>
    </div>
  );
}

function GameModal({ onClose, children }) {
  return (
    <div className="act-overlay" onClick={onClose}>
      <div className="act-modal" onClick={(e) => e.stopPropagation()}>
        <button className="act-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Activities() {
  const [showWS, setShowWS] = useState(false);
  const [showCW, setShowCW] = useState(false);
  const [wsStats, setWsStats] = useState(null);
  const [cwStats, setCwStats] = useState(null);

  const loadStats = async () => {
    const [ws, cw] = await Promise.all([fetchStats("wordsearch"), fetchStats("crossword")]);
    setWsStats(ws);
    setCwStats(cw);
  };

  useEffect(() => { loadStats(); }, []);
//Don't autofit
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

        .act-root {
          --card-bg: #FFFFFF;
          --card-shadow: 0 4px 24px rgba(160, 90, 30, 0.13);
          --text-dark: #2C1A0A;
          --text-mid: #7A5230;
          --text-light: #B8936A;
          --border: #E8D5BE;
          font-family: 'DM Sans', sans-serif;
          padding: 28px 0px 24px;
          
        }

        .act-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #d4895c, #b87040);
          border-radius: 30px;
          padding: 11px 20px;
          margin-bottom: 24px;
          max-width: 900px;
          margin: 0 auto 20px;
        }

        .act-section-title {
          font-size: 0.92rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 1px;
          font-family:  system-ui, Avenir, Helvetica, Arial, sans-serif;
        }

        .act-heading::after {
          content: '';
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
          border-radius: 2px;
        }

        .act-grid {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: nowrap;
        }

        .act-card {
          width: 320px;        /* your preferred card width */
          flex-shrink: 0;
          background: var(--card-bg);
          border-radius: 20px;
          border: 1.5px solid var(--border);
          box-shadow: var(--card-shadow);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .act-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(160, 90, 30, 0.18);
        }

        .act-card-btn {
          display: block;
          width: 100%;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          position: relative;
          overflow: hidden;
          transition: filter 0.15s ease;
        }

        .act-card-btn:hover { filter: brightness(1.05); }

        .act-card-img {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 18px 18px 0 0;
        }

        .act-card-play-label {
          position: absolute;
          bottom: 12px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.45);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          padding: 5px 12px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(4px);
        }

        .act-card-play-label::before {

          font-size: 9px;
        }

        .act-stats-panel { padding: 18px 22px 20px; }

        .act-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 7px 0;
          border-bottom: 1px solid var(--border);
        }

        .act-stat-row:last-child { border-bottom: none; }

        .act-stat-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-mid);
        }

        .act-stat-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 0.04em;
          color: var(--text-dark);
        }

        .act-stats-loading {
          font-size: 13px;
          color: var(--text-light);
          text-align: center;
          padding: 12px 0;
        }

        .act-overlay {
          position: fixed;
          inset: 0;
          background: rgba(30, 15, 5, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 16px;
        }

        .act-modal {
          background: #fff;
          border-radius: 18px;
          padding: 20px;
          max-width: 95vw;
          max-height: 92vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          scrollbar-width: thin;
        }

        .act-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #e0d0c0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7A5230;
          font-family: inherit;
          font-size: inherit;
          letter-spacing: normal;
          padding: 0;
          transition: background 0.15s, color 0.15s;
        }

        .act-close-btn:hover {
          background: #C8702A;
          color: #fff;
          border-color: #C8702A;
          transform: none;
          opacity: 1;
        }
      `}</style>

      <div className="act-root">
          <div className="act-section-header">
        <span className="act-section-title">ACTIVITIES</span>
        </div>
        <div className="act-grid">
          <GameCard
            title="Word Search"
            image={word}
            stats={wsStats}
            onPlay={() => setShowWS(true)}
          />
          <GameCard
            title="Crossword"
            image={cross}
            stats={cwStats}
            onPlay={() => setShowCW(true)}
          />
        </div>
      </div>

      {showWS && (
        <GameModal onClose={() => { setShowWS(false); loadStats(); }}>
          <WordSearch onComplete={(secs) => recordSession("wordsearch", secs)} />
        </GameModal>
      )}

      {showCW && (
        <GameModal onClose={() => { setShowCW(false); loadStats(); }}>
          <CrossWord onComplete={(secs) => recordSession("crossword", secs)} />
        </GameModal>
      )}
    </>
  );
}