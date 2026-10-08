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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { report_id, lang } = await req.json();

    if (!report_id || !lang || (lang !== "te" && lang !== "hi")) {
      return NextResponse.json(
        { error: "Valid report_id and target language ('te' or 'hi') are required" },
        { status: 400 }
      );
    }

    // 1. Fetch report and check cached translations
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("id, user_id, summary, key_points, questions_for_doctor, translations")
      .eq("id", report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check cache
    const cachedTranslations = (report.translations as Record<string, unknown>) || {};
    if (cachedTranslations[lang]) {
      return NextResponse.json({
        success: true,
        cached: true,
        translation: cachedTranslations[lang],
      });
    }

    // 2. Fetch related tests
    const { data: tests } = await supabase
      .from("lab_values")
      .select("id, test_name, explanation")
      .eq("report_id", report_id);

    // 3. Fetch related medications
    const { data: medications } = await supabase
      .from("medications")
      .select("id, name, instructions, purpose")
      .eq("report_id", report_id);

    const targetLangName = lang === "te" ? "Telugu (తెలుగు)" : "Hindi (हिन्दी)";

    const payloadToTranslate = {
      summary: report.summary,
      key_points: report.key_points || [],
      questions_for_doctor: report.questions_for_doctor || [],
      tests: (tests || []).map((t) => ({ id: t.id, test_name: t.test_name, explanation: t.explanation })),
      medicines: (medications || []).map((m) => ({
        id: m.id,
        name: m.name,
        instructions: m.instructions,
        purpose: m.purpose,
      })),
    };

    const prompt = `Translate the clinical explanations in this health report into ${targetLangName}.
CRITICAL RULES:
1. KEEP ALL DRUG/MEDICINE NAMES, TEST/BIOMARKER NAMES, NUMBERS, DOSAGES, AND UNITS STRICTLY UNCHANGED IN ENGLISH.
2. Translate the patient explanations, purposes, instructions, summary, key findings, and doctor questions into natural, empathetic ${targetLangName}.
3. Return ONLY valid JSON with this exact schema:
{
  "summary": "translated summary string",
  "key_points": ["translated bullet strings"],
  "questions_for_doctor": ["translated questions"],
  "tests": [{"id": "exact test id", "explanation": "translated explanation"}],
  "medicines": [{"id": "exact medicine id", "instructions": "translated instructions or null", "purpose": "translated purpose or null"}]
}

DATA TO TRANSLATE:
${JSON.stringify(payloadToTranslate)}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleaned = stripMarkdownJson(rawText);
    const translatedData = JSON.parse(cleaned);

    // 4. Cache in reports.translations[lang]
    const updatedTranslations = {
      ...cachedTranslations,
      [lang]: translatedData,
    };

    const { error: updateError } = await supabase
      .from("reports")
      .update({ translations: updatedTranslations })
      .eq("id", report_id);

    if (updateError) {
      console.warn("Could not cache translation to report:", updateError.message);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      translation: translatedData,
    });
  } catch (err: unknown) {
    console.error("Translation API error:", err);
    const msg = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
