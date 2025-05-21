// raymarchingUI.ts
import React, { useEffect, useRef } from "react";
import { Pane, FolderApi } from "tweakpane";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";

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
}

export interface GlobalSettings {
  mode: InterfaceMode;
  perf: PerformanceMode;
  numberOfShapes: number;
  numberOfMaterials: number;
  numberOfLights: number;
  maxRays: number;
  marchingSteps: number;
  distanceThreshold: number;
  giLength: number;
  giStrength: number;
  aoStrength: number;
  shadowRange: number;
  shadowAccuracy: number;
  roughReflectSamples: number;
  roughRefractSamples: number;
  camTgt: Vec3;
  camHeight: number;
  camDist: number;
  orbit: number;
  boundingBoxPos: Vec3;
  boundingBoxDims: Vec3;
  globalIllumination: boolean;
  reflection: boolean;
  transparency: boolean;
  lighting: boolean;
  shadows: boolean;
  showPerformance: boolean;
  perfMode: number;
  perfScale: number;
  showBoxes: boolean;
}

export interface Shape {
  type: ShapeType;
  id: number;
  l?: Vec2;
  c?: Vec2;
  a?: Vec3;
  b?: Vec3;
  n?: Vec3;
  pos: Vec3;
  h?: number;
  r?: number;
  r1?: number;
  r2?: number;
  mat?: number;
  rot: Vec3;
  uuid: string;
}

export interface Material {
  name: string;
  emissive: boolean;
  color: Color;
  innerColor: Color;
  glowColor: Color;
  kd: number;
  ior: number;
  reflectivity: number;
  intRef: boolean;
  roughness: number;
  reflectRoughness: number;
  refractRoughness: number;
  metallic: number;
  transparency: number;
  attenuation: number;
  attenuationStrength: number;
  glow: number;
  uuid: string;
}

export interface Light {
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
  globals: GlobalSettings;
  shapes: Shape[];
  materials: Material[];
  lights: Light[];
}

export interface TemplateData {
  shapes: any[];
  lights: Light[];
  showBoxes: boolean;
  devMode: boolean;
}

export class RaymarchingUI {
  container: HTMLElement;
  pane: Pane;
  globals: GlobalSettings = {} as GlobalSettings;
  shapes: Shape[] = [];
  materials: Material[] = [];
  lights: Light[] = [];
  shapeFolder: FolderApi | null = null;
  materialFolder: FolderApi | null = null;
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

    this.globals = {
      mode: InterfaceMode.PRODUCTION,
      perf: PerformanceMode.LOW,
      numberOfShapes: 1,
      numberOfMaterials: 1,
      numberOfLights: 1,
      maxRays: 10,
      marchingSteps: 150,
      distanceThreshold: 0.0001,
      giLength: 0.6,
      giStrength: 0.01,
      aoStrength: 0.4,
      shadowRange: 10.0,
      shadowAccuracy: 24.0,
      roughReflectSamples: 4,
      roughRefractSamples: 4,
      camTgt: { x: 0, y: 0, z: 0 },
      camHeight: 5.0,
      camDist: 5.0,
      orbit: 1.0,
      boundingBoxPos: { x: 0, y: 0, z: 0 },
      boundingBoxDims: { x: 1.0, y: 4.0, z: 0.0 },
      globalIllumination: true,
      reflection: true,
      transparency: true,
      lighting: true,
      shadows: true,
      showPerformance: false,
      perfMode: 0,
      perfScale: 1.0,
      showBoxes: false,
    };

    this.shapes = [this.defaultShape(0)];
    const floorMaterial = this.defaultMaterial();
    floorMaterial.name = "Floor Material";
    floorMaterial.uuid = "FLOOR";
    this.materials = [floorMaterial, this.defaultMaterial()];
    this.lights = [this.defaultLight(LightType.OMNI)];

    if (data) {
      this.globals = Object.assign(this.globals, data.globals);
      this.shapes = Object.assign(this.shapes, data.shapes);
      this.materials = Object.assign(this.materials, data.materials);
      this.lights = Object.assign(this.lights, data.lights);
    }

    this.pane.addButton({ title: "Export" }).on("click", () => {
      const state = {
        globals: this.globals,
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

    this.setupGlobalFolder();
    this.setupShapesFolder();
    this.setupMaterialsFolder();
    this.setupLightsFolder();
    if (this.setUniforms && this.setTemplateVariables) {
      this.setUniforms({
        globals: this.globals,
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
                  new THREE.Euler(
                    (shape.rot.x / 180) * Math.PI,
                    (shape.rot.y / 180) * Math.PI,
                    (shape.rot.z / 180) * Math.PI
                  )
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
        devMode: this.globals.mode == InterfaceMode.DEVELOPMENT,
      });
    }
    this.pane.on("change", () => {
      this.save();
    });
  }

  save() {
    if (this.setUniforms && this.setTemplateVariables) {
      this.setUniforms({
        globals: this.globals,
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
                  new THREE.Euler(
                    (shape.rot.x / 180) * Math.PI,
                    (shape.rot.y / 180) * Math.PI,
                    (shape.rot.z / 180) * Math.PI
                  )
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
        devMode: this.globals.mode == InterfaceMode.DEVELOPMENT,
      });
    }
    localStorage.setItem(
      "uidata",
      JSON.stringify({
        globals: this.globals,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      })
    );
  }

  setupGlobalFolder() {
    const f = this.pane.addFolder({ title: "Global Settings" });
    this.globals.mode = this.globals.mode ?? InterfaceMode.PRODUCTION;
    f.addBinding(this.globals, "mode", {
      label: "Mode",
      options: Object.keys(InterfaceMode)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({
          text: InterfaceMode[parseInt(v)],
          value: parseInt(v),
        })),
    }).on("change", () => {
      if (this.globals.mode == InterfaceMode.DEVELOPMENT) {
        this.globals.globalIllumination = false;
        this.globals.reflection = false;
        this.globals.transparency = false;
        this.globals.lighting = false;
        this.globals.shadows = false;
      } else {
        this.globals.globalIllumination = true;
        this.globals.reflection = true;
        this.globals.transparency = true;
        this.globals.lighting = true;
        this.globals.shadows = true;
      }
      f.refresh();
    });
    this.globals.perf = this.globals.perf ?? "LOW";
    f.addBinding(this.globals, "perf", {
      label: "Detail",
      options: [
        { text: "Low", value: PerformanceMode.LOW },
        { text: "Medium", value: PerformanceMode.MEDIUM },
        { text: "High", value: PerformanceMode.HIGH },
      ],
    });
    this.globals.maxRays = this.globals.maxRays || 16;
    f.addBinding(this.globals, "maxRays", {
      min: 1,
      max: 40,
      step: 1,
      label: "Max Rays",
    });
    this.globals.marchingSteps = this.globals.marchingSteps || 150;
    f.addBinding(this.globals, "marchingSteps", {
      min: 0,
      max: 200,
      step: 1,
      label: "Marching Steps",
    });
    this.globals.distanceThreshold = this.globals.distanceThreshold || 0.0001;
    f.addBinding(this.globals, "distanceThreshold", {
      min: 0.00001,
      max: 0.001,
      step: 0.00001,
      label: "Distance Threshold",
    });
    f.addBinding(this.globals, "giLength", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "GI Length",
    });
    f.addBinding(this.globals, "giStrength", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "GI Strength",
    });
    f.addBinding(this.globals, "aoStrength", {
      min: 0,
      max: 1,
      step: 0.01,
      label: "AO Strength",
    });
    this.globals.shadowRange = this.globals.shadowRange || 10.0;
    f.addBinding(this.globals, "shadowRange", {
      min: 0,
      max: 20.0,
      step: 0.01,
      label: "Shadow Range",
    });
    this.globals.shadowAccuracy = this.globals.shadowAccuracy || 24;
    f.addBinding(this.globals, "shadowAccuracy", {
      min: 8.0,
      max: 24.0,
      step: 1.0,
      label: "Shadow Accuracy",
    });
    this.globals.roughReflectSamples = this.globals.roughReflectSamples || 4;
    f.addBinding(this.globals, "roughReflectSamples", {
      min: 0,
      max: 16.0,
      step: 1.0,
      label: "Rough Reflect Samples",
    });
    this.globals.roughRefractSamples = this.globals.roughRefractSamples || 4;
    f.addBinding(this.globals, "roughRefractSamples", {
      min: 0,
      max: 16.0,
      step: 1.0,
      label: "Rough Refract Samples",
    });
    this.globals.camTgt = this.globals.camTgt ?? { x: 0, y: 0, z: 0 };
    f.addBinding(this.globals, "camTgt", {
      label: "Camera Target",
      step: 0.01,
    });
    this.globals.camHeight = this.globals.camHeight ?? 1.0;
    f.addBinding(this.globals, "camHeight", {
      label: "Camera Orbit Height",
      step: 0.01,
    });
    this.globals.camDist = this.globals.camDist ?? 1.0;
    f.addBinding(this.globals, "camDist", {
      label: "Camera Orbit Distance",
      step: 0.01,
    });
    this.globals.orbit = this.globals.orbit ?? 0;
    f.addBinding(this.globals, "orbit", {
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: "Orbit",
    });
    this.globals.boundingBoxPos = this.globals.boundingBoxPos ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    f.addBinding(this.globals, "camTgt", {
      label: "Camera Target",
      step: 0.01,
    });
    f.addBlade({
      view: "separator",
    });
    this.globals.globalIllumination = this.globals.globalIllumination ?? false;
    f.addBinding(this.globals, "globalIllumination", {
      label: "Global Illumination",
    });
    this.globals.reflection = this.globals.reflection ?? false;
    f.addBinding(this.globals, "reflection", {
      label: "Reflection",
    });
    this.globals.transparency = this.globals.transparency ?? false;
    f.addBinding(this.globals, "transparency", {
      label: "Transparency",
    });
    this.globals.lighting = this.globals.lighting ?? false;
    f.addBinding(this.globals, "lighting", {
      label: "Lighting",
    });
    this.globals.shadows = this.globals.shadows ?? false;
    f.addBinding(this.globals, "shadows", {
      label: "Shadows",
    });
    f.addBlade({
      view: "separator",
    });
    this.globals.showPerformance = this.globals.showPerformance ?? false;
    f.addBinding(this.globals, "showPerformance", {
      label: "Show Debug",
    });
    this.globals.perfMode = this.globals.perfMode ?? 0;
    f.addBinding(this.globals, "perfMode", {
      label: "Debug Mode",
      options: Object.keys(DebugMode)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({
          text: DebugMode[parseInt(v)],
          value: parseInt(v),
        })),
    });
    this.globals.perfScale = this.globals.perfScale ?? 1.0;
    f.addBinding(this.globals, "perfScale", {
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: "Heatmap Scale",
    });
    this.globals.showBoxes = this.globals.showBoxes ?? false;
    f.addBinding(this.globals, "showBoxes", {
      label: "Show Boxes",
    });
  }

  addShapeBinding(shape: Shape, f: FolderApi) {
    // Add shape-specific bindings
    switch (shape.type) {
      case ShapeType.OCTAHEDRON:
      case ShapeType.SPHERE:
        shape.r = shape.r ?? 0.3;
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;

      case ShapeType.ROUND_BOX:
        shape.r = shape.r ?? 0.3;
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });

      case ShapeType.BOX:
        if (shape.a === undefined) {
          shape.h = 0.5;
          shape.r1 = 0.5;
          shape.r2 = 0.5;
        }
        f.addBinding(shape, "h", {
          label: "Width",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          shape.a = {
            x: (shape.h! || 0) / 2,
            y: (shape.r1 || 0) / 2,
            z: (shape.r2 || 0) / 2,
          };
        });
        f.addBinding(shape, "r1", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          shape.a = {
            x: (shape.h! || 0) / 2,
            y: (shape.r1 || 0) / 2,
            z: (shape.r2 || 0) / 2,
          };
        });
        f.addBinding(shape, "r2", {
          label: "Depth",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          shape.a = {
            x: (shape.h! || 0) / 2,
            y: (shape.r1 || 0) / 2,
            z: (shape.r2 || 0) / 2,
          };
        });
        shape.a = {
          x: (shape.h! || 0) / 2,
          y: (shape.r1 || 0) / 2,
          z: (shape.r2 || 0) / 2,
        };

        break;
      case ShapeType.LINK:
      case ShapeType.ROUND_CONE:
        shape.h = shape.h ?? 0.1;
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 0.5,
          step: 0.01,
        });

      case ShapeType.TORUS:
        shape.r1 = shape.r1 ?? 0.3;
        shape.r2 = shape.r2 ?? 0.1;
        f.addBinding(shape, "r1", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shape, "r2", {
          label: "Inner Radius",
          min: 0,
          max: 0.25,
          step: 0.01,
        });
        break;
      case ShapeType.CONE:
        shape.h = shape.h ?? 0.5;
        shape.r = shape.r ?? 0.25;
        const vCone = new THREE.Vector2(shape.r, shape.h).normalize();
        shape.c = { x: vCone.x, y: vCone.y };
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", () => {
          const v = new THREE.Vector2(shape.r, shape.h).normalize();
          shape.c = { x: v.x, y: v.y };
        });
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.25,
          step: 0.01,
        }).on("change", () => {
          const v = new THREE.Vector2(shape.r, shape.h).normalize();
          shape.c = { x: v.x, y: v.y };
        });
        break;
      case ShapeType.HEX_PRISM:
      case ShapeType.TRI_PRISM:
        shape.h = shape.h ?? 0.5;
        shape.r = shape.r ?? 0.25;
        const vPrism = new THREE.Vector2(shape.r, shape.h).normalize();
        shape.c = { x: vPrism.x, y: vPrism.y };
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shape.h = ev.value! / 2;
        });
        f.addBinding(shape, "r", {
          label: "Width",
          min: 0,
          max: 1.0,
          step: 0.01,
        }).on("change", (ev) => {
          shape.r = ev.value! / 2;
        });
        break;
      case ShapeType.ROUND_CYLINDER:
        shape.r = shape.r ?? 0.5;
        shape.r1 = shape.r1 ?? 0.125;
        shape.h = shape.h ?? 0.1;
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        });
        f.addBinding(shape, "r1", {
          label: "Edge Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.CAPSULE:
      case ShapeType.CYLINDER:
        shape.r = shape.r ?? 0.5;
        shape.h = shape.h ?? 1.0;

        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        });
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.CUT_CONE:
        shape.h = shape.h ?? 1.0;
        shape.r1 = shape.r1 ?? 0.5;
        shape.r2 = shape.r2 ?? 0.5;
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 1.0,
          step: 0.01,
        });
        f.addBinding(shape, "r1", {
          label: "Radius 1",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shape, "r2", {
          label: "Radius 2",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;
      case ShapeType.SOLID_ANGLE:
        shape.h = shape.h ?? Math.PI / 2;
        shape.r1 = shape.r1 ?? 0.5;
        shape.c = { x: Math.sin(shape.h), y: Math.cos(shape.h) };
        f.addBinding(shape, "r1", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shape, "h", {
          label: "Theta",
          min: 0,
          max: Math.PI,
          step: 0.01,
        }).on("change", (ev) => {
          shape.c = { x: Math.sin(ev.value!), y: Math.cos(ev.value!) };
        });
        break;
      case ShapeType.CUT_SPHERE:
        shape.h = shape.h ?? 0.0;
        shape.r = shape.r ?? 0.5;
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        f.addBinding(shape, "h", {
          label: "Cutoff",
          min: -0.5,
          max: 0.5,
          step: 0.01,
        });
        break;
    }
  }

  removeShapeBinding(f: FolderApi) {
    f.children.forEach((child: any) => {
      if (!["type", "pos", "mat", "rot"].includes(child.key)) {
        f.remove(child);
      }
    });
  }

  addShapeMaterial(f: FolderApi, shape: Shape) {
    f.addBinding(shape, "mat", {
      label: "Material",
      options: this.materials
        .slice(1)
        .map((m, i) => ({ text: m.name, value: i + 1 })),
    });
  }

  addShape(shape: Shape) {
    const f = this.shapeFolder!.addFolder({ title: `Shape ${shape.uuid}` });
    f.addBinding(shape, "type", {
      options: Object.keys(ShapeType)
        .filter((v) => isNaN(Number(v)) === false)
        .map((v) => ({ text: ShapeType[parseInt(v)], value: parseInt(v) })),
      defaultValue: shape.type,
      label: "Type",
    }).on("change", () => {
      this.removeShapeBinding(f);
      this.addShapeBinding(shape, f);
    });
    f.addBinding(shape, "pos", {
      label: "Position",
      x: { min: -10, max: 10, step: 0.01 },
      y: { min: 0, max: 10, step: 0.01 },
      z: { min: -10, max: 10, step: 0.01 },
    });
    shape.rot = shape.rot ?? { x: 0, y: 0, z: 0 };
    f.addBinding(shape, "rot", {
      label: "Rotation",
      x: { min: -180, max: 180, step: 1 },
      y: { min: -180, max: 180, step: 1 },
      z: { min: -180, max: 180, step: 1 },
    });
    this.addShapeMaterial(f, shape);

    if (shape.uuid !== "DEFAULT") {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (this.shapes.length <= 1) return;
        this.shapes.splice(
          this.shapes.findIndex((el) => el.uuid == shape.uuid),
          1
        );
        this.globals.numberOfShapes = this.shapes.length;
        this.shapeFolder!.remove(f);
        this.pane.refresh();
        this.save();
      });
    }

    this.addShapeBinding(shape, f);
  }

  setupShapesFolder() {
    this.shapeFolder = this.pane.addFolder({ title: "Shapes" });

    const addBtn = this.shapeFolder.addButton({ title: "Add Shape" });
    addBtn.on("click", () => {
      const id = this.shapes.length;
      const shape = this.defaultShape(id);
      this.shapes.push(shape);
      shape.uuid = uuidv4();
      this.addShape(shape);
      this.globals.numberOfShapes = this.shapes.length;
      this.pane.refresh();
      this.save();
    });

    this.shapes.forEach((shape, index) => {
      if (!shape.uuid) {
        if (index == 0) {
          shape.uuid = "DEFAULT";
        } else {
          shape.uuid = uuidv4();
        }
      }
      this.addShape(shape);
    });
  }

  updateShapeMaterial() {
    let index = 0;
    this.shapeFolder?.children.forEach((child) => {
      if (child instanceof FolderApi) {
        const found = child.children.filter((c) => (c as any).key === "mat");
        if (found) {
          this.addShapeMaterial(child, this.shapes[index]);
          child.remove(found[0]);
        }
        index++;
      }
    });
  }

  addMaterial(mat: Material) {
    const f = this.materialFolder!.addFolder({ title: `Material ${mat.uuid}` });
    f.addBinding(mat, "name", { label: "Name" }).on("change", () => {
      this.updateShapeMaterial();
    });
    f.addBinding(mat, "color", { label: "Color", color: { type: "float" } });
    f.addBinding(mat, "innerColor", {
      label: "Inner Color",
      color: { type: "float" },
    });
    f.addBinding(mat, "kd", {
      min: 0,
      max: 10,
      step: 0.01,
      label: "Diffuse Strength",
    });
    f.addBinding(mat, "ior", {
      min: 1,
      max: 2,
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

    if (mat.uuid != "DEFAULT" && mat.uuid != "FLOOR") {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (this.materials.length <= 1) return;
        this.materials.splice(
          this.materials.findIndex((el) => el.uuid == mat.uuid),
          1
        );
        this.globals.numberOfMaterials = this.materials.length;
        this.materialFolder!.remove(f);
        this.updateShapeMaterial();
        this.pane.refresh();
        this.save();
      });
    }
  }

  setupMaterialsFolder() {
    this.materialFolder = this.pane.addFolder({ title: "Materials" });

    const addBtn = this.materialFolder.addButton({ title: "Add Material" });
    addBtn.on("click", () => {
      const material = this.defaultMaterial();
      material.name = `Material ${this.materials.length}`;
      material.uuid = uuidv4();
      this.addMaterial(material);
      this.materials.push(material);
      this.updateShapeMaterial();
      this.globals.numberOfMaterials = this.materials.length;
      this.pane!.refresh();
      this.save();
    });

    this.materials.forEach((mat, index) => {
      if (!mat.uuid) {
        if (index == 0) {
          mat.uuid = "FLOOR";
        } else if (index == 1) {
          mat.uuid = "DEFAULT";
        } else {
          mat.uuid = uuidv4();
        }
      }
      this.addMaterial(mat);
    });
  }

  addLight(light: Light) {
    const f = this.lightFolder!.addFolder({ title: `Light ${light.uuid}` });
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
        this.globals.numberOfLights = this.lights.length;
        this.lightFolder!.remove(f);
        this.pane.refresh();
        this.save();
      });
    }
  }

  setupLightsFolder() {
    this.lightFolder = this.pane.addFolder({ title: "Lights" });

    const addBtn = this.lightFolder.addButton({ title: "Add Light" });
    addBtn.on("click", () => {
      const hasOmni = this.lights.some((l) => l.type === LightType.OMNI);
      const light = this.defaultLight(
        hasOmni ? LightType.POINT : LightType.OMNI
      );
      light.uuid = uuidv4();
      this.addLight(light);
      this.lights.push(light);
      this.globals.numberOfLights = this.lights.length;
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

  defaultShape(id: number): Shape {
    return {
      type: ShapeType.SPHERE,
      id,
      l: { x: 0, y: 0 },
      c: { x: 0, y: 0 },
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 0 },
      n: { x: 0, y: 0, z: 0 },
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

  defaultMaterial(): Material {
    return {
      name: "Default Material",
      emissive: false,
      color: { r: 1, g: 1, b: 1 },
      innerColor: { r: 1, g: 1, b: 1 },
      glowColor: { r: 1, g: 1, b: 1 },
      kd: 0.5,
      ior: 1.5,
      reflectivity: 0.5,
      intRef: false,
      roughness: 0.2,
      reflectRoughness: 0.0,
      refractRoughness: 0.0,
      metallic: 0.0,
      transparency: 0.0,
      attenuation: 0.0,
      attenuationStrength: 0.0,
      glow: 0.0,
      uuid: "DEFAULT",
    };
  }

  defaultLight(type: LightType): Light {
    return {
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
