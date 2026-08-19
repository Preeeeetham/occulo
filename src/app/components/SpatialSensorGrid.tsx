import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function SpatialSensorGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create 3D Spatial Grid Nodes
    const cols = Math.floor(width / 45);
    const rows = Math.floor(height / 45);
    const nodes: { x: number; y: number; origX: number; origY: number; size: number }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5) * (width / cols);
        const y = (r + 0.5) * (height / rows);
        nodes.push({ x, y, origX: x, origY: y, size: Math.random() * 1.5 + 1 });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const mx = springX.get();
      const my = springY.get();

      // Draw subtle grid connections & dynamic vertex displacement
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = mx - n.origX;
        const dy = my - n.origY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;

        if (dist < maxDist) {
          const force = (1 - dist / maxDist) * 35;
          const angle = Math.atan2(dy, dx);
          n.x = n.origX - Math.cos(angle) * force;
          n.y = n.origY - Math.sin(angle) * force;
        } else {
          n.x += (n.origX - n.x) * 0.1;
          n.y += (n.origY - n.y) * 0.1;
        }

        // Draw Node Point
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = dist < maxDist ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.25)";
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const ndx = n.x - n2.x;
          const ndy = n.y - n2.y;
          const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (nDist < 60) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - nDist / 60)})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [springX, springY]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    />
  );
}
