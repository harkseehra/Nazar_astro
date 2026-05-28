'use client';
import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PLANET_COLORS, PLANET_GLYPHS, PLANET_LABELS } from '@/lib/theme';
import type { PlanetName, TodayJson } from '@/types/astrology';

// Stylised orbital radii — not to scale, just recognisable
const ORBIT_RADII: Record<PlanetName, number> = {
  sun:     0,
  moon:    1.4,
  mercury: 2.2,
  venus:   3.0,
  mars:    4.0,
  jupiter: 5.5,
  saturn:  7.0,
};

const PLANET_SIZES: Record<PlanetName, number> = {
  sun:     0.55,
  moon:    0.18,
  mercury: 0.20,
  venus:   0.28,
  mars:    0.24,
  jupiter: 0.42,
  saturn:  0.38,
};

const PLANETS: PlanetName[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

interface PlanetMeshProps {
  planet: PlanetName;
  longitude: number;
  isRetrograde: boolean;
  isSelected: boolean;
  onClick: () => void;
  showLabel: boolean;
}

function PlanetMesh({ planet, longitude, isRetrograde, isSelected, onClick, showLabel }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const color = new THREE.Color(PLANET_COLORS[planet]);
  const r = ORBIT_RADII[planet];
  const size = PLANET_SIZES[planet];

  // Convert ecliptic longitude to 3D position
  const rad = (longitude * Math.PI) / 180;
  const x = r * Math.cos(rad);
  const z = r * Math.sin(rad);

  useFrame((_, delta) => {
    if (meshRef.current && planet !== 'sun') {
      // Gentle self-rotation; retrograde planets spin backward
      const dir = isRetrograde ? 1 : -1;
      meshRef.current.rotation.y += dir * delta * 0.3;
    }
    // Subtle pulse for selected planet
    if (meshRef.current && isSelected) {
      const t = Date.now() / 800;
      meshRef.current.scale.setScalar(1 + Math.sin(t) * 0.05);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={meshRef} onClick={onClick} castShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={planet === 'sun' ? color : new THREE.Color(0, 0, 0)}
          emissiveIntensity={planet === 'sun' ? 0.6 : 0}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Saturn rings */}
      {planet === 'saturn' && (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[0.5, 0.75, 48]} />
          <meshBasicMaterial color={PLANET_COLORS.saturn} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover / selected glow */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[size * 1.5, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </mesh>
      )}

      {/* Label */}
      {showLabel && (
        <Html distanceFactor={12} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            color: PLANET_COLORS[planet],
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            textShadow: '0 0 8px #000',
            transform: 'translate(-50%, -150%)',
          }}>
            {PLANET_GLYPHS[planet]} {PLANET_LABELS[planet]}
          </div>
        </Html>
      )}
    </group>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  if (radius === 0) return null;
  const points = Array.from({ length: 129 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2;
    return new THREE.Vector3(radius * Math.cos(a), 0, radius * Math.sin(a));
  });
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.04 });
  const lineObj = new THREE.Line(geo, mat);
  return <primitive object={lineObj} />;
}

interface Props {
  data: TodayJson;
  onSelectPlanet: (p: PlanetName) => void;
  selectedPlanet: PlanetName | null;
}

function Scene({ data, onSelectPlanet, selectedPlanet }: Props) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#7D4452" decay={0.5} />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#ffffff" />

      {PLANETS.map((planet) => {
        if (planet === 'sun') {
          return (
            <PlanetMesh key={planet} planet={planet} longitude={0} isRetrograde={false}
              isSelected={selectedPlanet === planet}
              onClick={() => onSelectPlanet(planet)}
              showLabel={selectedPlanet === planet} />
          );
        }
        const pd = data.planets[planet];
        return (
          <PlanetMesh key={planet} planet={planet}
            longitude={pd.absoluteLongitude}
            isRetrograde={pd.isRetrograde}
            isSelected={selectedPlanet === planet}
            onClick={() => onSelectPlanet(planet)}
            showLabel={selectedPlanet === planet} />
        );
      })}

      {PLANETS.filter((p) => p !== 'sun').map((planet) => (
        <OrbitRing key={planet} radius={ORBIT_RADII[planet]} />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={20}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.1}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  );
}

export function CosmosView({ data, onSelectPlanet, selectedPlanet }: Props) {
  return (
    <div className="fixed inset-0" style={{ background: '#0A0E14' }}>
      <Canvas
        camera={{ position: [0, 7, 12], fov: 55 }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        }}
      >
        <Scene data={data} onSelectPlanet={onSelectPlanet} selectedPlanet={selectedPlanet} />
      </Canvas>
    </div>
  );
}
