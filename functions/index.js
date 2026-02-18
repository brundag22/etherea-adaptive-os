const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!admin.apps.length) {
  admin.initializeApp();
}

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_TEXT_LENGTH = 4000;
const MAX_JSON_CHARS = 40000;

const sanitizeModelOutput = (rawText) => {
  const text = String(rawText || "").trim();
  if (!text) return "{}";

  // Handle responses wrapped in markdown fences.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : text;
};

const safeParseJson = (text) => {
  try {
    return JSON.parse(sanitizeModelOutput(text));
  } catch {
    return null;
  }
};

const normalizeBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const userText = typeof body.userText === "string" ? body.userText.trim() : "";
  const uiContext = body.uiContext;
  const userState = body.userState && typeof body.userState === "object" ? body.userState : {};
  const prefs = body.prefs && typeof body.prefs === "object" ? body.prefs : {};

  if (!userText || !uiContext || typeof uiContext !== "object" || Array.isArray(uiContext)) {
    return null;
  }

  if (userText.length > MAX_TEXT_LENGTH) {
    return { error: "userText exceeds maximum allowed length" };
  }

  const uiContextSerialized = JSON.stringify(uiContext);
  if (uiContextSerialized.length > MAX_JSON_CHARS) {
    return { error: "uiContext payload exceeds maximum allowed size" };
  }

  return { userText, uiContext, userState, prefs };
};

exports.api = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    cors: true,
    secrets: [GEMINI_API_KEY],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    try {
      const apiKey = GEMINI_API_KEY.value();
      if (!apiKey) {
        res.status(500).json({ error: "Missing GEMINI_API_KEY secret" });
        return;
      }

      const normalized = normalizeBody(req.body);
      if (!normalized) {
        res.status(400).json({ error: "Invalid payload. Required: userText:string, uiContext:object" });
        return;
      }
      if (normalized.error) {
        res.status(413).json({ error: normalized.error });
        return;
      }

      const { userText, uiContext, userState, prefs } = normalized;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const systemInstruction =
        "You are the Etherea companion response planner. Return valid JSON only with actionable UI guidance.";

      const prompt = [
        systemInstruction,
        `User query: ${JSON.stringify(userText)}`,
        `UI context: ${JSON.stringify(uiContext)}`,
        `User state: ${JSON.stringify(userState)}`,
        `Preferences: ${JSON.stringify(prefs)}`,
      ].join("\n");

      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() || "{}";
      const parsed = safeParseJson(text);

      if (parsed && typeof parsed === "object") {
        res.status(200).json(parsed);
        return;
      }

      res.status(200).json({
        say: sanitizeModelOutput(text),
        actions: [
          {
            type: "toast",
            message: "Etherea returned a non-JSON answer; fallback applied.",
          },
        ],
      });
    } catch (error) {
      logger.error("Error processing /api request", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
