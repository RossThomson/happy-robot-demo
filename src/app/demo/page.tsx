import Link from "next/link";

import { WebCallDemo } from "@/components/web-call-demo";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
          Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          Web Call Demo
        </h1>
        <p className="mt-2 text-slate-600">
          Start inbound carrier sales calls from this page. The app requests a
          voice token from Happy Robot and connects your browser to the workflow
          Web Call trigger.
        </p>

        <WebCallDemo />

        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Demo script</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Click Start Call and allow microphone access</li>
            <li>Use mock MC number <strong>123456</strong></li>
            <li>Ask for Chicago to Dallas Dry Van load</li>
            <li>Counter-offer once below list rate</li>
            <li>Accept the agent counter to trigger transfer message</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
