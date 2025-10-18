"use client";

import { useState, useEffect } from "react";

export default function EnvironmentDebug() {
  const [envInfo, setEnvInfo] = useState<any>(null);

  useEffect(() => {
    setEnvInfo({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      windowOrigin:
        typeof window !== "undefined" ? window.location.origin : "N/A",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "N/A",
      timestamp: new Date().toISOString(),
    });
  }, []);

  if (!envInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs">
      <h3 className="font-bold mb-2">Environment Debug Info</h3>
      <div className="space-y-1">
        <div>
          <strong>NEXT_PUBLIC_SITE_URL:</strong>{" "}
          <span
            className={
              envInfo.NEXT_PUBLIC_SITE_URL ? "text-green-400" : "text-red-400"
            }
          >
            {envInfo.NEXT_PUBLIC_SITE_URL || "undefined"}
          </span>
        </div>
        <div>
          <strong>Window Origin:</strong> {envInfo.windowOrigin}
        </div>
        <div>
          <strong>Final Redirect URL:</strong>{" "}
          <span className="text-blue-400">
            {envInfo.NEXT_PUBLIC_SITE_URL || envInfo.windowOrigin}/dashboard
          </span>
        </div>
        <div>
          <strong>Environment:</strong>{" "}
          <span className="text-yellow-400">
            {envInfo.windowOrigin.includes("localhost")
              ? "Development"
              : "Production"}
          </span>
        </div>
      </div>
      <div className="mt-2 text-gray-400">
        <small>Remove this component after debugging</small>
      </div>
    </div>
  );
}
