import React from "react";

export default function ExportPanel({ modelName, setModelName, onExport }) {
  const handleExportClick = () => {
    if (!modelName.trim()) {
      alert("Please provide a name before exporting the model.");
      return;
    }
    onExport();
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 20,
        background: "#fff",
        padding: "8px",
        borderRadius: "6px",
        zIndex: 2,
      }}
    >
      <input
        type="text"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        placeholder="Enter export name"
        style={{ padding: "4px", marginRight: "8px" }}
      />
      <button
        onClick={handleExportClick}
        style={{
          padding: "8px 16px",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Export Model
      </button>
    </div>
  );
}
