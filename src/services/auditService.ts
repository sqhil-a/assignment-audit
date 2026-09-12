import type { AuditInput, AuditResult } from "../types/audit";
import { validateInput, parseAuditResponse } from "./validation";
export {
  validateInput,
  parseAuditResponse,
  validateReportEvidence,
  validateComparison,
} from "./validation";
export const API_URL =
  import.meta.env.VITE_AUDIT_API_URL?.trim() ||
  (import.meta.env.DEV && import.meta.env.VITE_DEV_AUDIT_ENABLED === "true"
    ? "/api/audit"
    : "");
export const isDemoMode = !API_URL;
export async function auditAssignment(
  input: AuditInput,
  signal?: AbortSignal,
  options: { endpoint?: string; demo?: boolean } = {},
): Promise<AuditResult> {
  validateInput(input);
  if (options.demo ?? isDemoMode) {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, 2100);
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
    });
    const { demoResult } = await import("../data/sampleRevision");
    return demoResult(input);
  }
  const endpoint = options.endpoint || API_URL;
  const parsedUrl = new URL(
    endpoint,
    globalThis.location?.origin || "http://localhost",
  );
  if (
    parsedUrl.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname)
  )
    throw new Error(
      "The audit endpoint must use HTTPS. Update the endpoint configuration.",
    );
  const timeout = AbortSignal.timeout(180000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemaVersion: 1, input }),
      signal: combined,
      credentials: "omit",
    });
    if (!response.ok) {
      if (response.status === 429)
        throw new Error(
          "The audit service is busy or rate limited. Wait a minute and try again.",
        );
      if (response.status === 401 || response.status === 403)
        throw new Error(
          "The audit service could not authenticate. Check the server’s API key configuration.",
        );
      if (response.status === 413)
        throw new Error(
          "Your materials are too long for the configured model. Shorten the context and retry.",
        );
      throw new Error(
        "The audit service could not complete the review. Your materials are still here. Please retry.",
      );
    }
    const body = await response.text();
    if (body.length > 2000000)
      throw new Error(
        "The audit response was unexpectedly large. Please retry with a shorter audit.",
      );
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(
        "The audit service returned malformed JSON. Please retry.",
      );
    }
    return parseAuditResponse(data, input);
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (timeout.aborted)
      throw new Error(
        "The audit took too long. Try again with fewer sources or a shorter audit.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Network connection failed. Check your connection and the audit endpoint, then retry.",
      );
    throw error;
  }
}
