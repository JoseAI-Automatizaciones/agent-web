"use client";

import dynamic from "next/dynamic";

const NeuralNetworkGraph = dynamic(
  () => import("@/components/memory/NeuralNetworkGraph"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-[#06060B]">
      <div className="w-full h-screen">
        <NeuralNetworkGraph />
      </div>
    </main>
  );
}
