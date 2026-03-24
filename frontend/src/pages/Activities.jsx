import { useState } from "react";
import WordSearch from "./WordSearch.jsx";
import word from '../assets/WORD.png';
import { X } from 'lucide-react';

export default function Activities() {
    const [showGame, setShowGame] = useState(false);

    return (
        <div style = {{ padding: "40px"}}>
            <h1>Activities</h1>

            {/* Image Button */}
            {/*adjust path*/}
            <img
                src= {word}
                alt="Play Word Search"
                style={{ width: "220px", cursor: "pointer" }}
                onClick={() => setShowGame(true)}
            />

            {/*Popup modal*/}
            {showGame && (
                <div
                    style= {overlayStyle}
                    onClick={() => setShowGame(false)}
                >
                    <div
                        style={modalStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowGame(false)}
                            style={{ marginBottom: "10px" }}
                        >
                            <X size={24} color="#000" />
                        </button>

                        <WordSearch />
                    </div>
                </div>
            )}
        </div>
    );
}

const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  
  const modalStyle = {
    background: "#f8f1f1",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "90%",
  };