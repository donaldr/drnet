// raymarchingUI.ts
import Rand from "rand-seed";

import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import { PhysicsSimulator } from "./sculptor";

type Vec2 = { x: number; y: number };
type Vec3 = { x: number; y: number; z: number };
type Color = { r: number; g: number; b: number };

export enum InterfaceMode {
  DEVELOPMENT = 0,
  PRODUCTION = 1,
}

export enum PerformanceMode {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum UpgradeGroup {
  BASEONLY = "BASE",
  UPGRADEONLY = "UPGRADEONLY",
  BOTH = "BOTH",
}

export enum ShapeType {
  SPHERE = 1,
  BOX = 2,
  ROUND_BOX = 3,
  TORUS = 4,
  LINK = 5,
  CONE = 6,
  HEX_PRISM = 7,
  TRI_PRISM = 8,
  CAPSULE = 9,
  CYLINDER = 10,
  ROUND_CYLINDER = 11,
  CUT_CONE = 12,
  SOLID_ANGLE = 13,
  CUT_SPHERE = 14,
  ROUND_CONE = 15,
  OCTAHEDRON = 18,
}

export enum LightType {
  OMNI = 0,
  DIRECTIONAL = 1,
  POINT = 2,
}

export enum DebugMode {
  STEP_COUNT = 0,
  EFFICIENCY = 1,
  TERMINATION = 2,
  STALLS = 3,
  PROXIMITY = 4,
  RAYS = 5,
}

export interface GenerationSettings {
  sculptureId: string;
  baseShapeCount: { min: number; max: number };
  upgradeShapeCount: number;
}

export interface GlobalSettings {
  perf: PerformanceMode;
  camTgt: Vec3;
  camHAngle: number;
  camVAngle: number;
  camDist: number;
  orbit: number;
  boundingBoxPos: Vec3;
  boundingBoxDims: Vec3;
  showDebug: boolean;
  debugMode: number;
  mapScale: number;
  showBoxes: boolean;
  showBoundingBox: boolean;
}

export interface PerformanceSettings {
  maxRays: number;
  marchingSteps: number;
  distanceThreshold: number;
  maxDistance: number;
  giLength: number;
  giStrength: number;
  aoStrength: number;
  shadowRange: number;
  shadowAccuracy: number;
  roughReflectSamples: number;
  roughRefractSamples: number;
  globalIllumination: boolean;
  reflection: boolean;
  transparency: boolean;
  lighting: boolean;
  shadows: boolean;
  surfaceBlur: boolean;
}

export type AllPerformanceSettings = {
  [key in PerformanceMode]: PerformanceSettings;
};

export interface ColorPaletteColor {
  name: string;
  color: Color;
  probability: number;
  uuid: string;
}

export interface ColorPalette {
  name: string;
  colors: Array<ColorPaletteColor>;
  probability: number;
  uuid: string;
}

export type RuleValue<T> = {
  min: T;
  max: T;
};

export type RulesForDims<Dims> = {
  [K in keyof Dims]: RuleValue<Dims[K]>;
};

// Utility type to define rules for a given dims interface
type RuleFor<Dims extends object> = RulesForDims<Dims>;

// All shape dimension interfaces
export interface SphereDims {
  r: number;
}
export interface BoxDims {
  a: Vec3;
}
export interface RoundBoxDims {
  r: number;
  a: Vec3;
}
export interface TorusDims {
  r1: number;
  r2: number;
}
export interface LinkDims {
  h: number;
  r1: number;
  r2: number;
}
export interface ConeDims {
  c: Vec2;
  h: number;
}
export interface HexPrismDims {
  h: number;
  r: number;
  c: Vec2;
}
export interface TriPrismDims {
  h: number;
  r: number;
  c: Vec2;
}
export interface CapsuleDims {
  h: number;
  r: number;
}
export interface CylinderDims {
  h: number;
  r: number;
}
export interface RoundCylinderDims {
  h: number;
  r: number;
  r2: number;
}
export interface CutConeDims {
  h: number;
  r: number;
  r2: number;
}
export interface SolidAngleDims {
  h: number;
  r: number;
  c: Vec2;
}
export interface CutSphereDims {
  h: number;
  r: number;
}
export interface RoundConeDims {
  h: number;
  r1: number;
  r2: number;
}
export interface OctahedronDims {
  r: number;
}

// All rules types, using the utility type
export type SphereRules = RuleFor<SphereDims>;
export type BoxRules = RuleFor<BoxDims>;
export type RoundBoxRules = RuleFor<RoundBoxDims>;
export type TorusRules = RuleFor<TorusDims>;
export type LinkRules = RuleFor<LinkDims>;
export type ConeRules = RuleFor<ConeDims>;
export type HexPrismRules = RuleFor<HexPrismDims>;
export type TriPrismRules = RuleFor<TriPrismDims>;
export type CapsuleRules = RuleFor<CapsuleDims>;
export type CylinderRules = RuleFor<CylinderDims>;
export type RoundCylinderRules = RuleFor<RoundCylinderDims>;
export type CutConeRules = RuleFor<CutConeDims>;
export type SolidAngleRules = RuleFor<SolidAngleDims>;
export type CutSphereRules = RuleFor<CutSphereDims>;
export type RoundConeRules = RuleFor<RoundConeDims>;
export type OctahedronRules = RuleFor<OctahedronDims>;

export type ShapeDims = SphereDims &
  BoxDims &
  RoundBoxDims &
  TorusDims &
  LinkDims &
  ConeDims &
  HexPrismDims &
  TriPrismDims &
  CapsuleDims &
  CylinderDims &
  RoundCylinderDims &
  CutConeDims &
  SolidAngleDims &
  CutSphereDims &
  RoundConeDims &
  OctahedronDims;

export type ShapeRules = SphereRules &
  BoxRules &
  RoundBoxRules &
  TorusRules &
  LinkRules &
  ConeRules &
  HexPrismRules &
  TriPrismRules &
  CapsuleRules &
  CylinderRules &
  RoundCylinderRules &
  CutConeRules &
  SolidAngleRules &
  CutSphereRules &
  RoundConeRules &
  OctahedronRules;

export interface ShapeDetails {
  type: ShapeType;
  pos: Vec3;
  mat?: number;
  rot: Vec3;
  uuid: string;
}

export type Shape = ShapeDetails & ShapeDims;

export type ShapeGeneratorDetails = {
  name: string;
  type: ShapeType;
  mats: Array<string>;
  probability: number;
  upgrade: UpgradeGroup;
  uuid: string;
} & Partial<ShapeRules>;

export interface Material {
  name: string;
  color: Color;
  innerColor: Color;
  kd: number;
  ior: number;
  reflectivity: number;
  intRef: boolean;
  roughness: number;
  reflectRoughness: number;
  refractRoughness: number;
  surfaceBlur: number;
  metallic: number;
  transparency: number;
  attenuation: number;
  attenuationStrength: number;
  uuid: string;
}

export interface MaterialGeneratorDetails {
  name: string;
  color: Array<string>; //reference to color palette
  innerColor: Array<string>; //reference to color palette
  kd: RuleValue<number>;
  ior: RuleValue<number>;
  reflectivity: RuleValue<number>;
  intRef: number;
  roughness: RuleValue<number>;
  reflectRoughness: RuleValue<number>;
  refractRoughness: RuleValue<number>;
  surfaceBlur: RuleValue<number>;
  metallic: RuleValue<number>;
  transparency: RuleValue<number>;
  attenuation: RuleValue<number>;
  attenuationStrength: RuleValue<number>;
  probability: number;
  uuid: string;
}

export interface Light {
  name: string;
  type: LightType;
  strength: number;
  color: Color;
  ranged: boolean;
  r: number;
  dir: Vec3;
  pos: Vec3;
  uuid: string;
  castsShadow: boolean;
}

export interface UiData {
  generationSettings?: GenerationSettings;
  globals: GlobalSettings;
  performanceSettings: AllPerformanceSettings;
  colorPalettes?: Array<ColorPalette>;
  shapeRules?: Array<ShapeGeneratorDetails>;
  materialRules?: Array<MaterialGeneratorDetails>;
  shapes: Shape[];
  materials: Material[];
  lights: Light[];
}

export interface TemplateData {
  shapes: any[];
  lights: Light[];
  showBoxes: boolean;
  showBoundingBox: boolean;
  boundingBoxPos: Vec3;
  boundingBoxDims: Vec3;
  devMode: boolean;
  maxRays: number;
}

export class DataManager {
  generationSettings: GenerationSettings = {} as GenerationSettings;
  globals: GlobalSettings = {} as GlobalSettings;
  performanceSettings = {} as AllPerformanceSettings;
  colorPalettes: ColorPalette[] = [];
  shapes: Shape[] = [];
  materials: Material[] = [];
  lights: Light[] = [];
  shapeRules: ShapeGeneratorDetails[] = [];
  materialRules: MaterialGeneratorDetails[] = [];
  setUniforms?: React.Dispatch<React.SetStateAction<UiData | undefined>>;
  setShapesUpdated: React.Dispatch<React.SetStateAction<number>>;
  setMaterialsUpdated: React.Dispatch<React.SetStateAction<number>>;
  setPerformanceSettingsUpdated: React.Dispatch<React.SetStateAction<number>>;
  setPerfUpdated: React.Dispatch<React.SetStateAction<number>>;
  setGlobalsUpdated: React.Dispatch<React.SetStateAction<number>>;
  setTemplateVariables?: React.Dispatch<
    React.SetStateAction<TemplateData | undefined>
  >;
  shapeCount: number = 0;
  raf = { id: "" };
  generating: { state: "idle" | "base" | "upgrade" } = {
    state: "idle",
  };

  constructor(
    setUniforms: React.Dispatch<React.SetStateAction<UiData | undefined>>,
    setTemplateVariables: React.Dispatch<
      React.SetStateAction<TemplateData | undefined>
    >,
    setShapesUpdated: React.Dispatch<React.SetStateAction<number>>,
    setMaterialsUpdated: React.Dispatch<React.SetStateAction<number>>,
    setPerformanceSettingsUpdated: React.Dispatch<React.SetStateAction<number>>,
    setPerfUpdated: React.Dispatch<React.SetStateAction<number>>,
    setGlobalsUpdated: React.Dispatch<React.SetStateAction<number>>
  ) {
    this.setUniforms = setUniforms;
    this.setTemplateVariables = setTemplateVariables;
    this.setGlobalsUpdated = setGlobalsUpdated;
    this.setMaterialsUpdated = setMaterialsUpdated;
    this.setPerfUpdated = setPerfUpdated;
    this.setPerformanceSettingsUpdated = setPerformanceSettingsUpdated;
    this.setShapesUpdated = setShapesUpdated;
  }

  getData(): UiData {
    return {
      generationSettings: this.generationSettings,
      globals: this.globals,
      performanceSettings: this.performanceSettings,
      colorPalettes: this.colorPalettes,
      shapeRules: this.shapeRules,
      materialRules: this.materialRules,
      shapes: this.shapes,
      materials: this.materials,
      lights: this.lights,
    };
  }

  setData(data?: UiData) {
    this.generationSettings = {
      sculptureId: uuidv4(),
      baseShapeCount: { min: 4, max: 6 },
      upgradeShapeCount: 0,
    };

    this.globals = {
      perf: PerformanceMode.LOW,
      camTgt: { x: 0, y: 0.4, z: 0 },
      camHAngle: 0.0,
      camVAngle: 0.67,
      camDist: 0.9,
      orbit: 0.0,
      boundingBoxPos: { x: 0, y: 0.5, z: 0 },
      boundingBoxDims: { x: 0.5, y: 0.5, z: 0.5 },
      showDebug: false,
      debugMode: 0,
      mapScale: 1.0,
      showBoxes: false,
      showBoundingBox: false,
    };

    this.performanceSettings = {
      LOW: {
        maxRays: 10,
        marchingSteps: 150,
        distanceThreshold: 0.0001,
        maxDistance: 20.0,
        giLength: 0.6,
        giStrength: 0.01,
        aoStrength: 0.4,
        shadowRange: 10.0,
        shadowAccuracy: 24.0,
        roughReflectSamples: 4,
        roughRefractSamples: 4,
        globalIllumination: true,
        reflection: true,
        transparency: true,
        lighting: true,
        shadows: true,
        surfaceBlur: true,
      },
      MEDIUM: {
        maxRays: 10,
        marchingSteps: 150,
        distanceThreshold: 0.0001,
        maxDistance: 20.0,
        giLength: 0.6,
        giStrength: 0.01,
        aoStrength: 0.4,
        shadowRange: 10.0,
        shadowAccuracy: 24.0,
        roughReflectSamples: 4,
        roughRefractSamples: 4,
        globalIllumination: true,
        reflection: true,
        transparency: true,
        lighting: true,
        shadows: true,
        surfaceBlur: true,
      },
      HIGH: {
        maxRays: 10,
        marchingSteps: 150,
        distanceThreshold: 0.0001,
        maxDistance: 20.0,
        giLength: 0.6,
        giStrength: 0.01,
        aoStrength: 0.4,
        shadowRange: 10.0,
        shadowAccuracy: 24.0,
        roughReflectSamples: 4,
        roughRefractSamples: 4,
        globalIllumination: true,
        reflection: true,
        transparency: true,
        lighting: true,
        shadows: true,
        surfaceBlur: true,
      },
    };

    this.colorPalettes = [this.defaultColorPalette()];

    this.shapes = [this.defaultShape()];
    this.shapeCount = this.shapes.length;
    const floorMaterial = this.defaultMaterial();
    floorMaterial.name = "Floor Material";
    floorMaterial.uuid = "FLOOR";
    this.materials = [floorMaterial];
    this.lights = [this.defaultLight(LightType.OMNI)];

    if (data) {
      if (data.generationSettings) {
        for (const key of Object.keys(
          this.generationSettings
        ) as (keyof GenerationSettings)[]) {
          if (data.generationSettings[key] !== undefined) {
            //@ts-expect-error Typescript seems to be inferring keys that don't exist here
            this.generationSettings[key] = data.generationSettings[key];
          }
        }
      }

      if (data.globals) {
        for (const key of Object.keys(
          this.globals
        ) as (keyof GlobalSettings)[]) {
          if (data.globals[key] !== undefined) {
            //@ts-expect-error Typescript seems to be inferring keys that don't exist here
            this.globals[key] = data.globals[key];
          }
        }
      }

      if (data.performanceSettings) {
        const mode = ["LOW", "MEDIUM", "HIGH"] as Array<
          keyof AllPerformanceSettings
        >;
        for (let i = 0; i < 3; i++) {
          const modeKey = mode[i];
          for (const key of Object.keys(
            this.performanceSettings[modeKey]
          ) as (keyof PerformanceSettings)[]) {
            if (
              data.performanceSettings &&
              data.performanceSettings[modeKey][key] !== undefined
            ) {
              //@ts-expect-error Typescript seems to be inferring keys that don't exist here
              this.performanceSettings[modeKey][key] =
                data.performanceSettings[modeKey][key];
            }
          }
        }
      }

      if (data.colorPalettes) {
        this.colorPalettes = data.colorPalettes;
      }

      if (data.shapeRules) {
        this.shapeRules = data.shapeRules;
      }

      if (data.materialRules) {
        this.materialRules = data.materialRules;
      }

      if (data.shapes) {
        this.shapes = data.shapes;
      }

      if (data.materials) {
        this.materials = data.materials;
      }

      if (data.lights) {
        this.lights = data.lights;
      }
    }

    if (this.setUniforms && this.setTemplateVariables) {
      this.setUniforms({
        globals: this.globals,
        performanceSettings: this.performanceSettings,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      });
      const shapes: any[] = [];
      this.shapes.forEach((shape) => {
        shapes.push({
          ...shape,
          rot: new THREE.Matrix3()
            .setFromMatrix4(
              new THREE.Matrix4()
                .makeRotationFromEuler(
                  new THREE.Euler(shape.rot.x, shape.rot.y, shape.rot.z)
                )
                .invert()
            )
            .toArray(),
          isRot: shape.rot.x != 0 || shape.rot.y != 0 || shape.rot.z != 0,
        });
      });
      this.setTemplateVariables((prev) => {
        const tv = {
          shapes,
          lights: this.lights,
          showBoxes: this.globals.showBoxes,
          showBoundingBox: this.globals.showBoundingBox,
          boundingBoxDims: this.globals.boundingBoxDims,
          boundingBoxPos: this.globals.boundingBoxPos,
          devMode: false,
          maxRays: this.performanceSettings[this.globals.perf].maxRays,
        };
        if (JSON.stringify(prev) === JSON.stringify(tv)) {
          return prev;
        }
        return tv;
      });
    }
  }

  updateShader() {
    if (this.setUniforms && this.setTemplateVariables) {
      this.setUniforms({
        generationSettings: this.generationSettings,
        globals: this.globals,
        performanceSettings: this.performanceSettings,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      });
      const shapes: any[] = [];
      this.shapes.forEach((shape) => {
        shapes.push({
          ...shape,
          rot: new THREE.Matrix3()
            .setFromMatrix4(
              new THREE.Matrix4()
                .makeRotationFromEuler(
                  new THREE.Euler(shape.rot.x, shape.rot.y, shape.rot.z)
                )
                .invert()
            )
            .toArray(),
          isRot: shape.rot.x != 0 || shape.rot.y != 0 || shape.rot.z != 0,
        });
      });
      const shapesWithout = shapes.map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { pos, rot, isRot, ...rest } = s;
        return rest;
      });
      this.setTemplateVariables((prev) => {
        const tv = {
          shapes: shapesWithout,
          lights: this.lights,
          showBoxes: this.globals.showBoxes,
          showBoundingBox: this.globals.showBoundingBox,
          boundingBoxDims: this.globals.boundingBoxDims,
          boundingBoxPos: this.globals.boundingBoxPos,
          devMode: false,
          maxRays: this.performanceSettings[this.globals.perf].maxRays,
        };
        if (JSON.stringify(prev) === JSON.stringify(tv)) {
          return prev;
        }
        return tv;
      });
      this.setGlobalsUpdated!((prev) => prev + 1);
      this.setMaterialsUpdated!((prev) => prev + 1);
      this.setPerfUpdated((prev) => prev + 1);
      this.setPerformanceSettingsUpdated((prev) => prev + 1);
      this.setShapesUpdated((prev) => prev + 1);
    }
  }

  generateBaseSculpture() {
    return new Promise<void>(async (resolve) => {
      if (this.generating.state == "upgrade") return;
      this.generating.state = "base";
      this.raf.id = uuidv4();
      const rafId = this.raf.id;

      this.shapes = [];
      this.materials = this.materials.slice(0, 1);
      this.shapeCount = 0;

      const rand = new Rand(
        this.generationSettings.sculptureId + this.shapeCount
      );

      const shapesGenerated = this.generateShapes(
        this.generationSettings.baseShapeCount,
        rand
      );

      const simulator = new PhysicsSimulator({
        shapes: this.shapes.map((s) => ({ ...s, dimensions: s })),
        radius: 0.5,
        gravityStrength: 0.1,
        friction: 1.0,
        verticalSpread: 0.5,
        verticalOffset: 0.4,
        stepsPerIteration: 1,
        seed: this.generationSettings.sculptureId + this.shapeCount,
        timeStep: 1 / 30,
        maxInitialFrames: 300,
        maxSubsequentFrames: 30,
        maxAttempts: 10,
        substeps: 1,
      });

      await simulator.initialize();

      const step = () => {
        const result = simulator.step();
        if (
          result.resolutionState == "idle" ||
          result.resolutionState == "separating" ||
          result.resolutionState == "settling"
        ) {
          this.shapes.forEach((shape, index) => {
            shape.pos = result.shapes[index].position;
            shape.rot = result.shapes[index].rotation;
          });
          this.setShapesUpdated!((prev) => prev + 1);
          this.updateShader();
          if (rafId == this.raf.id && !result.completionReason) {
            requestAnimationFrame(step);
          } else {
            this.generating.state = "idle";
            resolve();
          }
        }
      };

      requestAnimationFrame(step);
      this.setShapesUpdated!((prev) => prev + 1);
      this.shapeCount = shapesGenerated;
    });
  }

  upgradeSculpture() {
    return new Promise<void>(async (resolve) => {
      if (this.generating.state != "idle") return;
      this.generating.state = "upgrade";
      this.raf.id = uuidv4();
      const rafId = this.raf.id;

      const rand = new Rand(
        this.generationSettings.sculptureId + this.shapeCount
      );

      this.generateShapes(
        {
          min: this.generationSettings.upgradeShapeCount,
          max: this.generationSettings.upgradeShapeCount,
        },
        rand
      );

      const simulator = new PhysicsSimulator({
        shapes: this.shapes
          .slice(this.shapeCount)
          .map((s) => ({ ...s, dimensions: s })),
        initialStaticShapes: this.shapes
          .slice(0, this.shapeCount)
          .map((shape) => ({
            type: shape.type,
            dimensions: {
              r: shape.r,
              r1: shape.r1,
              r2: shape.r2,
              h: shape.h,
              c: shape.c,
              a: shape.a,
            },
            position: shape.pos,
            rotation: shape.rot,
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 },
            sleeping: true,
          })),
        radius: 0.5,
        gravityStrength: 0.1,
        friction: 1.0,
        verticalSpread: 0.5,
        verticalOffset: 0.4,
        stepsPerIteration: 1,
        seed: this.generationSettings.sculptureId + this.shapeCount,
        timeStep: 1 / 30,
        maxInitialFrames: 300,
        maxSubsequentFrames: 30,
        maxAttempts: 10,
        substeps: 1,
        addFromTop: true,
      });
      await simulator.initialize();

      // Step through simulation
      const step = () => {
        const result = simulator.step();
        this.shapes.forEach((shape, index) => {
          shape.pos = result.shapes[index].position;
          shape.rot = result.shapes[index].rotation;
        });
        this.updateShader();
        if (rafId == this.raf.id && !result.completionReason) {
          requestAnimationFrame(step);
          this.setShapesUpdated!((prev) => prev + 1);
        } else {
          this.generating.state = "idle";
          resolve();
        }
      };

      requestAnimationFrame(step);
      this.setShapesUpdated!((prev) => prev + 1);

      this.shapeCount += this.generationSettings.upgradeShapeCount;
    });
  }

  generateShapes(shapeCountRange: { min: number; max: number }, rand: Rand) {
    let shapeProbabilitySum = 0;
    let shapeRuleProbabilities = [];
    for (let i = 0; i < this.shapeRules.length; i++) {
      const rule = this.shapeRules[i];
      shapeRuleProbabilities.push(rule.probability + shapeProbabilitySum);
      shapeProbabilitySum += rule.probability;
    }

    shapeRuleProbabilities = shapeRuleProbabilities.map(
      (p) => p / shapeProbabilitySum
    );

    const shapeCount =
      shapeCountRange.min +
      Math.floor(rand.next() * (shapeCountRange.max - shapeCountRange.min + 1));

    for (let i = 0; i < shapeCount; i++) {
      //Choose the appropriate rule
      const shapeRuleSelected = rand.next();
      const foundShapeIndex = shapeRuleProbabilities.findIndex(
        (el) => el >= shapeRuleSelected
      );
      const foundShapeRule = this.shapeRules[foundShapeIndex];

      const shape = this.defaultShape();
      shape.type = foundShapeRule.type;

      const chooseInRangeNumber = (rule: RuleValue<number>) => {
        return (rule.max - rule.min) * rand.next() + rule.min;
      };
      const chooseInRangeVec2 = (rule: RuleValue<Vec2>) => {
        return {
          x: (rule.max.x - rule.min.x) * rand.next() + rule.min.x,
          y: (rule.max.y - rule.min.y) * rand.next() + rule.min.y,
        };
      };
      const chooseInRangeVec3 = (rule: RuleValue<Vec3>) => {
        return {
          x: (rule.max.x - rule.min.x) * rand.next() + rule.min.x,
          y: (rule.max.y - rule.min.y) * rand.next() + rule.min.y,
          z: (rule.max.z - rule.min.z) * rand.next() + rule.min.z,
        };
      };

      switch (shape.type) {
        case ShapeType.OCTAHEDRON:
        case ShapeType.SPHERE:
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          break;
        case ShapeType.ROUND_BOX:
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
        case ShapeType.BOX:
          shape.a = chooseInRangeVec3(foundShapeRule.a!);
          break;
        case ShapeType.LINK:
        case ShapeType.ROUND_CONE:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
        case ShapeType.TORUS:
          shape.r1 = chooseInRangeNumber(foundShapeRule.r1!);
          shape.r2 = chooseInRangeNumber(foundShapeRule.r2!);
          break;
        case ShapeType.CONE:
          shape.c = chooseInRangeVec2(foundShapeRule.c!);
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          break;
        case ShapeType.HEX_PRISM:
        case ShapeType.TRI_PRISM:
          shape.c = chooseInRangeVec2(foundShapeRule.c!);
          break;
        case ShapeType.ROUND_CYLINDER:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          shape.r2 = chooseInRangeNumber(foundShapeRule.r2!);
        case ShapeType.CAPSULE:
        case ShapeType.CYLINDER:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          break;
        case ShapeType.CUT_CONE:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          shape.r2 = chooseInRangeNumber(foundShapeRule.r2!);
          break;
        case ShapeType.SOLID_ANGLE:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          shape.c.x = Math.sin(shape.h / 2);
          shape.c.y = Math.cos(shape.h / 2);
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          break;
        case ShapeType.CUT_SPHERE:
          shape.h = chooseInRangeNumber(foundShapeRule.h!);
          shape.r = chooseInRangeNumber(foundShapeRule.r!);
          break;
      }

      const materialRules = this.materialRules.filter((r) =>
        foundShapeRule.mats.includes(r.uuid)
      );

      let materialProbabilitySum = 0;
      let materialRuleProbabilities = [];
      for (let i = 0; i < materialRules.length; i++) {
        const rule = materialRules[i];
        materialRuleProbabilities.push(
          rule.probability + materialProbabilitySum
        );
        materialProbabilitySum += rule.probability;
      }

      materialRuleProbabilities = materialRuleProbabilities.map(
        (p) => p / materialProbabilitySum
      );

      const materialRuleSelected = rand.next();
      const foundMaterialIndex = materialRuleProbabilities.findIndex(
        (el) => el >= materialRuleSelected
      );
      const foundMaterialRule = materialRules[foundMaterialIndex];

      let paletteProbabilitySum = 0;
      let paletteProbabilities = [];
      const palettes = this.colorPalettes.filter((c) =>
        foundMaterialRule.color.includes(c.uuid)
      );
      for (let i = 0; i < foundMaterialRule.color.length; i++) {
        const palette = palettes[i];
        paletteProbabilities.push(palette!.probability + paletteProbabilitySum);
        paletteProbabilitySum += palette!.probability;
      }

      paletteProbabilities = paletteProbabilities.map(
        (p) => p / paletteProbabilitySum
      );

      const paletteSelected = rand.next();
      const foundPaletteIndex = paletteProbabilities.findIndex(
        (el) => el >= paletteSelected
      );
      const colorPalette = palettes[foundPaletteIndex];

      let innerPaletteProbabilitySum = 0;
      let innerPaletteProbabilities = [];
      const innerPalettes = this.colorPalettes.filter((c) =>
        foundMaterialRule.innerColor.includes(c.uuid)
      );
      for (let i = 0; i < foundMaterialRule.innerColor.length; i++) {
        const innerPalette = innerPalettes[i];
        innerPaletteProbabilities.push(
          innerPalette!.probability + innerPaletteProbabilitySum
        );
        innerPaletteProbabilitySum += innerPalette!.probability;
      }

      innerPaletteProbabilities = innerPaletteProbabilities.map(
        (p) => p / innerPaletteProbabilitySum
      );

      const innerPaletteSelected = rand.next();
      const foundinnerPaletteIndex = innerPaletteProbabilities.findIndex(
        (el) => el >= innerPaletteSelected
      );
      const innerColorPalette = innerPalettes[foundinnerPaletteIndex];

      const material = this.defaultMaterial();

      if (colorPalette) {
        let colorProbabilitySum = 0;
        let colorProbabilities = [];

        for (let i = 0; i < colorPalette.colors.length; i++) {
          const rule = colorPalette.colors[i];
          colorProbabilities.push(rule.probability + colorProbabilitySum);
          colorProbabilitySum += rule.probability;
        }
        colorProbabilities = colorProbabilities.map(
          (p) => p / colorProbabilitySum
        );

        const colorSelected = rand.next();
        const foundColorIndex = colorProbabilities.findIndex(
          (el) => el >= colorSelected
        );
        const foundColor = colorPalette.colors[foundColorIndex];
        material.color = foundColor.color;

        if (innerColorPalette) {
          material.innerColor =
            innerColorPalette.colors[
              Math.floor(
                (foundColorIndex / colorPalette.colors.length) *
                  innerColorPalette.colors.length
              )
            ].color;
        }
      }

      material.kd = chooseInRangeNumber(foundMaterialRule.kd);
      material.metallic = chooseInRangeNumber(foundMaterialRule.metallic);
      material.roughness = chooseInRangeNumber(foundMaterialRule.roughness);

      material.reflectivity = chooseInRangeNumber(
        foundMaterialRule.reflectivity
      );

      material.transparency = chooseInRangeNumber(
        foundMaterialRule.transparency
      );

      if (material.reflectivity > 0) {
        material.reflectRoughness = chooseInRangeNumber(
          foundMaterialRule.reflectRoughness
        );
      }

      if (material.transparency > 0) {
        material.ior = chooseInRangeNumber(foundMaterialRule.ior);
        material.intRef = foundMaterialRule.intRef > rand.next();
        material.refractRoughness = chooseInRangeNumber(
          foundMaterialRule.refractRoughness
        );
        material.attenuation = chooseInRangeNumber(
          foundMaterialRule.attenuation
        );
        material.attenuationStrength = chooseInRangeNumber(
          foundMaterialRule.attenuationStrength
        );
      }

      if (material.transparency > 0 || material.reflectivity > 0) {
        material.surfaceBlur = chooseInRangeNumber(
          foundMaterialRule.surfaceBlur
        );
      }

      this.materials.push(material);

      shape.mat = this.materials.length - 1;

      this.shapes.push(shape);
      this.setShapesUpdated!((prev) => prev + 1);
      this.setMaterialsUpdated!((prev) => prev + 1);
    }
    return shapeCount;
  }

  defaultColorPalette(): ColorPalette {
    return {
      name: "Default Color Palette",
      colors: [
        {
          name: "Red",
          color: { r: 1, g: 0, b: 0 },
          probability: 1.0,
          uuid: "RED",
        },
        {
          name: "Green",
          color: { r: 0, g: 1, b: 0 },
          probability: 1.0,
          uuid: "GREEN",
        },
        {
          name: "Blue",
          color: { r: 0, g: 0, b: 1 },
          probability: 1.0,
          uuid: "BLUE",
        },
      ],
      probability: 1,
      uuid: "DEFAULT",
    };
  }

  defaultShape(): Shape {
    return {
      type: ShapeType.SPHERE,
      c: { x: 0, y: 0 },
      a: { x: 0, y: 0, z: 0 },
      pos: { x: 0, y: 0.5, z: 0 },
      h: 0,
      r: 0.5,
      r1: 0,
      r2: 0,
      mat: 1,
      rot: { x: 0, y: 0, z: 0 },
      uuid: "DEFAULT",
    };
  }

  defaultShapeRule(): ShapeGeneratorDetails {
    return {
      name: "Default Shape Rule",
      type: ShapeType.SPHERE,
      r: {
        min: 0.1,
        max: 0.4,
      },
      uuid: "DEFAULT",
      mats: [],
      probability: 1.0,
      upgrade: UpgradeGroup.BASEONLY,
    };
  }

  defaultMaterial(): Material {
    return {
      name: "Default Material",
      color: { r: 1, g: 1, b: 1 },
      innerColor: { r: 1, g: 1, b: 1 },
      kd: 0.0,
      ior: 1.0,
      reflectivity: 0.0,
      intRef: false,
      roughness: 0.0,
      reflectRoughness: 0.0,
      refractRoughness: 0.0,
      surfaceBlur: 0.0,
      metallic: 0.0,
      transparency: 0.0,
      attenuation: 0.0,
      attenuationStrength: 0.0,
      uuid: "DEFAULT",
    };
  }

  defaultMaterialRule(): MaterialGeneratorDetails {
    return {
      name: "Default Material Rule",
      color: [],
      innerColor: [],
      kd: { min: 0.0, max: 10.0 },
      ior: { min: 1.0, max: 5.0 },
      reflectivity: { min: 0.0, max: 1.0 },
      intRef: 0.5,
      roughness: { min: 0.0, max: 1.0 },
      reflectRoughness: { min: 0.0, max: 1.0 },
      refractRoughness: { min: 0.0, max: 1.0 },
      surfaceBlur: { min: 0.0, max: 1.0 },
      metallic: { min: 0.0, max: 1.0 },
      transparency: { min: 0.0, max: 1.0 },
      attenuation: { min: 0.0, max: 1.0 },
      attenuationStrength: { min: 0.0, max: 50.0 },
      uuid: "DEFAULT",
      probability: 1,
    };
  }

  defaultLight(type: LightType): Light {
    return {
      name: "Default Light",
      type,
      strength: 1,
      color: { r: 1, g: 1, b: 1 },
      ranged: false,
      r: 5.0,
      dir: { x: 0, y: 0, z: 0 },
      pos: { x: 0, y: 0, z: 0 },
      uuid: "DEFAULT",
      castsShadow: true,
    };
  }
}

export default DataManager;
