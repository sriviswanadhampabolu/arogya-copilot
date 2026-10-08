import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

interface FhirResource {
  resourceType: string;
  id: string;
  meta?: {
    profile?: string[];
  };
  text?: { div?: string };
  title?: string;
  date?: string;
  type?: {
    coding?: Coding[];
    text?: string;
  };
  name?: Array<{ text?: string }>;
  performer?: Array<{ display?: string; reference?: string }>;
  conclusion?: string;
  code?: {
    coding?: Coding[];
    text?: string;
  };
  clinicalStatus?: {
    coding?: Coding[];
  };
  note?: Array<{ text?: string }>;
  medicationCodeableConcept?: {
    text?: string;
  };
  dosageInstruction?: Array<{
    text?: string;
  }>;
  valueQuantity?: {
    value?: number;
    unit?: string;
  };
  interpretation?: Array<{
    coding?: Coding[];
  }>;
  referenceRange?: Array<{
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
    text?: string;
  }>;
  [key: string]: unknown;
}

interface FhirBundle {
  resourceType: string;
  id: string;
  meta?: { profile?: string[] };
  identifier?: { system: string; value: string };
  type: string;
  timestamp?: string;
  entry: Array<{
    fullUrl?: string;
    resource: FhirResource;
  }>;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sampleDir = path.join(process.cwd(), "public", "sample-fhir");
    const rxPath = path.join(sampleDir, "sample-prescription.json");
    const labPath = path.join(sampleDir, "sample-lab-report.json");

    const [rxDataRaw, labDataRaw] = await Promise.all([
      fs.readFile(rxPath, "utf-8"),
      fs.readFile(labPath, "utf-8"),
    ]);

    const bundles: FhirBundle[] = [JSON.parse(rxDataRaw), JSON.parse(labDataRaw)];
    const importedReports: Array<{ id: string; title: string }> = [];

    for (const bundle of bundles) {
      const entries = bundle.entry?.map((e) => e.resource) || [];
      const composition = entries.find((r) => r.resourceType === "Composition");
      const practitioner = entries.find((r) => r.resourceType === "Practitioner");
      const diagnosticReport = entries.find((r) => r.resourceType === "DiagnosticReport");
      const conditions = entries.filter((r) => r.resourceType === "Condition");
      const medications = entries.filter((r) => r.resourceType === "MedicationRequest");
      const observations = entries.filter((r) => r.resourceType === "Observation");

      const isPrescription = bundle.meta?.profile?.some((p) => p.includes("PrescriptionRecord")) ||
        composition?.type?.coding?.some((c) => c.code === "440545006") ||
        medications.length > 0;

      const docType = isPrescription ? "prescription" : "lab_report";
      const docDate = composition?.date ? composition.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const title = composition?.title || (isPrescription ? "Prescription Record" : "Diagnostic Lab Report");
      const doctorName = practitioner?.name?.[0]?.text || null;
      const facility = diagnosticReport?.performer?.[0]?.display || null;
      const summary = diagnosticReport?.conclusion || composition?.text?.div || (isPrescription ? "ABDM prescription imported record." : "ABDM diagnostic panel imported record.");

      // Insert into reports
      const { data: reportRow, error: reportErr } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          doc_type: docType,
          title: title,
          report_date: docDate,
          doctor_name: doctorName,
          facility: facility,
          language_detected: "en",
          summary: summary,
          key_points: isPrescription
            ? ["Imported electronically from ABHA", "Contains verified prescription medication schedule"]
            : ["Imported electronically from ABHA", "Contains standard diagnostic metabolic markers"],
          questions_for_doctor: isPrescription
            ? ["Discuss adherence and review medication tolerance with physician"]
            : ["Review borderline biomarkers during next consultation"],
          confidence: 1.0,
          needs_review: false,
          source: "abha_import",
          fhir_bundle: bundle,
        })
        .select("id")
        .single();

      if (reportErr || !reportRow) {
        console.error("Failed to insert ABHA report:", reportErr);
        continue;
      }

      const reportId = reportRow.id;
      importedReports.push({ id: reportId, title });

      // Insert Conditions
      if (conditions.length > 0) {
        const condInserts = conditions.map((c) => ({
          user_id: user.id,
          report_id: reportId,
          name: c.code?.text || "Documented condition",
          status: c.clinicalStatus?.coding?.[0]?.code || "active",
          notes: c.note?.[0]?.text || null,
          confidence: 1.0,
        }));
        await supabase.from("conditions").insert(condInserts);
      }

      // Insert Medications
      if (medications.length > 0) {
        const medInserts = medications.map((m) => {
          const medText = m.medicationCodeableConcept?.text || "Medication";
          const instruction = m.dosageInstruction?.[0]?.text || null;
          return {
            user_id: user.id,
            report_id: reportId,
            name: medText,
            instructions: instruction,
            confidence: 1.0,
            prescribed_date: docDate,
          };
        });
        await supabase.from("medications").insert(medInserts);
      }

      // Insert Lab Values
      if (observations.length > 0) {
        const labInserts = observations.map((o) => {
          const interpCode = o.interpretation?.[0]?.coding?.[0]?.code;
          let status: "normal" | "low" | "high" = "normal";
          if (interpCode === "H") status = "high";
          else if (interpCode === "L") status = "low";

          const refRange = o.referenceRange?.[0];
          const refLow = refRange?.low?.value ?? null;
          const refHigh = refRange?.high?.value ?? null;
          const refText = refRange?.text || "";

          return {
            user_id: user.id,
            report_id: reportId,
            test_name: o.code?.text || "Diagnostic Marker",
            value: o.valueQuantity?.value ?? 0,
            unit: o.valueQuantity?.unit ?? "",
            ref_low: refLow,
            ref_high: refHigh,
            ref_text: refText,
            status: status,
            explanation: o.note?.[0]?.text || "",
            loinc_code: o.code?.coding?.[0]?.code || null,
            confidence: 1.0,
            report_date: docDate,
          };
        });
        await supabase.from("lab_values").insert(labInserts);
      }
    }

    return NextResponse.json({
      success: true,
      count: importedReports.length,
      reports: importedReports,
      message: `Successfully imported ${importedReports.length} records from ABHA (demo)`,
    });
  } catch (err: unknown) {
    console.error("ABHA Import error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error during ABHA import";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
