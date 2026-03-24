import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Crossword.css';

// ─────────────────────────────────────────────
// Word bank  (clue → answer pairs)
// Add / remove freely. Answers must be A-Z only.
// ─────────────────────────────────────────────
// Clues are in English; answers are the Spanish translation (accents removed for A-Z grid)
const WORD_BANK = [
  // ── Everyday nouns ──
  { clue: 'The Spanish word for "house"', answer: 'CASA' },
  { clue: 'The Spanish word for "dog"', answer: 'PERRO' },
  { clue: 'The Spanish word for "cat"', answer: 'GATO' },
  { clue: 'The Spanish word for "book"', answer: 'LIBRO' },
  { clue: 'The Spanish word for "water"', answer: 'AGUA' },
  { clue: 'The Spanish word for "food"', answer: 'COMIDA' },
  { clue: 'The Spanish word for "friend" (male)', answer: 'AMIGO' },
  { clue: 'The Spanish word for "school"', answer: 'ESCUELA' },
  { clue: 'The Spanish word for "table"', answer: 'MESA' },
  { clue: 'The Spanish word for "chair"', answer: 'SILLA' },
  { clue: 'The Spanish word for "door"', answer: 'PUERTA' },
  { clue: 'The Spanish word for "window"', answer: 'VENTANA' },
  { clue: 'The Spanish word for "car"', answer: 'COCHE' },
  { clue: 'The Spanish word for "street"', answer: 'CALLE' },
  { clue: 'The Spanish word for "city"', answer: 'CIUDAD' },
  { clue: 'The Spanish word for "country"', answer: 'PAIS' },
  { clue: 'The Spanish word for "family"', answer: 'FAMILIA' },
  { clue: 'The Spanish word for "mother"', answer: 'MADRE' },
  { clue: 'The Spanish word for "father"', answer: 'PADRE' },
  { clue: 'The Spanish word for "brother"', answer: 'HERMANO' },
  { clue: 'The Spanish word for "sister"', answer: 'HERMANA' },
  { clue: 'The Spanish word for "son"', answer: 'HIJO' },
  { clue: 'The Spanish word for "daughter"', answer: 'HIJA' },
  { clue: 'The Spanish word for "boy"', answer: 'NINO' },
  { clue: 'The Spanish word for "girl"', answer: 'NINA' },
  // ── Nature ──
  { clue: 'The Spanish word for "sun"', answer: 'SOL' },
  { clue: 'The Spanish word for "moon"', answer: 'LUNA' },
  { clue: 'The Spanish word for "star"', answer: 'ESTRELLA' },
  { clue: 'The Spanish word for "sea"', answer: 'MAR' },
  { clue: 'The Spanish word for "river"', answer: 'RIO' },
  { clue: 'The Spanish word for "mountain"', answer: 'MONTANA' },
  { clue: 'The Spanish word for "tree"', answer: 'ARBOL' },
  { clue: 'The Spanish word for "flower"', answer: 'FLOR' },
  { clue: 'The Spanish word for "rain"', answer: 'LLUVIA' },
  { clue: 'The Spanish word for "wind"', answer: 'VIENTO' },
  { clue: 'The Spanish word for "fire"', answer: 'FUEGO' },
  { clue: 'The Spanish word for "earth / soil"', answer: 'TIERRA' },
  // ── Food ──
  { clue: 'The Spanish word for "bread"', answer: 'PAN' },
  { clue: 'The Spanish word for "milk"', answer: 'LECHE' },
  { clue: 'The Spanish word for "meat"', answer: 'CARNE' },
  { clue: 'The Spanish word for "fish"', answer: 'PESCADO' },
  { clue: 'The Spanish word for "apple"', answer: 'MANZANA' },
  { clue: 'The Spanish word for "orange" (fruit)', answer: 'NARANJA' },
  { clue: 'The Spanish word for "egg"', answer: 'HUEVO' },
  { clue: 'The Spanish word for "cheese"', answer: 'QUESO' },
  { clue: 'The Spanish word for "coffee"', answer: 'CAFE' },
  // ── Colors ──
  { clue: 'The Spanish word for "red"', answer: 'ROJO' },
  { clue: 'The Spanish word for "blue"', answer: 'AZUL' },
  { clue: 'The Spanish word for "green"', answer: 'VERDE' },
  { clue: 'The Spanish word for "yellow"', answer: 'AMARILLO' },
  { clue: 'The Spanish word for "white"', answer: 'BLANCO' },
  { clue: 'The Spanish word for "black"', answer: 'NEGRO' },
  // ── Common verbs (infinitive) ──
  { clue: 'Spanish infinitive meaning "to eat"', answer: 'COMER' },
  { clue: 'Spanish infinitive meaning "to drink"', answer: 'BEBER' },
  { clue: 'Spanish infinitive meaning "to sleep"', answer: 'DORMIR' },
  { clue: 'Spanish infinitive meaning "to run"', answer: 'CORRER' },
  { clue: 'Spanish infinitive meaning "to walk"', answer: 'CAMINAR' },
  { clue: 'Spanish infinitive meaning "to speak"', answer: 'HABLAR' },
  { clue: 'Spanish infinitive meaning "to write"', answer: 'ESCRIBIR' },
  { clue: 'Spanish infinitive meaning "to read"', answer: 'LEER' },
  { clue: 'Spanish infinitive meaning "to play"', answer: 'JUGAR' },
  { clue: 'Spanish infinitive meaning "to work"', answer: 'TRABAJAR' },
  { clue: 'Spanish infinitive meaning "to live"', answer: 'VIVIR' },
  { clue: 'Spanish infinitive meaning "to love"', answer: 'AMAR' },
  { clue: 'Spanish infinitive meaning "to come"', answer: 'VENIR' },
  { clue: 'Spanish infinitive meaning "to go"', answer: 'IR' },
  // ── Adjectives ──
  { clue: 'Spanish word meaning "big"', answer: 'GRANDE' },
  { clue: 'Spanish word meaning "small"', answer: 'PEQUENO' },
  { clue: 'Spanish word meaning "fast"', answer: 'RAPIDO' },
  { clue: 'Spanish word meaning "slow"', answer: 'LENTO' },
  { clue: 'Spanish word meaning "new"', answer: 'NUEVO' },
  { clue: 'Spanish word meaning "old"', answer: 'VIEJO' },
  { clue: 'Spanish word meaning "good"', answer: 'BUENO' },
  { clue: 'Spanish word meaning "bad"', answer: 'MALO' },
  { clue: 'Spanish word meaning "beautiful"', answer: 'BONITO' },
  { clue: 'Spanish word meaning "happy"', answer: 'FELIZ' },
  // ── Time & numbers ──
  { clue: 'Spanish word for "today"', answer: 'HOY' },
  { clue: 'Spanish word for "tomorrow"', answer: 'MANANA' },
  { clue: 'Spanish word for "yesterday"', answer: 'AYER' },
  { clue: 'Spanish word for "year"', answer: 'ANO' },
  { clue: 'Spanish word for "week"', answer: 'SEMANA' },
  { clue: 'Spanish word for "Monday"', answer: 'LUNES' },
  { clue: 'Spanish word for "Sunday"', answer: 'DOMINGO' },
  { clue: 'Spanish word for the number 5', answer: 'CINCO' },
  { clue: 'Spanish word for the number 10', answer: 'DIEZ' },
  { clue: 'Spanish word for the number 100', answer: 'CIEN' },
];

// ─────────────────────────────────────────────
// Crossword generator
// ─────────────────────────────────────────────
const GRID_SIZE = 15;

function buildEmptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

// Try to place a word onto the grid. Returns updated grid + placement or null.
function tryPlace(grid, word, size) {
  const len = word.length;

  // Collect cells that share letters with this word
  const intersections = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = grid[r][c];
      if (!ch) continue;
      for (let i = 0; i < len; i++) {
        if (word[i] === ch) intersections.push({ r, c, i });
      }
    }
  }

  // Shuffle intersections for variety
  const shuffled = [...intersections].sort(() => Math.random() - 0.5);

  const attempts = [];

  // Build candidate placements via intersections first
  for (const { r, c, i } of shuffled) {
    for (const dir of ['across', 'down']) {
      let startR = dir === 'down' ? r - i : r;
      let startC = dir === 'across' ? c - i : c;
      attempts.push({ startR, startC, dir });
    }
  }

  // Also try random placements (for first word or sparse grid)
  for (let t = 0; t < 60; t++) {
    const dir = Math.random() < 0.5 ? 'across' : 'down';
    const startR = dir === 'down'
      ? Math.floor(Math.random() * (size - len))
      : Math.floor(Math.random() * size);
    const startC = dir === 'across'
      ? Math.floor(Math.random() * (size - len))
      : Math.floor(Math.random() * size);
    attempts.push({ startR, startC, dir });
  }

  for (const { startR, startC, dir } of attempts) {
    if (canPlace(grid, word, startR, startC, dir, size)) {
      const newGrid = grid.map(row => [...row]);
      for (let i = 0; i < len; i++) {
        const r = dir === 'down' ? startR + i : startR;
        const c = dir === 'across' ? startC + i : startC;
        newGrid[r][c] = word[i];
      }
      return { grid: newGrid, startR, startC, dir };
    }
  }
  return null;
}

function canPlace(grid, word, startR, startC, dir, size) {
  const len = word.length;
  const dr = dir === 'down' ? 1 : 0;
  const dc = dir === 'across' ? 1 : 0;

  // Out of bounds?
  const endR = startR + dr * (len - 1);
  const endC = startC + dc * (len - 1);
  if (endR >= size || endC >= size || startR < 0 || startC < 0) return false;

  // Check cell before start (must be null / edge)
  const preR = startR - dr;
  const preC = startC - dc;
  if (preR >= 0 && preC >= 0 && grid[preR][preC] !== null) return false;

  // Check cell after end (must be null / edge)
  const postR = startR + dr * len;
  const postC = startC + dc * len;
  if (postR < size && postC < size && grid[postR][postC] !== null) return false;

  let hasIntersection = grid[startR][startC] !== null; // preliminary

  for (let i = 0; i < len; i++) {
    const r = startR + dr * i;
    const c = startC + dc * i;
    const existing = grid[r][c];

    if (existing !== null) {
      if (existing !== word[i]) return false;
      hasIntersection = true;
    } else {
      // Check perpendicular neighbours — must not extend into another word
      if (dir === 'across') {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < size - 1 && grid[r + 1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < size - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }

  return true;
}

function generateCrossword(entries, size) {
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  let grid = buildEmptyGrid(size);
  const placed = [];

  for (const entry of shuffled) {
    const result = tryPlace(grid, entry.answer, size);
    if (result) {
      grid = result.grid;
      placed.push({
        ...entry,
        startR: result.startR,
        startC: result.startC,
        dir: result.dir,
      });
    }
    if (placed.length >= 12) break;
  }

  if (placed.length < 6) return null; // retry if too few words

  // Crop to bounding box
  let minR = size, maxR = 0, minC = size, maxC = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cropped = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid[r + minR][c + minC])
  );

  const adjusted = placed.map(p => ({
    ...p,
    startR: p.startR - minR,
    startC: p.startC - minC,
  }));

  return { grid: cropped, placed: adjusted, rows, cols };
}

// Assign across/down numbers
function numberGrid(placed, rows, cols) {
  const numberedCells = {}; // "r,c" -> number
  const acrossClues = [];
  const downClues = [];
  let num = 1;

  // Determine which cells start a word
  const starters = placed.map(p => ({ key: `${p.startR},${p.startC}`, dir: p.dir, entry: p }));
  starters.sort((a, b) => {
    const [ar, ac] = a.key.split(',').map(Number);
    const [br, bc] = b.key.split(',').map(Number);
    return ar !== br ? ar - br : ac - bc;
  });

  // Collect unique starts
  const uniqueStarts = [];
  const seen = new Set();
  for (const s of starters) {
    if (!seen.has(s.key)) {
      seen.add(s.key);
      uniqueStarts.push(s.key);
    }
  }
  uniqueStarts.sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number);
    const [br, bc] = b.split(',').map(Number);
    return ar !== br ? ar - br : ac - bc;
  });

  const numberMap = {};
  for (const key of uniqueStarts) {
    numberMap[key] = num++;
  }

  for (const p of placed) {
    const key = `${p.startR},${p.startC}`;
    const n = numberMap[key];
    const entry = { ...p, number: n };
    if (p.dir === 'across') acrossClues.push(entry);
    else downClues.push(entry);
  }

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues, numberMap };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const Crossword = () => {
  const [gameData, setGameData] = useState(null);
  const [userInput, setUserInput] = useState({});  // "r,c" -> letter
  const [activeWord, setActiveWord] = useState(null); // { dir, number }
  const [activeCell, setActiveCell] = useState(null); // [r, c]
  const [solvedWords, setSolvedWords] = useState(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Build a new game ──
  const startGame = useCallback(() => {
    clearInterval(timerRef.current);
    let result = null;
    let tries = 0;
    while (!result && tries < 20) {
      result = generateCrossword(WORD_BANK, GRID_SIZE);
      tries++;
    }
    if (!result) return;

    const { acrossClues, downClues, numberMap } = numberGrid(result.placed, result.rows, result.cols);
    setGameData({ ...result, acrossClues, downClues, numberMap });
    setUserInput({});
    setSolvedWords(new Set());
    setActiveWord(null);
    setActiveCell(null);
    setIsWin(false);
    setTimeElapsed(0);

    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000);
  }, []);

  useEffect(() => {
    startGame();
    return () => clearInterval(timerRef.current);
  }, [startGame]);

  // ── Check win ──
  useEffect(() => {
    if (!gameData) return;
    const total = gameData.acrossClues.length + gameData.downClues.length;
    if (solvedWords.size === total && total > 0 && !isWin) {
      clearInterval(timerRef.current);
      setTimeout(() => setIsWin(true), 400);
    }
  }, [solvedWords, gameData, isWin]);

  // ── Check if a word is fully and correctly filled ──
  const checkWord = useCallback((entry, inputMap) => {
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.dir === 'down' ? entry.startR + i : entry.startR;
      const c = entry.dir === 'across' ? entry.startC + i : entry.startC;
      if ((inputMap[`${r},${c}`] || '') !== entry.answer[i]) return false;
    }
    return true;
  }, []);

  // ── Determine which cells belong to a word ──
  const wordCells = useCallback((entry) => {
    const cells = [];
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.dir === 'down' ? entry.startR + i : entry.startR;
      const c = entry.dir === 'across' ? entry.startC + i : entry.startC;
      cells.push(`${r},${c}`);
    }
    return cells;
  }, []);

  // ── Get all clue entries ──
  const allEntries = gameData ? [...gameData.acrossClues, ...gameData.downClues] : [];

  // ── Active word entry ──
  const activeEntry = activeWord
    ? allEntries.find(e => e.dir === activeWord.dir && e.number === activeWord.number)
    : null;

  const activeCellSet = activeEntry ? new Set(wordCells(activeEntry)) : new Set();

  // ── Click a white cell ──
  const handleCellClick = (r, c) => {
    const key = `${r},${c}`;

    // Find words that pass through this cell
    const candidates = allEntries.filter(e => wordCells(e).includes(key));
    if (!candidates.length) return;

    // If clicking same cell, toggle direction
    if (activeCell && activeCell[0] === r && activeCell[1] === c) {
      const other = candidates.find(e => !(activeEntry && e.dir === activeEntry.dir && e.number === activeEntry.number));
      if (other) {
        setActiveWord({ dir: other.dir, number: other.number });
      }
    } else {
      // Prefer current direction if available, else first candidate
      const pref = activeWord ? candidates.find(e => e.dir === activeWord.dir) : null;
      const chosen = pref || candidates[0];
      setActiveWord({ dir: chosen.dir, number: chosen.number });
      setActiveCell([r, c]);
    }
    setActiveCell([r, c]);
    inputRef.current?.focus();
  };

  // ── Select a clue from sidebar ──
  const handleClueClick = (entry) => {
    setActiveWord({ dir: entry.dir, number: entry.number });
    setActiveCell([entry.startR, entry.startC]);
    inputRef.current?.focus();
  };

  // ── Advance cursor forward ──
  const advanceCursor = useCallback((r, c, entry, newInput) => {
    if (!entry) return;
    const cells = wordCells(entry);
    const cur = `${r},${c}`;
    const idx = cells.indexOf(cur);
    // Move to next empty cell, or next cell if all filled
    for (let i = idx + 1; i < cells.length; i++) {
      const [nr, nc] = cells[i].split(',').map(Number);
      if (!newInput[cells[i]]) {
        setActiveCell([nr, nc]);
        return;
      }
    }
    // Fall back to next cell
    if (idx + 1 < cells.length) {
      const [nr, nc] = cells[idx + 1].split(',').map(Number);
      setActiveCell([nr, nc]);
    }
  }, [wordCells]);

  // ── Retreat cursor ──
  const retreatCursor = useCallback((r, c, entry) => {
    if (!entry) return;
    const cells = wordCells(entry);
    const cur = `${r},${c}`;
    const idx = cells.indexOf(cur);
    if (idx > 0) {
      const [nr, nc] = cells[idx - 1].split(',').map(Number);
      setActiveCell([nr, nc]);
    }
  }, [wordCells]);

  // ── Keyboard input ──
  const handleKeyDown = (e) => {
    if (!activeCell || !activeEntry) return;
    const [r, c] = activeCell;
    const key = e.key.toUpperCase();

    if (key.length === 1 && /^[A-Z]$/.test(key)) {
      e.preventDefault();
      const ck = `${r},${c}`;
      const newInput = { ...userInput, [ck]: key };
      setUserInput(newInput);

      // Check if word is now complete
      const newSolved = new Set(solvedWords);
      for (const entry of allEntries) {
        if (!newSolved.has(`${entry.dir}-${entry.number}`) && checkWord(entry, newInput)) {
          newSolved.add(`${entry.dir}-${entry.number}`);
        }
      }
      setSolvedWords(newSolved);
      advanceCursor(r, c, activeEntry, newInput);

    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const ck = `${r},${c}`;
      if (userInput[ck]) {
        const newInput = { ...userInput };
        delete newInput[ck];
        setUserInput(newInput);
      } else {
        retreatCursor(r, c, activeEntry);
        const cells = wordCells(activeEntry);
        const idx = cells.indexOf(ck);
        if (idx > 0) {
          const newInput = { ...userInput };
          delete newInput[cells[idx - 1]];
          setUserInput(newInput);
        }
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const cells = wordCells(activeEntry);
      const ck = `${r},${c}`;
      const idx = cells.indexOf(ck);
      const goForward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const ni = goForward ? Math.min(idx + 1, cells.length - 1) : Math.max(idx - 1, 0);
      const [nr, nc] = cells[ni].split(',').map(Number);
      setActiveCell([nr, nc]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle through words
      if (!allEntries.length) return;
      const ci = allEntries.findIndex(e => e.dir === activeWord?.dir && e.number === activeWord?.number);
      const ni = (ci + (e.shiftKey ? -1 + allEntries.length : 1)) % allEntries.length;
      const next = allEntries[ni];
      setActiveWord({ dir: next.dir, number: next.number });
      setActiveCell([next.startR, next.startC]);
    }
  };

  // ── Time formatting ──
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!gameData) return <div className="crossword-wrapper"><div className="cw-loading">GENERATING…</div></div>;

  const { grid, rows, cols, acrossClues, downClues, numberMap } = gameData;
  const total = acrossClues.length + downClues.length;

  return (
    <div className="crossword-wrapper">
      <header>
        <h1>CROSSWORD</h1>
        <p className="subtitle">spanish vocabulary · new puzzle every game</p>
      </header>

      {/* Hidden input to capture keyboard on mobile */}
      <input
        ref={inputRef}
        className="crossword-hidden-input"
        onKeyDown={handleKeyDown}
        readOnly
        aria-hidden="true"
      />

      <div className="crossword-game-area">
        {/* ── Grid ── */}
        <div className="crossword-grid-wrap" onMouseDown={() => inputRef.current?.focus()}>
          <div
            className="crossword-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, var(--cell-size))` }}
          >
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const letter = grid[r][c];
                const ck = `${r},${c}`;
                const isBlack = letter === null;
                const isActiveCell = activeCell && activeCell[0] === r && activeCell[1] === c;
                const isActiveWord = activeCellSet.has(ck);
                const num = numberMap[ck];
                const typed = userInput[ck] || '';

                const isSolvedCell = allEntries.some(e =>
                  solvedWords.has(`${e.dir}-${e.number}`) && wordCells(e).includes(ck)
                );

                let cls = 'cw-cell';
                if (!isBlack) cls += ' white';
                if (!isBlack && isActiveWord && !isActiveCell) cls += ' active-word';
                if (!isBlack && isActiveCell) cls += ' active-cell';

                return (
                  <div
                    key={ck}
                    className={cls}
                    onClick={isBlack ? undefined : () => handleCellClick(r, c)}
                  >
                    {!isBlack && num && <span className="cell-number">{num}</span>}
                    {!isBlack && (
                      <span className={`cell-letter${isSolvedCell ? ' correct' : ''}`}>
                        {typed}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="crossword-status">
            Solved <span>{solvedWords.size}</span> / <span>{total}</span> words
          </div>
          <div className="crossword-timer">
            Time: <span>{fmt(timeElapsed)}</span>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="crossword-sidebar">
          <div>
            <div className="clue-section-title">Across</div>
            <div className="clue-list clue-columns">
              {acrossClues.map(entry => {
                const wk = `across-${entry.number}`;
                const isActive = activeWord?.dir === 'across' && activeWord?.number === entry.number;
                const isSolved = solvedWords.has(wk);
                return (
                  <div
                    key={wk}
                    className={`clue-item${isActive ? ' active' : ''}${isSolved ? ' solved' : ''}`}
                    onClick={() => handleClueClick(entry)}
                  >
                    <span className="clue-num">{entry.number}.</span>
                    {entry.clue}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="clue-section-title">Down</div>
            <div className="clue-list clue-columns">
              {downClues.map(entry => {
                const wk = `down-${entry.number}`;
                const isActive = activeWord?.dir === 'down' && activeWord?.number === entry.number;
                const isSolved = solvedWords.has(wk);
                return (
                  <div
                    key={wk}
                    className={`clue-item${isActive ? ' active' : ''}${isSolved ? ' solved' : ''}`}
                    onClick={() => handleClueClick(entry)}
                  >
                    <span className="clue-num">{entry.number}.</span>
                    {entry.clue}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="btn-row">
            <button onClick={startGame}>NEW GAME</button>
            <button onClick={() => {
              // Reveal all answers
              const revealed = {};
              for (const entry of allEntries) {
                for (let i = 0; i < entry.answer.length; i++) {
                  const r = entry.dir === 'down' ? entry.startR + i : entry.startR;
                  const c = entry.dir === 'across' ? entry.startC + i : entry.startC;
                  revealed[`${r},${c}`] = entry.answer[i];
                }
              }
              setUserInput(revealed);
              const allSolved = new Set(allEntries.map(e => `${e.dir}-${e.number}`));
            }}>REVEAL</button>
          </div>
        </div>
      </div>

      {/* ── Win overlay ── */}
      {isWin && (
        <div className="cw-win-overlay show">
          <div className="cw-win-box">
            <div className="cw-win-title">SOLVED!</div>
            <div className="cw-win-sub">puzzle complete</div>
            <div className="cw-win-time">{fmt(timeElapsed)}</div>
            <button onClick={startGame}>PLAY AGAIN</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crossword;