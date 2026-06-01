import Link from "next/link";

import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardResetButton } from "@/components/dashboard-reset-button";
import { getMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getMetrics();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">Acme Logistics</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Inbound Carrier Sales Dashboard
            </h1>
          </div>
          <div className="flex items-start gap-4">
            <DashboardResetButton />
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <DashboardCharts data={data} />
      </main>
    </div>
  );
}
