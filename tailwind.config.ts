import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      dropShadow: {
        outline: [
          "-1px -1px var(--title-outline-blur) var(--title-outline-color)",
          "-1px 1px var(--title-outline-blur) var(--title-outline-color)",
          "1px -1px var(--title-outline-blur) var(--title-outline-color)",
          "1px 1px var(--title-outline-blur) var(--title-outline-color)",
        ],
        workNavigation: [
          "0 0 6px rgb(0 0 0 / 0.05)",
          "0 0 4px rgb(0 0 0 / 0.2)",
        ],
      },
      height: {
        header: "var(--header-height)",
        footer: "var(--footer-height)",
      },
      spacing: {
        header: "var(--header-height)",
        footer: "var(--footer-height)",
      },
      keyframes: {
        boldify: {
          "0%": {
            "font-variation-settings": `"wdth" 150, "wght" 100`,
          },
          "100%": {
            "font-variation-settings": `"wdth" 150, "wght" 600`,
          },
        },
        unboldify: {
          "0%": {
            "font-variation-settings": `"wdth" 150, "wght" 600`,
          },
          "100%": {
            "font-variation-settings": `"wdth" 150, "wght" 100`,
          },
        },
        glowpulse: {
          "0%": {
            filter: "drop-shadow(0px 0px 0px #ffffff);",
          },
          "100%": {
            filter: "drop-shadow(0px 0px 0px #ffffff);",
          },
          "10%": {
            filter: "drop-shadow(0px 0px 10px #ffffff);",
            stroke: "#FFFFFF",
          },
        },
        scalebounce: {
          "0%": {
            transform: "scale(1)",
          },
          "100%": {
            transform: "scale(1.1)",
          },
        },
        unscalebounce: {
          "0%": {
            transform: "scale(1.1)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        pulse: {
          "0%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      animation: {
        boldify: "boldify 0.5s linear forwards",
        unboldify: "unboldify 0.5s linear forwards",
        glowpulse: "glowpulse 1.5s ease-in forwards",
        pulse: "pulse 1s ease-in-out forwards infinite",
        scalebounce:
          "scalebounce 0.25s cubic-bezier(0.355, 0.525, 0.485, 1.650) forwards",
        unscalebounce:
          "unscalebounce 0.25s cubic-bezier(0.355, 0.525, 0.485, 1.650) forwards",
      },
      transitionDelay: {
        "100": "100ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "900": "900ms",
        "1000": "1000ms",
      },
      cursor: {
        left: "url(/icons/left-arrow.png) 32 15, move",
        right: "url(/icons/right-arrow.png) 32 15, move",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
