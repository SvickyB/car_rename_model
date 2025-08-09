import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { saveAs } from "file-saver";

function SelectableModel({ onSelect, selectedObject, scene, originalMaterials }) {
  useEffect(() => {
    if (!scene) return;

    // Restore original materials
    scene.traverse((child) => {
      if (child.isMesh && originalMaterials.has(child.uuid)) {
        child.material = originalMaterials.get(child.uuid).clone();
      }
    });

    // Highlight only selected mesh
    if (selectedObject && selectedObject.isMesh) {
      selectedObject.material = selectedObject.material.clone();
      selectedObject.material.emissive = new THREE.Color("yellow");
      selectedObject.material.emissiveIntensity = 1.5;
    }
  }, [selectedObject, scene, originalMaterials]);

  if (!scene) return null;

  return (
    <primitive
      object={scene}
      dispose={null}
      onPointerDown={(e) => {
        e.stopPropagation();
        const mesh = e.object;
        if (mesh?.userData.selectable) {
          onSelect(mesh);
        }
      }}
    />
  );
}

function ModelViewer() {
  const [selectedObj, setSelectedObj] = useState(null);
  const [newName, setNewName] = useState("");
  const [uploadedScene, setUploadedScene] = useState(null);
  const [modelName, setModelName] = useState(""); // ✅ Added missing state

  const sceneRef = useRef(null);
  const originalMaterials = useRef(new Map());
  const uploadedFileName = useRef("");

  const handleRename = () => {
    if (selectedObj && newName.trim()) {
      selectedObj.name = newName;
      alert(`Renamed to: ${newName}`);
      setNewName("");
    }
  };

  const handleExport = () => {
    if (!sceneRef.current) {
      alert("No model loaded");
      return;
    }

    // Restore original materials before export
    sceneRef.current.traverse((child) => {
      if (child.isMesh && originalMaterials.current.has(child.uuid)) {
        child.material = originalMaterials.current.get(child.uuid);
      }
    });

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (result) => {
        const fileBaseName = modelName.trim() || "exported_model";

        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          saveAs(blob, `${fileBaseName}.glb`);
        } else {
          const json = JSON.stringify(result, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          saveAs(blob, `${fileBaseName}.gltf`);
        }
      },
      { binary: true }
    );
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadedFileName.current = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const loader = new GLTFLoader();
      loader.parse(contents, "", (gltf) => {
        const scene = gltf.scene;

        // Center model
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        scene.position.sub(center);

        // Mark meshes as selectable
        scene.traverse((child) => {
          if (child.isMesh) {
            child.userData.selectable = true;
          }
        });

        // Save to refs/state
        sceneRef.current = scene;
        setUploadedScene(scene);

        // Store original materials
        const materialMap = new Map();
        scene.traverse((child) => {
          if (child.isMesh) {
            materialMap.set(child.uuid, child.material.clone());
          }
        });
        originalMaterials.current = materialMap;

        // Reset selection
        setSelectedObj(null);
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      {/* Upload */}
      <div style={{ position: "absolute", top: 40, right: 20, zIndex: 1 }}>
        <input
          type="file"
          accept=".glb"
          onChange={handleUpload}
          style={{
            padding: "6px",
            borderRadius: "6px",
            background: "#fff",
            fontWeight: "bold",
          }}
        />
      </div>

      {/* 3D Viewer */}
      <div
        style={{
          width: "90vw",
          height: "80vh",
          margin: "auto",
          border: "2px solid #ccc",
          borderRadius: "12px",
        }}
      >
        <Canvas shadows camera={{ position: [2, 2, 5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={3} castShadow />

          {uploadedScene && (
            <SelectableModel
              key={uploadedScene.uuid} // ✅ force remount
              onSelect={setSelectedObj}
              selectedObject={selectedObj}
              scene={uploadedScene}
              originalMaterials={originalMaterials.current}
            />
          )}

          <OrbitControls enablePan enableZoom enableRotate />
          <ContactShadows
            position={[0, -0.8, 0]}
            opacity={0.5}
            scale={100}
            blur={1.5}
            far={4}
          />
        </Canvas>
      </div>

      {/* Rename Panel */}
      {selectedObj && (
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
            onClick={handleRename}
            style={{
              marginLeft: 8,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Rename
          </button>
        </div>
      )}

      {/* Export Button */}
      {uploadedScene && (
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
            onClick={handleExport}
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
      )}
    </>
  );
}

export default ModelViewer;
