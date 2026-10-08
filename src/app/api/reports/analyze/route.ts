import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { buildFhirBundle, FhirUser, FhirReport, FhirTest, FhirMedication, FhirCondition } from "@/lib/fhir";

export const maxDuration = 60; // Up to 60s for multimodal AI extraction

interface MedicineExtracted {
  name: string;
  generic_name: string | null;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  purpose: string | null;
  confidence: number;
}

interface ConditionExtracted {
  name: string;
  status: "active" | "resolved" | "suspected" | null;
  notes: string | null;
  confidence: number;
}

interface TestExtracted {
  test_name: string;
  value: number;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  ref_text: string;
  status: "normal" | "low" | "high";
  explanation: string;
  loinc_code: string | null;
  confidence: number;
}

interface GeminiExtractionResult {
  doc_type: "lab_report" | "prescription" | "discharge_summary" | "diagnostic_imaging" | "other";
  language_detected: "en" | "te" | "hi" | "ta" | "mixed";
  document_date: string | null;
  title: string;
  doctor_name: string | null;
  facility: string | null;
  raw_text: string;
  medicines: MedicineExtracted[];
  conditions: ConditionExtracted[];
  tests: TestExtracted[];
  summary: string;
  key_points: string[];
  questions_for_doctor: string[];
  overall_confidence: number;
  needs_review: boolean;
}

const PROMPT_TEXT = `You are a careful medical record reader for patients in India. First identify the document type. Then extract everything. The document may be printed or handwritten, and may be in English, Telugu, Hindi, Tamil or a mix. Return ONLY valid JSON:
{
 "doc_type": "lab_report"|"prescription"|"discharge_summary"|"diagnostic_imaging"|"other",
 "language_detected": "en"|"te"|"hi"|"ta"|"mixed",
 "document_date": "YYYY-MM-DD"|null,
 "title": "short title like 'Prescription - Dr. Rao - Oct 2026'",
 "doctor_name": string|null,
 "facility": string|null,
 "raw_text": "full transcription of the document text",
 "medicines": [{"name": "brand or written name", "generic_name": string|null, "strength": "e.g. 500 mg"|null, "dosage": "e.g. 1 tablet", "frequency": "plain words e.g. Morning and night (convert 1-0-1 style notation: morning-afternoon-night)", "duration": "e.g. 5 days"|null, "route": "oral"|"topical"|"injection"|null, "instructions": "e.g. after food"|null, "purpose": "what it is generally used for, one simple sentence", "confidence": 0 to 1}],
 "conditions": [{"name": "diagnosis or condition", "status": "active"|"resolved"|"suspected"|null, "notes": string|null, "confidence": 0 to 1}],
 "tests": [{"test_name": string, "value": number, "unit": string, "ref_low": number|null, "ref_high": number|null, "ref_text": string, "status": "normal"|"low"|"high", "explanation": "one simple sentence on what this test measures and what this result means", "loinc_code": string|null, "confidence": 0 to 1}],
 "summary": "4-6 sentences in simple, friendly language for a non-medical person: what this document is, what it says, what is normal, what needs attention. Never diagnose.",
 "key_points": ["3 to 5 short plain-language bullet strings"],
 "questions_for_doctor": ["3 helpful questions the patient could ask their doctor"],
 "overall_confidence": 0 to 1,
 "needs_review": true if any handwriting, medicine name, dose or value was hard to read
}
RULES: Never invent medicines, doses, values or dates that are not in the document. If something is illegible, give your best guess with confidence below 0.5 and set needs_review to true. Do not recommend changing or stopping any medicine. Use careful wording like 'may suggest' and 'worth discussing with your doctor', never 'you have'. For abnormal values, explain what it can mean in general and suggest which type of doctor to consult. Use the reference ranges printed in the report. Leave arrays empty if the document has none of that type.`;

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

async function callGemini(
  ai: GoogleGenAI,
  modelName: string,
  base64Data: string,
  mimeType: string
): Promise<GeminiExtractionResult> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      PROMPT_TEXT,
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text || "";
  const cleaned = stripMarkdownJson(rawText);

  try {
    return JSON.parse(cleaned) as GeminiExtractionResult;
  } catch {
    // Retry parse once with secondary cleanup if needed
    const secondPass = cleaned.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
    return JSON.parse(secondPass) as GeminiExtractionResult;
  }
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

    const body = await req.json();
    const { filePath, fileType } = body;

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    // Download the file from Supabase storage "reports" bucket
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("reports")
      .download(filePath);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { error: `Failed to download file from storage: ${downloadError?.message || "File not found"}` },
        { status: 404 }
      );
    }

    // Convert blob to base64
    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = fileType || fileBlob.type || "application/pdf";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const standardModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const strongModel = process.env.GEMINI_MODEL_STRONG;

    let result: GeminiExtractionResult;
    try {
      result = await callGemini(ai, standardModel, base64Data, mimeType);
    } catch (primaryErr) {
      console.warn("Primary Gemini call failed, attempting fallback:", primaryErr);
      if (strongModel) {
        result = await callGemini(ai, strongModel, base64Data, mimeType);
      } else {
        throw primaryErr;
      }
    }

    // If confidence is low or needs_review, run strong model if configured
    if ((result.overall_confidence < 0.6 || result.needs_review) && strongModel && strongModel !== standardModel) {
      try {
        const strongResult = await callGemini(ai, strongModel, base64Data, mimeType);
        if (strongResult.overall_confidence > result.overall_confidence) {
          result = strongResult;
        }
      } catch (strongErr) {
        console.warn("Strong model run failed, keeping standard result:", strongErr);
      }
    }

    // Format safe document date
    let safeReportDate: string | null = null;
    if (result.document_date && /^\d{4}-\d{2}-\d{2}$/.test(result.document_date)) {
      safeReportDate = result.document_date;
    }

    // 1. Insert into reports table
    const { data: reportRow, error: reportInsertError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        doc_type: result.doc_type || "other",
        title: result.title || "Health Document",
        report_date: safeReportDate,
        doctor_name: result.doctor_name || null,
        facility: result.facility || null,
        language_detected: result.language_detected || "en",
        raw_text: result.raw_text || "",
        summary: result.summary || "",
        key_points: Array.isArray(result.key_points) ? result.key_points : [],
        questions_for_doctor: Array.isArray(result.questions_for_doctor) ? result.questions_for_doctor : [],
        confidence: typeof result.overall_confidence === "number" ? result.overall_confidence : 0.8,
        needs_review: Boolean(result.needs_review),
        file_path: filePath,
        source: "upload",
      })
      .select("id")
      .single();

    if (reportInsertError || !reportRow) {
      console.error("Report insert error:", reportInsertError);
      return NextResponse.json(
        { error: `Database error inserting report: ${reportInsertError?.message}` },
        { status: 500 }
      );
    }

    const reportId = reportRow.id;

    // 2. Insert into lab_values table
    if (Array.isArray(result.tests) && result.tests.length > 0) {
      const testsToInsert = result.tests.map((t) => ({
        user_id: user.id,
        report_id: reportId,
        test_name: t.test_name || "Diagnostic Metric",
        value: typeof t.value === "number" ? t.value : Number(t.value) || 0,
        unit: t.unit || "",
        ref_low: typeof t.ref_low === "number" ? t.ref_low : null,
        ref_high: typeof t.ref_high === "number" ? t.ref_high : null,
        ref_text: t.ref_text || "",
        status: t.status || "normal",
        explanation: t.explanation || "",
        loinc_code: t.loinc_code || null,
        confidence: typeof t.confidence === "number" ? t.confidence : 0.8,
        report_date: safeReportDate,
      }));

      const { error: testsError } = await supabase.from("lab_values").insert(testsToInsert);
      if (testsError) {
        console.warn("Lab values insert warning:", testsError.message);
      }
    }

    // 3. Insert into medications table
    if (Array.isArray(result.medicines) && result.medicines.length > 0) {
      const medsToInsert = result.medicines.map((m) => ({
        user_id: user.id,
        report_id: reportId,
        name: m.name || "Prescribed Medication",
        generic_name: m.generic_name || null,
        strength: m.strength || null,
        dosage: m.dosage || null,
        frequency: m.frequency || null,
        duration: m.duration || null,
        route: m.route || null,
        instructions: m.instructions || null,
        purpose: m.purpose || null,
        confidence: typeof m.confidence === "number" ? m.confidence : 0.8,
        prescribed_date: safeReportDate,
      }));

      const { error: medsError } = await supabase.from("medications").insert(medsToInsert);
      if (medsError) {
        console.warn("Medications insert warning:", medsError.message);
      }
    }

    // 4. Insert into conditions table
    if (Array.isArray(result.conditions) && result.conditions.length > 0) {
      const conditionsToInsert = result.conditions.map((c) => ({
        user_id: user.id,
        report_id: reportId,
        name: c.name || "Observed Condition",
        status: c.status || "active",
        notes: c.notes || null,
        confidence: typeof c.confidence === "number" ? c.confidence : 0.8,
      }));

      const { error: condError } = await supabase.from("conditions").insert(conditionsToInsert);
      if (condError) {
        console.warn("Conditions insert warning:", condError.message);
      }
    }

    // 5. Generate and store FHIR R4 Bundle
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, age, gender, abha_number")
        .eq("id", user.id)
        .single();

      const fhirUser: FhirUser = {
        id: user.id,
        name: profile?.full_name || user.email?.split("@")[0] || "Patient",
        age: profile?.age ?? null,
        gender: profile?.gender ?? null,
        abha_number: profile?.abha_number ?? null,
      };

      const fhirReport: FhirReport = {
        id: reportId,
        doc_type: result.doc_type || "other",
        title: result.title || "Health Document",
        report_date: safeReportDate,
        doctor_name: result.doctor_name || null,
        facility: result.facility || null,
        summary: result.summary || null,
      };

      const fhirTests: FhirTest[] = (result.tests || []).map((t) => ({
        test_name: t.test_name,
        value: typeof t.value === "number" ? t.value : Number(t.value) || 0,
        unit: t.unit || "",
        ref_low: t.ref_low,
        ref_high: t.ref_high,
        ref_text: t.ref_text,
        status: t.status,
        loinc_code: t.loinc_code,
        explanation: t.explanation,
      }));

      const fhirMeds: FhirMedication[] = (result.medicines || []).map((m) => ({
        name: m.name,
        generic_name: m.generic_name,
        strength: m.strength,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        purpose: m.purpose,
      }));

      const fhirConditions: FhirCondition[] = (result.conditions || []).map((c) => ({
        name: c.name,
        status: c.status,
        notes: c.notes,
      }));

      const fhirBundle = buildFhirBundle(fhirUser, fhirReport, fhirTests, fhirMeds, fhirConditions);

      await supabase
        .from("reports")
        .update({ fhir_bundle: fhirBundle })
        .eq("id", reportId);
    } catch (fhirErr) {
      console.warn("FHIR bundle generation warning:", fhirErr);
    }

    return NextResponse.json({
      success: true,
      reportId: reportId,
      title: result.title,
      summary: result.summary,
    });
  } catch (err: unknown) {
    console.error("Analyze API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
