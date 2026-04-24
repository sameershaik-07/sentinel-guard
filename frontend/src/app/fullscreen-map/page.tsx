import React, { Suspense } from "react";
import FullscreenMapClient from "../../components/FullscreenMapClient";

export default function FullscreenMapPage() {
  return (
    <div className="w-full h-screen bg-[#01030a] p-6">
      <div className="max-w-full h-full">
        <Suspense fallback={<div className="p-8">Loading fullscreen map…</div>}>
          <FullscreenMapClient />
        </Suspense>
      </div>
    </div>
  );
}
