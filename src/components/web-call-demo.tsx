"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HappyRobotVoiceClient } from "@happyrobot-ai/sdk/voice";
import type { VoiceConnection } from "@happyrobot-ai/sdk/voice";

type CallStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error";

export function WebCallDemo() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

  const connectionRef = useRef<VoiceConnection | null>(null);

  useEffect(() => {
    fetch("/api/web-call/status")
      .then((r) => r.json())
      .then((data: { configured: boolean }) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  const startCall = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    setRoomName(null);
    setRunId(null);

    try {
      const res = await fetch("/api/web-call/token", { method: "POST" });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "Failed to get voice token",
        );
      }

      const { url, token, room_name, run_id } = body as {
        url: string;
        token: string;
        room_name: string;
        run_id: string;
      };

      setRoomName(room_name);
      setRunId(run_id);

      const voiceClient = new HappyRobotVoiceClient({ url, token });
      const connection = await voiceClient.connect({
        onConnected: () => {
          setStatus("connected");
        },
        onDisconnected: () => {
          setStatus("idle");
          setIsMuted(false);
          connectionRef.current = null;
        },
        onAgentConnected: () => {
          setStatus("connected");
        },
        onReconnecting: () => {
          setStatus("reconnecting");
        },
        onReconnected: () => {
          setStatus("connected");
        },
        onError: (err) => {
          setError(err.message);
          setStatus("error");
        },
      });

      connectionRef.current = connection;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connection failed";
      setError(message);
      setStatus("error");
    }
  }, []);

  const endCall = useCallback(async () => {
    if (!connectionRef.current) return;

    try {
      await connectionRef.current.disconnect();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to end call",
      );
    }

    connectionRef.current = null;
    setStatus("idle");
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(async () => {
    if (!connectionRef.current) return;

    try {
      if (isMuted) {
        await connectionRef.current.unmute();
        setIsMuted(false);
      } else {
        await connectionRef.current.mute();
        setIsMuted(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle mute",
      );
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      void connectionRef.current?.disconnect();
    };
  }, []);

  if (configured === null) {
    return (
      <p className="mt-6 text-sm text-slate-500">Checking web call setup…</p>
    );
  }

  if (!configured) {
    return (
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Set{" "}
        <code className="font-mono">HAPPYROBOT_API_KEY</code> and{" "}
        <code className="font-mono">HAPPYROBOT_WORKFLOW_ID</code> in your
        environment to start calls from this page.
      </div>
    );
  }

  const isActive = status === "connected" || status === "reconnecting";

  return (
    <div className="mt-6 space-y-4">
      {(roomName || runId) && (
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {roomName && (
            <p>
              <span className="font-medium">Room:</span>{" "}
              <span className="font-mono">{roomName}</span>
            </p>
          )}
          {runId && (
            <p className="mt-1">
              <span className="font-medium">Run:</span>{" "}
              <span className="font-mono">{runId.slice(0, 8)}…</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!isActive && status !== "connecting" && (
          <button
            type="button"
            onClick={() => void startCall()}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Start Call
          </button>
        )}

        {status === "connecting" && (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2 text-sm font-medium text-white"
          >
            Connecting…
          </button>
        )}

        {isActive && (
          <>
            <button
              type="button"
              onClick={() => void toggleMute()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => void endCall()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              End Call
            </button>
          </>
        )}
      </div>

      {status === "reconnecting" && (
        <p className="text-sm text-slate-600">Reconnecting…</p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Your browser will request microphone access. Use HTTPS in production.
      </p>
    </div>
  );
}
