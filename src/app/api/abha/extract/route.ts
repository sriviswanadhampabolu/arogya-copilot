import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

function stripMarkdownJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

const ABHA_EXTRACT_PROMPT = `You are a specialized Indian digital health document reader. Read this photo/scan of an ABHA (Ayushman Bharat Health Account) card.
Extract ONLY the information visibly printed on the card into the following JSON format:
{
  "abha_number": "14-digit format XX-XXXX-XXXX-XXXX or null if not found",
  "abha_address": "health ID handle like name@abdm or name@sbx or null if not found",
  "name": "full name of the cardholder or null",
  "dob": "date of birth in YYYY-MM-DD or DD/MM/YYYY as printed or null",
  "gender": "Male" | "Female" | "Other" | null,
  "confidence": 0 to 1
}

STRICT SAFETY RULES:
1. Never invent, hallucinate, or extrapolate any numbers, names, or addresses.
2. If the ABHA number is printed as 14 continuous digits or space-separated digits, format it with hyphens: XX-XXXX-XXXX-XXXX.
3. If anything is illegible or not present on the card, set that field to null and lower the confidence score.
4. Return ONLY valid JSON.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "No image provided. Please upload a photo of your ABHA card." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: imageBase64,
          },
        },
        ABHA_EXTRACT_PROMPT,
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = stripMarkdownJson(rawText);

    let parsed: {
      abha_number?: string | null;
      abha_address?: string | null;
      name?: string | null;
      dob?: string | null;
      gender?: string | null;
      confidence?: number;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const secondPass = cleaned.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
      parsed = JSON.parse(secondPass);
    }

    // Format ABHA number to XX-XXXX-XXXX-XXXX if 14 raw digits
    if (parsed.abha_number) {
      const digits = parsed.abha_number.replace(/\D/g, "");
      if (digits.length === 14) {
        parsed.abha_number = `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        abha_number: parsed.abha_number || null,
        abha_address: parsed.abha_address || null,
        name: parsed.name || null,
        dob: parsed.dob || null,
        gender: parsed.gender || null,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      },
    });
  } catch (err: unknown) {
    console.error("[ABHA Extract API Error]:", err);
    const msg = err instanceof Error ? err.message : "Failed to extract ABHA card";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
