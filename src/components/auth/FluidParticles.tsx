import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FluidParticlesProps {
  particleDensity?: number;
  particleSize?: number;
  particleColor?: string;
  activeColor?: string;
  maxBlastRadius?: number;
  hoverDelay?: number;
  interactionDistance?: number;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const FluidParticles: React.FC<FluidParticlesProps> = ({
  particleDensity = 180,
  particleSize = 0.8,
  particleColor = "rgba(111,143,85,0.20)",
  activeColor = "rgba(158,183,124,0.75)",
  maxBlastRadius = 180,
  hoverDelay = 120, // delay or easing divisor for mouse position tracking
  interactionDistance = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  
  // Mouse position tracking with easing/lag support
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
  });

  // Ripple state tracking
  const rippleRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    radius: number;
    speed: number;
  }>({
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    speed: 3.5,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Detect mobile viewport (width < 768px)
    const isMobile = window.innerWidth < 768;
    
    // Lower density on mobile
    const density = isMobile ? Math.floor(particleDensity * 0.45) : particleDensity;

    // Handle screen resize
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    // Initialize particles across the canvas screen
    const initParticles = () => {
      particles = [];
      const cols = Math.sqrt(density * (canvas.width / canvas.height));
      const rows = density / cols;
      
      const stepX = canvas.width / (cols + 1);
      const stepY = canvas.height / (rows + 1);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Calculate grid anchor point with some random deviation
          const baseX = (i + 1) * stepX + (Math.random() - 0.5) * (stepX * 0.2);
          const baseY = (j + 1) * stepY + (Math.random() - 0.5) * (stepY * 0.2);
          
          particles.push({
            x: baseX,
            y: baseY,
            baseX,
            baseY,
            vx: 0,
            vy: 0,
            size: particleSize * (0.8 + Math.random() * 0.4),
            alpha: 0.15 + Math.random() * 0.2,
            color: particleColor,
          });
        }
      }
    };

    // Listeners for mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -9999;
      mouseRef.current.targetY = -9999;
    };

    // Soft green ripple blast on click (Disabled on mobile)
    const handleMouseClick = (e: MouseEvent) => {
      if (isMobile) return;
      
      rippleRef.current = {
        active: true,
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        speed: 4.5,
      };
    };

    // Setup event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    if (!isMobile) {
      window.addEventListener('click', handleMouseClick);
    }

    // Set initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();

    // Main animation loop
    const render = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse position update based on hoverDelay
      const mouse = mouseRef.current;
      if (mouse.targetX !== -9999) {
        // Linear interpolation/easing using hoverDelay divisor
        const lerpFactor = 1000 / (hoverDelay + 1000); 
        mouse.x += (mouse.targetX - mouse.x) * Math.min(1, lerpFactor);
        mouse.y += (mouse.targetY - mouse.y) * Math.min(1, lerpFactor);
      } else {
        mouse.x = -9999;
        mouse.y = -9999;
      }

      // Update click ripple radius
      const ripple = rippleRef.current;
      if (ripple.active) {
        ripple.radius += ripple.speed;
        if (ripple.radius > maxBlastRadius) {
          ripple.active = false;
        }
      }

      // Update and draw particles
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // 1. Mouse repulsion physics (if hover animations are not disabled)
        if (!reducedMotion && mouse.x !== -9999) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < interactionDistance) {
            const force = (interactionDistance - dist) / interactionDistance;
            const angle = Math.atan2(dy, dx);
            // Move particles away from the cursor gently
            p.vx -= Math.cos(angle) * force * 0.45;
            p.vy -= Math.sin(angle) * force * 0.45;
          }
        }

        // 2. Ripple blast physics (if active and not reduced motion)
        if (!reducedMotion && ripple.active) {
          const rdx = p.x - ripple.x;
          const rdy = p.y - ripple.y;
          const rdist = Math.hypot(rdx, rdy);

          // If the particle is hit by the expanding wave front
          if (rdist < ripple.radius && rdist > ripple.radius - 25) {
            const force = (25 - (ripple.radius - rdist)) / 25;
            const angle = Math.atan2(rdy, rdx);
            
            p.vx += Math.cos(angle) * force * 2.8;
            p.vy += Math.sin(angle) * force * 2.8;
            p.color = "rgba(126,168,94,0.72)"; // Custom green blast color
          } else {
            // Decay color back to default color
            p.color = particleColor;
          }
        } else {
          p.color = particleColor;
        }

        // 3. Anchor attraction physics (pull back to grid)
        if (!reducedMotion) {
          p.vx += (p.baseX - p.x) * 0.025;
          p.vy += (p.baseY - p.y) * 0.025;
          
          // Friction damping
          p.vx *= 0.93;
          p.vy *= 0.93;

          // Update position
          p.x += p.vx;
          p.y += p.vy;

          // Tiny ambient drift (Brownian motion)
          p.x += (Math.random() - 0.5) * 0.08;
          p.y += (Math.random() - 0.5) * 0.08;
        } else {
          // If reduced motion is requested, strictly lock to anchor positions
          p.x = p.baseX;
          p.y = p.baseY;
        }

        // Determine particle rendering color/glow state
        let fillStyle = p.color;
        
        // Highlight particle if mouse is near
        if (!reducedMotion && mouse.x !== -9999) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          if (Math.hypot(dx, dy) < 45) {
            fillStyle = activeColor;
          }
        }

        // Draw outer glow halo ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.8, 0, Math.PI * 2);
        const glowColor = fillStyle.replace(/[\d.]+\)$/, '0.15)');
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Draw mid glow ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.0, 0, Math.PI * 2);
        const midGlowColor = fillStyle.replace(/[\d.]+\)$/, '0.38)');
        ctx.fillStyle = midGlowColor;
        ctx.fill();

        // Draw solid core particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up event listeners and animation frames
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    particleDensity,
    particleSize,
    particleColor,
    activeColor,
    maxBlastRadius,
    hoverDelay,
    interactionDistance,
    reducedMotion,
  ]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default FluidParticles;
