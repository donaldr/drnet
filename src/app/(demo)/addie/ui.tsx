// raymarchingUI.ts
import React, { useEffect, useRef } from "react";
import { Pane, FolderApi } from "tweakpane";
import * as THREE from "three";

type Vec2 = { x: number; y: number };
type Vec3 = { x: number; y: number; z: number };
type Color = { r: number; g: number; b: number };

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

export interface GlobalSettings {
  numberOfShapes: number;
  numberOfMaterials: number;
  numberOfLights: number;
  maxRays: number;
  giLength: number;
  giStrength: number;
  aoStrength: number;
  camTgt: Vec3;
  camHeight: number;
  camDist: number;
  orbit: number;
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
}

export interface Light {
  type: LightType;
  strength: number;
  color: Color;
  ranged: boolean;
  r: number;
  dir: Vec3;
  pos: Vec3;
}

export interface Uniforms {
  globals: GlobalSettings;
  shapes: Shape[];
  materials: Material[];
  lights: Light[];
}

function deepAssignLiterals(target: any, source: any) {
  for (const key in target) {
    if (!source.hasOwnProperty(key)) continue;

    const tVal = target[key];
    const sVal = source[key];

    const tType = typeof tVal;
    const sType = typeof sVal;

    if (tType === "object" && sType === "object" && tVal && sVal) {
      deepAssignLiterals(tVal, sVal);
    } else if (isLiteral(sVal)) {
      target[key] = sVal;
    }
  }
}

function isLiteral(val: any) {
  return (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val === null
  );
}

export class RaymarchingUI {
  pane: Pane;
  globals: GlobalSettings;
  shapes: Shape[] = [];
  materials: Material[] = [];
  lights: Light[] = [];
  shapeFolder: FolderApi | null = null;
  materialFolder: FolderApi | null = null;
  lightFolder: FolderApi | null = null;
  setUniforms?: React.Dispatch<React.SetStateAction<Uniforms | undefined>>;

  constructor(
    container?: HTMLElement,
    setUniforms?: React.Dispatch<React.SetStateAction<Uniforms | undefined>>
  ) {
    this.pane = new Pane({
      title: "Raymarching Config",
      container: container ?? undefined,
    });

    this.globals = {
      numberOfShapes: 1,
      numberOfMaterials: 1,
      numberOfLights: 1,
      maxRays: 10,
      giLength: 0.6,
      giStrength: 0.01,
      aoStrength: 0.4,
      camTgt: { x: 0, y: 0, z: 0 },
      camHeight: 1.0,
      camDist: 1.0,
      orbit: 0.0,
    };

    this.shapes = [this.defaultShape(0)];
    const floorMaterial = this.defaultMaterial();
    floorMaterial.name = "Floor Material";
    this.materials = [floorMaterial, this.defaultMaterial()];
    this.lights = [this.defaultLight(LightType.OMNI)];
    this.setUniforms = setUniforms;

    const uniforms = localStorage.getItem("uniforms");

    if (uniforms) {
      const parsedUniforms = JSON.parse(uniforms) as Uniforms;
      this.globals = Object.assign(this.globals, parsedUniforms.globals);
      this.shapes = Object.assign(this.shapes, parsedUniforms.shapes);
      this.materials = Object.assign(this.materials, parsedUniforms.materials);
      this.lights = Object.assign(this.lights, parsedUniforms.lights);
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
            deepAssignLiterals(this.globals, json.globals);
            deepAssignLiterals(this.shapes, json.shapes);
            deepAssignLiterals(this.materials, json.materials);
            deepAssignLiterals(this.lights, json.lights);
            this.pane.refresh();
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
    if (setUniforms) {
      setUniforms({
        globals: this.globals,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      });
    }
    this.pane.on("change", () => {
      this.save();
    });
  }

  save() {
    if (this.setUniforms) {
      this.setUniforms({
        globals: this.globals,
        shapes: this.shapes,
        materials: this.materials,
        lights: this.lights,
      });
    }
    localStorage.setItem(
      "uniforms",
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
    f.addBinding(this.globals, "maxRays", {
      min: 1,
      max: 40,
      step: 1,
      label: "Max Rays",
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
  }

  addShapeBinding(shape: Shape, f: FolderApi) {
    // Add shape-specific bindings
    switch (shape.type) {
      case ShapeType.OCTAHEDRON:
      case ShapeType.SPHERE:
        if (shape.r === undefined) {
          shape.r = 0.3;
        }
        f.addBinding(shape, "r", {
          label: "Radius",
          min: 0,
          max: 0.5,
          step: 0.01,
        });
        break;

      case ShapeType.ROUND_BOX:
        if (shape.r === undefined) {
          shape.r = 0.15;
        }
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
        if (shape.h === undefined) {
          shape.h = 0.1;
        }
        f.addBinding(shape, "h", {
          label: "Height",
          min: 0,
          max: 0.5,
          step: 0.01,
        });

      case ShapeType.TORUS:
        if (shape.r1 === undefined) {
          shape.r1 = 0.3;
        }
        if (shape.r2 === undefined) {
          shape.r2 = 0.1;
        }
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
        if (shape.h === undefined) {
          shape.h = 0.5;
        }
        if (shape.r === undefined) {
          shape.r = 0.25;
        }
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
        if (shape.h === undefined) {
          shape.h = 0.5;
        }
        if (shape.r === undefined) {
          shape.r = 0.25;
        }
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
        if (shape.r === undefined) {
          shape.r = 0.5;
        }
        if (shape.r1 === undefined) {
          shape.r1 = 0.125;
        }
        if (shape.h === undefined) {
          shape.h = 1.0;
        }
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
        if (shape.r === undefined) {
          shape.r = 0.5;
        }
        if (shape.h === undefined) {
          shape.h = 1.0;
        }

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
        if (shape.h === undefined) {
          shape.h = 1.0;
        }
        if (shape.r1 === undefined) {
          shape.r1 = 0.5;
        }
        if (shape.r2 === undefined) {
          shape.r2 = 0.5;
        }
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
        if (shape.r1 === undefined) {
          shape.r1 = 0.5;
        }
        if (shape.h === undefined) {
          shape.h = Math.PI / 2;
        }
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
        if (shape.r === undefined) {
          shape.r = 0.5;
        }
        if (shape.h === undefined) {
          shape.h = 0.0;
        }
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

  addShape(shape: Shape, idx: number) {
    const f = this.shapeFolder!.addFolder({ title: `Shape ${idx}` });
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

    if (idx !== 0) {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (this.shapes.length <= 1) return;
        this.shapes.splice(idx, 1);
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
      this.addShape(shape, id);
      this.globals.numberOfShapes = this.shapes.length;
      this.pane.refresh();
      this.save();
    });

    this.shapes.forEach((shape, idx) => {
      this.addShape(shape, idx);
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

  addMaterial(mat: Material, idx: number) {
    const f = this.materialFolder!.addFolder({ title: `Material ${idx}` });
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
    f.addBinding(mat, "reflectivity", { min: 0, max: 1, step: 0.01 });
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

    if (idx >= 2) {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (this.materials.length <= 1) return;
        this.materials.splice(idx, 1);
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
      this.addMaterial(material, this.materials.length);
      this.materials.push(material);
      this.updateShapeMaterial();
      this.globals.numberOfMaterials = this.materials.length;
      this.pane!.refresh();
      this.save();
    });

    this.materials.forEach((mat, idx) => {
      this.addMaterial(mat, idx);
    });
  }

  addLight(light: Light, idx: number) {
    const f = this.lightFolder!.addFolder({ title: `Light ${idx}` });
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

    if (idx !== 0) {
      const rmBtn = f.addButton({ title: "Remove" });
      rmBtn.on("click", () => {
        if (light.type === LightType.OMNI || this.lights.length <= 1) return;
        this.lights.splice(idx, 1);
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
      this.addLight(light, this.lights.length);
      this.lights.push(light);
      this.globals.numberOfLights = this.lights.length;
      this.pane.refresh();
      this.save();
    });

    this.lights.forEach((light, idx) => {
      this.addLight(light, idx);
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
      r: 0,
      r1: 0,
      r2: 0,
      mat: 1,
      rot: { x: 0, y: 0, z: 0 },
    };
  }

  defaultMaterial(): Material {
    return {
      name: "Default Material",
      emissive: false,
      color: { r: 1, g: 1, b: 1 },
      innerColor: { r: 1, g: 1, b: 1 },
      glowColor: { r: 1, g: 1, b: 1 },
      kd: 1,
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
    };
  }
}

const RaymarchingUIWrapper = ({
  setUniforms,
}: Readonly<{
  setUniforms?: React.Dispatch<React.SetStateAction<Uniforms | undefined>>;
}>) => {
  // This component wraps the RaymarchingUI and handles the rendering
  // of the UI in a React-friendly way. It uses a ref to attach the UI
  // to a specific DOM element.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize the RaymarchingUI instance and pass the container reference
      new RaymarchingUI(containerRef.current, setUniforms);

      // Cleanup when the component is unmounted
      return () => {
        // Perform any necessary cleanup of the RaymarchingUI instance if needed
      };
    }
  }, [setUniforms]);

  return <div ref={containerRef} />; // This is where the UI will be rendered
};

export default RaymarchingUIWrapper;
