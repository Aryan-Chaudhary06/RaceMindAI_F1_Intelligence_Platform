import { useEffect, useId, useRef, useState } from "react";
import { getCircuitSvgUrl } from "../data/circuits";
import "./CircuitMap.css";

// Module-level cache so RaceRail (many mini cards) and Hero don't each
// re-fetch the same circuit SVG over the network.
const circuitCache = new Map(); // url -> Promise<{ pathD: string, viewBox: string }>

/**
 * Converts points attribute string from <polyline> or <polygon> elements to an SVG path "d" string.
 */
function pointsToPathData(pointsStr, isClosed = false) {
  if (!pointsStr) return null;
  const coords = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n));

  if (coords.length < 4) return null;

  let d = `M ${coords[0]} ${coords[1]}`;
  for (let i = 2; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      d += ` L ${coords[i]} ${coords[i + 1]}`;
    }
  }
  if (isClosed) {
    d += " Z";
  }
  return d;
}

/**
 * Fetches and parses an SVG circuit layout.
 * Supports <path>, <polygon>, and <polyline> elements, dynamic viewBox extraction,
 * and guards against Vite's dev server HTML fallback on 404s.
 */
async function fetchCircuitData(url) {
  if (circuitCache.has(url)) return circuitCache.get(url);

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load circuit SVG (${res.status} ${res.statusText})`);
      }
      const contentType = res.headers.get("content-type") || "";
      // Vite dev server returns index.html on missing assets (200 OK + text/html)
      if (contentType.includes("text/html")) {
        throw new Error(`Expected SVG but received HTML (Vite fallback for missing asset)`);
      }
      return res.text();
    })
    .then((svgText) => {
      const trimmed = svgText.trim();
      // Guard against HTML payload even without Content-Type header
      if (
        trimmed.startsWith("<!DOCTYPE html") ||
        trimmed.startsWith("<html") ||
        !trimmed.includes("<svg")
      ) {
        throw new Error("Received HTML markup instead of valid SVG");
      }

      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      if (doc.querySelector("parsererror")) {
        throw new Error("Malformed SVG markup (DOMParser parsererror)");
      }

      // ── Dynamic viewBox extraction ──
      const svgEl = doc.querySelector("svg");
      let extractedViewBox = svgEl?.getAttribute("viewBox") || null;
      if (!extractedViewBox && svgEl) {
        const width = parseFloat(svgEl.getAttribute("width"));
        const height = parseFloat(svgEl.getAttribute("height"));
        if (!isNaN(width) && !isNaN(height)) {
          extractedViewBox = `0 0 ${width} ${height}`;
        }
      }

      // ── Path / Polyline / Polygon extraction ──
      const candidates = [];

      // 1. <path> tags
      doc.querySelectorAll("path").forEach((p) => {
        const d = p.getAttribute("d");
        if (d && d.trim().length > 0) {
          candidates.push(d.trim());
        }
      });

      // 2. Fallback to <polygon>
      if (!candidates.length) {
        doc.querySelectorAll("polygon").forEach((p) => {
          const d = pointsToPathData(p.getAttribute("points"), true);
          if (d) candidates.push(d);
        });
      }

      // 3. Fallback to <polyline>
      if (!candidates.length) {
        doc.querySelectorAll("polyline").forEach((p) => {
          const d = pointsToPathData(p.getAttribute("points"), false);
          if (d) candidates.push(d);
        });
      }

      if (!candidates.length) {
        throw new Error("No path, polygon, or polyline data found in circuit SVG");
      }

      // The circuit outline track is typically the longest path
      const longestPath = candidates.reduce((a, b) => (b.length > a.length ? b : a));

      return {
        pathD: longestPath,
        viewBox: extractedViewBox || "0 0 500 500",
      };
    });

  circuitCache.set(url, promise);
  // Don't cache a rejected promise — let a future render retry
  promise.catch(() => circuitCache.delete(url));
  return promise;
}

/**
 * Renders a real F1 circuit layout from local SVGs.
 * Replicates the original SVG design with two thick white border lines and a dark/transparent gap,
 * with a glowing car dot traveling down the center of the track gap.
 *
 * Props:
 *  - circuitName: string — matched against src/data/circuits.js to resolve SVG
 *  - mini: bool — compact styling for use inside cards (default: false)
 *  - showCar: bool — animate a car dot lapping the circuit (default: !mini)
 *  - label: string — optional caption shown under the map
 */
export default function CircuitMap({ circuitName, mini = false, showCar = !mini, label }) {
  const [pathD, setPathD] = useState(null);
  const [viewBox, setViewBox] = useState("0 0 500 500");
  const [status, setStatus] = useState("loading"); // loading | ready | error | unknown

  const pathRef = useRef(null);
  const rafRef = useRef(null);
  const drawRafRef = useRef(null);

  const [pathLength, setPathLength] = useState(0);
  const [drawn, setDrawn] = useState(0);
  const [carPos, setCarPos] = useState(null);

  const rawId = useId();
  const maskId = `circuit-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const url = getCircuitSvgUrl(circuitName);

  // ── Fetch + parse the circuit path ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPathD(null);
    setDrawn(0);
    setCarPos(null);

    if (!circuitName) {
      setStatus("unknown");
      return;
    }

    if (!url) {
      console.warn(`[CircuitMap] Unknown circuit name or unmapped layout: "${circuitName}"`);
      setStatus("unknown");
      return;
    }

    fetchCircuitData(url)
      .then((data) => {
        if (cancelled) return;
        setPathD(data.pathD);
        if (data.viewBox) {
          setViewBox(data.viewBox);
        }
        setStatus("ready");
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn(
            `[CircuitMap] Failed to load circuit map for "${circuitName}" (${url}):`,
            err?.message || err
          );
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, circuitName]);

  // ── Draw-in animation once the path is mounted ──────────────────────
  useEffect(() => {
    if (status !== "ready" || !pathRef.current) return;
    try {
      const total = pathRef.current.getTotalLength();
      setPathLength(total);
      setDrawn(0);

      let start = null;
      const DURATION = mini ? 1200 : 2200;
      const draw = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / DURATION, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setDrawn(eased * total);
        if (p < 1) drawRafRef.current = requestAnimationFrame(draw);
      };
      drawRafRef.current = requestAnimationFrame(draw);
    } catch (e) {
      console.warn("[CircuitMap] Failed to calculate path length for animation:", e);
    }
    return () => {
      if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current);
    };
  }, [status, pathD, mini]);

  // ── Car dot lapping the circuit ──────────────────────────────────────
  useEffect(() => {
    if (!showCar || status !== "ready" || !pathRef.current) return;
    try {
      const total = pathRef.current.getTotalLength();
      const LAP_DURATION = mini ? 6000 : 8000;
      let start = null;

      const animate = (ts) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = (elapsed % LAP_DURATION) / LAP_DURATION;
        try {
          const point = pathRef.current.getPointAtLength(progress * total);
          setCarPos({ x: point.x, y: point.y });
        } catch {
          // path not ready — skip frame
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    } catch (e) {
      console.warn("[CircuitMap] Failed to start car lap animation:", e);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [showCar, status, mini]);

  const wrapClass = `circuit-map ${mini ? "circuit-map-mini" : ""}`;

  if (status === "unknown" || status === "error") {
    return (
      <div className={`${wrapClass} circuit-map-empty`}>
        <div className="circuit-map-empty-mark" />
        {!mini && <span className="circuit-map-empty-label">Layout unavailable</span>}
      </div>
    );
  }

  // Dash animation properties
  const dashArray = pathLength > 0 ? pathLength : undefined;
  const dashOffset = pathLength > 0 ? Math.max(0, pathLength - drawn) : undefined;

  // Track stroke dimensions matching the original SVGs (outer 20, inner cutout 5-6)
  const outerWidth = mini ? 14 : 20;
  const innerGapWidth = mini ? 4 : 5.5;

  return (
    <div className={wrapClass}>
      <svg
        className="circuit-map-svg"
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mask that carves out the center gap, producing two solid white lines with a transparent slot */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            {/* 1. White base stroke creates the outer track boundaries */}
            <path
              d={pathD || ""}
              stroke="#ffffff"
              strokeWidth={outerWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
            {/* 2. Black stroke cuts out the center gap, making it transparent */}
            <path
              d={pathD || ""}
              stroke="#000000"
              strokeWidth={innerGapWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          </mask>
        </defs>

        {pathD && (
          <>
            {/* Invisible measurement path for getTotalLength / getPointAtLength */}
            <path
              ref={pathRef}
              d={pathD}
              stroke="transparent"
              strokeWidth="1"
              fill="none"
            />

            {/* The Circuit Track: Two thick white lines with the gap between them */}
            <path
              d={pathD}
              stroke="#ffffff"
              strokeWidth={outerWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
              mask={`url(#${maskId})`}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />

            {/* Car dot moving right through the space between the two thick white lines */}
            {showCar && carPos && (
              <g transform={`translate(${carPos.x}, ${carPos.y})`} className="circuit-car">
                {/* Red telemetry glow halo */}
                <circle r={mini ? 5 : 7} fill="#e10600" opacity="0.32" />
                {/* Solid red car dot */}
                <circle r={mini ? 2.2 : 2.8} fill="#e10600" />
                {/* Bright white headlight center */}
                <circle r={mini ? 0.9 : 1.2} fill="#ffffff" opacity="0.95" />
              </g>
            )}
          </>
        )}
      </svg>
      {label && !mini && <div className="circuit-map-label">{label}</div>}
    </div>
  );
}
