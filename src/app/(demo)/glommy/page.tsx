"use client";
import React, { useEffect, useState, useRef, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Type definitions
interface ConfigProps {
  objectCount: number;
  radius: number;
  gravityStrength: number;
  friction: number;
  verticalSpread: number;
  simulationSpeed: number;
}

interface ConfigPanelProps {
  config: ConfigProps;
  setConfig: React.Dispatch<React.SetStateAction<ConfigProps>>;
  startSimulation: () => void;
  resetSimulation: () => void;
  simulationActive: boolean;
}

interface ShapeProps {
  type: "box" | "sphere" | "cylinder" | "cone";
  position: [number, number, number];
  dimensions: number[];
  color: string;
  friction: number;
}

interface ShapeObject extends ShapeProps {
  id: number;
  ref: RefObject<any>;
}

interface ForceApplierProps {
  shapes: ShapeObject[];
  active: boolean;
  gravityStrength: number;
  simulationSpeed: number;
}

interface SceneProps {
  config: ConfigProps;
  active: boolean;
  resetTrigger: number;
}

// Configuration panel component
const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  startSimulation,
  resetSimulation,
  simulationActive,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div className="absolute top-0 left-0 p-4 bg-black bg-opacity-50 text-white rounded-br-lg">
      <h2 className="text-xl font-bold mb-2">Configuration</h2>

      <div className="text-sm mb-2 text-yellow-200">
        Note: Changing object count resets the simulation
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Objects Count:</label>
        <input
          type="range"
          name="objectCount"
          min="3"
          max="20"
          value={config.objectCount}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.objectCount}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Radius:</label>
        <input
          type="range"
          name="radius"
          min="2"
          max="10"
          step="0.5"
          value={config.radius}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.radius}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Gravity Strength:</label>
        <input
          type="range"
          name="gravityStrength"
          min="0.5"
          max="10"
          step="0.5"
          value={config.gravityStrength}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.gravityStrength}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Friction:</label>
        <input
          type="range"
          name="friction"
          min="0"
          max="2"
          step="0.1"
          value={config.friction}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.friction}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Vertical Spread:</label>
        <input
          type="range"
          name="verticalSpread"
          min="0"
          max="10"
          step="0.5"
          value={config.verticalSpread}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.verticalSpread}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>Simulation Speed:</label>
        <input
          type="range"
          name="simulationSpeed"
          min="1.0"
          max="10.0"
          step="0.1"
          value={config.simulationSpeed}
          onChange={handleChange}
          className="w-full"
        />
        <span>{config.simulationSpeed}</span>
      </div>

      <button
        onClick={startSimulation}
        className={`mt-4 w-full p-2 rounded ${
          simulationActive
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {simulationActive ? "Simulation Active" : "Start Simulation"}
      </button>

      <button
        onClick={resetSimulation}
        className="mt-2 w-full p-2 bg-red-500 hover:bg-red-600 rounded"
      >
        Reset Simulation
      </button>
    </div>
  );
};

// Simple camera controls component without OrbitControls import
const CameraControls: React.FC = () => {
  const { camera, gl } = useThree();
  const sphericalRef = useRef(new THREE.Spherical());
  const vectorRef = useRef(new THREE.Vector3());
  const isDragRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const radiusRef = useRef(15);
  const isInitializedRef = useRef(false);

  const updateCameraPosition = () => {
    if (!isInitializedRef.current) return;

    vectorRef.current.setFromSpherical(sphericalRef.current);
    vectorRef.current.add(targetRef.current);
    camera.position.copy(vectorRef.current);
    camera.lookAt(targetRef.current);
  };

  useEffect(() => {
    sphericalRef.current.set(radiusRef.current, Math.PI / 3, 0);
    isInitializedRef.current = true;
    updateCameraPosition();

    const canvas = gl.domElement;

    const onMouseDown = (event: MouseEvent) => {
      isDragRef.current = true;
      previousMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragRef.current) return;

      const deltaX = event.clientX - previousMouseRef.current.x;
      const deltaY = event.clientY - previousMouseRef.current.y;

      sphericalRef.current.theta -= deltaX * 0.01;
      sphericalRef.current.phi += deltaY * 0.01;

      sphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, sphericalRef.current.phi)
      );

      updateCameraPosition();

      previousMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragRef.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      radiusRef.current += event.deltaY * 0.01;
      radiusRef.current = Math.max(3, Math.min(50, radiusRef.current));
      sphericalRef.current.radius = radiusRef.current;
      updateCameraPosition();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [updateCameraPosition, camera, gl]);

  return null;
};

/*
// Debug ForceApplier to see exactly what's happening with refs
const ForceApplier: React.FC<ForceApplierProps> = ({
  shapes,
  active,
  gravityStrength,
  dampingStrength,
}) => {
  const frameCount = useRef(0);
  const lastShapeCount = useRef(0);

  // Reset frame count when shapes array changes
  useEffect(() => {
    if (shapes.length !== lastShapeCount.current) {
      frameCount.current = 0;
      lastShapeCount.current = shapes.length;
      console.log("=== ForceApplier: Shapes changed ===");
      console.log("New shape count:", shapes.length);
      console.log(
        "Refs summary:",
        shapes.map(
          (s, i) => `Shape ${i}: ${s.ref.current ? "HAS REF" : "NO REF"}`
        )
      );
    }
  }, [shapes]);

  useFrame(() => {
    if (!active) return;

    frameCount.current++;

    // Check refs on every frame, not just once
    const activeShapes = shapes.filter(
      (shape) => shape.ref && shape.ref.current
    );

    if (frameCount.current === 1) {
      console.log("=== ForceApplier: First frame ===");
      console.log("Active?", active);
      console.log("Total shapes:", shapes.length);
      console.log("Shapes with refs:", activeShapes.length);
      console.log("Individual ref status:");
      shapes.forEach((shape, i) => {
        console.log(
          `  Shape ${i}: ref=${!!shape.ref}, ref.current=${!!shape.ref
            ?.current}`
        );
      });
    }

    // Log every 60 frames to track ref status over time
    if (frameCount.current % 60 === 5) {
      const refsAttached = shapes.filter((s) => s.ref?.current).length;
      console.log(
        `Frame ${frameCount.current}: ${refsAttached}/${shapes.length} refs attached`
      );
    }

    activeShapes.forEach((shape, index) => {
      const rigidBody = shape.ref.current;

      try {
        const position = rigidBody.translation();
        const velocity = rigidBody.linvel();

        const distanceFromAxis = Math.sqrt(
          position.x * position.x + position.z * position.z
        );
        const horizontalSpeed = Math.sqrt(
          velocity.x * velocity.x + velocity.z * velocity.z
        );

        const direction = new THREE.Vector3(
          -position.x,
          0,
          -position.z
        ).normalize();

        const velocityDamping = Math.max(
          0.98,
          1 - horizontalSpeed * 0.02 * dampingStrength
        );

        rigidBody.setLinvel(
          {
            x: velocity.x * Math.min(1.0, Math.pow(distanceFromAxis, 0.1)), // * velocityDamping,
            y: 0,
            z: velocity.z * Math.min(1.0, Math.pow(distanceFromAxis, 0.1)), // * velocityDamping,
          },
          true
        );

        let forceMultiplier;
        if (distanceFromAxis < 10.0) {
          forceMultiplier = distanceFromAxis / 10;
        } else {
          forceMultiplier = 1.0;
        }

        const impulse = {
          x: direction.x * gravityStrength * 0.005 * forceMultiplier,
          y: 0,
          z: direction.z * gravityStrength * 0.005 * forceMultiplier,
        };

        rigidBody.applyImpulse(impulse, true);

        if (index === 0 && frameCount.current % 60 === 5) {
          //console.log("Applying impulse to first shape:", impulse);
        }
      } catch (error) {
        console.warn(`Error processing shape ${index}:`, error);
      }
    });
  });

  return null;
};
*/
// Corrected aggressive anti-wiggle ForceApplier for v2.1.0

// Fix 2: Wake up objects when simulation starts
const ForceApplier: React.FC<ForceApplierProps> = ({
  shapes,
  active,
  gravityStrength,
  simulationSpeed,
}) => {
  const frameCount = useRef(0);
  const lastShapeCount = useRef(0);
  const hasWakenUp = useRef(false);

  useEffect(() => {
    if (shapes.length !== lastShapeCount.current) {
      frameCount.current = 0;
      lastShapeCount.current = shapes.length;
      hasWakenUp.current = false;
      console.log("=== ForceApplier: Shapes changed ===");
    }
  }, [shapes]);

  useFrame(() => {
    if (!active) return;

    frameCount.current++;

    // Wake up all objects on first active frame
    if (!hasWakenUp.current) {
      shapes.forEach((shape, index) => {
        const rigidBody = shape.ref.current;
        if (rigidBody) {
          rigidBody.wakeUp();
          console.log(`Woke up shape ${index}`);
        }
      });
      hasWakenUp.current = true;
    }

    const activeShapes = shapes.filter(
      (shape) => shape.ref && shape.ref.current
    );

    activeShapes.forEach((shape, index) => {
      const rigidBody = shape.ref.current;

      try {
        // Wake up any sleeping objects (in case they went to sleep)
        if (rigidBody.isSleeping()) {
          rigidBody.wakeUp();
        }

        const position = rigidBody.translation();
        const velocity = rigidBody.linvel();

        const distanceFromAxis = Math.sqrt(
          position.x * position.x + position.z * position.z
        );
        /*
        const horizontalSpeed = Math.sqrt(
          velocity.x * velocity.x + velocity.z * velocity.z
        );
        */

        const direction = new THREE.Vector3(
          -position.x,
          -position.y,
          -position.z
        ).normalize();

        rigidBody.setLinvel(
          {
            x: velocity.x * Math.min(1.0, Math.pow(distanceFromAxis, 0.1)),
            y: velocity.y * Math.min(1.0, Math.pow(distanceFromAxis, 0.1)),
            z: velocity.z * Math.min(1.0, Math.pow(distanceFromAxis, 0.1)),
          },
          true
        );

        let forceMultiplier;
        if (distanceFromAxis < 0.5) {
          forceMultiplier = distanceFromAxis;
        } else {
          forceMultiplier = 1.0;
        }

        const impulse = {
          x:
            direction.x *
            gravityStrength *
            0.005 *
            forceMultiplier *
            simulationSpeed,
          y:
            direction.y *
            gravityStrength *
            0.005 *
            forceMultiplier *
            0.5 *
            simulationSpeed,
          z:
            direction.z *
            gravityStrength *
            0.005 *
            forceMultiplier *
            simulationSpeed,
        };

        rigidBody.applyImpulse(impulse, true);
      } catch (error) {
        console.warn(`Error processing shape ${index}:`, error);
      }
    });
  });

  return null;
};

const Scene: React.FC<SceneProps> = ({ config, active, resetTrigger }) => {
  const [shapes, setShapes] = useState<ShapeObject[]>([]);
  const originalPositions = useRef<[number, number, number][]>([]);
  const [sceneKey, setSceneKey] = useState(0);

  const colors: string[] = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F3FF33",
    "#FF33F3",
    "#33FFF3",
    "#FF8033",
    "#8033FF",
    "#33FF80",
    "#F380FF",
  ];

  const shapeTypes: ("box" | "sphere" | "cylinder" | "cone")[] = [
    "box",
    "sphere",
    "cylinder",
    "cone",
  ];

  // Helper function to get shape radius/extent
  const getShapeRadius = (type: string, dimensions: number[]) => {
    switch (type) {
      case "sphere":
        return dimensions[0]; // radius
      case "box":
        const [w, h, d] = dimensions as [number, number, number];
        return Math.max(w, h, d) / 2; // Half of largest dimension
      case "cylinder":
      case "cone":
        return Math.max(dimensions[0], dimensions[1] / 2); // radius or half-height
      default:
        return 0.5;
    }
  };

  // Check if two shapes would overlap
  const wouldOverlap = (
    pos1: [number, number, number],
    pos2: [number, number, number],
    radius1: number,
    radius2: number,
    buffer: number = 0.1
  ) => {
    const distance = Math.sqrt(
      Math.pow(pos1[0] - pos2[0], 2) +
        Math.pow(pos1[1] - pos2[1], 2) +
        Math.pow(pos1[2] - pos2[2], 2)
    );
    return distance < radius1 + radius2 + buffer;
  };

  // Find a valid position that doesn't overlap with existing shapes
  const findValidPosition = (
    shapeType: string,
    dimensions: number[],
    existingShapes: Array<{
      position: [number, number, number];
      radius: number;
    }>,
    baseAngle: number,
    maxAttempts: number = 50
  ) => {
    const radius = getShapeRadius(shapeType, dimensions);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Try different strategies for different attempts
      let position: [number, number, number];

      if (attempt < 10) {
        // First tries: use the intended orbital position
        const angle = baseAngle + (Math.random() - 0.5) * 0.2; // Small random variation
        const x = Math.cos(angle) * config.radius;
        const z = Math.sin(angle) * config.radius;
        const y =
          config.verticalSpread > 0
            ? (Math.random() - 0.5) * config.verticalSpread * 2
            : Math.random() * 2 - 1;
        position = [x, y, z];
      } else if (attempt < 25) {
        // Next tries: vary the radius
        const radiusVariation = config.radius + (Math.random() - 0.5) * 2;
        const angle = baseAngle + (Math.random() - 0.5) * 0.5;
        const x = Math.cos(angle) * radiusVariation;
        const z = Math.sin(angle) * radiusVariation;
        const y =
          config.verticalSpread > 0
            ? (Math.random() - 0.5) * config.verticalSpread * 2
            : Math.random() * 2 - 1;
        position = [x, y, z];
      } else {
        // Last tries: completely random within bounds
        const maxRadius = config.radius + 3;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * maxRadius;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y =
          config.verticalSpread > 0
            ? (Math.random() - 0.5) * config.verticalSpread * 2
            : Math.random() * 2 - 1;
        position = [x, y, z];
      }

      // Check if this position overlaps with any existing shape
      let overlaps = false;
      for (const existing of existingShapes) {
        if (
          wouldOverlap(position, existing.position, radius, existing.radius)
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        return position;
      }
    }

    // If all attempts failed, return the last attempted position
    console.warn(
      `Could not find non-overlapping position for shape, using potentially overlapping position`
    );
    const angle = baseAngle;
    const x = Math.cos(angle) * config.radius;
    const z = Math.sin(angle) * config.radius;
    const y =
      config.verticalSpread > 0
        ? (Math.random() - 0.5) * config.verticalSpread * 2
        : Math.random() * 2 - 1;
    return [x, y, z] as [number, number, number];
  };

  // Generate shapes based on configuration
  useEffect(() => {
    console.log("Generating shapes with config:", config);

    const generatedShapes: ShapeObject[] = [];
    const generatedPositions: [number, number, number][] = [];
    const placedShapes: Array<{
      position: [number, number, number];
      radius: number;
    }> = [];

    for (let i = 0; i < config.objectCount; i++) {
      const baseAngle = (i / config.objectCount) * Math.PI * 2;

      const type =
        i === 0
          ? shapeTypes[1]
          : shapeTypes[Math.floor(Math.random() * shapeTypes.length)];

      let dimensions: number[];
      switch (type) {
        case "box":
          dimensions = [
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5,
          ];
          break;
        case "sphere":
          dimensions = [0.4 + Math.random() * 0.4];
          break;
        case "cylinder":
          dimensions = [0.3 + Math.random() * 0.3, 0.8 + Math.random() * 0.8];
          break;
        case "cone":
          dimensions = [0.3 + Math.random() * 0.3, 0.8 + Math.random() * 0.8];
          break;
        default:
          dimensions = [0.5, 0.5, 0.5];
      }

      // Find a valid non-overlapping position
      const position = findValidPosition(
        type,
        dimensions,
        placedShapes,
        baseAngle
      );
      const radius = getShapeRadius(type, dimensions);

      generatedPositions.push(position);
      placedShapes.push({ position, radius });

      const color = colors[i % colors.length];

      generatedShapes.push({
        id: i,
        type,
        position,
        dimensions,
        color,
        friction: config.friction,
        ref: React.createRef(),
      });
    }

    originalPositions.current = generatedPositions;
    setShapes(generatedShapes);
    setSceneKey((prev) => prev + 1);
  }, [
    config.objectCount,
    config.radius,
    config.verticalSpread,
    config.friction,
    colors,
    config,
    findValidPosition,
    shapeTypes,
  ]);

  // Reset shapes when trigger changes
  useEffect(() => {
    if (resetTrigger > 0 && shapes.length > 0) {
      console.log("Resetting shapes to original positions");
      shapes.forEach((shape, index) => {
        const rigidBody = shape.ref.current;
        if (rigidBody && originalPositions.current[index]) {
          rigidBody.setTranslation(originalPositions.current[index], true);
          rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      });
    }
  }, [resetTrigger, shapes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />

      <Physics
        gravity={[0, 0, 0]}
        // Stability improvements
        timeStep={1 / (60 / config.simulationSpeed)}
        numSolverIterations={8} // More iterations = more stable
        numAdditionalFrictionIterations={4}
        numInternalPgsIterations={1}
        // Contact processing
        allowedLinearError={0.001} // Stricter error tolerance
      >
        {shapes.map((shape) => (
          <RigidBody
            key={`${sceneKey}-${shape.id}`} // Use sceneKey to force re-mounting
            position={shape.position}
            friction={shape.friction}
            restitution={0.0}
            linearDamping={1.0}
            angularDamping={10.0}
            mass={0.1}
            ref={shape.ref}
            colliders={"trimesh"}
            canSleep={true}
          >
            {shape.type === "box" && (
              <mesh>
                <boxGeometry
                  args={shape.dimensions as [number, number, number]}
                />
                <meshStandardMaterial color={shape.color} />
              </mesh>
            )}
            {shape.type === "sphere" && (
              <mesh>
                <sphereGeometry args={[shape.dimensions[0], 32, 32]} />
                <meshStandardMaterial color={shape.color} />
              </mesh>
            )}
            {shape.type === "cylinder" && (
              <mesh>
                <cylinderGeometry
                  args={[
                    shape.dimensions[0],
                    shape.dimensions[0],
                    shape.dimensions[1],
                    32,
                  ]}
                />
                <meshStandardMaterial color={shape.color} />
              </mesh>
            )}
            {shape.type === "cone" && (
              <mesh>
                <coneGeometry
                  args={[shape.dimensions[0], shape.dimensions[1], 32]}
                />
                <meshStandardMaterial color={shape.color} />
              </mesh>
            )}
          </RigidBody>
        ))}

        <ForceApplier
          shapes={shapes}
          active={active}
          gravityStrength={config.gravityStrength}
          simulationSpeed={config.simulationSpeed}
        />
      </Physics>

      <CameraControls />
    </>
  );
};

// Main app component
const GravitationalArtPiece: React.FC = () => {
  const [config, setConfig] = useState<ConfigProps>({
    objectCount: 8,
    radius: 2,
    gravityStrength: 3,
    friction: 1.5,
    verticalSpread: 4,
    simulationSpeed: 1.0,
  });

  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  useEffect(() => {
    setSimulationActive(false);
    console.log("Object count changed, simulation reset");
  }, [config.objectCount]);

  const startSimulation = (): void => {
    console.log("Starting simulation...");
    setSimulationActive(true);
  };

  const resetSimulation = (): void => {
    setSimulationActive(false);
    setResetTrigger((prev) => prev + 1);
    console.log("Simulation reset");
  };

  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <Scene
          config={config}
          active={simulationActive}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      <ConfigPanel
        config={config}
        setConfig={setConfig}
        startSimulation={startSimulation}
        resetSimulation={resetSimulation}
        simulationActive={simulationActive}
      />
    </div>
  );
};

export default GravitationalArtPiece;
