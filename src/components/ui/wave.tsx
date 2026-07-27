import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useElementVisibility } from '../../hooks/useElementVisibility';

export type WaveParams = {
  speed: number;
  intensity: number;
  progress: number;
  pointerStrength: number;
  opacity: number;
};

export type WaveProps = {
  speed?: number;
  tiles?: number;
  intensity?: number;
  progress?: number;
  pointerStrength?: number;
  theme?: "light" | "dark";
  disablePointerTracking?: boolean;
  paused?: boolean;
  dpr?: number | [number, number];
  className?: string;
  style?: React.CSSProperties;
  controllerRef?: React.MutableRefObject<WaveParams>;
};

// Shader Material Definition
const WaveShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uProgress: { value: 0 },
    uIntensity: { value: 1 },
    uPointerStrength: { value: 0.5 },
    uSpeed: { value: 0.5 },
    uIsLight: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uProgress;
    uniform float uIntensity;
    uniform float uPointerStrength;
    uniform float uSpeed;
    uniform float uIsLight;
    varying vec2 vUv;

    // Pseudo-random hash
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // 2D Value Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    // Fractal Brownian Motion
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;

      // Safe division
      float safeDiv = max(uPointerStrength, 0.0001);

      // Mouse interactive warp
      float distToMouse = distance(uv, uMouse);
      float mouseInfluence = smoothstep(0.5, 0.0, distToMouse) * uPointerStrength;
      
      // Wave deformation
      vec2 deformedUv = uv;
      float timeScale = uTime * uSpeed * 0.15;
      
      float progressAmp = max(uProgress, 0.05);
      deformedUv.y += fbm(uv * 4.0 + timeScale) * 0.12 * uIntensity * progressAmp;
      deformedUv.x += fbm(uv * 3.0 - timeScale * 0.8) * 0.08 * uIntensity * progressAmp;
      
      // Apply mouse influence
      deformedUv += (uv - uMouse) * mouseInfluence * 0.08;

      // Create contour lines
      float gridVal1 = sin(deformedUv.y * 22.0);
      float gridVal2 = sin(deformedUv.x * 15.0 + deformedUv.y * 15.0);
      
      // Thin outline lines
      float line1 = smoothstep(0.96, 1.0, gridVal1);
      float line2 = smoothstep(0.97, 1.0, gridVal2);

      // Revised Dark Earthy Topographic Palette
      vec3 colorDeepForest  = vec3(0.12, 0.14, 0.11); // #1F241C
      vec3 colorMutedOlive  = vec3(0.54, 0.58, 0.42); // #8A956B
      vec3 colorMossGreen   = vec3(0.27, 0.29, 0.22); // #444B39
      vec3 colorWarmSand    = vec3(0.79, 0.73, 0.56); // #C9B990
      
      // Dynamic color mapping
      float fbmMix = fbm(deformedUv * 6.0 + uTime * 0.05);
      vec3 waveColor = mix(colorMossGreen, colorMutedOlive, fbmMix);
      waveColor = mix(waveColor, colorWarmSand, line2 * 0.25);
      
      // Restrained topographic energy - reduced brightness and alpha
      float alpha = (line1 * 0.12 + line2 * 0.08) * uIntensity;
      
      // Make Wave more visible along the left side (x near 0.0) and edges
      float edgeFactor = smoothstep(0.4, 0.0, uv.x) + smoothstep(0.8, 1.0, uv.x) + smoothstep(0.8, 1.0, uv.y) + smoothstep(0.2, 0.0, uv.y);
      edgeFactor = clamp(edgeFactor, 0.1, 1.0);
      
      // Keep central-right region (where auth form sits) calmer and darker for readability
      float formSettleFactor = smoothstep(0.4, 0.9, uv.x);
      alpha *= mix(1.0, 0.15, formSettleFactor * uProgress);
      
      alpha *= edgeFactor;

      // Soft ambient bloom in dark green
      alpha += (1.0 - uv.y) * 0.03 * uProgress;

      gl_FragColor = vec4(waveColor, alpha);
    }
  `
};

type ShaderMeshProps = {
  speed: number;
  intensity: number;
  progress: number;
  pointerStrength: number;
  theme: "light" | "dark";
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  isTouch: boolean;
  reducedMotion: boolean;
  paused: boolean;
  controllerRef?: React.MutableRefObject<WaveParams>;
};

const ShaderMesh: React.FC<ShaderMeshProps> = ({
  speed,
  intensity,
  progress,
  pointerStrength,
  theme,
  pointerRef,
  isTouch,
  reducedMotion,
  paused,
  controllerRef,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Initialize the custom shader material
  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(WaveShaderMaterial.uniforms),
      vertexShader: WaveShaderMaterial.vertexShader,
      fragmentShader: WaveShaderMaterial.fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
  }, []);

  // Sync static theme prop
  useEffect(() => {
    if (customMaterial) {
      customMaterial.uniforms.uIsLight.value = theme === 'light' ? 1.0 : 0.0;
    }
  }, [theme, customMaterial]);

  // Clean up WebGL resources
  useEffect(() => {
    return () => {
      customMaterial.dispose();
    };
  }, [customMaterial]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const uniforms = materialRef.current.uniforms;

    // Resolve parameter sources (ref vs static prop)
    const activeSpeed = controllerRef?.current ? controllerRef.current.speed : speed;
    const activeIntensity = controllerRef?.current ? controllerRef.current.intensity : intensity;
    const activeProgress = controllerRef?.current ? controllerRef.current.progress : progress;
    const activePointerStrength = controllerRef?.current ? controllerRef.current.pointerStrength : pointerStrength;

    // Smoothly interpolate progress & configuration uniforms
    uniforms.uProgress.value = THREE.MathUtils.lerp(uniforms.uProgress.value, activeProgress, 0.05);
    uniforms.uIntensity.value = THREE.MathUtils.lerp(uniforms.uIntensity.value, activeIntensity, 0.05);
    uniforms.uSpeed.value = THREE.MathUtils.lerp(uniforms.uSpeed.value, activeSpeed, 0.05);

    // Update time uniform if animation isn't paused
    if (!paused && !reducedMotion) {
      uniforms.uTime.value = state.clock.getElapsedTime();
    }

    // Process pointer vectors
    const currentPtStrength = isTouch ? 0 : activePointerStrength;
    uniforms.uPointerStrength.value = THREE.MathUtils.lerp(uniforms.uPointerStrength.value, currentPtStrength, 0.05);

    if (!isTouch) {
      const targetMouseX = pointerRef.current.x;
      const targetMouseY = pointerRef.current.y;
      uniforms.uMouse.value.x = THREE.MathUtils.lerp(uniforms.uMouse.value.x, targetMouseX, 0.08);
      uniforms.uMouse.value.y = THREE.MathUtils.lerp(uniforms.uMouse.value.y, targetMouseY, 0.08);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <primitive object={customMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
};

export const Wave: React.FC<WaveProps> = ({
  speed = 0.5,
  intensity = 1.0,
  progress = 0.0,
  pointerStrength = 0.5,
  theme = "light",
  disablePointerTracking = false,
  paused = false,
  dpr = 1.5,
  className = "",
  style = {},
  controllerRef,
}) => {
  const [containerRef, isVisible] = useElementVisibility<HTMLDivElement>();
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const [isTouch, setIsTouch] = useState(false);
  const reducedMotion = useReducedMotion();

  // Detect touch capability
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
  }, []);

  // Track pointer movements
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disablePointerTracking || isTouch || !isVisible) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    pointerRef.current = { x, y };
  };

  const finalDpr = useMemo(() => {
    if (Array.isArray(dpr)) {
      return [Math.min(dpr[0], 1.5), Math.min(dpr[1], 1.5)] as [number, number];
    }
    return Math.min(dpr, 1.5);
  }, [dpr]);

  if (!isVisible) {
    return <div ref={containerRef} className={`${className} opacity-0`} style={style} />;
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ ...style }}
    >
      <Canvas
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance",
          depth: false,
          stencil: false,
        }}
        dpr={finalDpr}
        camera={{ position: [0, 0, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ShaderMesh
          speed={speed}
          intensity={intensity}
          progress={progress}
          pointerStrength={pointerStrength}
          theme={theme}
          pointerRef={pointerRef}
          isTouch={isTouch}
          reducedMotion={reducedMotion}
          paused={paused}
          controllerRef={controllerRef}
        />
      </Canvas>
    </div>
  );
};

export default Wave;

