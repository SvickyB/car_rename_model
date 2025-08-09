import React, { useEffect } from "react";
import * as THREE from "three";

export default function SelectableModel({ onSelect, selectedObject, scene, originalMaterials }) {
  useEffect(() => {
    if (!scene) return;

    // Restore original materials
    scene.traverse((child) => {
      if (child.isMesh && originalMaterials.has(child.uuid)) {
        child.material = originalMaterials.get(child.uuid).clone();
      }
    });

    // Highlight selected mesh
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
