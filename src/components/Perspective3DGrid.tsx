import React, { useEffect, useState } from 'react';

interface Perspective3DGridProps {
  isDark: boolean;
}

export const Perspective3DGrid: React.FC<Perspective3DGridProps> = ({ isDark }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setTilt({ x: nx * 14, y: ny * 8 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden scene-3d-viewport"
    >
      {/* Back Structural Blueprint Wall */}
      <div
        className="absolute inset-0 grid-back-wall"
        style={{
          transform: `translate3d(${tilt.x * -0.4}px, ${tilt.y * -0.4}px, 0)`,
        }}
      />

      {/* Top 3D Perspective Ceiling Plane */}
      <div
        className="absolute -top-[35%] left-[-25%] right-[-25%] h-[75%] grid-3d-ceiling"
        style={{
          transform: `rotateX(-68deg) translateZ(-170px) translateX(${tilt.x * 0.6}px) scale(2.1)`,
        }}
      />

      {/* Bottom 3D Perspective Architectural Floor Plane */}
      <div
        className="absolute -bottom-[30%] left-[-25%] right-[-25%] h-[85%] grid-3d-floor"
        style={{
          transform: `rotateX(66deg) translateZ(-90px) translateX(${tilt.x}px) scale(2.2)`,
        }}
      />

      {/* 3D Horizon Glow & Depth Fog Scrim so foreground cards have 100% WCAG AA contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 42%, rgba(9, 10, 15, 0.35) 0%, rgba(9, 10, 15, 0.86) 65%, rgba(9, 10, 15, 0.96) 100%)'
            : 'radial-gradient(circle at 50% 42%, rgba(236, 234, 226, 0.35) 0%, rgba(236, 234, 226, 0.85) 65%, rgba(236, 234, 226, 0.95) 100%)',
        }}
      />

      {/* Horizon Isometric Axis Line */}
      <div
        className={`absolute left-0 right-0 top-[42%] h-[1px] ${
          isDark ? 'bg-[#B8FF01]/30' : 'bg-zinc-950/20'
        }`}
        style={{
          transform: `translateY(${tilt.y * 0.8}px)`,
        }}
      />

      {/* Architectural Corner Crosshairs */}
      <div className="hidden lg:block absolute top-24 left-6 font-mono text-[10px] tracking-widest opacity-50 select-none">
        + AXIS X:3D // Z-DEPTH: 850PX
      </div>
      <div className="hidden lg:block absolute top-24 right-6 font-mono text-[10px] tracking-widest opacity-50 select-none">
        VAN313 // SPATIAL GRID ACTIVE +
      </div>
    </div>
  );
};
