"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function ConnectWallet() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, isPending, status } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected)
    return (
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white"
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
      >
        {isPending ? "Bağlanılıyor..." : "Cüzdanı Bağla (Base)"}
      </button>
    );

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      <button className="px-3 py-1 rounded bg-gray-700 text-white" onClick={() => disconnect()}>Çıkış</button>
    </div>
  );
}
