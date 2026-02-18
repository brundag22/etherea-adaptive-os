const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

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

      const { userText, uiContext, userState = {}, prefs = {} } = req.body || {};
      if (!userText || !uiContext) {
        res.status(400).json({ error: "Missing required fields: userText and uiContext" });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

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

      try {
        res.status(200).json(JSON.parse(text));
      } catch {
        // Fallback for non-JSON model output.
        res.status(200).json({
          say: text,
          actions: [
            {
              type: "toast",
              message: "Etherea returned a non-JSON answer; fallback applied.",
            },
          ],
        });
      }
    } catch (error) {
      logger.error("Error processing /api request", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
