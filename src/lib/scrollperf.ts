// Lightweight scroll profiler. Records silently while active and prints ONE
// compact summary when you stop (no per-frame console spam — that floods the
// console and makes copying crash editors).
//
// Usage: scrollPerf() to start, scroll, scrollPerf() again for the summary.
// Copy the data with:  copy(window.__scrollPerf)

let enabled = false;
let rafId: number | null = null;
let lastFrameTime = 0;

// Per-frame handler timings (cleared each frame).
const frameTimings: Map<string, number> = new Map();
let currentHandler: string | null = null;
let handlerStart = 0;

const LONG_MS = 20;

interface Agg {
  total: number; // total JS ms across the session
  count: number; // frames this handler ran in
  max: number; // worst single-frame ms
  longTotal: number; // JS ms spent during long (>20ms) frames only
}
const agg: Map<string, Agg> = new Map();
let frameCount = 0;
let longFrameCount = 0;
let maxDelta = 0;
let longDeltaSum = 0; // sum of frame durations for long frames
let longJsSum = 0; // sum of handler JS time within long frames

function reset() {
  agg.clear();
  frameTimings.clear();
  frameCount = 0;
  longFrameCount = 0;
  maxDelta = 0;
  longDeltaSum = 0;
  longJsSum = 0;
  currentHandler = null;
}

function start() {
  if (enabled) return;
  enabled = true;
  reset();
  lastFrameTime = performance.now();
  tick();
  console.log(
    "%c[ScrollPerf] Recording (silent). Scroll the area, then run scrollPerf() again for a summary.",
    "color: #0af"
  );
}

function stop() {
  enabled = false;
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  report();
}

export function installScrollPerf() {
  (window as any).scrollPerf = () => {
    if (enabled) stop();
    else start();
  };
  console.log(
    "%c[ScrollPerf] Ready — type scrollPerf() to start/stop",
    "color: #0af"
  );

  // Long Animation Frames: attribute long frames to the scripts that blocked
  // them (file + function), so we can name what's inside the 200ms commit
  // without a Performance recording (which crashes on this page).
  // After scrolling: copy(window.__loaf)
  try {
    const loaf: any[] = ((window as any).__loaf = []);
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (entry.duration < 50) continue;
        const scripts = (entry.scripts || [])
          .map((s: any) => ({
            dur: Math.round(s.duration),
            fn: s.sourceFunctionName || "(anon)",
            src: (s.sourceURL || s.name || "")
              .split("?")[0]
              .split("/")
              .slice(-1)[0],
            invoker: s.invoker,
          }))
          .sort((a: any, b: any) => b.dur - a.dur)
          .slice(0, 6);
        loaf.push({
          frameMs: Math.round(entry.duration),
          blockingMs: Math.round(entry.blockingDuration),
          scripts,
        });
        if (loaf.length > 80) loaf.shift();
      }
    });
    obs.observe({ type: "long-animation-frame", buffered: true } as any);
    console.log(
      "%c[LoAF] Watching long animation frames — scroll, then copy(window.__loaf)",
      "color: #0af"
    );
  } catch {
    console.log("%c[LoAF] long-animation-frame API not supported here", "color:#fa0");
  }
}

function tick() {
  if (!enabled) return;
  const now = performance.now();
  const delta = now - lastFrameTime;

  if (lastFrameTime > 0) {
    frameCount++;
    if (delta > maxDelta) maxDelta = delta;
    const isLong = delta > LONG_MS;
    if (isLong) {
      longFrameCount++;
      longDeltaSum += delta;
    }

    let frameJs = 0;
    for (const [name, ms] of frameTimings) {
      frameJs += ms;
      let a = agg.get(name);
      if (!a) {
        a = { total: 0, count: 0, max: 0, longTotal: 0 };
        agg.set(name, a);
      }
      a.total += ms;
      a.count++;
      if (ms > a.max) a.max = ms;
      if (isLong) a.longTotal += ms;
    }
    if (isLong) longJsSum += frameJs;
  }

  frameTimings.clear();
  lastFrameTime = now;
  rafId = requestAnimationFrame(tick);
}

function report() {
  const rows = Array.from(agg.entries())
    .map(([handler, a]) => ({
      handler,
      "longJS(ms)": +a.longTotal.toFixed(1),
      "totalJS(ms)": +a.total.toFixed(1),
      calls: a.count,
      "avg(ms)": +(a.total / Math.max(1, a.count)).toFixed(2),
      "max(ms)": +a.max.toFixed(1),
    }))
    .sort((x, y) => y["longJS(ms)"] - x["longJS(ms)"] || y["totalJS(ms)"] - x["totalJS(ms)"]);

  console.log("%c[ScrollPerf] Summary", "color: #0af; font-weight: bold");
  console.log(
    `frames: ${frameCount} | long (>${LONG_MS}ms): ${longFrameCount} | worst frame: ${maxDelta.toFixed(1)}ms`
  );
  if (longFrameCount > 0) {
    const avgLong = longDeltaSum / longFrameCount;
    const avgJs = longJsSum / longFrameCount;
    // The gap between frame time and JS time on long frames is paint/layout/composite.
    console.log(
      `long frames: avg ${avgLong.toFixed(1)}ms = JS ${avgJs.toFixed(
        1
      )}ms + paint/other ${(avgLong - avgJs).toFixed(1)}ms`
    );
  }
  console.table(rows);

  (window as any).__scrollPerf = {
    frameCount,
    longFrameCount,
    worstFrameMs: +maxDelta.toFixed(1),
    longFrameAvgMs: longFrameCount ? +(longDeltaSum / longFrameCount).toFixed(1) : 0,
    longFrameJsMs: longFrameCount ? +(longJsSum / longFrameCount).toFixed(1) : 0,
    handlers: rows,
  };
  console.log(
    "%cCopy results with:  copy(window.__scrollPerf)",
    "color: #0af"
  );
}

export function markHandlerStart(name: string) {
  if (!enabled) return;
  currentHandler = name;
  handlerStart = performance.now();
}

export function markHandlerEnd(name: string) {
  if (!enabled) return;
  if (currentHandler === name) {
    const elapsed = performance.now() - handlerStart;
    frameTimings.set(name, (frameTimings.get(name) || 0) + elapsed);
    currentHandler = null;
  }
}
