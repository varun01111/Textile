import { describe, expect, it } from "vitest";

import { isAudioUploadAllowed, validateAudioUpload } from "@/lib/validation/conversation";

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
