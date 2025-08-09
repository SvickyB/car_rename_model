// src/components/ModelViewer.jsx
import React, { useState, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { saveAs } from "file-saver";
import SelectableModel from "./SelectableModel";
import Spinner from "./Spinner";

// Load the garage OBJ+MTL as geometry
function GarageModel() {
  const materials = useLoader(MTLLoader, "/garage.mtl");
  const obj = useLoader(
    OBJLoader,
    "/garage.obj",
    (loader) => {
      materials.preload();
      loader.setMaterials(materials);
    }
  );

  // Align the floor to y=0
  const box = new THREE.Box3().setFromObject(obj);
  const minY = box.min.y;
  obj.position.y -= minY;

  return <primitive object={obj} />;
}

export default function ModelViewer() {
  const [selectedObj, setSelectedObj] = useState(null);
  const [newName, setNewName] = useState("");
  const [modelName, setModelName] = useState("");
  const [uploadedScene, setUploadedScene] = useState(null);
  const [loading, setLoading] = useState(false);

  const sceneRef = useRef(null);
  const originalMaterials = useRef(new Map());
  const uploadedFileName = useRef("");

  const handleRename = () => {
    if (!newName.trim()) return;
    if (selectedObj) {
      selectedObj.name = newName.trim();
      setSelectedObj({ ...selectedObj });
      setNewName("");
    }
  };

  const handleExport = () => {
    if (!modelName.trim()) {
      alert("Please provide a name before exporting the model.");
      return;
    }
    if (!sceneRef.current) {
      alert("No model loaded");
      return;
    }

    // Restore original materials
    sceneRef.current.traverse((child) => {
      if (child.isMesh && originalMaterials.current.has(child.uuid)) {
        child.material = originalMaterials.current.get(child.uuid);
      }
    });

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (result) => {
        const fileBaseName = modelName.trim();
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
    setLoading(true);
    uploadedFileName.current = file.name;
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene;

        // Center the car and place it on the garage floor
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const minY = box.min.y;
        scene.position.sub(center); // center horizontally
        scene.position.y -= minY;   // drop to floor level

        const materialMap = new Map();
        scene.traverse((child) => {
          if (child.isMesh) {
            child.userData.selectable = true;
            materialMap.set(child.uuid, child.material.clone());
          }
        });

        originalMaterials.current = materialMap;
        sceneRef.current = scene;
        setUploadedScene(scene);
        setSelectedObj(null);

        setLoading(false);
        URL.revokeObjectURL(url);
      },
      undefined,
      (error) => {
        console.error("Error loading model", error);
        setLoading(false);
      }
    );
  };

  return (
    <>
      {/* Upload Button */}
      <div style={{ position: "absolute", top: 40, right: 20, zIndex: 1 }}>
        <input
          type="file"
          accept=".glb,.gltf"
          onChange={handleUpload}
          style={{
            padding: "6px",
            borderRadius: "6px",
            background: "#fff",
            fontWeight: "bold",
          }}
        />
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.7)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner />
        </div>
      )}

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
        <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <hemisphereLight intensity={0.8} groundColor={"#444"} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={3}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Lighting from EXR */}
          <Environment files="/garage.exr" background={false} blur={0.3} />

          {/* Physical garage */}
          <GarageModel />

          {/* Uploaded car model */}
          {uploadedScene && (
            <SelectableModel
              key={uploadedScene.uuid}
              onSelect={setSelectedObj}
              selectedObject={selectedObj}
              scene={uploadedScene}
              originalMaterials={originalMaterials.current}
            />
          )}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
          <ContactShadows
            position={[0, -0.01, 0]}
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

      {/* Export Panel */}
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
