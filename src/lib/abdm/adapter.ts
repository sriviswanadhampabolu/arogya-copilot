/**
 * ABDM (Ayushman Bharat Digital Mission) Adapter Layer
 * 
 * Provides a unified contract for ABHA identification and clinical record retrieval.
 * Supports file/user-provided ingestion today, and acts as an architectural plug-in
 * point for the official NHA ABDM Sandbox Gateway (Milestones M1, M2, M3).
 */

export interface AbdmRecord {
  id: string;
  type: "prescription" | "lab_report" | "discharge_summary" | "diagnostic_imaging" | "other";
  title: string;
  date: string;
  bundle: unknown;
}

export interface AbdmAdapter {
  name: string;
  isLive: boolean;
  linkAbha(abhaNumber: string, abhaAddress: string): Promise<{
    success: boolean;
    status: "self_declared" | "verified";
    message: string;
  }>;
  fetchRecords(abhaNumber: string, consentId?: string): Promise<{
    success: boolean;
    records: AbdmRecord[];
    message?: string;
  }>;
}

/**
 * FileImportAdapter
 * 
 * Currently active adapter. Operates in disconnected / offline mode where ABHA
 * details are self-declared by the user (or extracted from card scans) and
 * clinical records are ingested directly from FHIR R4 Bundle files.
 */
export class FileImportAdapter implements AbdmAdapter {
  name = "File & Self-Declared Adapter";
  isLive = false;

  async linkAbha(abhaNumber: string, abhaAddress: string) {
    const cleanNumber = abhaNumber.trim();
    const cleanAddress = abhaAddress.trim();

    if (!/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(cleanNumber)) {
      return {
        success: false,
        status: "self_declared" as const,
        message: "Invalid ABHA number format. Must be 14 digits: XX-XXXX-XXXX-XXXX",
      };
    }

    if (!cleanAddress || !cleanAddress.includes("@")) {
      return {
        success: false,
        status: "self_declared" as const,
        message: "Invalid ABHA address format. Must be username@abdm or username@sbx",
      };
    }

    return {
      success: true,
      status: "self_declared" as const,
      message: "ABHA details saved successfully as self-declared. Not verified against live ABDM registry.",
    };
  }

  async fetchRecords(): Promise<{ success: boolean; records: AbdmRecord[]; message: string }> {
    return {
      success: true,
      records: [],
      message: "Local mode: Import clinical records using JSON FHIR R4 bundles.",
    };
  }
}

/**
 * AbdmGatewayAdapter
 * 
 * NOT-ENABLED PLACEHOLDER: To be enabled after ABDM Sandbox approval from the
 * National Health Authority (NHA). This adapter will connect to the official
 * ABDM Gateway for OTP-based verification, HIU (Health Information User),
 * and HIP (Health Information Provider) milestone flows.
 */
export class AbdmGatewayAdapter implements AbdmAdapter {
  name = "NHA ABDM Sandbox Gateway (Disabled)";
  isLive = false;

  private clientId: string | undefined;
  private clientSecret: string | undefined;

  constructor() {
    this.clientId = process.env.ABDM_CLIENT_ID;
    this.clientSecret = process.env.ABDM_CLIENT_SECRET;
  }

  async linkAbha(): Promise<{ success: boolean; status: "verified"; message: string }> {
    // Intentionally no live API call
    return {
      success: false,
      status: "verified",
      message:
        "ABDM Gateway is currently NOT enabled. Requires official NHA Sandbox M1/M2/M3 approval and ABDM_CLIENT_ID / ABDM_CLIENT_SECRET credentials.",
    };
  }

  async fetchRecords(): Promise<{ success: boolean; records: AbdmRecord[]; message: string }> {
    return {
      success: false,
      records: [],
      message: "ABDM Gateway is not enabled. Cannot request consent or fetch records from external health facilities.",
    };
  }
}

// Export default singleton adapter
export const defaultAbdmAdapter: AbdmAdapter = new FileImportAdapter();
