// src/components/Spinner.jsx
import React from "react";

export default function Spinner() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #ccc",
        borderTop: "4px solid #333",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
