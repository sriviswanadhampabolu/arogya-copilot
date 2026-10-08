function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface FhirUser {
  id: string;
  name?: string | null;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  abha_number?: string | null;
}

export interface FhirReport {
  id: string;
  doc_type: string;
  title: string;
  report_date?: string | null;
  doctor_name?: string | null;
  facility?: string | null;
  summary?: string | null;
}

export interface FhirTest {
  id?: string;
  test_name: string;
  value: number;
  unit?: string | null;
  ref_low?: number | null;
  ref_high?: number | null;
  ref_text?: string | null;
  status?: string | null;
  loinc_code?: string | null;
  explanation?: string | null;
}

export interface FhirMedication {
  id?: string;
  name: string;
  generic_name?: string | null;
  strength?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  purpose?: string | null;
}

export interface FhirCondition {
  id?: string;
  name: string;
  status?: string | null;
  notes?: string | null;
}

export interface FhirResource {
  resourceType: string;
  id: string;
  meta?: {
    profile?: string[];
    versionId?: string;
    lastUpdated?: string;
  };
  [key: string]: unknown;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
    profile: string[];
  };
  identifier?: {
    system: string;
    value: string;
  };
  type: "collection";
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: FhirResource;
  }>;
}

function getAbdmProfile(docType: string): string {
  switch (docType) {
    case "prescription":
      return "https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord";
    case "lab_report":
    case "diagnostic_imaging":
      return "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord";
    case "discharge_summary":
      return "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord";
    default:
      return "https://nrces.in/ndhm/fhir/r4/StructureDefinition/HealthDocumentRecord";
  }
}

function mapGender(gender?: string | null): "male" | "female" | "other" | "unknown" {
  if (!gender) return "unknown";
  const g = gender.toLowerCase();
  if (g.startsWith("m")) return "male";
  if (g.startsWith("f")) return "female";
  if (g.includes("non") || g.includes("other")) return "other";
  return "unknown";
}

function mapInterpretation(status?: string | null): string {
  if (!status) return "N";
  const s = status.toLowerCase();
  if (s === "high") return "H";
  if (s === "low") return "L";
  return "N";
}

export function buildFhirBundle(
  user: FhirUser,
  report: FhirReport,
  tests: FhirTest[] = [],
  medications: FhirMedication[] = [],
  conditions: FhirCondition[] = []
): FhirBundle {
  const bundleId = generateUUID();
  const patientId = generateUUID();
  const practitionerId = generateUUID();
  const compositionId = generateUUID();
  const diagnosticReportId = generateUUID();

  const now = new Date().toISOString();
  const docDate = report.report_date ? new Date(report.report_date).toISOString() : now;
  const abdmProfile = getAbdmProfile(report.doc_type);

  const entries: Array<{ fullUrl: string; resource: FhirResource }> = [];

  // 1. Patient Resource
  const patientResource: FhirResource = {
    resourceType: "Patient",
    id: patientId,
    meta: {
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"],
    },
    name: [
      {
        text: user.name || "Patient",
      },
    ],
    gender: mapGender(user.gender),
  };

  if (user.birthDate) {
    patientResource.birthDate = user.birthDate;
  } else if (user.age) {
    const approximateYear = new Date().getFullYear() - user.age;
    patientResource.birthDate = `${approximateYear}-01-01`;
  }

  if (user.abha_number) {
    patientResource.identifier = [
      {
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        system: "https://healthid.ndhm.gov.in",
        value: user.abha_number,
      },
    ];
  }

  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: patientResource,
  });

  // 2. Practitioner Resource
  const practitionerResource: FhirResource = {
    resourceType: "Practitioner",
    id: practitionerId,
    meta: {
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner"],
    },
    name: [
      {
        text: report.doctor_name || "Treating Physician",
      },
    ],
  };

  entries.push({
    fullUrl: `urn:uuid:${practitionerId}`,
    resource: practitionerResource,
  });

  // 3. Condition Resources
  const conditionRefs: Array<{ reference: string; display: string }> = [];
  conditions.forEach((cond) => {
    const condId = cond.id || generateUUID();
    const conditionResource: FhirResource = {
      resourceType: "Condition",
      id: condId,
      meta: {
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"],
      },
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: cond.status === "resolved" ? "resolved" : "active",
            display: cond.status === "resolved" ? "Resolved" : "Active",
          },
        ],
      },
      code: {
        text: cond.name,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: user.name || "Patient",
      },
      recordedDate: docDate,
    };

    if (cond.notes) {
      conditionResource.note = [{ text: cond.notes }];
    }

    entries.push({
      fullUrl: `urn:uuid:${condId}`,
      resource: conditionResource,
    });

    conditionRefs.push({
      reference: `urn:uuid:${condId}`,
      display: cond.name,
    });
  });

  // 4. MedicationRequest Resources
  const medicationRefs: Array<{ reference: string; display: string }> = [];
  medications.forEach((med) => {
    const medId = med.id || generateUUID();
    const medicationRequestResource: FhirResource = {
      resourceType: "MedicationRequest",
      id: medId,
      meta: {
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest"],
      },
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        text: [med.name, med.strength].filter(Boolean).join(" "),
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: user.name || "Patient",
      },
      authoredOn: docDate,
      requester: {
        reference: `urn:uuid:${practitionerId}`,
        display: report.doctor_name || "Treating Physician",
      },
      dosageInstruction: [
        {
          text: [
            med.dosage ? `Dose: ${med.dosage}` : "",
            med.frequency ? `Timing: ${med.frequency}` : "",
            med.duration ? `Duration: ${med.duration}` : "",
            med.instructions ? `Instructions: ${med.instructions}` : "",
          ]
            .filter(Boolean)
            .join(". "),
        },
      ],
    };

    entries.push({
      fullUrl: `urn:uuid:${medId}`,
      resource: medicationRequestResource,
    });

    medicationRefs.push({
      reference: `urn:uuid:${medId}`,
      display: med.name,
    });
  });

  // 5. Observation Resources (for lab tests)
  const observationRefs: Array<{ reference: string; display: string }> = [];
  tests.forEach((test) => {
    const obsId = test.id || generateUUID();
    const interpretationCode = mapInterpretation(test.status);

    const observationResource: FhirResource = {
      resourceType: "Observation",
      id: obsId,
      meta: {
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation"],
      },
      status: "final",
      code: {
        coding: test.loinc_code
          ? [
              {
                system: "http://loinc.org",
                code: test.loinc_code,
                display: test.test_name,
              },
            ]
          : undefined,
        text: test.test_name,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: user.name || "Patient",
      },
      effectiveDateTime: docDate,
      valueQuantity: {
        value: test.value,
        unit: test.unit || "unit",
      },
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: interpretationCode,
              display: interpretationCode === "H" ? "High" : interpretationCode === "L" ? "Low" : "Normal",
            },
          ],
        },
      ],
    };

    if (test.ref_low !== null && test.ref_low !== undefined || test.ref_high !== null && test.ref_high !== undefined || test.ref_text) {
      observationResource.referenceRange = [
        {
          low: test.ref_low !== null && test.ref_low !== undefined ? { value: test.ref_low, unit: test.unit || "" } : undefined,
          high: test.ref_high !== null && test.ref_high !== undefined ? { value: test.ref_high, unit: test.unit || "" } : undefined,
          text: test.ref_text || undefined,
        },
      ];
    }

    if (test.explanation) {
      observationResource.note = [{ text: test.explanation }];
    }

    entries.push({
      fullUrl: `urn:uuid:${obsId}`,
      resource: observationResource,
    });

    observationRefs.push({
      reference: `urn:uuid:${obsId}`,
      display: test.test_name,
    });
  });

  // 6. DiagnosticReport Resource (if tests exist or if doc_type is lab/imaging)
  if (observationRefs.length > 0 || report.doc_type === "lab_report" || report.doc_type === "diagnostic_imaging") {
    const diagnosticReportResource: FhirResource = {
      resourceType: "DiagnosticReport",
      id: diagnosticReportId,
      meta: {
        profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab"],
      },
      status: "final",
      code: {
        text: report.title,
      },
      subject: {
        reference: `urn:uuid:${patientId}`,
        display: user.name || "Patient",
      },
      effectiveDateTime: docDate,
      issued: now,
      performer: [
        {
          reference: `urn:uuid:${practitionerId}`,
          display: report.facility || report.doctor_name || "Diagnostic Laboratory",
        },
      ],
      result: observationRefs,
      conclusion: report.summary || undefined,
    };

    entries.push({
      fullUrl: `urn:uuid:${diagnosticReportId}`,
      resource: diagnosticReportResource,
    });
  }

  // 7. Composition Resource (groups all entries into the ABDM document record)
  const compositionSections: Array<{ title: string; entry: Array<{ reference: string; display: string }> }> = [];

  if (observationRefs.length > 0) {
    compositionSections.push({
      title: "Diagnostic Investigations",
      entry: observationRefs,
    });
  }

  if (medicationRefs.length > 0) {
    compositionSections.push({
      title: "Prescribed Medications",
      entry: medicationRefs,
    });
  }

  if (conditionRefs.length > 0) {
    compositionSections.push({
      title: "Documented Conditions & Diagnoses",
      entry: conditionRefs,
    });
  }

  const compositionResource: FhirResource = {
    resourceType: "Composition",
    id: compositionId,
    meta: {
      profile: [abdmProfile],
    },
    status: "final",
    type: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "371530004",
          display: "Clinical consultation report",
        },
      ],
      text: report.title,
    },
    subject: {
      reference: `urn:uuid:${patientId}`,
      display: user.name || "Patient",
    },
    date: docDate,
    author: [
      {
        reference: `urn:uuid:${practitionerId}`,
        display: report.doctor_name || "Treating Physician",
      },
    ],
    title: report.title,
    section: compositionSections,
  };

  // The composition is placed first in entry list per FHIR document convention
  entries.unshift({
    fullUrl: `urn:uuid:${compositionId}`,
    resource: compositionResource,
  });

  return {
    resourceType: "Bundle",
    id: bundleId,
    meta: {
      versionId: "1",
      lastUpdated: now,
      profile: [abdmProfile],
    },
    identifier: {
      system: "https://arogya.app/fhir/bundles",
      value: bundleId,
    },
    type: "collection",
    timestamp: now,
    entry: entries,
  };
}
