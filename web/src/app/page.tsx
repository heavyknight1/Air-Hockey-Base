import Link from "next/link";
import ConnectWallet from "@/components/ConnectWallet";

export default function Home() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Air Hockey Base</h1>
      <p>Base ağı üzerinde basit bir masa buz hokeyi oyunu.</p>
      <ConnectWallet />
      <div>
        <Link className="text-blue-600 underline" href="/game">Oyunu Başlat</Link>
      </div>
    </main>
  );
}
