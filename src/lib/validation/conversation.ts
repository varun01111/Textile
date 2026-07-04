import { z } from "zod";

import { conversationSourceLanguages, conversationTypes } from "@/lib/types";
import { aiAnalysisSchema } from "@/lib/validation/ai-analysis";

export const maxAudioUploadBytes = 200 * 1024 * 1024;

const allowedExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];
const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "video/mp4",
  "audio/webm",
]);

export const captureMetadataSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required."),
  meetingTitle: z.string().trim().min(1, "Meeting title is required."),
  meetingDate: z.string().trim().min(1, "Meeting date is required."),
  conversationType: z.enum(conversationTypes),
  sourceLanguage: z.enum(conversationSourceLanguages).default("gujarati"),
  consentAcknowledged: z.boolean().refine((value) => value, {
    message: "You must confirm that recording is consent-based.",
  }),
});

export const reviewPayloadSchema = z.object({
  analysis: aiAnalysisSchema,
  tasks: z.array(
    z.object({
      id: z.string().uuid().optional(),
      taskText: z.string().trim().min(1),
      dueDate: z.string().trim().nullable().default(null),
      reminderAt: z.string().trim().nullable().default(null),
      status: z.enum(["pending", "completed"]).default("pending"),
    }),
  ),
});

export function isAudioUploadAllowed(file: {
  name: string;
  type?: string;
  size: number;
}) {
  const fileName = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) =>
    fileName.endsWith(extension),
  );
  const hasAllowedMime =
    !file.type || file.type.length === 0 ? true : allowedMimeTypes.has(file.type);

  return hasAllowedExtension && hasAllowedMime && file.size <= maxAudioUploadBytes;
}

export function validateAudioUpload(file: {
  name: string;
  type?: string;
  size: number;
}) {
  if (!allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    throw new Error("Unsupported file type. Use MP3, WAV, M4A, MP4, or WebM.");
  }

  if (file.type && !allowedMimeTypes.has(file.type)) {
    throw new Error("Unsupported media MIME type.");
  }

  if (file.size > maxAudioUploadBytes) {
    throw new Error("The selected file is too large for the MVP upload limit.");
  }
}
