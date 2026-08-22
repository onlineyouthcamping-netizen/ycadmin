export function resolvePaymentProofUrl(payment: {
  proofFileUrl?: string | null;
  proofUrl?: string | null;
} | null | undefined): string | null {
  if (!payment) return null;
  const url = payment.proofFileUrl || payment.proofUrl || "";
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function formatProofDisplayUrl(
  url: string | null | undefined,
  apiBaseUrl: string,
): string {
  if (!url || typeof url !== "string") return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const serverBase = String(apiBaseUrl || "").replace(/\/api$/, "");
  return `${serverBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function isProofUploadPersisted(response: {
  success?: boolean;
  payment?: { proofFileUrl?: string | null; proofUrl?: string | null } | null;
  proof_url?: string | null;
} | null | undefined): boolean {
  if (!response?.success) return false;
  return Boolean(
    resolvePaymentProofUrl(response.payment) || response.proof_url,
  );
}
