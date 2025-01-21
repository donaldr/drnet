'use client';
import {
    NearestFilter,
    RepeatWrapping,
    RGBAFormat,
    Uniform,
    Texture,
    Vector4,
} from "three";
import { Effect, NoiseTexture } from "postprocessing";
import { PixelSelectionMode } from "./pixelpull";

import fragmentShader from "./pixelpull.frag";

const textureTag = "PixelPull.Generated";

/**
 * Returns a random float in the specified range.
 *
 * @private
 * @param {Number} low - The lowest possible value.
 * @param {Number} high - The highest possible value.
 * @return {Number} The random value.
 */

export enum PullDirection {
    LEFT,
    UP,
    RIGHT,
    DOWN,
}

/**
 * A glitch effect.
 *
 * This effect can be used in conjunction with the {@link ChromaticAberrationEffect}.
 *
 * Reference: https://github.com/staffantan/unityglitch
 */

interface PixelPullEffectProps {
    t: number;
    texture: Texture | null;
    perturbationMap: Texture | null;
    dtSize: number;
    isActive: boolean;
    direction: number;
    pullToBackground: boolean;
    backgroundColor: Vector4;
    pixelSelectionMode: PixelSelectionMode;
    pixelSelectionRandomBlend: number;
    minSpeed: number;
    maxSpeed: number;
    minLength: number;
    maxLength: number;
    noEnd: boolean;
}

export class PixelPullEffect extends Effect {
    /**
     * Constructs a pixel pull effect.
     *
     */

    constructor({
        t = 0,
        perturbationMap = null,
        dtSize = 1024,
        isActive = false,
        direction = 0,
        pullToBackground = false,
        backgroundColor = new Vector4(0, 0, 0, 0),
        pixelSelectionMode = PixelSelectionMode.BRIGHT,
        pixelSelectionRandomBlend = 0.5,
        minSpeed = 4.0,
        maxSpeed = 8.0,
        minLength = 1.5,
        maxLength = 2.0,
        noEnd = false,
    }: Partial<PixelPullEffectProps> = {}) {
        super("PixelPullEffect", fragmentShader, {
            uniforms: new Map<string, Uniform>([
                ["perturbationMap", new Uniform(null)],
                ["t", new Uniform(0.0)],
                ["isActive", new Uniform(false)],
                ["direction", new Uniform(0)],
                ["pullToBackground", new Uniform(false)],
                [
                    "backgroundColor",
                    new Uniform(new Vector4(0.0, 0.0, 0.0, 0.0)),
                ],
                ["pixelSelectionMode", new Uniform(0)],
                ["pixelSelectionRandomBlend", new Uniform(0.5)],
                ["minSpeed", new Uniform(4.0)],
                ["maxSpeed", new Uniform(8.0)],
                ["minLength", new Uniform(1.5)],
                ["maxLength", new Uniform(2.0)],
                ["noEnd", new Uniform(false)],
            ]),
        });

        if (perturbationMap === null) {
            const map = new NoiseTexture(dtSize, dtSize, RGBAFormat);
            map.name = textureTag;
            this.perturbationMap = map;
        } else {
            this.perturbationMap = perturbationMap;
        }

        this.t = t;
        this.isActive = isActive;
        this.direction = direction;
        this.pullToBackground = pullToBackground;
        this.backgroundColor = backgroundColor;
        this.pixelSelectionMode = pixelSelectionMode;
        this.pixelSelectionRandomBlend = pixelSelectionRandomBlend;
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.noEnd = noEnd;

        return this;
    }

    /**
     * The time
     *
     * @type {Number}
     */

    get t(): number {
        return this.uniforms.get("t")!.value;
    }

    set t(value) {
        this.uniforms.get("t")!.value = value;
    }

    /**
     * The direction
     *
     * Uses an enum whose directions correspond to
     * Left - 0
     * Up - 1
     * Right - 2
     * Down - 3
     *
     * @type {PullDirection}
     */

    get direction(): PullDirection {
        return this.uniforms.get("direction")!.value;
    }

    set direction(value) {
        this.uniforms.get("direction")!.value = value;
    }

    /**
     * isActive
     *
     * @type {Boolean}
     */

    get isActive(): boolean {
        return this.uniforms.get("isActive")!.value;
    }

    set isActive(value) {
        this.uniforms.get("isActive")!.value = value;
    }

    /**
     * pullToBackground
     *
     * @type {Boolean}
     */

    get pullToBackground(): boolean {
        return this.uniforms.get("pullToBackground")!.value;
    }

    set pullToBackground(value) {
        this.uniforms.get("pullToBackground")!.value = value;
    }

    /**
     * backgroundColor
     *
     * @type {Vector4}
     */

    get backgroundColor(): Vector4 {
        return this.uniforms.get("backgroundColor")!.value;
    }

    set backgroundColor(value: Vector4) {
        this.uniforms.get("backgroundColor")!.value = value;
    }

    /**
     * The pixel selection type
     *
     * @type {PixelSelectionMode}
     */

    get pixelSelectionMode(): PixelSelectionMode {
        return this.uniforms.get("pixelSelectionMode")!.value;
    }

    set pixelSelectionMode(value: PixelSelectionMode) {
        this.uniforms.get("pixelSelectionMode")!.value = value;
    }

    /**
     * The pixel selection random blend, i.e. 1 is completely random pixel selection
     *
     * @type {number}
     */

    get pixelSelectionRandomBlend(): number {
        return this.uniforms.get("pixelSelectionRandomBlend")!.value;
    }

    set pixelSelectionRandomBlend(value: number) {
        this.uniforms.get("pixelSelectionRandomBlend")!.value = value;
    }

    /**
     * The pixel pull min speed in fraction of width or length
     *
     * @type {number}
     */

    get minSpeed(): number {
        return this.uniforms.get("minSpeed")!.value;
    }

    set minSpeed(value: number) {
        this.uniforms.get("minSpeed")!.value = value;
    }

    /**
     * The pixel pull max speed in fraction of width or length
     *
     * @type {number}
     */

    get maxSpeed(): number {
        return this.uniforms.get("maxSpeed")!.value;
    }

    set maxSpeed(value: number) {
        this.uniforms.get("maxSpeed")!.value = value;
    }

    /**
     * The pixel pull min speed in fraction of width or length
     *
     * @type {number}
     */

    get minLength(): number {
        return this.uniforms.get("minLength")!.value;
    }

    set minLength(value: number) {
        this.uniforms.get("minLength")!.value = value;
    }

    /**
     * The pixel pull max speed in fraction of width or length
     *
     * @type {number}
     */

    get maxLength(): number {
        return this.uniforms.get("maxLength")!.value;
    }

    set maxLength(value: number) {
        this.uniforms.get("maxLength")!.value = value;
    }

    /**
     * noEnd
     *
     * @type {Boolean}
     */

    get noEnd(): boolean {
        return this.uniforms.get("noEnd")!.value;
    }

    set noEnd(value) {
        this.uniforms.get("noEnd")!.value = value;
    }

    /**
     * The perturbation map.
     *
     * @type {Texture}
     */

    get perturbationMap() {
        return this.uniforms.get("perturbationMap")!.value;
    }

    set perturbationMap(value) {
        const currentMap = this.perturbationMap;

        if (currentMap !== null && currentMap.name === textureTag) {
            currentMap.dispose();
        }

        value.minFilter = value.magFilter = NearestFilter;
        value.wrapS = value.wrapT = RepeatWrapping;
        value.generateMipmaps = false;

        this.uniforms.get("perturbationMap")!.value = value;
    }

    /**
     * Deletes generated resources.
     */

    dispose() {
        const map = this.perturbationMap;

        if (map !== null && map.name === textureTag) {
            map.dispose();
        }
    }
}
