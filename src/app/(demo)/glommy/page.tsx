/*
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
/*

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

*/

"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import RAPIER from "@dimforge/rapier3d-compat";
RAPIER.init();

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
  simulationComplete: boolean;
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
}

interface ShapeResult {
  id: number;
  type: string;
  color: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

interface LiveDataProps {
  liveResults: ShapeResult[];
  frameCount: number;
}

interface PhysicsBody {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  mass: number;
  radius: number;
  friction: number;
  sleeping: boolean;
  sleepCounter: number;
}

// Live simulation data display component
const LiveDataDisplay: React.FC<LiveDataProps> = ({
  liveResults,
  frameCount,
}) => {
  return (
    <div className="p-4 bg-black bg-opacity-90 text-white h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">Live Simulation Data</h2>
      <div className="text-sm mb-3 text-green-400">
        Frame: {frameCount} | Objects: {liveResults.length}
      </div>
      <div className="space-y-2">
        {liveResults.map((result) => (
          <div key={result.id} className="bg-gray-800 p-2 rounded text-xs">
            <div className="flex items-center mb-1">
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: result.color }}
              />
              <span className="font-semibold text-sm">
                {result.type} #{result.id}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>
                <strong>Pos:</strong>
                <div>X: {result.position.x.toFixed(2)}</div>
                <div>Y: {result.position.y.toFixed(2)}</div>
                <div>Z: {result.position.z.toFixed(2)}</div>
              </div>
              <div>
                <strong>Rot:</strong>
                <div>X: {result.rotation.x.toFixed(2)}</div>
                <div>Y: {result.rotation.y.toFixed(2)}</div>
                <div>Z: {result.rotation.z.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Results display component
const ResultsDisplay: React.FC<{ results: ShapeResult[] }> = ({ results }) => {
  return (
    <div className="p-4 bg-black bg-opacity-90 text-white h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Final Results</h2>
      <div className="space-y-3">
        {results.map((result) => (
          <div key={result.id} className="bg-gray-800 p-3 rounded text-sm">
            <div className="flex items-center mb-2">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: result.color }}
              />
              <span className="font-semibold">
                {result.type} #{result.id}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Position:</strong>
                <div>X: {result.position.x.toFixed(3)}</div>
                <div>Y: {result.position.y.toFixed(3)}</div>
                <div>Z: {result.position.z.toFixed(3)}</div>
              </div>
              <div>
                <strong>Rotation:</strong>
                <div>X: {result.rotation.x.toFixed(3)}</div>
                <div>Y: {result.rotation.y.toFixed(3)}</div>
                <div>Z: {result.rotation.z.toFixed(3)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Configuration panel component
const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  setConfig,
  startSimulation,
  resetSimulation,
  simulationActive,
  simulationComplete,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div className="p-4 bg-black bg-opacity-90 text-white h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-2">Headless Physics Simulation</h2>

      <div className="text-sm mb-4 text-yellow-200">
        Running physics without rendering for maximum speed
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Objects Count: {config.objectCount}
          </label>
          <input
            type="range"
            name="objectCount"
            min="3"
            max="50"
            value={config.objectCount}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Radius: {config.radius}
          </label>
          <input
            type="range"
            name="radius"
            min="2"
            max="10"
            step="0.5"
            value={config.radius}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Gravity Strength: {config.gravityStrength}
          </label>
          <input
            type="range"
            name="gravityStrength"
            min="0.5"
            max="10"
            step="0.5"
            value={config.gravityStrength}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Friction: {config.friction}
          </label>
          <input
            type="range"
            name="friction"
            min="0"
            max="2"
            step="0.1"
            value={config.friction}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Vertical Spread: {config.verticalSpread}
          </label>
          <input
            type="range"
            name="verticalSpread"
            min="0"
            max="10"
            step="0.5"
            value={config.verticalSpread}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Simulation Speed: {config.simulationSpeed}x
          </label>
          <input
            type="range"
            name="simulationSpeed"
            min="1.0"
            max="20.0"
            step="0.5"
            value={config.simulationSpeed}
            onChange={handleChange}
            className="w-full"
            disabled={simulationActive}
          />
        </div>

        <button
          onClick={startSimulation}
          className={`w-full p-3 rounded text-lg font-semibold ${
            simulationActive
              ? "bg-green-500"
              : simulationComplete
              ? "bg-purple-500 hover:bg-purple-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={simulationActive}
        >
          {simulationActive
            ? "Running..."
            : simulationComplete
            ? "Complete!"
            : "Start Simulation"}
        </button>

        <button
          onClick={resetSimulation}
          className="w-full p-2 bg-red-500 hover:bg-red-600 rounded"
        >
          Reset Simulation
        </button>
      </div>
    </div>
  );
};

// Headless physics simulation hook
const usePhysicsSimulation = (
  config: ConfigProps,
  active: boolean,
  onComplete: (results: ShapeResult[]) => void,
  onLiveUpdate: (results: ShapeResult[], frameCount: number) => void
) => {
  const worldRef = useRef<any>(null);
  const bodiesRef = useRef<any[]>([]);
  const shapesRef = useRef<ShapeObject[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Initialize physics world and bodies
  useEffect(() => {
    if (!active) return;

    const initializeSimulation = async () => {
      // Create physics world
      const world = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });
      worldRef.current = world;

      // Generate shapes
      const colors = [
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

      const shapeTypes = ["box", "sphere", "cylinder", "cone"];
      const shapes: ShapeObject[] = [];
      const bodies: any[] = [];

      // Helper functions
      const getShapeRadius = (type: string, dimensions: number[]) => {
        switch (type) {
          case "sphere":
            return dimensions[0];
          case "box":
            return Math.max(...dimensions) / 2;
          case "cylinder":
          case "cone":
            return Math.max(dimensions[0], dimensions[1] / 2);
          default:
            return 0.5;
        }
      };

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

      const findValidPosition = (
        shapeType: string,
        dimensions: number[],
        existingShapes: Array<{
          position: [number, number, number];
          radius: number;
        }>,
        baseAngle: number
      ): [number, number, number] => {
        const radius = getShapeRadius(shapeType, dimensions);

        for (let attempt = 0; attempt < 50; attempt++) {
          let position: [number, number, number];

          if (attempt < 10) {
            const angle = baseAngle + (Math.random() - 0.5) * 0.2;
            const x = Math.cos(angle) * config.radius;
            const z = Math.sin(angle) * config.radius;
            const y =
              config.verticalSpread > 0
                ? (Math.random() - 0.5) * config.verticalSpread * 2
                : Math.random() * 2 - 1;
            position = [x, y, z];
          } else {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (config.radius + 3);
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const y =
              config.verticalSpread > 0
                ? (Math.random() - 0.5) * config.verticalSpread * 2
                : Math.random() * 2 - 1;
            position = [x, y, z];
          }

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

        // Fallback position
        const angle = baseAngle;
        const x = Math.cos(angle) * config.radius;
        const z = Math.sin(angle) * config.radius;
        const y =
          config.verticalSpread > 0
            ? (Math.random() - 0.5) * config.verticalSpread * 2
            : Math.random() * 2 - 1;
        return [x, y, z];
      };

      // Create bodies
      const placedShapes: Array<{
        position: [number, number, number];
        radius: number;
      }> = [];

      for (let i = 0; i < config.objectCount; i++) {
        const baseAngle = (i / config.objectCount) * Math.PI * 2;
        const type =
          i === 0
            ? "sphere"
            : (shapeTypes[
                Math.floor(Math.random() * shapeTypes.length)
              ] as any);

        let dimensions: number[];
        let colliderDesc: any;

        switch (type) {
          case "box":
            dimensions = [
              0.5 + Math.random() * 0.5,
              0.5 + Math.random() * 0.5,
              0.5 + Math.random() * 0.5,
            ];
            colliderDesc = RAPIER.ColliderDesc.cuboid(
              dimensions[0],
              dimensions[1],
              dimensions[2]
            );
            break;
          case "sphere":
            dimensions = [0.4 + Math.random() * 0.4];
            colliderDesc = RAPIER.ColliderDesc.ball(dimensions[0]);
            break;
          case "cylinder":
            dimensions = [0.3 + Math.random() * 0.3, 0.8 + Math.random() * 0.8];
            colliderDesc = RAPIER.ColliderDesc.cylinder(
              dimensions[1] / 2,
              dimensions[0]
            );
            break;
          case "cone":
            dimensions = [0.3 + Math.random() * 0.3, 0.8 + Math.random() * 0.8];
            colliderDesc = RAPIER.ColliderDesc.cone(
              dimensions[1] / 2,
              dimensions[0]
            );
            break;
          default:
            dimensions = [0.5, 0.5, 0.5];
            colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        }

        const position = findValidPosition(
          type,
          dimensions,
          placedShapes,
          baseAngle
        );
        const radius = getShapeRadius(type, dimensions);
        placedShapes.push({ position, radius });

        // Create rigid body
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
          position[0],
          position[1],
          position[2]
        );
        const rigidBody = world.createRigidBody(rigidBodyDesc);

        // Create collider
        colliderDesc.setFriction(config.friction);
        colliderDesc.setRestitution(0.0);
        world.createCollider(colliderDesc, rigidBody);

        // Set physics properties
        rigidBody.setLinearDamping(1.0);
        rigidBody.setAngularDamping(10.0);

        const shape: ShapeObject = {
          id: i,
          type: type as any,
          position,
          dimensions,
          color: colors[i % colors.length],
          friction: config.friction,
        };

        shapes.push(shape);
        bodies.push(rigidBody);
      }

      shapesRef.current = shapes;
      bodiesRef.current = bodies;

      console.log(
        `Initialized headless physics simulation with ${shapes.length} objects`
      );

      // Start simulation loop
      runSimulation();
    };

    const runSimulation = () => {
      const world = worldRef.current;
      const bodies = bodiesRef.current;

      if (!world || !bodies.length) return;

      let frameCount = 0;

      const simulationLoop = () => {
        frameCount++;

        // Apply gravitational forces
        bodies.forEach((rigidBody) => {
          if (!rigidBody) return;

          // Wake up sleeping bodies
          if (rigidBody.isSleeping()) {
            rigidBody.wakeUp();
          }

          const position = rigidBody.translation();
          const velocity = rigidBody.linvel();

          const distanceFromAxis = Math.sqrt(
            position.x * position.x + position.z * position.z
          );

          // Apply velocity damping
          const dampingFactor = Math.min(1.0, Math.pow(distanceFromAxis, 0.1));
          rigidBody.setLinvel(
            {
              x: velocity.x * dampingFactor,
              y: velocity.y * dampingFactor,
              z: velocity.z * dampingFactor,
            },
            true
          );

          // Apply gravitational force toward center
          const direction = {
            x: -position.x,
            y: -position.y,
            z: -position.z,
          };
          const length = Math.sqrt(
            direction.x ** 2 + direction.y ** 2 + direction.z ** 2
          );
          if (length > 0) {
            direction.x /= length;
            direction.y /= length;
            direction.z /= length;
          }

          const forceMultiplier =
            distanceFromAxis < 0.5 ? distanceFromAxis : 1.0;
          const impulse = {
            x: direction.x * config.gravityStrength * 0.005 * forceMultiplier,
            y:
              direction.y *
              config.gravityStrength *
              0.005 *
              forceMultiplier *
              0.5,
            z: direction.z * config.gravityStrength * 0.005 * forceMultiplier,
          };

          rigidBody.applyImpulse(impulse, true);
        });

        // Step the physics world
        world.step();

        // Emit live data every 10 frames for real-time updates
        if (frameCount % 1 === 0) {
          const liveResults: ShapeResult[] = bodies.map((rigidBody, index) => {
            const shape = shapesRef.current[index];
            const position = rigidBody.translation();
            const rotation = rigidBody.rotation();

            // Convert quaternion to euler angles (simplified)
            const euler = {
              x: Math.atan2(
                2 * (rotation.w * rotation.x + rotation.y * rotation.z),
                1 - 2 * (rotation.x ** 2 + rotation.y ** 2)
              ),
              y: Math.asin(
                2 * (rotation.w * rotation.y - rotation.z * rotation.x)
              ),
              z: Math.atan2(
                2 * (rotation.w * rotation.z + rotation.x * rotation.y),
                1 - 2 * (rotation.y ** 2 + rotation.z ** 2)
              ),
            };

            return {
              id: shape.id,
              type: shape.type,
              color: shape.color,
              position: {
                x: position.x,
                y: position.y,
                z: position.z,
              },
              rotation: {
                x: euler.x,
                y: euler.y,
                z: euler.z,
              },
            };
          });

          onLiveUpdate(liveResults, frameCount);
        }

        // Check for completion every 30 frames
        if (frameCount % 30 === 0) {
          const allAtRest = bodies.every((rigidBody) => {
            if (!rigidBody) return true;

            const velocity = rigidBody.linvel();
            const angularVelocity = rigidBody.angvel();
            const totalVelocity = Math.sqrt(
              velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
            );
            const totalAngularVelocity = Math.sqrt(
              angularVelocity.x ** 2 +
                angularVelocity.y ** 2 +
                angularVelocity.z ** 2
            );

            return (
              rigidBody.isSleeping() ||
              (totalVelocity < 0.01 && totalAngularVelocity < 0.01)
            );
          });

          if (allAtRest) {
            console.log(`Simulation completed after ${frameCount} frames`);

            // Collect final results
            const results: ShapeResult[] = bodies.map((rigidBody, index) => {
              const shape = shapesRef.current[index];
              const position = rigidBody.translation();
              const rotation = rigidBody.rotation();

              // Convert quaternion to euler angles (simplified)
              const euler = {
                x: Math.atan2(
                  2 * (rotation.w * rotation.x + rotation.y * rotation.z),
                  1 - 2 * (rotation.x ** 2 + rotation.y ** 2)
                ),
                y: Math.asin(
                  2 * (rotation.w * rotation.y - rotation.z * rotation.x)
                ),
                z: Math.atan2(
                  2 * (rotation.w * rotation.z + rotation.x * rotation.y),
                  1 - 2 * (rotation.y ** 2 + rotation.z ** 2)
                ),
              };

              return {
                id: shape.id,
                type: shape.type,
                color: shape.color,
                position: {
                  x: position.x,
                  y: position.y,
                  z: position.z,
                },
                rotation: {
                  x: euler.x,
                  y: euler.y,
                  z: euler.z,
                },
              };
            });

            onComplete(results);
            return;
          }
        }

        // Continue simulation
        animationFrameRef.current = requestAnimationFrame(simulationLoop);
      };

      simulationLoop();
    };

    initializeSimulation();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (worldRef.current) {
        worldRef.current.free();
        worldRef.current = null;
      }
      bodiesRef.current = [];
      shapesRef.current = [];
    };
  }, [active, config, onComplete, onLiveUpdate]);

  return null;
};

// Main app component
const GravitationalArtPiece: React.FC = () => {
  const [config, setConfig] = useState<ConfigProps>({
    objectCount: 8,
    radius: 2,
    gravityStrength: 3,
    friction: 1.5,
    verticalSpread: 4,
    simulationSpeed: 5.0, // Higher default speed since we're headless
  });

  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationComplete, setSimulationComplete] = useState<boolean>(false);
  const [results, setResults] = useState<ShapeResult[]>([]);
  const [liveResults, setLiveResults] = useState<ShapeResult[]>([]);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  useEffect(() => {
    setSimulationActive(false);
    setSimulationComplete(false);
    setResults([]);
    setLiveResults([]);
    setFrameCount(0);
    console.log("Configuration changed, simulation reset");
  }, [config.objectCount]);

  const startSimulation = useCallback((): void => {
    console.log("Starting headless physics simulation...");
    setSimulationActive(true);
    setSimulationComplete(false);
    setResults([]);
    setLiveResults([]);
    setFrameCount(0);
    setStartTime(Date.now());
  }, []);

  const resetSimulation = useCallback((): void => {
    setSimulationActive(false);
    setSimulationComplete(false);
    setResults([]);
    setLiveResults([]);
    setFrameCount(0);
    setStartTime(0);
    setEndTime(0);
  }, []);

  const handleLiveUpdate = useCallback(
    (currentResults: ShapeResult[], currentFrame: number): void => {
      setLiveResults(currentResults);
      setFrameCount(currentFrame);
    },
    []
  );

  const handleSimulationComplete = useCallback(
    (finalResults: ShapeResult[]): void => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(
        `Headless simulation completed in ${duration.toFixed(
          2
        )} seconds with results:`,
        finalResults
      );
      setSimulationActive(false);
      setSimulationComplete(true);
      setResults(finalResults);
      setEndTime(endTime);
    },
    [startTime]
  );

  // Use the headless physics simulation
  usePhysicsSimulation(
    config,
    simulationActive,
    handleSimulationComplete,
    handleLiveUpdate
  );

  return (
    <div className="w-full h-screen bg-gray-900 flex">
      {/* Left Sidebar - Configuration Panel */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700">
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          startSimulation={startSimulation}
          resetSimulation={resetSimulation}
          simulationActive={simulationActive}
          simulationComplete={simulationComplete}
        />
      </div>

      {/* Center Content Area */}
      <div className="flex-1 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"></div>
        </div>

        {/* In Progress Overlay */}
        {simulationActive && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-white text-4xl font-bold animate-pulse mb-2">
                Physics Simulation Running
              </div>
              <div className="text-white text-xl">
                Frame: {frameCount} • {config.objectCount} objects •{" "}
                {config.simulationSpeed}x speed
              </div>
              <div className="text-gray-300 text-sm mt-2">
                Watch live data on the right →
              </div>
            </div>
          </div>
        )}

        {/* Completion Time Display */}
        {simulationComplete && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded">
            <div className="text-sm">
              Completed in {((endTime - startTime) / 1000).toFixed(2)} seconds
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Live Data / Results */}
      <div className="w-80 flex-shrink-0 border-l border-gray-700">
        {/* Live Data Display during simulation */}
        {simulationActive && liveResults.length > 0 && (
          <LiveDataDisplay liveResults={liveResults} frameCount={frameCount} />
        )}

        {/* Final Results Display after completion */}
        {simulationComplete && results.length > 0 && (
          <ResultsDisplay results={results} />
        )}

        {/* Empty state when not running */}
        {!simulationActive && !simulationComplete && (
          <div className="p-4 bg-black bg-opacity-90 text-white h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-lg mb-2">Ready to Simulate</div>
              <div className="text-sm">
                Start a simulation to see live data here
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GravitationalArtPiece;
