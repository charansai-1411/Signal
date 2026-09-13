"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Sparkles, useScroll } from "@react-three/drei";
import * as THREE from "three";

const { lerp, smoothstep, smootherstep, clamp } = THREE.MathUtils;

type Shard = {
  label: string;
  note: string;
  tint: string;
  scatter: [number, number, number];
  pair?: 0 | 1;
};

const SHARDS: Shard[] = [
  { label: "WhatsApp", note: "use the previous marble", tint: "#1f9d55", scatter: [-3.6, 1.8, 0.4], pair: 0 },
  { label: "Email", note: "refer Rev 04 — marble changed", tint: "#2563eb", scatter: [3.4, 2.0, -0.5], pair: 1 },
  { label: "Site", note: "needs clarification", tint: "#e0701a", scatter: [-4.0, -1.4, -1.1] },
  { label: "Client", note: "approved except bathroom", tint: "#7c3aed", scatter: [3.8, -1.6, 0.7] },
  { label: "Supplier", note: "Shade 312 unavailable", tint: "#0d9488", scatter: [-1.9, 2.7, -1.7] },
  { label: "Drawings", note: "Rev 05 uploaded", tint: "#64748b", scatter: [2.1, -2.7, -0.7] },
  { label: "WhatsApp", note: "site photos attached", tint: "#1f9d55", scatter: [-2.5, 0.2, 1.7] },
  { label: "Email", note: "PO approved", tint: "#2563eb", scatter: [2.7, 0.7, 1.3] },
];

const N = SHARDS.length;

export function Experience() {
  const scroll = useScroll();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const beam = useRef<THREE.Mesh>(null);
  const decision = useRef<THREE.Group>(null);
  const decisionMat = useRef<THREE.MeshStandardMaterial>(null);

  const red = useMemo(() => new THREE.Color("#dc2626"), []);
  const tints = useMemo(() => SHARDS.map((s) => new THREE.Color(s.tint)), []);

  useFrame((state) => {
    const off = scroll.offset;
    const t = state.clock.elapsedTime;
    const intro = smootherstep(clamp(t / 1.5, 0, 1), 0, 1); // entrance fly-in

    // Camera: dolly in over scroll + subtle mouse parallax.
    const cam = state.camera;
    const ease = smootherstep(off, 0, 1);
    cam.position.set(
      Math.sin(off * Math.PI) * 1.8 + state.pointer.x * 0.8,
      0.3 + off * 0.3 + state.pointer.y * 0.45,
      lerp(13.6, 10.8, ease),
    );
    cam.lookAt(0, 0.1, 0);

    const converge = smoothstep(off, 0.6, 0.98);
    const clash = smoothstep(off, 0.32, 0.46) * (1 - smoothstep(off, 0.58, 0.72));
    const spin = t * 0.22 * converge; // the settled ring slowly orbits

    SHARDS.forEach((s, i) => {
      const g = groups.current[i];
      const m = mats.current[i];
      if (!g || !m) return;

      const drift = 1 - converge;
      const dx = Math.sin(t * 0.55 + i * 1.7) * 0.24 * drift;
      const dy = Math.cos(t * 0.45 + i * 1.1) * 0.22 * drift;
      const dz = Math.sin(t * 0.4 + i * 0.7) * 0.16 * drift;

      const sx = s.scatter[0] * 1.18;
      const sy = s.scatter[1] * 1.12;
      const ang = (i / N) * Math.PI * 2 - Math.PI / 2 + spin;
      const rx = Math.cos(ang) * 3.5;
      const ry = Math.sin(ang) * 2.05;
      const rz = Math.sin(ang) * 0.6;

      let x = lerp(sx, rx, converge) + dx;
      let y = lerp(sy, ry, converge) + dy;
      let z = lerp(s.scatter[2], rz, converge) + dz;

      if (s.pair !== undefined) {
        const cx = s.pair === 0 ? -1.05 : 1.05;
        x = lerp(x, cx, clash);
        y = lerp(y, 0.6, clash);
        z = lerp(z, 1.5, clash);
        m.emissive.copy(red);
        m.emissiveIntensity = 0.12 + clash * 1.8;
      } else {
        m.emissive.copy(tints[i]);
        m.emissiveIntensity = 0.22 + converge * 0.12 - clash * 0.12 + Math.sin(t * 1.5 + i) * 0.05;
      }

      g.position.set(x, y, z);
      g.scale.setScalar(intro);
      g.rotation.z = Math.sin(t * 0.35 + i) * 0.07 * drift + clash * 0.13 * (s.pair === 0 ? 1 : -1);
      g.rotation.x = -0.05 + Math.sin(t * 0.4 + i) * 0.035 * drift;
      g.rotation.y = lerp(Math.sin(i) * 0.3, Math.sin(t * 0.3 + i) * 0.1, converge) + (1 - intro) * 3.2;
    });

    if (beam.current) {
      const bm = beam.current.material as THREE.MeshStandardMaterial;
      bm.opacity = clash * 0.9;
      beam.current.scale.x = 0.15 + clash * 1.0;
      bm.emissiveIntensity = (0.6 + Math.sin(t * 9) * 0.25) * clash * 2.2;
    }

    if (decision.current && decisionMat.current) {
      const ds = smoothstep(off, 0.68, 0.96);
      decision.current.scale.setScalar(0.001 + ds);
      decision.current.rotation.y = Math.sin(t * 0.5) * 0.22; // gentle face-wobble, stays readable
      decision.current.rotation.z = Math.sin(t * 0.7) * 0.02;
      decision.current.position.y = 0.15 + Math.sin(t * 0.9) * 0.07 * ds;
      decisionMat.current.emissiveIntensity = ds * (0.55 + Math.sin(t * 2.4) * 0.16);
    }
  });

  return (
    <group>
      <Sparkles count={110} scale={[18, 11, 9]} size={2.8} speed={0.32} opacity={0.5} color="#e0a05a" />
      <Sparkles count={50} scale={[14, 9, 7]} size={1.6} speed={0.2} opacity={0.35} color="#ffffff" />

      {SHARDS.map((s, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} position={s.scatter}>
          <RoundedBox args={[1.95, 1.18, 0.1]} radius={0.1} smoothness={4}>
            <meshStandardMaterial
              ref={(el) => { mats.current[i] = el; }}
              color="#fffdf8"
              roughness={0.3}
              metalness={0.14}
              emissive={s.tint}
              emissiveIntensity={0.22}
            />
          </RoundedBox>
          <mesh position={[-0.62, 0.4, 0.055]}>
            <planeGeometry args={[0.66, 0.2]} />
            <meshBasicMaterial color={s.tint} toneMapped={false} />
          </mesh>
          <Text position={[-0.62, 0.4, 0.062]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.03}>
            {s.label.toUpperCase()}
          </Text>
          <Text position={[0, -0.03, 0.062]} fontSize={0.155} maxWidth={1.65} textAlign="center" color="#3a332b" anchorX="center" anchorY="middle">
            {s.note}
          </Text>
        </group>
      ))}

      {/* Contradiction beam */}
      <mesh ref={beam} position={[0, 0.6, 1.5]}>
        <boxGeometry args={[2.1, 0.05, 0.05]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* Central Decision card */}
      <group ref={decision} scale={0.001} position={[0, 0.15, 0]}>
        <RoundedBox args={[2.75, 1.68, 0.16]} radius={0.14} smoothness={5}>
          <meshStandardMaterial ref={decisionMat} color="#fffef9" roughness={0.2} metalness={0.28} emissive="#e0701a" emissiveIntensity={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.58, 0.09]}>
          <planeGeometry args={[1.25, 0.26]} />
          <meshBasicMaterial color="#dc2626" toneMapped={false} />
        </mesh>
        <Text position={[0, 0.58, 0.1]} fontSize={0.13} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.05}>
          ⚠ CONTRADICTION
        </Text>
        <Text position={[0, 0.09, 0.1]} fontSize={0.22} maxWidth={2.4} textAlign="center" color="#1a1712" anchorX="center" anchorY="middle">
          Master bathroom marble
        </Text>
        <Text position={[0, -0.37, 0.1]} fontSize={0.125} maxWidth={2.4} textAlign="center" color="#6b6257" anchorX="center" anchorY="middle">
          reuse old vs. Rev 04 — cannot both be true
        </Text>
      </group>

      {/* Lights */}
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 6, 6]} intensity={1.6} />
      <pointLight position={[-5, -2, 4]} intensity={45} color="#e0701a" distance={22} decay={2} />
      <pointLight position={[0, 0.5, 3]} intensity={14} color="#ffd9a8" distance={13} decay={2} />
    </group>
  );
}
