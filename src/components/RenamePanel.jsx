import React from "react";

export default function RenamePanel({ selectedObj, newName, setNewName, onRename }) {
  if (!selectedObj) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 100,
        left: 20,
        background: "#fff",
        padding: 15,
        borderRadius: 8,
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        zIndex: 2,
      }}
    >
      <p>
        <b>Selected Object:</b> {selectedObj.name}
      </p>
      <input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Enter new name"
      />
      <button
        onClick={onRename}
        style={{
          marginLeft: 8,
          padding: "4px 10px",
          cursor: "pointer",
        }}
      >
        Rename
      </button>
    </div>
  );
}
