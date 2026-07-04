import { describe, expect, it } from "vitest";

import {
  isAudioUploadAllowed,
  normalizeMimeType,
  validateAudioUpload,
} from "@/lib/validation/conversation";

describe("audio upload validation", () => {
  it("allows supported audio uploads", () => {
    expect(
      isAudioUploadAllowed({
        name: "client-call.mp3",
        type: "audio/mpeg",
        size: 10 * 1024 * 1024,
      }),
    ).toBe(true);
  });

  it("allows browser-recorded webm audio with codecs in the MIME type", () => {
    expect(
      isAudioUploadAllowed({
        name: "conversation.webm",
        type: "audio/webm;codecs=opus",
        size: 512_000,
      }),
    ).toBe(true);

    expect(() =>
      validateAudioUpload({
        name: "conversation.webm",
        type: "audio/webm;codecs=opus",
        size: 512_000,
      }),
    ).not.toThrow();
  });

  it("normalizes MIME types before storing or validating them", () => {
    expect(normalizeMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(normalizeMimeType(" VIDEO/WEBM ; codecs=vp8 ")).toBe("video/webm");
  });

  it("rejects unsupported extensions", () => {
    expect(() =>
      validateAudioUpload({
        name: "notes.txt",
        type: "text/plain",
        size: 100,
      }),
    ).toThrow("Unsupported file type");
  });
});
