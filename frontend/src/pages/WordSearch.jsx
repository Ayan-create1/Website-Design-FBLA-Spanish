import React, { useState, useEffect, useRef } from 'react';
import './WordSearch.css';
import { X } from 'lucide-react';

const WordSearch = () => {
  const ROWS = 11;
  const COLS = 11;
  const NUM_WORDS = 8;
  const DIRS = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  const FILLER = 'AAEEIIOOUURRSSLLNNCCTTTMMPPDDHHHBBBGGG';

  const CONJ_SETS = [
    // your word sets here, same as in your original script
    [
      { clue: 'hablar (yo) — present', answer: 'HABLO' },
      { clue: 'hablar (tú) — present', answer: 'HABLAS' },
      { clue: 'hablar (él) — present', answer: 'HABLA' },
      { clue: 'hablar (nosotros) — present', answer: 'HABLAMOS' },
      { clue: 'hablar (ellos) — present', answer: 'HABLAN' },
      { clue: 'caminar (yo) — present', answer: 'CAMINO' },
      { clue: 'caminar (tú) — present', answer: 'CAMINAS' },
      { clue: 'caminar (él) — present', answer: 'CAMINA' },
      { clue: 'caminar (nosotros) — present', answer: 'CAMINAMOS' },
      { clue: 'trabajar (yo) — present', answer: 'TRABAJO' },
      { clue: 'trabajar (tú) — present', answer: 'TRABAJAS' },
      { clue: 'trabajar (él) — present', answer: 'TRABAJA' },
      { clue: 'escuchar (yo) — present', answer: 'ESCUCHO' },
      { clue: 'escuchar (tú) — present', answer: 'ESCUCHAS' },
      { clue: 'escuchar (ud.) — present', answer: 'ESCUCHA' },
    ],
    // add other sets similarly...
  ];

  const timerRef = useRef(null);

  const [grid, setGrid] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [foundSet, setFoundSet] = useState(new Set());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [currentSel, setCurrentSel] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wordList, setWordList] = useState([]);
  const [currentSet, setCurrentSet] = useState([]);
  const [isWin, setIsWin] = useState(false);

  // Utility shuffle
  const shuffle = (arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Start new game
  const newGame = () => {
    clearInterval(timerRef.current);
    setFoundSet(new Set());
    setSelecting(false);
    setStartCell(null);
    setCurrentSel([]);
    setIsWin(false);
    buildGame();
    startTimer();
  };

  const startTimer = () => {
    setTimeElapsed(0);
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const buildGame = () => {
    // pick a random set
    const setIdx = Math.floor(Math.random() * CONJ_SETS.length);
    const selectedSet = CONJ_SETS[setIdx];
    const filteredSet = selectedSet.filter(e => e.answer.length <= Math.max(ROWS, COLS));
    const gameSet = shuffle([...filteredSet]).slice(0, NUM_WORDS);
    setCurrentSet(gameSet);

    // Initialize grid
    let newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    let newPlaced = [];

    // Place words
    for (const entry of gameSet) {
      placeWord(entry, newGrid, newPlaced);
    }

    // Fill remaining cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c]) {
          newGrid[r][c] = FILLER[Math.floor(Math.random() * FILLER.length)];
        }
      }
    }

    setGrid(newGrid);
    setPlaced(newPlaced);
    setWordList(newPlaced);
  };

  const placeWord = (entry, gridRef, placedRef) => {
    const word = entry.answer;
    for (let attempt = 0; attempt < 300; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (canPlace(word, r, c, dr, dc, gridRef)) {
        for (let j = 0; j < word.length; j++) {
          gridRef[r + dr * j][c + dc * j] = word[j];
        }
        placedRef.push({ ...entry, cells: Array.from({ length: word.length }, (_, j) => [r + dr * j, c + dc * j]) });
        return true;
      }
    }
    return false;
  };

  const canPlace = (word, r, c, dr, dc, gridRef) => {
    for (let i = 0; i < word.length; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (gridRef[nr][nc] && gridRef[nr][nc] !== word[i]) return false;
    }
    return true;
  };

  // Effect: start game on mount
  useEffect(() => {
    newGame();
    return () => clearInterval(timerRef.current);
  }, []);

  // Effect: check win condition
  useEffect(() => {
    if (placed.length && foundSet.size === placed.length && !isWin) {
      stopTimer();
      setIsWin(true);
    }
  }, [foundSet, placed, isWin]);

  // Helper to get cell element (if needed)
  const handleCellMouseDown = (r, c) => {
    setSelecting(true);
    setStartCell([r, c]);
    setCurrentSel([[r, c]]);
  };

  const handleCellMouseOver = (r, c) => {
    if (!selecting) return;
    setCurrentSel(getCells(startCell, [r, c]));
  };

  const handleMouseUp = () => {
    if (!selecting) return;
    setSelecting(false);
    checkSelection();
    setCurrentSel([]);
  };

  const getCells = ([r0, c0], [r1, c1]) => {
    const dr = Math.sign(r1 - r0);
    const dc = Math.sign(c1 - c0);
    if (r0 !== r1 && c0 !== c1 && Math.abs(r1 - r0) !== Math.abs(c1 - c0))
      return [[r0, c0]];
    const cells = [];
    let r = r0, c = c0;
    while (true) {
      cells.push([r, c]);
      if (r === r1 && c === c1) break;
      r += dr;
      c += dc;
      if (cells.length > Math.max(ROWS, COLS) + 1) break;
    }
    return cells;
  };

  const checkSelection = () => {
    const str = currentSel.map(([r, c]) => grid[r][c]).join('');
    const rev = str.split('').reverse().join('');
    for (const p of placed) {
      if (foundSet.has(p.answer)) continue;
      if (str === p.answer || rev === p.answer) {
        setFoundSet(prev => {
            const newSet = new Set(prev);
            newSet.add(p.answer);
            return newSet;
          });
        // check win
        if (placed.length && (new Set([...foundSet, p.answer]).size === placed.length)) {
          setTimeout(() => {
            setIsWin(true);
            stopTimer();
          }, 400);
        }
        break;
      }
    }
  };

  const handleNewGame = () => {
    newGame();
  };

  // JSX rendering
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  return (
    <>
      {/* The CSS imported separately */}
      <header>
        <h1>WORD SEARCH</h1>
        <p className="subtitle">spanish verb conjugation challenge</p>
      </header>
      <div className="wordsearch-container">
      <div className="game-area">
        <div className="grid-wrap">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${COLS}, var(--cell))` }}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
          >
            {grid.flatMap((rowArr, r) =>
              rowArr.map((cell, c) => {
                const isSelected = currentSel.some(([rr, cc]) => rr === r && cc === c);
                const classNames = ['cell'];
                if (isSelected) classNames.push('selected');
                
                // You can add more classes for 'found' cells if you track them

                const isFound = placed.some(p =>
                    foundSet.has(p.answer) &&
                    p.cells.some(([rr, cc]) => rr === r && cc === c)
                );
                    
                if (isFound) classNames.push('found');

                return (
                  <div
                    key={`${r}-${c}`}
                    className={classNames.join(' ')}
                    onMouseDown={() => handleCellMouseDown(r, c)}
                    onMouseOver={() => handleCellMouseOver(r, c)}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el && el.classList.contains('cell')) {
                        handleCellMouseDown(r, c);
                      }
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const el = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (el && el.classList.contains('cell')) {
                        handleCellMouseOver(r, c);
                      }
                    }}
                    data-r={r}
                    data-c={c}
                  >
                    {cell}
                  </div>
                );
              })
            )}
          </div>
          <div className="status">
            Found <span id="found-count">{foundSet.size}</span> / <span id="total-count">{placed.length}</span> words
          </div>
          <div className="timer">
            Time: <span id="timer">{`${minutes}:${seconds.toString().padStart(2, '0')}`}</span>
          </div>
        </div>
        <div className="sidebar">
          <div className="sidebar-title">Words</div>
          <div className="word-list">
            {wordList.map((p, index) => (
              <div
                key={index}
                className={`word-item ${foundSet.has(p.answer) ? 'found' : ''}`}
                data-answer={p.answer}
                data-clue={p.clue}
              >
                <span className="clue">{p.clue}</span>
                <span className="answer-hint">{'_'.repeat(p.answer.length)} ({p.answer.length} letters)</span>
              </div>
            ))}
          </div>
          <button style={{ marginTop: 18, width: '100%', fontSize: 18, padding: 10 }} onClick={handleNewGame}>NEW GAME</button>
        </div>
      </div>
      {/* Win overlay */}
      {isWin && (
        <div className="win-overlay show">
          <div className="win-box">
            <div className="win-title">YOU WIN!</div>
            <div className="win-sub">all words found</div>
            <div className="win-time">{`${minutes}:${seconds.toString().padStart(2, '0')}`}</div>
            <button onClick={handleNewGame}>PLAY AGAIN</button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default WordSearch;