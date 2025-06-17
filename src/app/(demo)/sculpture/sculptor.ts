import RAPIER, { EventQueue } from "@dimforge/rapier3d";
import {
  SphereDims,
  BoxDims,
  RoundBoxDims,
  ConeDims,
  TorusDims,
  LinkDims,
  HexPrismDims,
  TriPrismDims,
  CylinderDims,
  RoundCylinderDims,
  CapsuleDims,
  CutConeDims,
  ShapeDims,
  ShapeType,
  SolidAngleDims,
  CutSphereDims,
  RoundConeDims,
  OctahedronDims,
} from "./ui";
import * as THREE from "three";
import Rand from "rand-seed";

// Initialize RAPIER once
/*
let rapierInitialized = false;
const initRapier = async () => {
  if (!rapierInitialized) {
    await RAPIER.init();
    rapierInitialized = true;
  }
};
*/

// Type definitions
export interface ShapeDefinition {
  type: ShapeType;
  dimensions: ShapeDims;
}

export interface SimulationConfig {
  shapes: ShapeDefinition[];
  radius: number;
  gravityStrength: number;
  friction: number;
  verticalSpread: number;
  stepsPerIteration: number;
  timeStep: number;
  seed: string;
  maxInitialFrames: number;
  maxSubsequentFrames: number;
  maxAttempts: number;
  substeps?: number; // Number of physics substeps per iteration

  // Overlap resolution settings
  enableOverlapResolution?: boolean; // Whether to resolve overlaps
  maxResolutionIterations?: number; // Max iterations for overlap resolution
  resolutionStep?: number; // How far to move per iteration (small increments)
  separationBuffer?: number; // Extra buffer distance when separating overlaps
  resolutionFramesPerStep?: number; // How many simulation frames between resolution steps (for visibility)
  settleFramesPerStep?: number; // How many frames to show settling physics
}

export interface ShapeState {
  type: ShapeType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  sleeping: boolean;
}

export interface SimulationResult {
  shapes: ShapeState[];
  frameCount: number;
  isComplete: boolean;
  completionReason?: "all_connected" | "max_frames" | "user_stopped";
  overlaps?: Array<{
    index1: number;
    index2: number;
    penetrationDepth: number;
  }>; // Information about overlapping shapes
  resolutionIterations?: number; // Number of iterations used to resolve overlaps
  resolutionState?: "idle" | "separating" | "settling"; // Current resolution state
  connectivityInfo?: any; // Debug info during settling
}

function generateCutConePoints(
  bottomRadius: number,
  topRadius: number,
  halfHeight: number, // Now expects half-height like SDF
  segments = 16
): Float32Array {
  const vertices = [];
  // Bottom circle vertices (at y = -halfHeight)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(
      Math.cos(angle) * bottomRadius,
      -halfHeight, // Bottom at -h
      Math.sin(angle) * bottomRadius
    );
  }
  // Top circle vertices (at y = +halfHeight)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(
      Math.cos(angle) * topRadius,
      halfHeight, // Top at +h
      Math.sin(angle) * topRadius
    );
  }
  return new Float32Array(vertices);
}

function generateTriPrismPoints(
  c_x: number, // Triangle scale parameter (NOT side length)
  c_y: number // Half-height of prism
): Float32Array {
  const points: number[] = [];

  // Triangle vertices based on SDF constraints:
  // max(q.z-c.y, max(q.x*0.866025+p.y*0.5, -p.y) - c.x*0.5)
  const sqrt3_2 = Math.sqrt(3) / 2; // 0.866025

  const tri = [
    [0, c_x], // Top vertex
    [-c_x * sqrt3_2, -c_x / 2], // Bottom left
    [c_x * sqrt3_2, -c_x / 2], // Bottom right
  ];

  // Extrude in Z (bottom and top faces)
  for (const z of [-c_y, c_y]) {
    for (const [x, y] of tri) {
      points.push(x, y, z);
    }
  }

  return new Float32Array(points);
}

function generateHexPrismPoints(
  apothem: number, // c.x in SDF - distance from center to edge
  halfHeight: number // c.y in SDF - half the height of the prism
): Float32Array {
  const points: number[] = [];

  // For a regular hexagon with apothem 'a', the radius (center to vertex) is a * 2/√3
  const radius = apothem * (2 / Math.sqrt(3));

  // Generate 6 vertices of the hexagon in XY plane
  const hexVertices: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3; // 60 degrees apart
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    hexVertices.push([x, y]);
  }

  // Create vertices for both the top and bottom faces
  // Bottom face (z = -halfHeight)
  for (const [x, y] of hexVertices) {
    points.push(x, y, -halfHeight);
  }

  // Top face (z = +halfHeight)
  for (const [x, y] of hexVertices) {
    points.push(x, y, halfHeight);
  }

  return new Float32Array(points);
}

function generateTorusPoints(
  R: number,
  r: number,
  segments = 16,
  sides = 8
): Float32Array {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const cx = Math.cos(theta) * R;
    const cz = Math.sin(theta) * R;

    for (let j = 0; j < sides; j++) {
      const phi = (j / sides) * 2 * Math.PI;
      const x = cx + Math.cos(phi) * r * Math.cos(theta);
      const y = Math.sin(phi) * r;
      const z = cz + Math.cos(phi) * r * Math.sin(theta);
      points.push(x, y, z);
    }
  }
  return new Float32Array(points);
}

function generateLinkPoints(
  arcRadius: number, // r in SDF
  tubeRadius: number, // r2 in SDF
  verticalLength: number, // 2h in SDF
  arcSteps = 16,
  sides = 8
): Float32Array {
  const points: number[] = [];
  const h = verticalLength / 2;

  const path: [number, number][] = [];

  // Top arc (right to left), centered at Y=+h
  for (let i = 0; i <= arcSteps; i++) {
    const theta = Math.PI - (i / arcSteps) * Math.PI;
    path.push([
      arcRadius * Math.cos(theta), // X
      h + arcRadius * Math.sin(theta), // Y
    ]);
  }

  // Downward segment (right side)
  for (let i = 1; i < arcSteps; i++) {
    const t = i / arcSteps;
    path.push([
      arcRadius, // X
      h - 2 * h * t, // Y: from h to -h
    ]);
  }

  // Bottom arc (left to right), centered at Y=-h
  for (let i = 0; i <= arcSteps; i++) {
    const theta = (i / arcSteps) * Math.PI;
    path.push([
      arcRadius * Math.cos(theta), // X
      -h - arcRadius * Math.sin(theta), // Y  <-- Note the minus sign
    ]);
  }

  // Upward segment (left side)
  for (let i = 1; i < arcSteps; i++) {
    const t = i / arcSteps;
    path.push([
      -arcRadius, // X
      -h + 2 * h * t, // Y: from -h to h
    ]);
  }

  // Sweep cross-section (circle in XZ plane) along path
  for (const [px, py] of path) {
    for (let j = 0; j < sides; j++) {
      const phi = (j / sides) * 2 * Math.PI;
      const x = px + tubeRadius * Math.cos(phi);
      const y = py;
      const z = tubeRadius * Math.sin(phi);
      points.push(x, y, z);
    }
  }

  return new Float32Array(points);
}

function generateSolidAnglePoints(
  angleRad: number, // This should be the cone half-angle
  radius: number
): Float32Array {
  const vertices = [];

  // Add apex at origin
  vertices.push(0, 0, 0);

  const azimuthSegments = 6;
  const polarSegments = 3;

  for (let i = 0; i < azimuthSegments; i++) {
    const phi = (i / azimuthSegments) * 2 * Math.PI; // Around Y-axis

    for (let j = 1; j <= polarSegments; j++) {
      // Polar angle from +Y axis: 0 to angleRad (cone half-angle)
      const theta = (j / polarSegments) * angleRad;

      // Multiple radii for volume
      const radii = [radius * 0.5, radius];

      radii.forEach((r) => {
        vertices.push(
          r * Math.sin(theta) * Math.cos(phi), // x
          r * Math.cos(theta), // y (points along +Y when theta=0)
          r * Math.sin(theta) * Math.sin(phi) // z
        );
      });
    }
  }

  return new Float32Array(vertices);
}

function generateCutSpherePoints(
  r: number,
  h_normalized: number
): Float32Array {
  h_normalized = Math.max(-1, Math.min(1, h_normalized));
  const h: number = h_normalized * r;
  const vertices: number[] = [];
  const w: number = Math.sqrt(r * r - h * h);

  const azimuthSegments: number = 16;
  const polarSegments: number = 12;

  for (let i = 0; i < azimuthSegments; i++) {
    const phi: number = (i / azimuthSegments) * 2 * Math.PI;

    for (let j = 0; j < polarSegments; j++) {
      const theta: number = (j / (polarSegments - 1)) * Math.PI;
      const y: number = r * Math.cos(theta);

      // Keep points ABOVE the cutting plane
      if (y >= h) {
        const x: number = r * Math.sin(theta) * Math.cos(phi);
        const z: number = r * Math.sin(theta) * Math.sin(phi);
        vertices.push(x, y, z);
      }
    }
  }

  // Add flat cut surface points
  if (Math.abs(h) < r) {
    for (let i = 0; i < azimuthSegments; i++) {
      const phi: number = (i / azimuthSegments) * 2 * Math.PI;
      const x: number = w * Math.cos(phi);
      const z: number = w * Math.sin(phi);
      vertices.push(x, h, z);
    }
    vertices.push(0, h, 0);
  }

  return new Float32Array(vertices);
}

function generateRoundedConePoints(
  r: number, // Bottom radius
  r2: number, // Top radius
  h: number, // Core height (between sphere centers)
  azimuthSegments: number = 16,
  polarSegments: number = 8
): Float32Array {
  const vertices: number[] = [];

  // Bottom hemisphere (sphere of radius r at origin, keep y <= 0)
  for (let i = 0; i < azimuthSegments; i++) {
    const phi = (i / azimuthSegments) * 2 * Math.PI;

    for (let j = 0; j < polarSegments; j++) {
      const theta = (j / (polarSegments - 1)) * Math.PI;
      const y = r * Math.cos(theta);

      // Only keep bottom hemisphere points
      if (y <= 0) {
        const x = r * Math.sin(theta) * Math.cos(phi);
        const z = r * Math.sin(theta) * Math.sin(phi);
        vertices.push(x, y, z);
      }
    }
  }

  // Top hemisphere (sphere of radius r2 at (0,h,0), keep y >= h)
  for (let i = 0; i < azimuthSegments; i++) {
    const phi = (i / azimuthSegments) * 2 * Math.PI;

    for (let j = 0; j < polarSegments; j++) {
      const theta = (j / (polarSegments - 1)) * Math.PI;
      const y_local = r2 * Math.cos(theta);
      const y_world = h + y_local; // Translate to (0,h,0)

      // Only keep top hemisphere points
      if (y_world >= h) {
        const x = r2 * Math.sin(theta) * Math.cos(phi);
        const z = r2 * Math.sin(theta) * Math.sin(phi);
        vertices.push(x, y_world, z);
      }
    }
  }

  // Cone surface points between y=0 and y=h
  const heightSegments = 4;
  for (let i = 0; i < azimuthSegments; i++) {
    const phi = (i / azimuthSegments) * 2 * Math.PI;

    for (let j = 1; j < heightSegments; j++) {
      // Skip j=0 and j=heightSegments to avoid overlap
      const t = j / heightSegments;
      const y = t * h;
      const radius = r + (r2 - r) * t; // Linear interpolation

      const x = radius * Math.cos(phi);
      const z = radius * Math.sin(phi);
      vertices.push(x, y, z);
    }
  }

  // Add key points for robustness
  vertices.push(0, -r, 0); // Bottom pole
  vertices.push(0, h + r2, 0); // Top pole

  return new Float32Array(vertices);
}

function generateOctahedronPoints(r: number): Float32Array {
  // An octahedron has 6 vertices positioned along the coordinate axes
  // at distance r from the origin
  const vertices = [
    // Positive and negative X axis
    r,
    0,
    0,
    -r,
    0,
    0,

    // Positive and negative Y axis
    0,
    r,
    0,
    0,
    -r,
    0,

    // Positive and negative Z axis
    0,
    0,
    r,
    0,
    0,
    -r,
  ];

  return new Float32Array(vertices);
}

export class PhysicsSimulator {
  private world: any = null;
  private rigidBodies: any[] = [];
  private shapeDefinitions: ShapeDefinition[] = [];
  private config: SimulationConfig;
  private frameCount: number = 0;
  private maxInitialFrames: number = 300;
  private maxSubsequentFrames: number = 30;
  private attempts: number = 0;
  private maxAttempts: number = 10;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private rand: Rand;
  private eventQueue?: EventQueue;
  private contactGraph: Map<number, Set<number>>;

  // Overlap resolution state
  private resolutionState: "idle" | "separating" | "settling" = "idle";
  private resolutionIteration: number = 0;
  private resolutionFrameCounter: number = 0;
  private settleFrameCounter: number = 0;
  private pendingOverlaps: Array<{
    index1: number;
    index2: number;
    penetrationDepth: number;
  }> = [];

  constructor(config: SimulationConfig) {
    this.config = {
      substeps: 1, // Default to 1 substep (original behavior)
      enableOverlapResolution: true, // Enable overlap resolution by default
      maxResolutionIterations: 200, // More iterations for smoother movement
      resolutionStep: 0.003, // Small steps for smooth movement
      separationBuffer: 0.01, // Smaller buffer to reduce separation distance
      resolutionFramesPerStep: 1, // Process every frame for smoothness
      settleFramesPerStep: 1, // Faster settling physics processing
      ...config,
    };
    this.rand = new Rand(config.seed);
    this.maxInitialFrames = config.maxInitialFrames;
    this.maxSubsequentFrames = config.maxSubsequentFrames;
    this.contactGraph = new Map();
  }

  /**
   * Initialize the physics simulation
   */
  async initialize(): Promise<void> {
    //await initRapier();
    this.eventQueue = new EventQueue(true);
    // Create physics world
    this.world = new RAPIER.World({ x: 0.0, y: 0.0, z: 0.0 });
    this.rigidBodies = [];
    this.shapeDefinitions = [...this.config.shapes];
    this.frameCount = 0;
    this.isRunning = false;

    // Create physics bodies for each shape
    const placedShapes: Array<{
      position: [number, number, number];
      radius: number;
    }> = [];

    for (let i = 0; i < this.config.shapes.length; i++) {
      const shapeConfig = this.config.shapes[i];
      const baseAngle = (i / this.config.shapes.length) * Math.PI * 2;

      // Create collider based on shape type
      let colliderDesc: any;
      const dimensions = shapeConfig.dimensions;

      switch (shapeConfig.type) {
        case ShapeType.BOX:
          const boxDims: BoxDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.cuboid(
            boxDims.a.x,
            boxDims.a.y,
            boxDims.a.z
          );
          break;
        case ShapeType.ROUND_BOX:
          const roundBoxDims: RoundBoxDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.roundCuboid(
            roundBoxDims.a.x - roundBoxDims.r,
            roundBoxDims.a.y - roundBoxDims.r,
            roundBoxDims.a.z - roundBoxDims.r,
            roundBoxDims.r
          );
          break;
        case ShapeType.SPHERE:
          const sphereDims: SphereDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.ball(sphereDims.r);
          break;
        case ShapeType.CYLINDER:
          const cylinderDims: CylinderDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.cylinder(
            cylinderDims.h,
            cylinderDims.r
          );
          break;
        case ShapeType.ROUND_CYLINDER:
          const roundCylinderDims: RoundCylinderDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.roundCylinder(
            roundCylinderDims.h,
            roundCylinderDims.r,
            roundCylinderDims.r2
          );
          break;
        case ShapeType.CONE:
          const coneDims: ConeDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.cone(
            coneDims.h / 2,
            coneDims.h * (coneDims.c.x / coneDims.c.y)
          );
          break;
        case ShapeType.TORUS:
          const torusDims: TorusDims = dimensions;
          const torusPoints = generateTorusPoints(torusDims.r1, torusDims.r2);
          colliderDesc = RAPIER.ColliderDesc.convexHull(torusPoints);
          break;
        case ShapeType.LINK:
          const linkDims: LinkDims = dimensions;
          const linkPoints = generateLinkPoints(
            linkDims.r1,
            linkDims.r2,
            linkDims.h * 2
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(linkPoints);
          break;
        case ShapeType.HEX_PRISM:
          const hexPrismDims: HexPrismDims = dimensions;
          const hexPrismPoints = generateHexPrismPoints(
            hexPrismDims.c.x,
            hexPrismDims.c.y
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(hexPrismPoints);
          break;
        case ShapeType.TRI_PRISM:
          const triPrismDims: TriPrismDims = dimensions;
          const triPrismPoints = generateTriPrismPoints(
            triPrismDims.c.x,
            triPrismDims.c.y
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(triPrismPoints);
          break;
        case ShapeType.CAPSULE:
          const capsuleDims: CapsuleDims = dimensions;
          colliderDesc = RAPIER.ColliderDesc.capsule(
            capsuleDims.h / 2,
            capsuleDims.r
          );
          break;
        case ShapeType.CUT_CONE:
          const cutConeDims: CutConeDims = dimensions;
          const cutConePoints = generateCutConePoints(
            cutConeDims.r,
            cutConeDims.r2,
            cutConeDims.h
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(cutConePoints);
          break;
        case ShapeType.SOLID_ANGLE:
          const solidAngleDims: SolidAngleDims = dimensions;
          const solidAnglePoints = generateSolidAnglePoints(
            solidAngleDims.h / 2,
            solidAngleDims.r
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(solidAnglePoints);
          break;
        case ShapeType.CUT_SPHERE:
          const cutSphereDims: CutSphereDims = dimensions;
          const cutSpherePoints = generateCutSpherePoints(
            cutSphereDims.r,
            cutSphereDims.h
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(cutSpherePoints);
          break;
        case ShapeType.ROUND_CONE:
          const roundConeDims: RoundConeDims = dimensions;
          const roundConePoints = generateRoundedConePoints(
            roundConeDims.r1,
            roundConeDims.r2,
            roundConeDims.h
          );
          colliderDesc = RAPIER.ColliderDesc.convexHull(roundConePoints);
          break;
        case ShapeType.OCTAHEDRON:
          const octahedronDims: OctahedronDims = dimensions;
          const octahedronPoints = generateOctahedronPoints(octahedronDims.r);
          colliderDesc = RAPIER.ColliderDesc.convexHull(octahedronPoints);
          break;

        default:
          colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
      }

      // Calculate position around circle
      const position = this.findValidPosition(
        shapeConfig.type,
        dimensions,
        placedShapes,
        baseAngle
      );
      //const position = [0, 0, 0] as [number, number, number];

      //const radius = this.getShapeRadius(shapeConfig.type, dimensions);
      const radius = this.config.radius;

      placedShapes.push({ position, radius });

      // Create rigid body
      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
        position[0],
        position[1],
        position[2]
      );
      const q = new THREE.Quaternion();
      q.setFromEuler(
        new THREE.Euler(
          this.rand.next() * Math.PI,
          this.rand.next() * Math.PI,
          this.rand.next() * Math.PI
        )
      );
      rigidBodyDesc.setRotation(q);
      rigidBodyDesc.mass = 0.001;
      rigidBodyDesc.ccdEnabled = true;
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);

      // Create collider with collision margin to prevent penetration
      colliderDesc.setFriction(this.config.friction);
      colliderDesc.setRestitution(0.0);
      colliderDesc.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS);
      colliderDesc.ccdEnabled = true;

      const collider = this.world.createCollider(colliderDesc, rigidBody);
      collider.setContactForceEventThreshold(0);

      // Set physics properties
      rigidBody.setLinearDamping(1.0);
      rigidBody.setAngularDamping(10.0);
      rigidBody.ccdEnabled = true;

      this.rigidBodies.push(rigidBody);
    }

    this.isInitialized = true;
  }

  areAllBodiesConnected() {
    // Initialize graph with all dynamic bodies
    this.world.bodies.forEach((body: any) => {
      if (body.isDynamic()) {
        this.contactGraph.set(body.handle, new Set());
      }
    });

    // Build connectivity graph from contact force events (proper touching)
    this.eventQueue!.drainContactForceEvents((event: any) => {
      const collider1 = this.world.getCollider(event.collider1());
      const collider2 = this.world.getCollider(event.collider2());
      const body1 = collider1?.parent();
      const body2 = collider2?.parent();

      if (!body1 || !body2) return;
      if (
        !this.contactGraph.has(body1.handle) ||
        !this.contactGraph.has(body2.handle)
      )
        return;

      this.contactGraph.get(body1.handle)!.add(body2.handle);
      this.contactGraph.get(body2.handle)!.add(body1.handle);
    });

    // Also add overlapping bodies as connected
    const overlaps = this.detectOverlaps();
    overlaps.forEach((overlap) => {
      const body1 = this.rigidBodies[overlap.index1];
      const body2 = this.rigidBodies[overlap.index2];

      if (!body1 || !body2) return;
      if (
        !this.contactGraph.has(body1.handle) ||
        !this.contactGraph.has(body2.handle)
      )
        return;

      // Add overlap connections to the graph
      this.contactGraph.get(body1.handle)!.add(body2.handle);
      this.contactGraph.get(body2.handle)!.add(body1.handle);
    });

    // Check connectivity via BFS
    const handles = [...this.contactGraph.keys()];
    if (handles.length === 0) return true;

    const visited = new Set();
    const queue = [handles[0]];

    while (queue.length) {
      const current = queue.pop();
      if (!visited.has(current)) {
        visited.add(current);
        for (const neighbor of this.contactGraph.get(current!)!) {
          queue.push(neighbor);
        }
      }
    }

    return visited.size === handles.length;
  }

  /**
   * Detect overlapping rigid bodies using Rapier's collision detection
   */
  private detectOverlaps(): Array<{
    index1: number;
    index2: number;
    penetrationDepth: number;
  }> {
    const overlaps: {
      index1: number;
      index2: number;
      penetrationDepth: number;
    }[] = [];

    for (let i = 0; i < this.rigidBodies.length; i++) {
      for (let j = i + 1; j < this.rigidBodies.length; j++) {
        const body1 = this.rigidBodies[i];
        const body2 = this.rigidBodies[j];

        if (!body1 || !body2) continue;

        const collider1 = body1.collider();
        const collider2 = body2.collider();

        if (!collider1 || !collider2) continue;

        // Use Rapier's contact detection with callback
        this.world.contactPair(collider1, collider2, (manifold: any) => {
          if (manifold) {
            // Check all contact points for penetration
            for (let k = 0; k < manifold.numContacts(); k++) {
              const contactDist = manifold.contactDist(k);

              // Negative distance indicates penetration/overlap
              if (contactDist < -0.0001) {
                // Small threshold to ignore floating point errors
                overlaps.push({
                  index1: i,
                  index2: j,
                  penetrationDepth: -contactDist,
                });
                break; // Only report one overlap per pair
              }
            }
          }
        });
      }
    }

    return overlaps;
  }

  /**
   * Calculate distance from y-axis (center line)
   */
  private getDistanceFromYAxis(body: any): number {
    const pos = body.translation();
    return Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  }

  /**
   * Get detailed connectivity information for debugging
   */
  getConnectivityInfo(): {
    totalBodies: number;
    connectedBodies: number;
    isFullyConnected: boolean;
    overlappingPairs: number;
    contactPairs: number;
  } {
    // Initialize graph
    this.world.bodies.forEach((body: any) => {
      if (body.isDynamic()) {
        this.contactGraph.set(body.handle, new Set());
      }
    });

    // Count contact pairs
    let contactPairs = 0;
    this.eventQueue!.drainContactForceEvents((event: any) => {
      const collider1 = this.world.getCollider(event.collider1());
      const collider2 = this.world.getCollider(event.collider2());
      const body1 = collider1?.parent();
      const body2 = collider2?.parent();

      if (!body1 || !body2) return;
      if (
        !this.contactGraph.has(body1.handle) ||
        !this.contactGraph.has(body2.handle)
      )
        return;

      this.contactGraph.get(body1.handle)!.add(body2.handle);
      this.contactGraph.get(body2.handle)!.add(body1.handle);
      contactPairs++;
    });

    // Count overlapping pairs and add to graph
    const overlaps = this.detectOverlaps();
    overlaps.forEach((overlap) => {
      const body1 = this.rigidBodies[overlap.index1];
      const body2 = this.rigidBodies[overlap.index2];

      if (!body1 || !body2) return;
      if (
        !this.contactGraph.has(body1.handle) ||
        !this.contactGraph.has(body2.handle)
      )
        return;

      this.contactGraph.get(body1.handle)!.add(body2.handle);
      this.contactGraph.get(body2.handle)!.add(body1.handle);
    });

    // Check connectivity
    const handles = [...this.contactGraph.keys()];
    const totalBodies = handles.length;

    if (totalBodies === 0) {
      return {
        totalBodies: 0,
        connectedBodies: 0,
        isFullyConnected: true,
        overlappingPairs: overlaps.length,
        contactPairs,
      };
    }

    const visited = new Set();
    const queue = [handles[0]];

    while (queue.length) {
      const current = queue.pop();
      if (!visited.has(current)) {
        visited.add(current);
        for (const neighbor of this.contactGraph.get(current!)!) {
          queue.push(neighbor);
        }
      }
    }

    return {
      totalBodies,
      connectedBodies: visited.size,
      isFullyConnected: visited.size === totalBodies,
      overlappingPairs: overlaps.length,
      contactPairs,
    };
  }

  /**
   * Calculate optimal separation direction based on contact normals and penetration depths
   */
  private calculateSeparationDirection(
    bodyIndex: number
  ): { x: number; y: number; z: number } | null {
    const body = this.rigidBodies[bodyIndex];
    if (!body) return null;

    const totalWeightedNormal = { x: 0, y: 0, z: 0 };
    let totalWeight = 0;

    // Check this body against all other bodies for contacts
    for (let i = 0; i < this.rigidBodies.length; i++) {
      if (i === bodyIndex) continue;

      const otherBody = this.rigidBodies[i];
      if (!otherBody) continue;

      const collider1 = body.collider();
      const collider2 = otherBody.collider();
      if (!collider1 || !collider2) continue;

      // Use Rapier's contact detection to get detailed contact info
      this.world.contactPair(collider1, collider2, (manifold: any) => {
        if (manifold) {
          // Get the contact normal (points from body1 to body2)
          const normal = manifold.normal();

          // Check all contact points for penetration
          for (let k = 0; k < manifold.numContacts(); k++) {
            const contactDist = manifold.contactDist(k);

            // Negative distance indicates penetration/overlap
            if (contactDist < -0.0001) {
              const penetrationDepth = -contactDist;

              // Normal points from our body to the other body, so we want to move opposite
              const separationNormal = {
                x: -normal.x,
                y: 0, // Don't separate vertically
                z: -normal.z,
              };

              // Weight by penetration depth - deeper penetrations have more influence
              totalWeightedNormal.x += separationNormal.x * penetrationDepth;
              totalWeightedNormal.y += separationNormal.y * penetrationDepth;
              totalWeightedNormal.z += separationNormal.z * penetrationDepth;
              totalWeight += penetrationDepth;
            }
          }
        }
      });
    }

    // If no contacts found, fall back to center-based direction
    if (totalWeight === 0) {
      return this.getDirectionFromCenter(body);
    }

    // Normalize by total weight to get average direction
    totalWeightedNormal.x /= totalWeight;
    totalWeightedNormal.y /= totalWeight;
    totalWeightedNormal.z /= totalWeight;

    // Normalize the vector to unit length
    const length = Math.sqrt(
      totalWeightedNormal.x ** 2 +
        totalWeightedNormal.y ** 2 +
        totalWeightedNormal.z ** 2
    );

    if (length > 0.001) {
      return {
        x: totalWeightedNormal.x / length,
        y: totalWeightedNormal.y / length,
        z: totalWeightedNormal.z / length,
      };
    }

    // Fall back to center-based direction if normalization fails
    return this.getDirectionFromCenter(body);
  }

  /**
   * Calculate direction away from center (y-axis) - fallback method
   */
  private getDirectionFromCenter(body: any): {
    x: number;
    y: number;
    z: number;
  } {
    const pos = body.translation();
    const horizontalDistance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    if (horizontalDistance < 0.001) {
      // If very close to center, pick a random horizontal direction
      const angle = this.rand.next() * Math.PI * 2;
      return { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
    }

    // Normalize horizontal direction (don't push vertically)
    return {
      x: pos.x / horizontalDistance,
      y: 0, // Don't push vertically
      z: pos.z / horizontalDistance,
    };
  }

  /**
   * Start the overlap resolution process
   */
  private startOverlapResolution(): void {
    if (this.resolutionState !== "idle") return;

    const overlaps = this.detectOverlaps();
    if (overlaps.length === 0) return;

    this.resolutionState = "separating";
    this.resolutionIteration = 0;
    this.resolutionFrameCounter = 0;
    this.pendingOverlaps = overlaps;

    // Lock rotations to prevent spinning during separation
    this.lockAllRotations();
  }

  /**
   * Process one step of the overlap resolution (called each frame)
   */
  private processOverlapResolutionStep(): number {
    if (this.resolutionState === "idle") return 0;

    this.resolutionFrameCounter++;

    if (this.resolutionState === "separating") {
      // Process separation every frame for smooth movement
      if (this.resolutionFrameCounter >= this.config.resolutionFramesPerStep!) {
        this.resolutionFrameCounter = 0;
        this.resolutionIteration++;

        // Detect current overlaps
        const currentOverlaps = this.detectOverlaps();

        if (
          currentOverlaps.length === 0 ||
          this.resolutionIteration >= this.config.maxResolutionIterations!
        ) {
          // Unlock rotations before settling
          this.unlockAllRotations();

          // Clear all momentum before transitioning to settling
          this.clearAllMomentum();

          // Start settling phase
          this.resolutionState = "settling";
          this.settleFrameCounter = 0;
          this.resolutionFrameCounter = 0;
          return this.resolutionIteration;
        }

        // For each overlap, move the further object by a small step
        currentOverlaps.forEach((overlap) => {
          const body1 = this.rigidBodies[overlap.index1];
          const body2 = this.rigidBodies[overlap.index2];

          if (!body1 || !body2) return;

          // Determine which body is further from y-axis (center)
          const distance1 = this.getDistanceFromYAxis(body1);
          const distance2 = this.getDistanceFromYAxis(body2);

          let bodyToMove;
          if (distance1 >= distance2) {
            bodyToMove = body1;
          } else {
            bodyToMove = body2;
          }

          // Get optimal separation direction based on contact normals and penetration depths
          const direction = this.getDirectionFromCenter(bodyToMove);
          if (!direction) return;

          // Move by just resolutionStep amount this frame
          const currentPos = bodyToMove.translation();
          const newPos = {
            x: currentPos.x + direction.x * this.config.resolutionStep!,
            y: currentPos.y, // Don't move vertically
            z: currentPos.z + direction.z * this.config.resolutionStep!,
          };

          // Move the body
          bodyToMove.setTranslation(newPos, true);

          // Zero out velocity to prevent bouncing
          bodyToMove.setLinvel({ x: 0, y: 0, z: 0 }, true);
          bodyToMove.setAngvel({ x: 0, y: 0, z: 0 }, true);
        });
      }
    } else if (this.resolutionState === "settling") {
      // Run settling physics every N frames
      if (this.resolutionFrameCounter >= this.config.settleFramesPerStep!) {
        this.resolutionFrameCounter = 0;

        this.world.step(this.eventQueue);

        this.resolutionState = "idle";
        return this.resolutionIteration;
      }
    }

    return this.resolutionIteration;
  }

  /**
   * Lock rotation for all bodies during separation
   */
  private lockAllRotations(): void {
    this.rigidBodies.forEach((rigidBody) => {
      if (!rigidBody) return;

      // Lock all rotations
      rigidBody.lockRotations(true, true);
    });
  }

  /**
   * Unlock all rotations (restore normal rotation)
   */
  private unlockAllRotations(): void {
    this.rigidBodies.forEach((rigidBody) => {
      if (!rigidBody) return;

      // Unlock rotations - restore normal state
      rigidBody.lockRotations(false, true);
    });
  }

  /**
   * Clear all momentum (linear and angular velocity) from all bodies
   */
  private clearAllMomentum(): void {
    this.rigidBodies.forEach((rigidBody) => {
      if (!rigidBody) return;

      // Set all velocities to zero
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Wake up the body so it responds to new forces
      if (rigidBody.isSleeping()) {
        rigidBody.wakeUp();
      }
    });
  }

  /**
   * Step the simulation forward
   */
  step(): SimulationResult {
    if (!this.isInitialized || !this.world) {
      throw new Error("Simulator not initialized. Call initialize() first.");
    }

    this.isRunning = true;

    let bodiesConnected = false;
    // Perform multiple physics steps per iteration
    for (let i = 0; i < this.config.stepsPerIteration; i++) {
      this.frameCount++;

      // Only apply gravitational forces when NOT in separating mode
      if (this.resolutionState === "idle") {
        // Apply gravitational forces to each body
        this.rigidBodies.forEach((rigidBody) => {
          if (!rigidBody) return;

          // Wake up sleeping bodies
          if (rigidBody.isSleeping()) {
            rigidBody.wakeUp();
          }

          const position = rigidBody.translation();
          const velocity = rigidBody.linvel();
          const angVel = rigidBody.angvel();

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
          rigidBody.setAngvel(
            {
              x: angVel.x * dampingFactor,
              y: angVel.y * dampingFactor,
              z: angVel.z * dampingFactor,
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
            x:
              direction.x *
              this.config.gravityStrength *
              0.005 *
              forceMultiplier,
            y:
              direction.y *
              this.config.gravityStrength *
              0.005 *
              forceMultiplier *
              0.5,
            z:
              direction.z *
              this.config.gravityStrength *
              0.005 *
              forceMultiplier,
          };

          rigidBody.applyImpulse(impulse, true);
        });
      }

      // Step the physics world with configurable substeps for better collision resolution
      const substeps = this.config.substeps!;
      const substepTimeStep = this.config.timeStep / substeps;

      for (let substep = 0; substep < substeps; substep++) {
        this.world.timestep = substepTimeStep;
        this.world.step(this.eventQueue);
      }

      this.world.bodies.forEach((body: any) => {
        if (body.isDynamic()) {
          this.contactGraph.set(body.handle, new Set());
        }
      });
      bodiesConnected ||= this.areAllBodiesConnected();
    }

    // Start overlap resolution if simulation is complete or nearly complete
    let resolutionIterations = 0;
    if (
      bodiesConnected &&
      (this.attempts == 0
        ? this.frameCount >= this.maxInitialFrames
        : this.frameCount >= this.maxSubsequentFrames) &&
      this.resolutionState === "idle"
    ) {
      this.startOverlapResolution();
    }

    // Process overlap resolution if in progress
    if (this.resolutionState !== "idle") {
      resolutionIterations = this.processOverlapResolutionStep();
    }

    // Detect any remaining overlaps for reporting
    const overlaps = this.detectOverlaps();

    // Extract current state
    const shapes: ShapeState[] = this.rigidBodies.map((rigidBody, index) => {
      const shapeConfig = this.shapeDefinitions[index];
      const position = rigidBody.translation();
      const rotation = rigidBody.rotation();
      const velocity = rigidBody.linvel();
      const angularVelocity = rigidBody.angvel();

      // Convert quaternion to euler angles
      const rot = new THREE.Quaternion(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
      );
      const euler = new THREE.Euler();
      euler.setFromQuaternion(rot);

      return {
        type: shapeConfig.type,
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
        velocity: {
          x: velocity.x,
          y: velocity.y,
          z: velocity.z,
        },
        angularVelocity: {
          x: angularVelocity.x,
          y: angularVelocity.y,
          z: angularVelocity.z,
        },
        sleeping: rigidBody.isSleeping(),
      };
    });

    // Check for completion
    let isComplete = false;
    let completionReason: SimulationResult["completionReason"];

    if (this.resolutionState == "settling" && overlaps.length == 0) {
      if (bodiesConnected || this.attempts >= this.maxAttempts) {
        isComplete = true;
        completionReason = "all_connected";
      } else {
        this.attempts++;
        this.frameCount = 0;
      }
    }

    if (isComplete) {
      this.isRunning = false;
    }

    return {
      shapes,
      frameCount: this.frameCount,
      isComplete,
      completionReason,
      overlaps,
      resolutionIterations,
      resolutionState: this.resolutionState,
      connectivityInfo:
        this.resolutionState === "settling"
          ? this.getConnectivityInfo()
          : undefined,
    };
  }

  /**
   * Manually start overlap resolution (will be processed gradually over subsequent frames)
   */
  resolveOverlapsManually(): {
    started: boolean;
    currentState: "idle" | "separating" | "settling";
    remainingOverlaps: number;
    connectivityInfo?: any;
  } {
    if (!this.isInitialized || !this.world) {
      throw new Error("Simulator not initialized. Call initialize() first.");
    }

    const overlaps = this.detectOverlaps();
    let started = false;

    if (this.resolutionState === "idle" && overlaps.length > 0) {
      this.startOverlapResolution();
      started = true;
    }

    // Include connectivity info for debugging settling issues
    const connectivityInfo =
      this.resolutionState === "settling"
        ? this.getConnectivityInfo()
        : undefined;

    return {
      started,
      currentState: this.resolutionState,
      remainingOverlaps: overlaps.length,
      connectivityInfo,
    };
  }

  /**
   * Run the simulation until completion
   */
  async runToCompletion(): Promise<SimulationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let result: SimulationResult;
    do {
      result = this.step();
    } while (!result.isComplete);

    return result;
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Reset the simulation
   */
  reset(): void {
    // Unlock rotations before cleanup
    if (this.rigidBodies && this.rigidBodies.length > 0) {
      this.unlockAllRotations();
    }

    if (this.world) {
      this.world.free();
    }
    this.world = null;
    this.rigidBodies = [];
    this.frameCount = 0;
    this.isInitialized = false;
    this.isRunning = false;

    // Reset overlap resolution state
    this.resolutionState = "idle";
    this.resolutionIteration = 0;
    this.resolutionFrameCounter = 0;
    this.settleFrameCounter = 0;
    this.pendingOverlaps = [];
  }

  /**
   * Get current simulation status
   */
  getStatus(): {
    isInitialized: boolean;
    isRunning: boolean;
    frameCount: number;
    attempts: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      frameCount: this.frameCount,
      attempts: this.attempts,
    };
  }

  /**
   * Update simulation configuration
   */
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Helper methods
  private getShapeRadius(type: ShapeType, dimensions: ShapeDims): number {
    switch (type) {
      case ShapeType.SPHERE:
        const sphereDims: SphereDims = dimensions;
        return sphereDims.r;
      case ShapeType.BOX:
      case ShapeType.ROUND_BOX:
        const boxDims: RoundBoxDims = dimensions;
        return new THREE.Vector3(
          boxDims.a.x,
          boxDims.a.y,
          boxDims.a.z
        ).length();
      case ShapeType.CYLINDER:
        const cylinderDims: CylinderDims = dimensions;
        return Math.max(cylinderDims.r * 2, cylinderDims.h * 2);
      case ShapeType.ROUND_CYLINDER:
        const roundCylinderDims: RoundCylinderDims = dimensions;
        return Math.max(
          (roundCylinderDims.r + roundCylinderDims.r2) * 2,
          (roundCylinderDims.h + roundCylinderDims.r2) * 2
        );
      case ShapeType.CONE:
        const coneDims: ConeDims = dimensions;
        return Math.max(
          2 * coneDims.h * Math.tan(coneDims.c.x / coneDims.c.y),
          coneDims.h
        );
      case ShapeType.HEX_PRISM:
        const hexPrismDims: HexPrismDims = dimensions;
        return Math.max(hexPrismDims.r * 2, hexPrismDims.h * 2);
      case ShapeType.TRI_PRISM:
        const triPrismDims: TriPrismDims = dimensions;
        return Math.max(triPrismDims.r, triPrismDims.h * 2);
      case ShapeType.CAPSULE:
        const capsuleDims: CapsuleDims = dimensions;
        return capsuleDims.r * 2 + capsuleDims.h * 2;
      case ShapeType.CUT_CONE:
        const cutConeDims: CutConeDims = dimensions;
        return Math.max(cutConeDims.r * 2, cutConeDims.h * 2);
      case ShapeType.SOLID_ANGLE:
        const solidAngleDims: SolidAngleDims = dimensions;
        return solidAngleDims.r;
      case ShapeType.CUT_SPHERE:
        const cutSphereDims: CutSphereDims = dimensions;
        return cutSphereDims.r;
      case ShapeType.ROUND_CONE:
        const roundConeDims: RoundConeDims = dimensions;
        return (
          Math.max(roundConeDims.r, roundConeDims.r2) * 2 + roundConeDims.h
        );
      case ShapeType.OCTAHEDRON:
        const octahedronDims: OctahedronDims = dimensions;
        return octahedronDims.r;
      default:
        return 0.5;
    }
  }

  private wouldOverlap(
    pos1: [number, number, number],
    pos2: [number, number, number],
    radius1: number,
    radius2: number,
    buffer: number = 0.1
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(pos1[0] - pos2[0], 2) +
        Math.pow(pos1[1] - pos2[1], 2) +
        Math.pow(pos1[2] - pos2[2], 2)
    );
    return distance < radius1 + radius2 + buffer;
  }

  private findValidPosition(
    shapeType: ShapeType,
    dimensions: ShapeDims,
    existingShapes: Array<{
      position: [number, number, number];
      radius: number;
    }>,
    baseAngle: number
  ): [number, number, number] {
    const radius = this.getShapeRadius(shapeType, dimensions);

    for (let attempt = 0; attempt < 50; attempt++) {
      let position: [number, number, number];

      if (attempt < 10) {
        const angle = baseAngle + (this.rand.next() - 0.5) * 0.2;
        const x = Math.cos(angle) * this.config.radius;
        const z = Math.sin(angle) * this.config.radius;
        const y =
          this.config.verticalSpread > 0
            ? (this.rand.next() - 0.5) * this.config.verticalSpread * 2
            : this.rand.next() * 2 - 1;
        position = [x, y, z];
      } else {
        const angle = this.rand.next() * Math.PI * 2;
        const r = this.rand.next() * this.config.radius;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y =
          this.config.verticalSpread > 0
            ? (this.rand.next() - 0.5) * this.config.verticalSpread * 2
            : this.rand.next() * 2 - 1;
        position = [x, y, z];
      }

      let overlaps = false;
      for (const existing of existingShapes) {
        if (
          this.wouldOverlap(
            position,
            existing.position,
            radius,
            existing.radius
          )
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
    const x = Math.cos(angle) * this.config.radius;
    const z = Math.sin(angle) * this.config.radius;
    const y =
      this.config.verticalSpread > 0
        ? (this.rand.next() - 0.5) * this.config.verticalSpread * 2
        : this.rand.next() * 2 - 1;
    return [x, y, z];
  }
}
