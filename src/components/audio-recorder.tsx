"use client";

import { Pause, Play, Square, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "paused";

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

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
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
        onRecorded(file);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setState("recording");
      startTimer();
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
      return;
    }

    recorder.resume();
    setState("recording");
    startTimer();
  }

  function handleStop() {
    mediaRecorderRef.current?.stop();
    stopTimer();
    setState("idle");
  }

  return (
    <div className="record-panel rounded-[1.75rem] p-5 sm:rounded-[2rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#fff4e7]">In-room recorder</p>
          <p className="mt-1 text-sm text-[#e4d4c3]">
            Recording is always visible and stops only when you tell it to.
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
