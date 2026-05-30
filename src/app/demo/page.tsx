"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const workflowId = process.env.NEXT_PUBLIC_HAPPYROBOT_WORKFLOW_ID;
  const [status, setStatus] = useState<string>("");

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
          Launch inbound carrier sales calls from the HappyRobot platform using
          the Web Call trigger. Configure your workflow ID in environment
          variables, then start a call from the HappyRobot builder.
        </p>

        {workflowId ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Workflow ID:</span> {workflowId}
            </p>
            <p className="mt-2">
              Open the HappyRobot platform, navigate to this workflow, and use
              the Web Call trigger to start a demo call.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Set <code className="font-mono">NEXT_PUBLIC_HAPPYROBOT_WORKFLOW_ID</code>{" "}
            in your environment to display workflow details here.
          </div>
        )}

        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Demo script</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Use mock MC number <strong>123456</strong></li>
            <li>Ask for Chicago to Dallas Dry Van load</li>
            <li>Counter-offer once below list rate</li>
            <li>Accept the agent counter to trigger transfer message</li>
          </ol>
        </div>

        <button
          type="button"
          onClick={() =>
            setStatus(
              "Web calls are initiated from the HappyRobot platform Web Call trigger.",
            )
          }
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Check setup
        </button>
        {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
      </div>
    </div>
  );
}
