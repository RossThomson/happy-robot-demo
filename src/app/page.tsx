import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            HappyRobot FDE Take-Home
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900">
            Inbound Carrier Sales
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Proof of concept for Acme Logistics — automate inbound carrier calls
            with MC verification, load matching, price negotiation, and custom
            metrics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
          >
            <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
            <p className="mt-2 text-sm text-slate-600">
              Custom metrics: conversion rate, sentiment, outcomes, and recent
              calls.
            </p>
          </Link>
          <Link
            href="/demo"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
          >
            <h2 className="text-lg font-semibold text-slate-900">Web Call Demo</h2>
            <p className="mt-2 text-sm text-slate-600">
              Instructions for launching inbound carrier calls via HappyRobot.
            </p>
          </Link>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Test MC Numbers</h2>
          <p className="mt-2 text-sm text-slate-600">
            FMCSA API access is geo-locked outside the US. Use these mock MC
            numbers for demo when FMCSA is unavailable:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              <strong>123456</strong>, <strong>789012</strong>,{" "}
              <strong>345678</strong>, <strong>901234</strong> — eligible
            </li>
            <li>
              <strong>567890</strong>, <strong>111111</strong> — ineligible
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">API Endpoints</h2>
          <p className="mt-2 text-sm text-slate-600">
            All endpoints except <code>/api/health</code> require the{" "}
            <code>x-api-key</code> header.
          </p>
          <ul className="mt-3 space-y-1 font-mono text-sm text-slate-700">
            <li>GET /api/health</li>
            <li>GET /api/loads</li>
            <li>GET /api/loads/[id]</li>
            <li>POST /api/verify-mc</li>
            <li>POST /api/negotiate</li>
            <li>POST /api/calls</li>
            <li>GET /api/metrics</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
