import type { Source, SourceRole } from "../types/audit";
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 160000;
export const MAX_TOTAL_TEXT = 600000;
export const ACCEPTED_FILES = ".pdf,.docx,.txt,.md";
export function validateFile(file: Pick<File, "name" | "size">) {
  if (!/\.(pdf|docx|txt|md)$/i.test(file.name))
    throw new Error("Choose a PDF, DOCX, TXT, or Markdown file.");
  if (file.size > MAX_FILE_BYTES)
    throw new Error(
      "This file is too large. Choose a file smaller than 15 MB.",
    );
  if (!file.size)
    throw new Error("This file is empty. Add a document with readable text.");
}
export function validateText(value: string) {
  const clean = value.replace(/\u0000/g, "").trim();
  if (!clean)
    throw new Error(
      "No readable text was found. Paste the document text instead.",
    );
  if (clean.length > MAX_TEXT_LENGTH)
    throw new Error(
      "This document exceeds 160,000 characters. Split it into smaller documents.",
    );
  return clean;
}
export async function parseFile(
  file: File,
  role: SourceRole,
  sourceId: string,
): Promise<Source> {
  validateFile(file);
  const extension = file.name.split(".").pop()?.toLowerCase();
  let extracted = "";
  let warning: string | undefined;
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const pdf = await task.promise;
      if (pdf.numPages > 200)
        throw new Error(
          "This PDF has more than 200 pages. Upload only the relevant pages.",
        );
      const pages: string[] = [];
      let blankPages = 0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const line = content.items
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join("")
          .trim();
        if (line.length < 15) blankPages++;
        pages.push(`[Page ${pageNumber}]\n${line}`);
        if (pages.join("\n").length > MAX_TEXT_LENGTH)
          throw new Error(
            "This document exceeds 160,000 characters. Upload fewer pages.",
          );
      }
      if (blankPages === pdf.numPages)
        throw new Error(
          "This PDF appears to contain scanned pages. Text extraction was limited. Paste the text or use a text-based PDF.",
        );
      if (blankPages)
        warning = `${blankPages} page(s) had little or no readable text and may be scanned. Add their text before auditing; visual content cannot be assessed.`;
      extracted = pages.join("\n\n");
    } catch (error) {
      if (error instanceof Error && error.name === "PasswordException")
        throw new Error(
          "This PDF is password protected. Upload an unlocked copy.",
        );
      throw error;
    } finally {
      await task.destroy();
    }
  } else if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    extracted = result.value;
    if (result.messages.length)
      warning =
        "Some document elements could not be extracted. Review the extracted text; images and visual formatting are not analyzed.";
  } else {
    extracted = await file.text();
  }
  return {
    id: sourceId,
    name: file.name,
    text: validateText(extracted),
    role,
    size: file.size,
    type: extension?.toUpperCase() || "Text",
    status: "ready",
    warning,
  };
}
export function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (
    /^(Choose|This|No readable|Some|Could not|The |Your |Please |Audit |Revision |Unable|Network|Too many)/.test(
      message,
    )
  )
    return message;
  return "Could not read this document. It may be damaged or unsupported. Try another file or paste its text.";
}
