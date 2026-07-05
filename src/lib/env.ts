import { z } from "zod";

const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().trim().url().optional(),
});

const supabaseStorageSchema = publicSupabaseSchema.extend({
  SUPABASE_AUDIO_BUCKET: z.string().trim().min(1).default("audio-recordings"),
});

const supabaseAdminSchema = supabaseStorageSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
});

const aiSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().min(1),
  OPENROUTER_API_KEY_BACKUP: z.string().trim().min(1).optional(),
  OPENROUTER_MODEL: z.string().trim().min(1).default("google/gemini-2.5-flash"),
});

const transcriptionSchema = z.object({
  ASSEMBLYAI_API_KEY: z.string().trim().min(1),
  ASSEMBLYAI_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000),
});

const sheetsSchema = z.object({
  GOOGLE_SHEETS_CLIENT_EMAIL: z.string().trim().email(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().trim().min(1),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().trim().min(1),
  GOOGLE_SHEET_NAME: z.string().trim().min(1).default("Conversations"),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseSchema>;
export type SupabaseStorageEnv = z.infer<typeof supabaseStorageSchema>;
export type SupabaseAdminEnv = z.infer<typeof supabaseAdminSchema>;
export type AiEnv = z.infer<typeof aiSchema>;
export type TranscriptionEnv = z.infer<typeof transcriptionSchema>;
export type GoogleSheetsEnv = z.infer<typeof sheetsSchema>;
export type SetupChecklist = ReturnType<typeof getSetupChecklist>;
export type FeatureReadiness = ReturnType<typeof getFeatureReadiness>;

const featureMap = {
  publicSupabase: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
  ],
  supabaseAdmin: ["SUPABASE_SERVICE_ROLE_KEY"],
  ai: ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"],
  transcription: ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_POLL_INTERVAL_MS"],
  sheets: [
    "GOOGLE_SHEETS_CLIENT_EMAIL",
    "GOOGLE_SHEETS_PRIVATE_KEY",
    "GOOGLE_SHEETS_SPREADSHEET_ID",
    "GOOGLE_SHEET_NAME",
  ],
} as const;

type FeatureName = keyof typeof featureMap;

function normalizeEnvValue(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const hasMatchingDoubleQuotes =
    trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const hasMatchingSingleQuotes =
    trimmed.startsWith("'") && trimmed.endsWith("'");

  if (hasMatchingDoubleQuotes || hasMatchingSingleQuotes) {
    const unwrapped = trimmed.slice(1, -1).trim();
    return unwrapped.length > 0 ? unwrapped : undefined;
  }

  return trimmed;
}

function envSource() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_APP_URL: normalizeEnvValue(process.env.NEXT_PUBLIC_APP_URL),
    SUPABASE_SERVICE_ROLE_KEY: normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_AUDIO_BUCKET: normalizeEnvValue(process.env.SUPABASE_AUDIO_BUCKET),
    OPENROUTER_API_KEY: normalizeEnvValue(process.env.OPENROUTER_API_KEY),
    OPENROUTER_API_KEY_BACKUP: normalizeEnvValue(process.env.OPENROUTER_API_KEY_BACKUP),
    OPENROUTER_MODEL: normalizeEnvValue(process.env.OPENROUTER_MODEL),
    ASSEMBLYAI_API_KEY: normalizeEnvValue(process.env.ASSEMBLYAI_API_KEY),
    ASSEMBLYAI_POLL_INTERVAL_MS: normalizeEnvValue(process.env.ASSEMBLYAI_POLL_INTERVAL_MS),
    GOOGLE_SHEETS_CLIENT_EMAIL: normalizeEnvValue(process.env.GOOGLE_SHEETS_CLIENT_EMAIL),
    GOOGLE_SHEETS_PRIVATE_KEY: normalizeEnvValue(process.env.GOOGLE_SHEETS_PRIVATE_KEY),
    GOOGLE_SHEETS_SPREADSHEET_ID: normalizeEnvValue(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
    GOOGLE_SHEET_NAME: normalizeEnvValue(process.env.GOOGLE_SHEET_NAME),
    ALLOWED_LOGIN_EMAILS: normalizeEnvValue(process.env.ALLOWED_LOGIN_EMAILS),
  };
}

function parseOrThrow<T>(
  result:
    | { success: true; data: T }
    | { success: false; error: z.ZodError },
  name: string,
): T {
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || name}: ${issue.message}`)
      .join("; ");
    throw new Error(`Missing or invalid ${name} environment: ${message}`);
  }

  return result.data;
}

export function hasPublicSupabaseEnv() {
  return publicSupabaseSchema.safeParse(envSource()).success;
}

export function hasSupabaseStorageEnv() {
  return supabaseStorageSchema.safeParse(envSource()).success;
}

export function hasSupabaseAdminEnv() {
  return supabaseAdminSchema.safeParse(envSource()).success;
}

export function hasAiEnv() {
  return aiSchema.safeParse(envSource()).success;
}

export function hasTranscriptionEnv() {
  return transcriptionSchema.safeParse(envSource()).success;
}

export function hasGoogleSheetsEnv() {
  return sheetsSchema.safeParse(envSource()).success;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return parseOrThrow(publicSupabaseSchema.safeParse(envSource()), "public Supabase");
}

export function getSupabaseStorageEnv(): SupabaseStorageEnv {
  return parseOrThrow(supabaseStorageSchema.safeParse(envSource()), "Supabase storage");
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return parseOrThrow(supabaseAdminSchema.safeParse(envSource()), "Supabase admin");
}

export function getAiEnv(): AiEnv {
  return parseOrThrow(aiSchema.safeParse(envSource()), "OpenRouter");
}

export function getTranscriptionEnv(): TranscriptionEnv {
  return parseOrThrow(transcriptionSchema.safeParse(envSource()), "AssemblyAI");
}

export function getGoogleSheetsEnv(): GoogleSheetsEnv {
  const env = parseOrThrow(sheetsSchema.safeParse(envSource()), "Google Sheets");

  return {
    ...env,
    GOOGLE_SHEETS_PRIVATE_KEY: env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

export function isMockProcessingEnabled() {
  return process.env.MOCK_PROCESSING === "true";
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getAllowedLoginEmails() {
  return (process.env.ALLOWED_LOGIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export function isLoginEmailAllowed(email: string | null | undefined) {
  const allowedEmails = getAllowedLoginEmails();
  if (allowedEmails.length === 0) {
    return true;
  }

  return email ? allowedEmails.includes(email.trim().toLowerCase()) : false;
}

export function getMissingEnvironmentNames(feature: FeatureName) {
  const source = envSource();
  return featureMap[feature].filter((name) => !source[name as keyof typeof source]);
}

export function getSetupChecklist() {
  return {
    publicSupabase: getMissingEnvironmentNames("publicSupabase"),
    supabaseAdmin: getMissingEnvironmentNames("supabaseAdmin"),
    ai: getMissingEnvironmentNames("ai"),
    transcription: getMissingEnvironmentNames("transcription"),
    sheets: getMissingEnvironmentNames("sheets"),
  };
}

export function getFeatureReadiness() {
  const checklist = getSetupChecklist();
  const mockProcessing = isMockProcessingEnabled();
  const coreAppReady = checklist.publicSupabase.length === 0;
  const processingReady =
    mockProcessing ||
    (checklist.ai.length === 0 && checklist.transcription.length === 0);
  const exportReady = checklist.sheets.length === 0;

  return {
    mockProcessing,
    checklist,
    coreAppReady,
    processingReady,
    exportReady,
  };
}
