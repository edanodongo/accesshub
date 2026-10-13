"use client";

import { useState, useTransition } from "react";
import { runProbe } from "@/app/actions/probe";
import Badge from "@/components/Badge";
import { PROBES } from "@/lib/probes";
import type { ProbeResult } from "@/lib/types";

export default function ProbePanel({ permissions }: { permissions: string[] }) {
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [pending, startTransition] = useTransition();

  function run(key: string) {
    startTransition(async () => {
      const result = await runProbe(key);
      setResults((prev) => ({ ...prev, [key]: result }));
    });
  }

  function runAll() {
    startTransition(async () => {
      for (const probe of PROBES) {
        const result = await runProbe(probe.key);
        setResults((prev) => ({ ...prev, [probe.key]: result }));
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">API probes</h2>
        <button
          onClick={runAll}
          disabled={pending}
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Running..." : "Run all"}
        </button>
      </div>

      <table className="mt-3 w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-left text-sm">
        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Endpoint</th>
            <th className="px-4 py-3">UI predicts</th>
            <th className="px-4 py-3">Server says</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {PROBES.map((probe) => {
            const expected = probe.permission === null || permissions.includes(probe.permission);
            const result = results[probe.key];
            const passed = result && result.status !== 0 && result.status !== 401 && result.status !== 403;

            return (
              <tr key={probe.key} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{probe.label}</p>
                  <p className="font-mono text-xs text-gray-500">{probe.method} {probe.path}</p>
                  <p className="text-xs text-gray-400">needs: {probe.permission ?? "login only"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={expected ? "green" : "red"}>{expected ? "allow" : "deny"}</Badge>
                </td>
                <td className="px-4 py-3">
                  {result ? (
                    <div>
                      <Badge tone={passed ? "green" : "red"}>
                        {result.status} {passed ? "allowed" : "denied"}
                      </Badge>{" "}
                      <span className="text-xs">
                        {passed === expected ? "✅ matches" : "⚠️ MISMATCH"}
                      </span>
                      <p className="mt-1 break-all font-mono text-xs text-gray-500">{result.body}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">not run</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => run(probe.key)}
                    disabled={pending}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
                  >
                    Run
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}