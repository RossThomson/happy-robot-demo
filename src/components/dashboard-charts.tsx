"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetricsData = {
  summary: {
    total_calls: number;
    booked_calls: number;
    conversion_rate: number;
    avg_negotiation_rounds: number;
    avg_rate_delta: number;
  };
  outcome_counts: Record<string, number>;
  sentiment_counts: Record<string, number>;
  calls_over_time: { date: string; count: number }[];
  top_lanes: { lane: string; count: number }[];
  recent_calls: {
    id: string;
    call_id: string | null;
    mc_number: string | null;
    load_id: string | null;
    initial_rate: number | null;
    final_rate: number | null;
    negotiation_rounds: number;
    outcome: string;
    sentiment: string;
    transcript_summary: string | null;
    created_at: string;
  }[];
};

const SENTIMENT_COLORS = ["#16a34a", "#64748b", "#dc2626"];

function toChartData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function DashboardCharts({ data }: { data: MetricsData }) {
  const outcomeData = toChartData(data.outcome_counts);
  const sentimentData = toChartData(data.sentiment_counts);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Calls"
          value={String(data.summary.total_calls)}
        />
        <MetricCard
          label="Conversion Rate"
          value={`${(data.summary.conversion_rate * 100).toFixed(1)}%`}
        />
        <MetricCard
          label="Avg Negotiation Rounds"
          value={data.summary.avg_negotiation_rounds.toFixed(1)}
        />
        <MetricCard
          label="Avg Rate Delta"
          value={`$${data.summary.avg_rate_delta.toFixed(0)}`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Calls by Outcome">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={outcomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sentiment Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {sentimentData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Calls Over Time">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.calls_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Lanes">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.top_lanes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="lane" width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Recent Calls
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">MC</th>
                <th className="px-3 py-2">Load</th>
                <th className="px-3 py-2">Outcome</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2">Final Rate</th>
                <th className="px-3 py-2">Rounds</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No calls recorded yet. Run a web call demo to populate metrics.
                  </td>
                </tr>
              ) : (
                data.recent_calls.map((call) => (
                  <tr key={call.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(call.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{call.mc_number ?? "—"}</td>
                    <td className="px-3 py-2">{call.load_id ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">{call.outcome}</td>
                    <td className="px-3 py-2 capitalize">{call.sentiment}</td>
                    <td className="px-3 py-2">
                      {call.final_rate !== null ? `$${call.final_rate}` : "—"}
                    </td>
                    <td className="px-3 py-2">{call.negotiation_rounds}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
