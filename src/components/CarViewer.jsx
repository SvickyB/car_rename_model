import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
  ContactShadows,
  Bounds,
} from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { saveAs } from "file-saver";

function SelectableModel({
  onSelect,
  selectedObject,
  scene,
  setSceneRef,
  setOriginalMaterials,
}) {
  useEffect(() => {
    if (!scene) return;

    const materialMap = new Map();
    scene.traverse((child) => {
      if (child.isMesh) {
        child.userData.selectable = true;
        materialMap.set(child.uuid, child.material.clone());
      }
    });

    setOriginalMaterials(materialMap);
    setSceneRef(scene);
  }, [scene]);

  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.emissive = new THREE.Color(0x000000);
        child.material.emissiveIntensity = 0;
      }
    });

    if (selectedObject) {
      const parentGroup =
        selectedObject.parent?.children?.length > 1
          ? selectedObject.parent
          : selectedObject;

      parentGroup.traverse((child) => {
        if (child.isMesh) {
          child.material.emissive = new THREE.Color("yellow");
          child.material.emissiveIntensity = 1.5;
        }
      });
    }
  }, [selectedObject, scene]);

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

  const sceneRef = useRef(null);
  const originalMaterials = useRef(new Map());

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

    sceneRef.current.traverse((child) => {
      if (child.isMesh && originalMaterials.current.has(child.uuid)) {
        child.material = originalMaterials.current.get(child.uuid);
      }
    });

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          saveAs(blob, "renamed_model.glb");
        } else {
          const json = JSON.stringify(result, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          saveAs(blob, "renamed_model.gltf");
        }
      },
      { binary: true }
    );
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const loader = new GLTFLoader();
      loader.parse(contents, "", (gltf) => {
        const scene = gltf.scene;
        scene.traverse((child) => {
          if (child.isMesh) {
            child.userData.selectable = true;
          }
        });
        setUploadedScene(scene);
        sceneRef.current = scene;

        const materialMap = new Map();
        scene.traverse((child) => {
          if (child.isMesh) {
            materialMap.set(child.uuid, child.material.clone());
          }
        });
        originalMaterials.current = materialMap;
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      {/* Upload Button */}
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
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
          <Stage environment="city" intensity={0.6} shadows adjustCamera>
            <Bounds fit clip observe margin={1.2}>
              <SelectableModel
                onSelect={setSelectedObj}
                selectedObject={selectedObj}
                scene={uploadedScene}
                setSceneRef={(scene) => (sceneRef.current = scene)}
                setOriginalMaterials={(materials) =>
                  (originalMaterials.current = materials)
                }
              />
            </Bounds>
          </Stage>
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
        <button
          onClick={handleExport}
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            padding: "10px 20px",
            background: "#333",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          Export Renamed Model
        </button>
      )}
    </>
  );
}

export default ModelViewer;