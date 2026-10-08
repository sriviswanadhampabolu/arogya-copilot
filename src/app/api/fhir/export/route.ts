import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, age, gender, abha_number, abha_address")
      .eq("id", user.id)
      .single();

    // Fetch all user reports that have fhir_bundle
    const { data: reports, error: reportsErr } = await supabase
      .from("reports")
      .select("id, title, doc_type, report_date, doctor_name, facility, fhir_bundle, created_at")
      .eq("user_id", user.id)
      .order("report_date", { ascending: false, nullsFirst: false });

    if (reportsErr) {
      return NextResponse.json({ error: reportsErr.message }, { status: 500 });
    }

    const exportedBundles = (reports || [])
      .map((r) => r.fhir_bundle)
      .filter(Boolean);

    // Aggregate into a master collection Bundle
    const masterExport = {
      resourceType: "Bundle",
      id: `health-record-export-${user.id}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: [
          "https://nrces.in/ndhm/fhir/r4/StructureDefinition/HealthDocumentRecord"
        ]
      },
      type: "collection",
      timestamp: new Date().toISOString(),
      patient: {
        id: user.id,
        name: profile?.full_name || "Patient",
        gender: profile?.gender || null,
        abha_number: profile?.abha_number || null,
        abha_address: profile?.abha_address || null,
      },
      totalRecords: exportedBundles.length,
      bundles: exportedBundles,
    };

    return new NextResponse(JSON.stringify(masterExport, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="arogya-full-health-record-${new Date().toISOString().substring(0, 10)}.json"`,
      },
    });
  } catch (err: unknown) {
    console.error("Export error:", err);
    const msg = err instanceof Error ? err.message : "Failed to export FHIR health record";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
