"use client";

import { Pause, Play, Square, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "paused";
type WakeLockSentinelLike = {
  release: () => Promise<void>;
};

export function AudioRecorder({
  onRecorded,
}: {
  onRecorded: (file: File) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef<RecorderState>("idle");
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      void releaseWakeLock();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    async function handleVisibilityChange() {
      const recorder = mediaRecorderRef.current;
      if (!recorder || stateRef.current === "idle") {
        return;
      }

      if (document.visibilityState !== "visible") {
        await releaseWakeLock();
        stopTimer();
        recorder.stop();
        setState("idle");
        setError(
          "Phone browsers stop reliable recording when the app goes into the background or the screen locks. Keep this page open and the screen awake, or use your phone's recorder app and upload the file after the meeting.",
        );
        return;
      }

      await requestWakeLock();
    }

    const onVisibilityChange = () => {
      void handleVisibilityChange();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function startTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function requestWakeLock() {
    if (typeof window === "undefined" || document.visibilityState !== "visible") {
      return;
    }

    const wakeLockApi = (
      navigator as Navigator & {
        wakeLock?: {
          request: (type: "screen") => Promise<WakeLockSentinelLike>;
        };
      }
    ).wakeLock;

    if (!wakeLockApi || wakeLockRef.current) {
      return;
    }

    try {
      wakeLockRef.current = await wakeLockApi.request("screen");
    } catch {
      wakeLockRef.current = null;
    }
  }

  async function releaseWakeLock() {
    if (!wakeLockRef.current) {
      return;
    }

    const wakeLock = wakeLockRef.current;
    wakeLockRef.current = null;
    await wakeLock.release().catch(() => undefined);
  }

  function formatElapsed() {
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  async function handleStart() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
        ].find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      setElapsedSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `conversation-${Date.now()}.${extension}`, {
          type: recorder.mimeType || "audio/webm",
        });
        if (file.size > 0) {
          onRecorded(file);
        }
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setState("recording");
      startTimer();
      await requestWakeLock();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Microphone access could not be started.",
      );
    }
  }

  function handlePauseResume() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (state === "recording") {
      recorder.pause();
      setState("paused");
      stopTimer();
      void releaseWakeLock();
      return;
    }

    recorder.resume();
    setState("recording");
    startTimer();
    void requestWakeLock();
  }

  function handleStop() {
    mediaRecorderRef.current?.stop();
    stopTimer();
    setState("idle");
    void releaseWakeLock();
  }

  return (
    <div className="record-panel rounded-[1.75rem] p-5 sm:rounded-[2rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#fff4e7]">In-room recorder</p>
          <p className="mt-1 text-sm text-[#e4d4c3]">
            Recording is always visible and stops only when you tell it to.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#f4d9c4]">
            On phones, keep this page open and the screen awake during the full meeting.
          </p>
          <p className="mt-2 text-xs text-[#f0dbc8]">
            Supported phones will also try to keep the screen awake while recording.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              state === "recording" ? "animate-pulse bg-rose-500" : "bg-stone-400"
            }`}
          />
          <span className="text-sm font-medium text-[#fff4e7]">{formatElapsed()}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={state !== "idle"}
          className="primary-btn w-full px-4 py-2 sm:w-auto"
        >
          <Mic className="h-4 w-4" />
          Start
        </button>
        <button
          type="button"
          onClick={handlePauseResume}
          disabled={state === "idle"}
          className="secondary-btn w-full border-white/14 bg-white/10 px-4 py-2 text-[#fff4e7] sm:w-auto"
        >
          {state === "paused" ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={state === "idle"}
          className="danger-btn w-full border-rose-300/30 bg-rose-200/10 px-4 py-2 text-rose-100 sm:w-auto"
        >
          <Square className="h-4 w-4" />
          Stop & save
        </button>
      </div>
      {error ? (
        <p className="error-notice mt-4 bg-rose-200/90 text-rose-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
