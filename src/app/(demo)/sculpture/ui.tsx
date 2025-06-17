// raymarchingUI.ts
import React, { useEffect, useRef } from "react";
import { Pane, FolderApi } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import { createMultiSelectBlade } from "./multiblade";
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
  baseShapeCount: number;
  shapeUpgrades: number;
}

export interface GlobalSettings {
  perf: PerformanceMode;
  camTgt: Vec3;
  camHeight: number;
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

export class RaymarchingUI {
  container: HTMLElement;
  pane: Pane;
  generationSettings: GenerationSettings = {} as GenerationSettings;
  globals: GlobalSettings = {} as GlobalSettings;
  performanceSettings = {} as AllPerformanceSettings;
  colorPalettes: ColorPalette[] = [];
  shapes: Shape[] = [];
  materials: Material[] = [];
  lights: Light[] = [];
  shapeRules: ShapeGeneratorDetails[] = [];
  materialRules: MaterialGeneratorDetails[] = [];
  shapeFolder: FolderApi | null = null;
  shapeRulesFolder: FolderApi | null = null;
  materialRulesFolder: FolderApi | null = null;
  lightFolder: FolderApi | null = null;
  setUniforms?: React.Dispatch<React.SetStateAction<UiData | undefined>>;
  setTemplateVariables?: React.Dispatch<
    React.SetStateAction<TemplateData | undefined>
  >;

  constructor(
    container: HTMLElement,
    setUniforms?: React.Dispatch<React.SetStateAction<UiData | undefined>>,
    setTemplateVariables?: React.Dispatch<
      React.SetStateAction<TemplateData | undefined>
    >
  ) {
    this.pane = new Pane({
      title: "Raymarching Config",
      container: container ?? undefined,
    });

    this.pane.registerPlugin(EssentialsPlugin);

    const stored = localStorage.getItem("uidata");
    let data;
    if (stored) {
      data = JSON.parse(stored) as UiData;
    }
    this.container = container;
    this.setUniforms = setUniforms;
    this.setTemplateVariables = setTemplateVariables;

    this.rebuild(data);
    if (!stored) {
      this.save();
    }
  }

  rebuild(data?: UiData) {
    this.pane.children.forEach((child) => {
      this.pane.remove(child);
    });

    this.generationSettings = {
      sculptureId: uuidv4(),
      baseShapeCount: 1,
      shapeUpgrades: 0,
    };

    this.globals = {
      perf: PerformanceMode.LOW,
      camTgt: { x: 0, y: 0, z: 0 },
      camHeight: 5.0,
      camDist: 5.0,
      orbit: 1.0,
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

    this.pane.addButton({ title: "Export" }).on("click", () => {
      const state: UiData = {
        generationSettings: this.generationSettings,
        globals: this.globals,
        performanceSettings: this.performanceSettings,
        shapeRules: this.shapeRules,
        materialRules: this.materialRules,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      };
      const jsonStr = JSON.stringify(state, null, 2); // pretty-print with 2-space indent
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = Date.now() + "-vars.json";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    });

    this.pane.addButton({ title: "Import" }).on("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.display = "none"; // not visible in the DOM

      input.addEventListener("change", (event) => {
        const file = (event.target as any).files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target!.result as string);
            this.rebuild(json);
          } catch (err) {
            console.error("Invalid JSON:", err);
          }
        };
        reader.readAsText(file);
      });

      document.body.appendChild(input); // necessary for some browsers
      input.click(); // trigger file dialog
      document.body.removeChild(input); // clean up
    });

    this.setupGenerationFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupGlobalFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupPerformanceFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupColorPalettesFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupShapeRulesFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupMaterialRulesFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupFloorFolder();
    this.pane.addBlade({ view: "separator" });
    this.setupLightsFolder();
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
      this.setTemplateVariables({
        shapes,
        lights: this.lights,
        showBoxes: this.globals.showBoxes,
        showBoundingBox: this.globals.showBoundingBox,
        boundingBoxPos: this.globals.boundingBoxPos,
        boundingBoxDims: this.globals.boundingBoxDims,
        devMode: false,
        maxRays: this.performanceSettings[this.globals.perf].maxRays,
      });
    }
    this.pane.on("change", () => {
      this.save();
    });
  }

  save() {
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
        const { pos, rot, isRot, ...rest } = s;
        return rest;
      });
      this.setTemplateVariables({
        shapes: shapesWithout,
        lights: this.lights,
        showBoxes: this.globals.showBoxes,
        showBoundingBox: this.globals.showBoundingBox,
        boundingBoxDims: this.globals.boundingBoxDims,
        boundingBoxPos: this.globals.boundingBoxPos,
        devMode: false,
        maxRays: this.performanceSettings[this.globals.perf].maxRays,
      });
    }
    localStorage.setItem(
      "uidata",
      JSON.stringify({
        generationSettings: this.generationSettings,
        globals: this.globals,
        performanceSettings: this.performanceSettings,
        colorPalettes: this.colorPalettes,
        shapeRules: this.shapeRules,
        materialRules: this.materialRules,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      })
    );
  }

  setupGenerationFolder() {
    const f = this.pane.addFolder({
      title: "Generation",
      expanded: true,
    });
    f.addBinding(this.generationSettings, "sculptureId", {
      label: "Sculpture ID",
    });
    const genIdBtn = f.addButton({ title: "Generate ID" });
    genIdBtn.on("click", () => {
      this.generationSettings.sculptureId = uuidv4();
      this.pane.refresh();
      this.save();
    });
    f.addBinding(this.generationSettings, "baseShapeCount", {
      label: "Base Shape Count",
      min: 1,
      max: 10,
      step: 1,
    });
    f.addBinding(this.generationSettings, "shapeUpgrades", {
      label: "Shape Upgrades",
      min: 0,
      max: 10,
      step: 1,
    });
    const genScupltureBtn = f.addButton({ title: "Generate Sculpture" });
    const raf = { id: "" };
    genScupltureBtn.on("click", async () => {
      raf.id = uuidv4();
      const rafId = raf.id;
      this.shapes = [];
      this.materials = this.materials.slice(0, 1);
      //Add all the probabilities for all the shape generators
      const rand = new Rand(this.generationSettings.sculptureId);

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

      for (let i = 0; i < this.generationSettings.baseShapeCount; i++) {
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
        const foundMaterialRule = this.materialRules[foundMaterialIndex];

        let paletteProbabilitySum = 0;
        let paletteProbabilities = [];
        const palettes = this.colorPalettes.filter((c) =>
          foundMaterialRule.color.includes(c.uuid)
        );
        for (let i = 0; i < foundMaterialRule.color.length; i++) {
          const palette = palettes[i];
          paletteProbabilities.push(
            palette!.probability + paletteProbabilitySum
          );
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
        }

        if (material.transparency > 0 || material.reflectivity > 0) {
          material.surfaceBlur = chooseInRangeNumber(
            foundMaterialRule.surfaceBlur
          );
        }

        this.materials.push(material);

        shape.mat = this.materials.length - 1;

        this.shapes.push(shape);
      }

      const simulator = new PhysicsSimulator({
        shapes: this.shapes.map((s) => ({ ...s, dimensions: s })),
        radius: 0.5,
        gravityStrength: 0.1,
        friction: 1.0,
        verticalSpread: 0.5,
        stepsPerIteration: 1,
        seed: this.generationSettings.sculptureId,
        timeStep: 1 / 60,
        maxInitialFrames: 300,
        maxSubsequentFrames: 30,
        maxAttempts: 10,
        substeps: 1,
      });
      await simulator.initialize();

      // Step through simulation
      const step = () => {
        const result = simulator.step();
        if (
          result.resolutionState == "idle" ||
          result.resolutionState == "separating" ||
          result.resolutionState == "settling"
        ) {
          this.shapes.forEach((shape, index) => {
            shape.pos = result.shapes[index].position;
            shape.pos.y += 0.4;
            shape.rot = result.shapes[index].rotation;
          });
          this.save();
          if (rafId == raf.id && !result.completionReason) {
            requestAnimationFrame(step);
          }
        }
      };

      requestAnimationFrame(step);

      this.save();
    });
  }

  setupGlobalFolder() {
    const f = this.pane.addFolder({
      title: "Global Settings",
      expanded: false,
    });
    f.addBinding(this.globals, "perf", {
      label: "Detail",
      options: [
        { text: "Low", value: PerformanceMode.LOW },
        { text: "Medium", value: PerformanceMode.MEDIUM },
        { text: "High", value: PerformanceMode.HIGH },
      ],
    });
    f.addBinding(this.globals, "camTgt", {
      label: "Camera Target",
      step: 0.01,
    });
    f.addBinding(this.globals, "camHeight", {
      label: "Camera Orbit Height",
      step: 0.01,
    });
    f.addBinding(this.globals, "camDist", {
      label: "Camera Orbit Distance",
      step: 0.01,
    });
    f.addBinding(this.globals, "orbit", {
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: "Orbit",
    });
    f.addBinding(this.globals, "boundingBoxPos", {
      label: "Bounding Box Position",
      x: { min: -10, max: 10, step: 0.01 },
      y: { min: 0, max: 10, step: 0.01 },
      z: { min: -10, max: 10, step: 0.01 },
    });
    f.addBinding(this.globals, "boundingBoxDims", {
      label: "Bounding Box Dimensions",
      x: { min: 0, max: 5, step: 0.01 },
      y: { min: 0, max: 5, step: 0.01 },
      z: { min: 0, max: 5, step: 0.01 },
    });
    f.addBlade({
      view: "separator",
    });
    f.addBinding(this.globals, "showDebug", {
      label: "Show Debug",
    });
    f.addBinding(this.globals, "debugMode", {
      label: "Debug Mode",
      options: Object.keys(DebugMode)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({
          text: DebugMode[parseInt(v)],
          value: parseInt(v),
        })),
    });
    f.addBinding(this.globals, "mapScale", {
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: "Heatmap Scale",
    });
    f.addBinding(this.globals, "showBoxes", {
      label: "Show Shape Boxes",
    });
    f.addBinding(this.globals, "showBoundingBox", {
      label: "Show Bounding Box",
    });
  }

  setupPerformanceFolder() {
    const f = this.pane.addFolder({
      title: "Performance Settings",
      expanded: false,
    });
    const tabs = f.addTab({
      pages: [{ title: "Low" }, { title: "Medium" }, { title: "High" }],
    });

    const mode = ["LOW", "MEDIUM", "HIGH"] as Array<
      keyof AllPerformanceSettings
    >;
    for (let i = 0; i < 3; i++) {
      const key = mode[i];
      const p = this.performanceSettings[key];
      tabs.pages[i].addBinding(p, "maxRays", {
        min: 1,
        max: 40,
        step: 1,
        label: "Max Rays",
      });
      tabs.pages[i].addBinding(p, "marchingSteps", {
        min: 0,
        max: 200,
        step: 1,
        label: "Marching Steps",
      });
      tabs.pages[i].addBinding(p, "distanceThreshold", {
        min: 0.00001,
        max: 0.001,
        step: 0.00001,
        label: "Distance Threshold",
      });
      p.maxDistance = p.maxDistance ?? 20.0;
      tabs.pages[i].addBinding(p, "maxDistance", {
        min: 1.0,
        max: 100.0,
        step: 1.0,
        label: "Max Distance",
      });
      tabs.pages[i].addBinding(p, "giLength", {
        min: 0,
        max: 0.1,
        step: 0.001,
        label: "GI Length",
      });
      tabs.pages[i].addBinding(p, "giStrength", {
        min: 0,
        max: 0.1,
        step: 0.001,
        label: "GI Strength",
      });
      tabs.pages[i].addBinding(p, "aoStrength", {
        min: 0,
        max: 0.1,
        step: 0.001,
        label: "AO Strength",
      });
      tabs.pages[i].addBinding(p, "shadowRange", {
        min: 0,
        max: 20.0,
        step: 0.01,
        label: "Shadow Range",
      });
      tabs.pages[i].addBinding(p, "shadowAccuracy", {
        min: 8.0,
        max: 24.0,
        step: 1.0,
        label: "Shadow Accuracy",
      });
      tabs.pages[i].addBinding(p, "roughReflectSamples", {
        min: 0,
        max: 16.0,
        step: 1.0,
        label: "Rough Reflect Samples",
      });
      tabs.pages[i].addBinding(p, "roughRefractSamples", {
        min: 0,
        max: 16.0,
        step: 1.0,
        label: "Rough Refract Samples",
      });
      tabs.pages[i].addBinding(p, "globalIllumination", {
        label: "Global Illumination",
      });
      tabs.pages[i].addBinding(p, "reflection", {
        label: "Reflection",
      });
      tabs.pages[i].addBinding(p, "transparency", {
        label: "Transparency",
      });
      tabs.pages[i].addBinding(p, "lighting", {
        label: "Lighting",
      });
      tabs.pages[i].addBinding(p, "shadows", {
        label: "Shadows",
      });
      tabs.pages[i].addBinding(p, "surfaceBlur", {
        label: "Surface Blur",
      });
    }
  }

  addColor(
    paletteFolder: FolderApi,
    color: ColorPaletteColor,
    palette: ColorPalette
  ) {
    color.name = color.name ?? `Color ${color.uuid}`;
    const colorFolder = paletteFolder.addFolder({
      title: color.name,
      expanded: true,
    });
    colorFolder
      .addBinding(color, "name", {
        label: "Name",
      })
      .on("change", (ev) => {
        colorFolder.title = ev.value;
      });
    colorFolder.addBinding(color, "color", {
      label: "Color",
      color: { type: "float" },
    });
    colorFolder
      .addBinding(color, "probability", {
        label: "Probability",
      })
      .on("change", () => this.save());
    colorFolder.addButton({ title: "Remove Color" }).on("click", () => {
      palette.colors.splice(
        palette.colors.findIndex((el) => el.uuid == color.uuid),
        1
      );
      paletteFolder.remove(colorFolder);
      this.pane.refresh();
      this.save();
    });
  }

  addColorPalette(f: FolderApi, palette: ColorPalette) {
    const paletteFolder = f.addFolder({ title: palette.name, expanded: false });
    paletteFolder
      .addBinding(palette, "name", { label: "Palette Name" })
      .on("change", (ev) => {
        paletteFolder.title = ev.value;
        this.updateMaterialRules();
        this.pane.refresh();
        this.save();
      });
    const colorsFolder = paletteFolder.addFolder({
      title: "Colors",
      expanded: true,
    });
    palette.colors.forEach((color) => {
      this.addColor(colorsFolder, color, palette);
    });
    palette.probability = palette.probability ?? 1.0;
    paletteFolder.addBinding(palette, "probability", { label: "Probability" });
    paletteFolder.addButton({ title: "Add Color" }).on("click", () => {
      const uuid = uuidv4();
      const newColor: ColorPaletteColor = {
        name: `Color ${uuid}`,
        color: { r: 1, g: 1, b: 1 },
        probability: 0.5,
        uuid,
      };
      palette.colors.push(newColor);
      this.addColor(colorsFolder, newColor, palette);
      this.pane.refresh();
      this.save();
    });
    paletteFolder.addButton({ title: "Remove Palette" }).on("click", () => {
      this.colorPalettes.splice(
        this.colorPalettes.findIndex((el) => el.uuid == palette.uuid),
        1
      );
      f.remove(paletteFolder);

      this.updateMaterialRules();

      this.pane.refresh();
      this.save();
    });
    this.updateMaterialRules();
  }

  setupColorPalettesFolder() {
    const f = this.pane.addFolder({ title: "Color Palettes", expanded: false });
    const paletteFolder = f.addFolder({ title: "Palettes", expanded: true });
    this.colorPalettes.forEach((palette) => {
      this.addColorPalette(paletteFolder, palette);
    });
    f.addButton({ title: "Add Palette" }).on("click", () => {
      const newPalette = this.defaultColorPalette();
      newPalette.uuid = uuidv4();
      newPalette.name = `Palette ${newPalette.uuid}`;
      this.colorPalettes.push(newPalette);
      this.addColorPalette(paletteFolder, newPalette);
      this.pane.refresh();
      this.save();
    });
  }

  addShapeRuleBinding(shapeRule: ShapeGeneratorDetails, f: FolderApi) {
    // Add shape-specific bindings
    switch (shapeRule.type) {
      case ShapeType.OCTAHEDRON:
      case ShapeType.SPHERE:
        shapeRule.r = shapeRule.r ?? { min: 0.1, max: 0.1 };
        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;

      case ShapeType.ROUND_BOX:
        shapeRule.r = shapeRule.r ?? { min: 0.3, max: 0.3 };
        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });

      case ShapeType.BOX:
        if (shapeRule.a === undefined) {
          shapeRule.h = { min: 0.1, max: 0.1 };
          shapeRule.r1 = { min: 0.1, max: 0.1 };
          shapeRule.r2 = { min: 0.1, max: 0.1 };
          shapeRule.a = {
            min: {
              x: (shapeRule.h!.min! || 0) / 2,
              y: (shapeRule.r1!.min || 0) / 2,
              z: (shapeRule.r2!.min || 0) / 2,
            },
            max: {
              x: (shapeRule.h!.max! || 0) / 2,
              y: (shapeRule.r1!.max || 0) / 2,
              z: (shapeRule.r2!.max || 0) / 2,
            },
          };
        } else {
          shapeRule.h = {
            min: shapeRule.a.min.x * 2,
            max: shapeRule.a.max.x * 2,
          };
          shapeRule.r1 = {
            min: shapeRule.a.min.y * 2,
            max: shapeRule.a.max.y * 2,
          };
          shapeRule.r2 = {
            min: shapeRule.a.min.z * 2,
            max: shapeRule.a.max.z * 2,
          };
        }
        f.addBinding(shapeRule, "h", {
          label: "Width",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          if (!shapeRule.a) {
            shapeRule.a = {
              min: { x: 0, y: 0, z: 0 },
              max: { x: 0, y: 0, z: 0 },
            };
          }
          shapeRule.a.min = {
            x: (shapeRule.h!.min! || 0) / 2,
            y: (shapeRule.r1!.min || 0) / 2,
            z: (shapeRule.r2!.min || 0) / 2,
          };
          shapeRule.a.max = {
            x: (shapeRule.h!.max! || 0) / 2,
            y: (shapeRule.r1!.max || 0) / 2,
            z: (shapeRule.r2!.max || 0) / 2,
          };
        });

        f.addBinding(shapeRule, "r1", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          if (!shapeRule.a) {
            shapeRule.a = {
              min: { x: 0, y: 0, z: 0 },
              max: { x: 0, y: 0, z: 0 },
            };
          }
          shapeRule.a.min = {
            x: (shapeRule.h!.min! || 0) / 2,
            y: (shapeRule.r1!.min || 0) / 2,
            z: (shapeRule.r2!.min || 0) / 2,
          };
          shapeRule.a.max = {
            x: (shapeRule.h!.max! || 0) / 2,
            y: (shapeRule.r1!.max || 0) / 2,
            z: (shapeRule.r2!.max || 0) / 2,
          };
        });

        f.addBinding(shapeRule, "r2", {
          label: "Depth",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          if (!shapeRule.a) {
            shapeRule.a = {
              min: { x: 0, y: 0, z: 0 },
              max: { x: 0, y: 0, z: 0 },
            };
          }
          shapeRule.a.min = {
            x: (shapeRule.h!.min! || 0) / 2,
            y: (shapeRule.r1!.min || 0) / 2,
            z: (shapeRule.r2!.min || 0) / 2,
          };
          shapeRule.a.max = {
            x: (shapeRule.h!.max! || 0) / 2,
            y: (shapeRule.r1!.max || 0) / 2,
            z: (shapeRule.r2!.max || 0) / 2,
          };
        });

        break;
      case ShapeType.LINK:
      case ShapeType.ROUND_CONE:
        shapeRule.h = shapeRule.h ?? { min: 0.1, max: 0.1 };
        f.addBinding(shapeRule, "h", {
          label: "Height",
          min: 0,
          max: 0.5,
          step: 0.01,
        });

      case ShapeType.TORUS:
        shapeRule.r1 = shapeRule.r1 ?? { min: 0.3, max: 0.3 };
        shapeRule.r2 = shapeRule.r2 ?? { min: 0.1, max: 0 };
        f.addBinding(shapeRule, "r1", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shapeRule, "r2", {
          label: "Inner Radius",
          min: 0,
          max: 0.25,
          step: 0.01,
        });
        break;
      case ShapeType.CONE:
        shapeRule.h = shapeRule.h ?? { min: 0.5, max: 0.5 };
        shapeRule.r = shapeRule.r ?? { min: 0.25, max: 0.25 };
        if (!shapeRule.c) {
          shapeRule.c = {
            min: { x: 0.0, y: 0.0 },
            max: { x: 0.0, y: 0.0 },
          };
        }
        const vConeMin = new THREE.Vector2(
          shapeRule.r.min,
          shapeRule.h.min
        ).normalize();
        const vConeMax = new THREE.Vector2(
          shapeRule.r.max,
          shapeRule.h.max
        ).normalize();

        shapeRule.c.min = { x: vConeMin.x, y: vConeMin.y };
        shapeRule.c.max = { x: vConeMax.x, y: vConeMax.y };

        f.addBinding(shapeRule, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          const vMin = new THREE.Vector2(
            shapeRule.r!.min,
            shapeRule.h!.min
          ).normalize();
          shapeRule.c!.min = { x: vMin.x, y: vMin.y };
          const vMax = new THREE.Vector2(
            shapeRule.r!.max,
            shapeRule.h!.max
          ).normalize();
          shapeRule.c!.max = { x: vMax.x, y: vMax.y };
        });

        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.25,
          step: 0.01,
        }).on("change", () => {
          const vMin = new THREE.Vector2(
            shapeRule.r!.min,
            shapeRule.h!.min
          ).normalize();
          shapeRule.c!.min = { x: vMin.x, y: vMin.y };
          const vMax = new THREE.Vector2(
            shapeRule.r!.max,
            shapeRule.h!.max
          ).normalize();
          shapeRule.c!.max = { x: vMax.x, y: vMax.y };
        });
        break;
      case ShapeType.HEX_PRISM:
        shapeRule.h = shapeRule.h ?? { min: 0.5, max: 0.5 };
        shapeRule.r = shapeRule.r ?? { min: 0.25, max: 0.25 };
        if (shapeRule.c === undefined) {
          shapeRule.c = {
            min: { x: shapeRule.r.min, y: shapeRule.h.min },
            max: { x: shapeRule.r.max, y: shapeRule.h.max },
          };
        }

        f.addBinding(shapeRule, "r", {
          label: "Width",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shapeRule.r!.min = ev.value!.min;
          shapeRule.r!.max = ev.value!.max;
          shapeRule.c = {
            min: { x: shapeRule.r!.min, y: shapeRule.h!.min / 2 },
            max: { x: shapeRule.r!.max, y: shapeRule.h!.max / 2 },
          };
        });

        f.addBinding(shapeRule, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shapeRule.h!.min = ev.value!.min;
          shapeRule.h!.max = ev.value!.max;
          shapeRule.c = {
            min: { x: shapeRule.r!.min, y: shapeRule.h!.min / 2 },
            max: { x: shapeRule.r!.max, y: shapeRule.h!.max / 2 },
          };
        });
        break;
      case ShapeType.TRI_PRISM:
        shapeRule.h = shapeRule.h ?? { min: 0.5, max: 0.5 };
        shapeRule.r = shapeRule.r ?? { min: 0.25, max: 0.25 };
        if (shapeRule.c === undefined) {
          shapeRule.c = {
            min: { x: shapeRule.r.min, y: shapeRule.h.min / 2 },
            max: { x: shapeRule.r.max, y: shapeRule.h.max / 2 },
          };
        }

        f.addBinding(shapeRule, "r", {
          label: "Width",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shapeRule.r!.min = ev.value!.min;
          shapeRule.r!.max = ev.value!.max;
          shapeRule.c = {
            min: { x: shapeRule.r!.min, y: shapeRule.h!.min / 2 },
            max: { x: shapeRule.r!.max, y: shapeRule.h!.max / 2 },
          };
        });

        f.addBinding(shapeRule, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shapeRule.h!.min = ev.value!.min;
          shapeRule.h!.max = ev.value!.max;
          shapeRule.c = {
            min: { x: shapeRule.r!.min, y: shapeRule.h!.min },
            max: { x: shapeRule.r!.max, y: shapeRule.h!.max },
          };
        });
        break;
      case ShapeType.ROUND_CYLINDER:
        shapeRule.r = shapeRule.r ?? { min: 0.5, max: 0.5 };
        shapeRule.r2 = shapeRule.r2 ?? { min: 0.125, max: 0.125 };
        shapeRule.h = shapeRule.h ?? { min: 0.1, max: 0.1 };
        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shapeRule, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        });
        f.addBinding(shapeRule, "r2", {
          label: "Edge Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.CAPSULE:
      case ShapeType.CYLINDER:
        shapeRule.r = shapeRule.r ?? { min: 0.5, max: 0.5 };
        shapeRule.h = shapeRule.h ?? { min: 1.0, max: 1.0 };

        const cylinderHBinding = f
          .addBinding(shapeRule, "h", {
            label: "Half Height",
            min: 0,
            max: 1.0,
            step: 0.01,
          })
          .on("change", (ev) => {
            shapeRule.h = { min: ev.value!.min / 2, max: ev.value!.max / 2 };
          });

        shapeRule.h.min *= 2;
        shapeRule.h.max *= 2;
        cylinderHBinding.refresh(); // Update the UI

        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.CUT_CONE:
        shapeRule.h = shapeRule.h ?? { min: 1.0, max: 1.0 };
        shapeRule.r = shapeRule.r ?? { min: 0.5, max: 0.5 };
        shapeRule.r2 = shapeRule.r2 ?? { min: 0.5, max: 0.5 };
        const cutConeHBinding = f
          .addBinding(shapeRule, "h", {
            label: "Height",
            min: 0,
            max: 1.0,
            step: 0.01,
          })
          .on("change", (ev) => {
            shapeRule.h!.min = ev.value!.min / 2;
            shapeRule.h!.max = ev.value!.max / 2;
          });

        shapeRule.h!.min *= 2;
        shapeRule.h!.max *= 2;
        cutConeHBinding.refresh();
        f.addBinding(shapeRule, "r2", {
          label: "Top Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shapeRule, "r", {
          label: "Bottom Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.SOLID_ANGLE:
        shapeRule.h = shapeRule.h ?? {
          min: Math.PI / 2,
          max: Math.PI / 2,
        };
        shapeRule.r = shapeRule.r ?? { min: 0.5, max: 0.5 };

        shapeRule.c = {
          min: { x: Math.sin(shapeRule.h.min), y: Math.cos(shapeRule.h.min) },
          max: { x: Math.sin(shapeRule.h.max), y: Math.cos(shapeRule.h.max) },
        };

        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shapeRule, "h", {
          label: "Theta Min",
          min: 0,
          max: Math.PI,
          step: 0.01,
        }).on("change", (ev) => {
          shapeRule.h!.min = ev.value!.min;
          shapeRule.h!.max = ev.value!.max;
          shapeRule.c!.min = {
            x: Math.sin(ev.value!.min / 2),
            y: Math.cos(ev.value!.min / 2),
          };
          shapeRule.c!.max = {
            x: Math.sin(ev.value!.max / 2),
            y: Math.cos(ev.value!.max / 2),
          };
        });
        break;
      case ShapeType.CUT_SPHERE:
        shapeRule.h = shapeRule.h ?? { min: 0.0, max: 0.0 };
        shapeRule.r = shapeRule.r ?? { min: 0.5, max: 0.5 };
        f.addBinding(shapeRule, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shapeRule, "h", {
          label: "Cutoff",
          min: -1.0,
          max: 1.0,
          step: 0.01,
        });
        break;
    }
  }

  removeShapeRuleBinding(f: FolderApi) {
    f.children.forEach((child: any) => {
      if (
        !["name", "type", "mats", "probability", "upgrade"].includes(
          child.key
        ) &&
        child.constructor.name !== "SeparatorBladeApi"
      ) {
        f.remove(child);
      }
    });
  }

  addShapeMaterialRules(
    f: FolderApi,
    shapeRule: ShapeGeneratorDetails,
    index?: number
  ) {
    return createMultiSelectBlade(
      f,
      this.materialRules
        .slice(0)
        .map((m) => ({ label: m.name, value: m.uuid })),
      {
        label: "Materials",
        values: shapeRule.mats,
        onChange: (selected: string[]) => {
          shapeRule.mats = selected;
          this.save();
        },
      },
      index
    );
  }

  addShapeRule(shapeRule: ShapeGeneratorDetails) {
    shapeRule.name = shapeRule.name ?? `Shape Rule ${shapeRule.uuid}`;
    const f = this.shapeRulesFolder!.addFolder({
      title: shapeRule.name,
      expanded: false,
    });
    f.addBinding(shapeRule, "name", { label: "Name" }).on("change", (ev) => {
      f.title = ev.value;
    });
    f.addBinding(shapeRule, "type", {
      options: Object.keys(ShapeType)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({ text: ShapeType[parseInt(v)], value: parseInt(v) })),
      defaultValue: shapeRule.type,
      label: "Type",
    }).on("change", () => {
      this.removeShapeRuleBinding(f);
      this.addShapeRuleBinding(shapeRule, f);
    });
    this.addShapeMaterialRules(f, shapeRule);

    f.addBinding(shapeRule, "probability", { label: "Probability" });

    const rmBtn = f.addButton({ title: "Remove" });
    rmBtn.on("click", () => {
      if (this.shapes.length <= 1) return;
      this.shapes.splice(
        this.shapes.findIndex((el) => el.uuid == shapeRule.uuid),
        1
      );
      this.shapeRulesFolder!.remove(f);
      this.pane.refresh();
      this.save();
    });

    this.addShapeRuleBinding(shapeRule, f);
  }

  setupShapeRulesFolder() {
    this.shapeRulesFolder = this.pane.addFolder({
      title: "Shape Rules",
      expanded: false,
    });

    const addBtn = this.shapeRulesFolder.addButton({ title: "Add Shape Rule" });
    addBtn.on("click", () => {
      const shapeRule = this.defaultShapeRule();
      this.shapeRules.push(shapeRule);
      shapeRule.uuid = uuidv4();
      this.addShapeRule(shapeRule);
      this.pane.refresh();
      this.save();
    });

    this.shapeRules.forEach((shapeRule, index) => {
      if (!shapeRule.uuid) {
        if (index == 0) {
          shapeRule.uuid = "DEFAULT";
        } else {
          shapeRule.uuid = uuidv4();
        }
      }
      this.addShapeRule(shapeRule);
    });
  }

  updateShapeMaterialRules() {
    let index = 0;
    this.shapeRulesFolder?.children.forEach((child) => {
      if (child instanceof FolderApi) {
        const foundIndex = child.children.findIndex(
          (c) => c.constructor.name === "SeparatorBladeApi"
        );
        if (foundIndex >= 0) {
          this.addShapeMaterialRules(child, this.shapeRules[index], foundIndex);
        }
        index++;
      }
    });
  }

  addMaterialMultiSelect(
    f: FolderApi,
    mat: MaterialGeneratorDetails,
    key: keyof Pick<MaterialGeneratorDetails, "color" | "innerColor">,
    label: string,
    index?: number
  ) {
    return createMultiSelectBlade(
      f,
      this.colorPalettes
        .slice(0)
        .map((c) => ({ label: c.name, value: c.uuid })),
      {
        label: label,
        values: mat[key],
        onChange: (selected: string[]) => {
          mat[key] = selected;
          this.save();
        },
      },
      index
    );
  }

  addMaterialRule(mat: MaterialGeneratorDetails) {
    mat.name = mat.name ?? `Material Rule ${mat.uuid}`;
    const f = this.materialRulesFolder!.addFolder({
      title: mat.name,
      expanded: false,
    });
    f.addBinding(mat, "name", { label: "Name" }).on("change", (ev) => {
      f.title = ev.value;
      this.updateShapeMaterialRules();
    });

    this.addMaterialMultiSelect(f, mat, "color", "Color");
    this.addMaterialMultiSelect(f, mat, "innerColor", "Inner Color");

    f.addBinding(mat, "kd", {
      min: 0,
      max: 10,
      step: 0.01,
      label: "Diffuse Strength",
    });
    f.addBinding(mat, "ior", {
      min: 1,
      max: 5,
      step: 0.01,
      label: "Index of Refraction",
    });
    f.addBinding(mat, "reflectivity", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Reflectivity",
    });
    mat.intRef = mat.intRef ?? false;
    f.addBinding(mat, "intRef", { label: "Internal Reflection" });
    f.addBinding(mat, "roughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Roughness",
    });
    mat.reflectRoughness = mat.reflectRoughness ?? 0.0;
    f.addBinding(mat, "reflectRoughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Reflect Roughness",
    });
    mat.refractRoughness = mat.refractRoughness ?? 0.0;
    f.addBinding(mat, "refractRoughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Refract Roughness",
    });
    mat.surfaceBlur = mat.surfaceBlur ?? 0.0;
    f.addBinding(mat, "surfaceBlur", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Surface Blur",
    });
    f.addBinding(mat, "metallic", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Metallic",
    });
    f.addBinding(mat, "transparency", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Transparency",
    });
    f.addBinding(mat, "attenuation", {
      min: 0,
      max: 1,
      step: 0.0001,
      label: "Attenuation",
    });
    f.addBinding(mat, "attenuationStrength", {
      min: 0,
      max: 50,
      step: 0.1,
      label: "Attenuation Strength",
    });
    mat.probability = mat.probability ?? 1.0;
    f.addBinding(mat, "probability", {
      label: "Probability",
    });

    if (mat.uuid != "FLOOR") {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        this.materialRules.splice(
          this.materialRules.findIndex((el) => el.uuid == mat.uuid),
          1
        );
        this.materialRulesFolder!.remove(f);
        this.updateShapeMaterialRules();
        this.pane.refresh();
        this.save();
      });
    }
  }

  updateMaterialRules() {
    this.materialRulesFolder?.children.forEach((child, childIndex) => {
      if (child instanceof FolderApi) {
        this.materialRulesFolder?.remove(child);
        const mat = this.materialRules[childIndex - 1]; // -1 because first child is the add button
        this.addMaterialRule(mat);
      }
    });
  }

  setupMaterialRulesFolder() {
    this.materialRulesFolder = this.pane.addFolder({
      title: "Material Rules",
      expanded: false,
    });

    const addBtn = this.materialRulesFolder.addButton({
      title: "Add Material Rule",
    });
    addBtn.on("click", () => {
      const materialRule = this.defaultMaterialRule();
      materialRule.uuid = uuidv4();
      materialRule.name = `Material ${materialRule.uuid}`;
      this.addMaterialRule(materialRule);
      this.materialRules.push(materialRule);
      this.updateShapeMaterialRules();
      this.pane!.refresh();
      this.save();
    });

    this.materialRules.forEach((mat, index) => {
      if (!mat.uuid) {
        if (index == 0) {
          mat.uuid = "FLOOR";
        } else if (index == 1) {
          mat.uuid = "DEFAULT";
        } else {
          mat.uuid = uuidv4();
        }
      }
      if (mat.uuid != "FLOOR") {
        this.addMaterialRule(mat);
      }
    });
  }

  setupFloorFolder() {
    const f = this.pane.addFolder({ title: "Floor", expanded: false });

    f.addBinding(this.materials[0], "color", {
      label: "Color",
      color: { type: "float" },
    });
    f.addBinding(this.materials[0], "kd", {
      min: 0,
      max: 100,
      step: 0.01,
      label: "Diffuse Strength",
    });
    f.addBinding(this.materials[0], "reflectivity", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Reflectivity",
    });
    this.materials[0].intRef = this.materials[0].intRef ?? false;
    f.addBinding(this.materials[0], "intRef", { label: "Internal Reflection" });
    f.addBinding(this.materials[0], "roughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Roughness",
    });
    this.materials[0].reflectRoughness =
      this.materials[0].reflectRoughness ?? 0.0;
    f.addBinding(this.materials[0], "reflectRoughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Reflect Roughness",
    });
    this.materials[0].refractRoughness =
      this.materials[0].refractRoughness ?? 0.0;
    f.addBinding(this.materials[0], "refractRoughness", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Refract Roughness",
    });
    this.materials[0].surfaceBlur = this.materials[0].surfaceBlur ?? 0.0;
    f.addBinding(this.materials[0], "surfaceBlur", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Surface Blur",
    });
    f.addBinding(this.materials[0], "metallic", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "Metallic",
    });
  }

  addLight(light: Light) {
    light.name = light.name ?? `Light ${light.uuid}`;
    const f = this.lightFolder!.addFolder({
      title: light.name,
      expanded: false,
    });
    f.addBinding(light, "name", {
      label: "Name",
    }).on("change", (ev) => {
      f.title = ev.value;
    });
    f.addBinding(light, "type", {
      label: "Type",
      options: Object.keys(LightType)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({ text: LightType[parseInt(v)], value: parseInt(v) })),
      disabled: light.type === LightType.OMNI,
    });
    light.strength = light.strength ?? 1;
    f.addBinding(light, "strength", {
      min: 0,
      max: 5,
      step: 0.1,
      label: "Strength",
    });
    f.addBinding(light, "color", { color: { type: "float" }, label: "Color" });
    f.addBinding(light, "dir", { label: "Direction" });
    f.addBinding(light, "pos", { label: "Position" });
    f.addBinding(light, "ranged", { label: "Ranged" });
    f.addBinding(light, "r", { min: 0, max: 10, label: "Radius" });
    light.castsShadow = light.castsShadow ?? true;
    f.addBinding(light, "castsShadow", { label: "Casts Shadow" });

    if (light.uuid !== "DEFAULT") {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (light.type === LightType.OMNI || this.lights.length <= 1) return;
        this.lights.splice(
          this.lights.findIndex((el) => el.uuid == light.uuid),
          1
        );
        this.lightFolder!.remove(f);
        this.pane.refresh();
        this.save();
      });
    }
  }

  setupLightsFolder() {
    this.lightFolder = this.pane.addFolder({
      title: "Lights",
      expanded: false,
    });

    const addBtn = this.lightFolder.addButton({ title: "Add Light" });
    addBtn.on("click", () => {
      const hasOmni = this.lights.some((l) => l.type === LightType.OMNI);
      const light = this.defaultLight(
        hasOmni ? LightType.POINT : LightType.OMNI
      );
      light.uuid = uuidv4();
      this.addLight(light);
      this.lights.push(light);
      this.pane.refresh();
      this.save();
    });

    this.lights.forEach((light, index) => {
      if (!light.uuid) {
        if (index == 0) {
          light.uuid = "DEFAULT";
        } else {
          light.uuid = uuidv4();
        }
      }
      this.addLight(light);
    });
  }

  setupShapesFolder() {
    this.shapeFolder = this.pane.addFolder({
      title: "Shapes",
      expanded: false,
    });

    this.shapes.forEach((shape) => {
      shape.uuid = uuidv4();
      this.addShape(shape);
    });
  }

  addShape(shape: Shape) {
    const f = this.shapeFolder!.addFolder({
      title: `Shape ${shape.uuid}`,
      expanded: false,
    });
    shape.pos = { x: 0, y: 0, z: 0 };
    f.addBinding(shape, "pos", {
      label: "Position",
      x: { min: -10, max: 10, step: 0.01 },
      y: { min: 0, max: 10, step: 0.01 },
      z: { min: -10, max: 10, step: 0.01 },
    });
    shape.rot = shape.rot ?? { x: 0, y: 0, z: 0 };
    shape.rot =
      shape.rot.x === null || shape.rot.y === null || shape.rot.z === null
        ? { x: 0, y: 0, z: 0 }
        : shape.rot;
    f.addBinding(shape, "rot", {
      label: "Rotation",
      x: { min: -180, max: 180, step: 1 },
      y: { min: -180, max: 180, step: 1 },
      z: { min: -180, max: 180, step: 1 },
    });
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

const RaymarchingUIWrapper = ({
  setUniforms,
  setTemplateVariables,
}: Readonly<{
  setUniforms?: React.Dispatch<React.SetStateAction<UiData | undefined>>;
  setTemplateVariables?: React.Dispatch<
    React.SetStateAction<TemplateData | undefined>
  >;
}>) => {
  // This component wraps the RaymarchingUI and handles the rendering
  // of the UI in a React-friendly way. It uses a ref to attach the UI
  // to a specific DOM element.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize the RaymarchingUI instance and pass the container reference
      new RaymarchingUI(
        containerRef.current,
        setUniforms,
        setTemplateVariables
      );

      // Cleanup when the component is unmounted
      return () => {
        // Perform any necessary cleanup of the RaymarchingUI instance if needed
      };
    }
  }, [setUniforms, setTemplateVariables]);

  return <div ref={containerRef} />; // This is where the UI will be rendered
};

export default RaymarchingUIWrapper;
