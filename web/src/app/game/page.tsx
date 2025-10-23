"use client";
import dynamic from "next/dynamic";
const AirHockeyGame = dynamic(() => import("@/components/game/AirHockeyGame"), { ssr: false });

export default function GamePage() {
  return (
    <main className="p-8 space-y-4">
      <h2 className="text-2xl font-semibold">Oyun</h2>
      <p className="text-sm text-gray-500">Sol paddleyi fareyle hareket ettir. İlk prototip: tek oyuncu vs bilgisayar.</p>
      <div className="flex justify-center">
        <AirHockeyGame />
      </div>
    </main>
  );
}
