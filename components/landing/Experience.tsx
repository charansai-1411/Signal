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
  pair?: 0 | 1; // the contradiction pair
};

// Eight channel "messages" — the noise. Two of them (the marble instructions)
// are the contradiction pair that clashes at the midpoint of the scroll.
const SHARDS: Shard[] = [
  { label: "WhatsApp", note: "use the previous marble", tint: "#1f9d55", scatter: [-3.3, 1.7, 0.4], pair: 0 },
  { label: "Email", note: "refer Rev 04 — marble changed", tint: "#2563eb", scatter: [3.1, 1.9, -0.5], pair: 1 },
  { label: "Site", note: "needs clarification", tint: "#e0701a", scatter: [-3.7, -1.3, -1.1] },
  { label: "Client", note: "approved except bathroom", tint: "#7c3aed", scatter: [3.5, -1.5, 0.7] },
  { label: "Supplier", note: "Shade 312 unavailable", tint: "#0d9488", scatter: [-1.7, 2.5, -1.7] },
  { label: "Drawings", note: "Rev 05 uploaded", tint: "#64748b", scatter: [1.9, -2.5, -0.7] },
  { label: "WhatsApp", note: "site photos attached", tint: "#1f9d55", scatter: [-2.3, 0.1, 1.7] },
  { label: "Email", note: "PO approved", tint: "#2563eb", scatter: [2.5, 0.7, 1.3] },
];

// Final resting places: an ellipse orbiting the central Decision card.
const RING = SHARDS.map((_, i) => {
  const a = (i / SHARDS.length) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * 2.9, Math.sin(a) * 1.8, Math.sin(a) * 0.5] as [number, number, number];
});

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
    const off = scroll.offset; // 0..1 across the whole scroll
    const t = state.clock.elapsedTime;

    // Camera: dolly in and drift sideways as the story progresses.
    const cam = state.camera;
    const ease = smootherstep(off, 0, 1);
    cam.position.set(Math.sin(off * Math.PI) * 1.7, 0.3 + off * 0.25, lerp(12.5, 8.4, ease));
    cam.lookAt(0, 0.1, 0);

    const converge = smoothstep(off, 0.6, 0.98); // scatter -> ring
    const clash = smoothstep(off, 0.32, 0.46) * (1 - smoothstep(off, 0.58, 0.72)); // pair collide, mid

    SHARDS.forEach((s, i) => {
      const g = groups.current[i];
      const m = mats.current[i];
      if (!g || !m) return;

      const drift = 1 - converge;
      const dx = Math.sin(t * 0.5 + i * 1.7) * 0.2 * drift;
      const dy = Math.cos(t * 0.42 + i * 1.1) * 0.18 * drift;

      let x = lerp(s.scatter[0], RING[i][0], converge) + dx;
      let y = lerp(s.scatter[1], RING[i][1], converge) + dy;
      let z = lerp(s.scatter[2], RING[i][2], converge);

      if (s.pair !== undefined) {
        const cx = s.pair === 0 ? -0.9 : 0.9;
        x = lerp(x, cx, clash);
        y = lerp(y, 0.55, clash);
        z = lerp(z, 1.3, clash);
        m.emissive.copy(red);
        m.emissiveIntensity = 0.12 + clash * 1.6;
      } else {
        m.emissive.copy(tints[i]);
        m.emissiveIntensity = 0.22 + converge * 0.12 - clash * 0.12;
      }

      g.position.set(x, y, z);
      g.rotation.z = Math.sin(t * 0.3 + i) * 0.05 * drift + clamp(s.pair !== undefined ? clash * 0.1 : 0, -1, 1);
      g.rotation.x = -0.04;
      g.rotation.y = lerp(Math.sin(i) * 0.25, 0, converge);
    });

    // Red contradiction beam between the pair.
    if (beam.current) {
      const bm = beam.current.material as THREE.MeshStandardMaterial;
      bm.opacity = clash * 0.85;
      beam.current.scale.x = 0.2 + clash * 1.0;
      const pulse = 0.6 + Math.sin(t * 8) * 0.2 * clash;
      bm.emissiveIntensity = pulse * clash * 2;
    }

    // Central Decision card resolves in at the end.
    if (decision.current && decisionMat.current) {
      const ds = smoothstep(off, 0.68, 0.96);
      decision.current.scale.setScalar(0.001 + ds);
      decision.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      decision.current.position.y = 0.1 + Math.sin(t * 0.8) * 0.05 * ds;
      decisionMat.current.emissiveIntensity = ds * (0.5 + Math.sin(t * 2.2) * 0.12);
    }
  });

  return (
    <group>
      {/* Ambient floating dust for depth */}
      <Sparkles count={70} scale={[16, 10, 8]} size={2.4} speed={0.28} opacity={0.5} color="#e0a05a" />

      {SHARDS.map((s, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} position={s.scatter}>
          <RoundedBox args={[1.55, 0.92, 0.09]} radius={0.09} smoothness={4} castShadow>
            <meshStandardMaterial
              ref={(el) => { mats.current[i] = el; }}
              color="#fffdf8"
              roughness={0.32}
              metalness={0.12}
              emissive={s.tint}
              emissiveIntensity={0.22}
            />
          </RoundedBox>
          {/* channel tab */}
          <mesh position={[-0.5, 0.32, 0.05]}>
            <planeGeometry args={[0.5, 0.16]} />
            <meshBasicMaterial color={s.tint} toneMapped={false} />
          </mesh>
          <Text position={[-0.5, 0.32, 0.061]} fontSize={0.088} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.02}>
            {s.label.toUpperCase()}
          </Text>
          <Text position={[0, -0.02, 0.061]} fontSize={0.12} maxWidth={1.3} textAlign="center" color="#3a332b" anchorX="center" anchorY="middle">
            {s.note}
          </Text>
        </group>
      ))}

      {/* Contradiction beam */}
      <mesh ref={beam} position={[0, 0.55, 1.3]}>
        <boxGeometry args={[1.7, 0.04, 0.04]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* Central Decision card */}
      <group ref={decision} scale={0.001} position={[0, 0.1, 0]}>
        <RoundedBox args={[2.1, 1.3, 0.14]} radius={0.12} smoothness={5}>
          <meshStandardMaterial ref={decisionMat} color="#fffef9" roughness={0.22} metalness={0.25} emissive="#e0701a" emissiveIntensity={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.44, 0.08]}>
          <planeGeometry args={[0.95, 0.2]} />
          <meshBasicMaterial color="#dc2626" toneMapped={false} />
        </mesh>
        <Text position={[0, 0.44, 0.09]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.04}>
          ⚠ CONTRADICTION
        </Text>
        <Text position={[0, 0.06, 0.09]} fontSize={0.17} maxWidth={1.8} textAlign="center" color="#1a1712" anchorX="center" anchorY="middle">
          Master bathroom marble
        </Text>
        <Text position={[0, -0.28, 0.09]} fontSize={0.1} maxWidth={1.8} textAlign="center" color="#6b6257" anchorX="center" anchorY="middle">
          reuse old vs. Rev 04 — cannot both be true
        </Text>
      </group>

      {/* Lights */}
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 6]} intensity={1.5} />
      <pointLight position={[-5, -2, 4]} intensity={40} color="#e0701a" distance={20} decay={2} />
      <pointLight position={[0, 0.5, 3]} intensity={12} color="#ffd9a8" distance={12} decay={2} />
    </group>
  );
}
