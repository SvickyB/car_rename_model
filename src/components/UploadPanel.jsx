import React from "react";

export default function UploadPanel({ onUpload }) {
  return (
    <div style={{ position: "absolute", top: 40, right: 20, zIndex: 1 }}>
      <input
        type="file"
        accept=".glb"
        onChange={onUpload}
        style={{
          padding: "6px",
          borderRadius: "6px",
          background: "#fff",
          fontWeight: "bold",
        }}
      />
    </div>
  );
}
