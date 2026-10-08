import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

interface FhirResource {
  resourceType: string;
  id?: string;
  name?: Array<{ text?: string; family?: string; given?: string[] }>;
  type?: { coding?: FhirCoding[]; text?: string };
  code?: { coding?: FhirCoding[]; text?: string };
  clinicalStatus?: { coding?: FhirCoding[] };
  note?: Array<{ text?: string }>;
  medicationCodeableConcept?: { coding?: FhirCoding[]; text?: string };
  dosageInstruction?: Array<{ text?: string }>;
  valueQuantity?: { value?: number; unit?: string };
  interpretation?: Array<{ coding?: FhirCoding[] }>;
  referenceRange?: Array<{
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
    text?: string;
  }>;
  title?: string;
  date?: string;
  effectiveDateTime?: string;
  author?: Array<{ display?: string; reference?: string }>;
  performer?: Array<{ display?: string; reference?: string }>;
  custodian?: { display?: string };
  conclusion?: string;
  text?: { div?: string };
  [key: string]: unknown;
}

interface FhirBundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
}

interface FhirBundlePayload {
  resourceType: string;
  id?: string;
  type?: string;
  entry?: FhirBundleEntry[];
  [key: string]: unknown;
}

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Parse JSON body with 5MB sanity check
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File exceeds maximum size of 5MB." },
        { status: 400 }
      );
    }

    let bundle: FhirBundlePayload;
    try {
      bundle = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format. Please upload a valid JSON FHIR bundle." },
        { status: 400 }
      );
    }

    // 2. Validate bundle structure
    if (!bundle || bundle.resourceType !== "Bundle") {
      return NextResponse.json(
        { success: false, error: "Invalid resource type. The file must be an HL7 FHIR R4 'Bundle'." },
        { status: 400 }
      );
    }

    const entries = Array.isArray(bundle.entry) ? bundle.entry : [];
    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: "FHIR Bundle is empty (contains 0 entry elements)." },
        { status: 400 }
      );
    }

    // 3. User profile verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, age, gender")
      .eq("id", user.id)
      .single();

    const warnings: string[] = [];
    const skipped: Array<{ resourceType: string; reason: string }> = [];

    // Filter resources safely
    const resources: FhirResource[] = entries
      .map((e) => e.resource)
      .filter((r): r is FhirResource => Boolean(r));

    // Patient check
    const patientResource = resources.find((r) => r.resourceType === "Patient");
    if (patientResource) {
      const patientName =
        patientResource.name?.[0]?.text ||
        [patientResource.name?.[0]?.given?.join(" "), patientResource.name?.[0]?.family]
          .filter(Boolean)
          .join(" ");

      if (patientName && profile?.full_name) {
        const p1 = patientName.toLowerCase().trim();
        const p2 = profile.full_name.toLowerCase().trim();
        if (p1 !== p2 && !p1.includes(p2) && !p2.includes(p1)) {
          warnings.push(
            `Patient name in bundle ("${patientName}") does not match profile name ("${profile.full_name}"). Records imported under your account.`
          );
        }
      }
    }

    // Classify Composition & DiagnosticReport
    const composition = resources.find((r) => r.resourceType === "Composition");
    const diagnosticReport = resources.find((r) => r.resourceType === "DiagnosticReport");
    const practitioner = resources.find((r) => r.resourceType === "Practitioner");

    const conditions = resources.filter((r) => r.resourceType === "Condition");
    const medications = resources.filter(
      (r) => r.resourceType === "MedicationRequest" || r.resourceType === "MedicationStatement"
    );
    const observations = resources.filter((r) => r.resourceType === "Observation");

    // Track unhandled/skipped resources
    resources.forEach((r) => {
      const recognized = [
        "Bundle",
        "Composition",
        "DiagnosticReport",
        "Practitioner",
        "Patient",
        "Condition",
        "MedicationRequest",
        "MedicationStatement",
        "Observation",
      ];
      if (!recognized.includes(r.resourceType)) {
        skipped.push({
          resourceType: r.resourceType,
          reason: "Resource type is not part of clinical report import (ignored safely).",
        });
      }
    });

    // Determine doc_type
    let docType: "lab_report" | "prescription" | "discharge_summary" | "diagnostic_imaging" | "other" = "other";
    if (
      diagnosticReport ||
      composition?.type?.coding?.some((c: FhirCoding) => c.display?.toLowerCase().includes("lab") || c.display?.toLowerCase().includes("diagnostic"))
    ) {
      docType = "lab_report";
    } else if (
      medications.length > 0 ||
      composition?.type?.coding?.some((c: FhirCoding) => c.display?.toLowerCase().includes("prescription"))
    ) {
      docType = "prescription";
    } else if (
      composition?.type?.coding?.some((c: FhirCoding) => c.display?.toLowerCase().includes("discharge"))
    ) {
      docType = "discharge_summary";
    }

    const title =
      composition?.title ||
      diagnosticReport?.code?.text ||
      (docType === "prescription" ? "Imported Prescription Record" : "Imported Diagnostic Health Record");

    const docDate =
      (composition?.date ? composition.date.substring(0, 10) : null) ||
      (diagnosticReport?.effectiveDateTime ? diagnosticReport.effectiveDateTime.substring(0, 10) : null) ||
      new Date().toISOString().substring(0, 10);

    const doctorName =
      practitioner?.name?.[0]?.text ||
      composition?.author?.[0]?.display ||
      null;

    const facility =
      diagnosticReport?.performer?.[0]?.display ||
      composition?.custodian?.display ||
      null;

    // 4. Generate plain language summary via Gemini
    let summary = diagnosticReport?.conclusion || composition?.text?.div || "";
    let keyPoints: string[] = [];
    let questionsForDoctor: string[] = [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

        const clinicalContext = {
          title,
          docType,
          date: docDate,
          conditions: conditions.map((c) => c.code?.text || c.code?.coding?.[0]?.display || "Condition"),
          medications: medications.map((m) => {
            const medName = m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || "Medication";
            const dose = m.dosageInstruction?.[0]?.text || "";
            return `${medName} ${dose}`.trim();
          }),
          observations: observations.map((o) => {
            const name = o.code?.text || o.code?.coding?.[0]?.display || "Test";
            const val = o.valueQuantity?.value;
            const unit = o.valueQuantity?.unit || "";
            return `${name}: ${val} ${unit}`;
          }),
        };

        const summaryPrompt = `You are a medical explainer for Indian patients. Review this structured clinical record imported from an ABDM FHIR bundle:
${JSON.stringify(clinicalContext)}

Return ONLY valid JSON:
{
  "summary": "3-4 short, empathetic sentences in plain language explaining what this document is, what results or prescriptions are included, what is normal and what needs doctor consultation. Never diagnose or prescribe.",
  "key_points": ["3 to 4 short bullet strings with main findings"],
  "questions_for_doctor": ["2 to 3 practical questions the patient can ask their doctor"]
}`;

        const aiRes = await ai.models.generateContent({
          model: modelName,
          contents: summaryPrompt,
          config: { responseMimeType: "application/json" },
        });

        const parsedAi = JSON.parse(stripMarkdownJson(aiRes.text || "{}"));
        if (parsedAi.summary) summary = parsedAi.summary;
        if (Array.isArray(parsedAi.key_points)) keyPoints = parsedAi.key_points;
        if (Array.isArray(parsedAi.questions_for_doctor)) questionsForDoctor = parsedAi.questions_for_doctor;
      } catch (aiErr) {
        console.warn("[FHIR Import] AI summary generation warning, using fallback:", aiErr);
      }
    }

    if (!summary) {
      summary = `Electronically imported FHIR R4 ${docType.replace("_", " ")} record with ${observations.length} observations and ${medications.length} prescribed medications.`;
    }
    if (keyPoints.length === 0) {
      keyPoints = [
        "Electronically verified FHIR R4 Bundle import",
        `Aggregated ${observations.length} lab observations and ${medications.length} medications`,
      ];
    }
    if (questionsForDoctor.length === 0) {
      questionsForDoctor = [
        "Review this electronic FHIR record during your next consultation.",
      ];
    }

    // 5. Insert into reports table
    const { data: reportRow, error: reportInsertError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        doc_type: docType,
        title: title,
        report_date: docDate,
        doctor_name: doctorName,
        facility: facility,
        language_detected: "en",
        raw_text: JSON.stringify(bundle, null, 2),
        summary: summary,
        key_points: keyPoints,
        questions_for_doctor: questionsForDoctor,
        confidence: 1.0,
        needs_review: false,
        file_path: `fhir-import/${bundle.id || Date.now()}.json`,
        source: "fhir_import",
        fhir_bundle: bundle,
      })
      .select("id")
      .single();

    if (reportInsertError || !reportRow) {
      console.error("[FHIR Import] Report insert error:", reportInsertError);
      return NextResponse.json(
        { success: false, error: `Failed to insert report: ${reportInsertError?.message}` },
        { status: 500 }
      );
    }

    const reportId = reportRow.id;

    // 6. Insert Conditions
    let importedConditionsCount = 0;
    if (conditions.length > 0) {
      const condRows = conditions.map((c) => ({
        user_id: user.id,
        report_id: reportId,
        name: c.code?.text || c.code?.coding?.[0]?.display || "Observed Condition",
        status: c.clinicalStatus?.coding?.[0]?.code === "resolved" ? "resolved" : "active",
        notes: c.note?.[0]?.text || null,
        confidence: 1.0,
      }));
      const { error: condErr } = await supabase.from("conditions").insert(condRows);
      if (!condErr) importedConditionsCount = condRows.length;
    }

    // 7. Insert Medications
    let importedMedsCount = 0;
    if (medications.length > 0) {
      const medRows = medications.map((m) => {
        const medName =
          m.medicationCodeableConcept?.text ||
          m.medicationCodeableConcept?.coding?.[0]?.display ||
          "Prescribed Medication";

        const dosageText = m.dosageInstruction?.[0]?.text || null;
        return {
          user_id: user.id,
          report_id: reportId,
          name: medName,
          generic_name: null,
          strength: null,
          dosage: dosageText,
          frequency: dosageText,
          duration: null,
          route: null,
          instructions: dosageText,
          purpose: null,
          confidence: 1.0,
          prescribed_date: docDate,
        };
      });
      const { error: medsErr } = await supabase.from("medications").insert(medRows);
      if (!medsErr) importedMedsCount = medRows.length;
    }

    // 8. Insert Observations (lab_values)
    let importedObsCount = 0;
    if (observations.length > 0) {
      const obsRows = observations.map((o) => {
        const testName = o.code?.text || o.code?.coding?.[0]?.display || "Diagnostic Test";
        const val = typeof o.valueQuantity?.value === "number" ? o.valueQuantity.value : Number(o.valueQuantity?.value) || 0;
        const unit = o.valueQuantity?.unit || "";

        let refLow: number | null = null;
        let refHigh: number | null = null;
        let refText = "";

        if (Array.isArray(o.referenceRange) && o.referenceRange.length > 0) {
          const rr = o.referenceRange[0];
          refLow = typeof rr.low?.value === "number" ? rr.low.value : null;
          refHigh = typeof rr.high?.value === "number" ? rr.high.value : null;
          refText = rr.text || (refLow !== null && refHigh !== null ? `${refLow} - ${refHigh} ${unit}` : "");
        }

        let status: "normal" | "low" | "high" = "normal";
        const interpCode = o.interpretation?.[0]?.coding?.[0]?.code?.toUpperCase();
        if (interpCode === "H") status = "high";
        else if (interpCode === "L") status = "low";
        else if (refHigh !== null && val > refHigh) status = "high";
        else if (refLow !== null && val < refLow) status = "low";

        const loincCode = o.code?.coding?.find((c: FhirCoding) => c.system?.includes("loinc"))?.code || null;

        return {
          user_id: user.id,
          report_id: reportId,
          test_name: testName,
          value: val,
          unit: unit,
          ref_low: refLow,
          ref_high: refHigh,
          ref_text: refText,
          status: status,
          explanation: o.note?.[0]?.text || "",
          loinc_code: loincCode,
          confidence: 1.0,
          report_date: docDate,
        };
      });

      const { error: obsErr } = await supabase.from("lab_values").insert(obsRows);
      if (!obsErr) importedObsCount = obsRows.length;
    }

    return NextResponse.json({
      success: true,
      reportId: reportId,
      title: title,
      summary: summary,
      imported: {
        reports: 1,
        conditions: importedConditionsCount,
        medications: importedMedsCount,
        observations: importedObsCount,
      },
      skipped: skipped,
      warnings: warnings,
    });
  } catch (err: unknown) {
    console.error("[FHIR Import API Error]:", err);
    const msg = err instanceof Error ? err.message : "Internal error during FHIR bundle import";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
