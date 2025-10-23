"use client";
import { useEffect, useRef } from "react";

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let req = 0;
    let x = 50, y = 50, vx = 2, vy = 2;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0ea5e9"; // top
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      x += vx; y += vy;
      if (x < 10 || x > canvas.width - 10) vx *= -1;
      if (y < 10 || y > canvas.height - 10) vy *= -1;
      req = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(req);
  }, []);

  return (
    <main className="p-8 space-y-4">
      <h2 className="text-2xl font-semibold">Oyun</h2>
      <canvas ref={canvasRef} width={640} height={360} className="border border-gray-700 rounded" />
      <p className="text-sm text-gray-500">Basit bir placeholder animasyonu. Phaser eklenecek.</p>
    </main>
  );
}
