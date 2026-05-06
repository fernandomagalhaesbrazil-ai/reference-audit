const input = document.querySelector("#referenceInput");
const fileInput = document.querySelector("#fileInput");
const doiInput = document.querySelector("#doiInput");
const doiButton = document.querySelector("#doiButton");
const checkButton = document.querySelector("#checkButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector("#sampleButton");
const downloadButton = document.querySelector("#downloadButton");
const resultsList = document.querySelector("#resultsList");
const networkStatus = document.querySelector("#networkStatus");
const summaryStatus = document.querySelector("#summaryStatus");
const verifiedCount = document.querySelector("#verifiedCount");
const reviewCount = document.querySelector("#reviewCount");
const notFoundCount = document.querySelector("#notFoundCount");
const resultTemplate = document.querySelector("#resultTemplate");

let latestResults = [];
let pdfJsPromise = null;

const pdfJsVersion = "5.6.205";

const sampleReferences = `Miller, S. L. (1953). A production of amino acids under possible primitive earth conditions. Science, 117(3046), 528-529. doi:10.1126/science.117.3046.528
Lowry, O. H., Rosebrough, N. J., Farr, A. L., & Randall, R. J. (1951). Protein measurement with the Folin phenol reagent. Journal of Biological Chemistry, 193(1), 265-275.
Watson, J. D., & Crick, F. H. C. (1953). Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid. Nature, 171, 737-738.
Fake, A. B. (2022). Enzymatic moonlight signaling in imaginary chloroplast mammals. Journal of Impossible Biochemistry, 44(9), 100-108.`;

const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const yearPattern = /\b(18|19|20)\d{2}\b/;

sampleButton.addEventListener("click", () => {
  input.value = sampleReferences;
  input.focus();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  doiInput.value = "";
  latestResults = [];
  downloadButton.disabled = true;
  updateSummary([]);
  renderEmptyState();
  setStatus("Ready", "neutral");
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    setBusy(true, "Reading...");
    if (isPdfFile(file)) {
      setStatus("Reading PDF", "neutral");
      const pdfText = await extractTextFromPdf(file);
      const referenceSection = extractReferencesSection(pdfText);
      const extractedReferences = formatExtractedReferences(referenceSection || pdfText);
      input.value = extractedReferences;
      const count = parseReferences(extractedReferences).length;
      setStatus(count ? "PDF Imported" : "Review PDF Text", count ? "ok" : "warn");
      summaryStatus.textContent = count ? `${count} candidate references` : "0 references found";
    } else {
      input.value = await file.text();
      setStatus("File Imported", "ok");
    }
  } catch (error) {
    setStatus("Import Failed", "bad");
    summaryStatus.textContent = error.message;
  } finally {
    setBusy(false);
    fileInput.value = "";
  }
});

checkButton.addEventListener("click", async () => {
  const references = parseReferences(input.value);
  if (!references.length) {
    setStatus("No references found", "warn");
    return;
  }

  await auditReferences(references, "Checking...");
});

doiButton.addEventListener("click", async () => {
  const dois = extractDoiValues(doiInput.value);
  if (!dois.length) {
    setStatus("No DOI found", "warn");
    summaryStatus.textContent = "Enter a DOI or DOI URL";
    return;
  }

  await auditReferences(dois.map((doi) => `DOI: ${doi}`), "Checking DOI...");
});

downloadButton.addEventListener("click", () => {
  const csv = toCsv(latestResults);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reference-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
});

function parseReferences(rawText) {
  const text = rawText.trim();
  if (!text) return [];
  if (/@\w+\s*\{/.test(text)) return parseBibtex(text);
  if (/^TY\s+-/m.test(text)) return parseRis(text);
  return parsePlainReferences(text);
}

function extractDoiValues(text) {
  const matches = [...text.matchAll(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi)]
    .map((match) => normalizeDoi(match[0]));
  return [...new Set(matches)];
}

async function auditReferences(references, busyLabel) {
  setBusy(true, busyLabel);
  setStatus("Checking", "neutral");
  resultsList.replaceChildren();
  latestResults = [];

  for (const [index, reference] of references.entries()) {
    summaryStatus.textContent = `${index + 1} of ${references.length}`;
    const result = await verifyReference(reference);
    latestResults.push(result);
    renderResult(result);
    updateSummary(latestResults);
  }

  setBusy(false);
  setStatus("Complete", "ok");
  downloadButton.disabled = !latestResults.length;
}

function parsePlainReferences(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n(?=\s*(?:\[\d+\]|\d+\.|\w[\w' -]+,\s+[A-Z]))/g)
    .flatMap((chunk) => chunk.split(/\n{2,}/g))
    .map(cleanReference)
    .filter((entry) => entry.length > 12);
}

function parseBibtex(text) {
  const entries = text.match(/@\w+\s*\{[\s\S]*?(?=\n@\w+\s*\{|$)/g) ?? [];
  return entries.map((entry) => {
    const fields = ["author", "title", "journal", "year", "doi"]
      .map((field) => extractBibField(entry, field))
      .filter(Boolean);
    return cleanReference(fields.join(". "));
  }).filter(Boolean);
}

function parseRis(text) {
  return text.split(/\nER\s+-/).map((entry) => {
    const fields = ["AU", "TI", "T2", "PY", "DO"]
      .flatMap((tag) => [...entry.matchAll(new RegExp(`^${tag}\\s+-\\s+(.+)$`, "gim"))].map((match) => match[1]))
      .filter(Boolean);
    return cleanReference(fields.join(". "));
  }).filter((entry) => entry.length > 12);
}

function extractBibField(entry, field) {
  const match = entry.match(new RegExp(`${field}\\s*=\\s*[{"]([\\s\\S]*?)[}"],?\\s*(?=\\n\\s*\\w+\\s*=|\\n?\\})`, "i"));
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function cleanReference(reference) {
  return reference
    .replace(/^\s*(?:\[\d+\]|\d+\.)\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPdfFile(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const documentTask = pdfjsLib.getDocument({ data });
  const pdf = await documentTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    setStatus(`Reading PDF ${pageNumber}/${pdf.numPages}`, "neutral");
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push(textItemsToLines(textContent.items).join("\n"));
  }

  return pages.join("\n\n");
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.mjs`)
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.mjs`;
        return pdfjsLib;
      });
  }
  return pdfJsPromise;
}

function extractReferencesSection(text) {
  const normalized = text.replace(/\r/g, "\n");
  const headingPattern = /(?:^|\n)\s*(references|bibliography|literature cited|works cited)\s*(?:\n|$)/gi;
  const headings = [...normalized.matchAll(headingPattern)];
  const heading = headings.at(-1);
  if (heading?.index === undefined) return "";

  const start = heading.index + heading[0].length;
  const afterHeading = normalized.slice(start);
  const endMatch = afterHeading.match(/\n\s*(appendix|appendices|supplementary|acknowledg(?:e)?ments)\b/i);
  return endMatch ? afterHeading.slice(0, endMatch.index) : afterHeading;
}

function textItemsToLines(items) {
  const lines = [];
  let currentLine = "";
  let currentY = null;

  for (const item of items) {
    const itemY = Number.isFinite(item.transform?.[5]) ? item.transform[5] : null;
    const startsNewLine = currentY !== null && itemY !== null && Math.abs(itemY - currentY) > 4;

    if (startsNewLine && currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = "";
    }

    currentLine = `${currentLine} ${item.str}`.trim();
    currentY = itemY ?? currentY;

    if (item.hasEOL && currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = "";
      currentY = null;
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

function formatExtractedReferences(text) {
  const lines = text
    .replace(/\f/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const entries = [];
  let current = "";

  for (const line of lines) {
    if (isReferenceStart(line) && current) {
      entries.push(current);
      current = line;
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }

  if (current) entries.push(current);
  return entries.map(cleanReference).filter((entry) => entry.length > 12).join("\n");
}

function isReferenceStart(line) {
  return /^\s*(?:\[\d+\]|\d+\.|\d+\s+|[A-Z][A-Za-z' -]{1,45},\s+(?:[A-Z]\.|[A-Z][a-z]))/.test(line);
}

async function verifyReference(reference) {
  const parsed = parseCitationClues(reference);
  const candidates = [];

  try {
    if (parsed.doi) {
      const crossrefDoi = await fetchCrossrefDoi(parsed.doi).catch(() => null);
      if (crossrefDoi) candidates.push(crossrefDoi);
    }

    const [crossrefSearch, openAlexSearch] = await Promise.all([
      fetchCrossrefSearch(parsed).catch(() => []),
      fetchOpenAlexSearch(parsed).catch(() => [])
    ]);

    candidates.push(...crossrefSearch, ...openAlexSearch);
  } catch (error) {
    return buildErrorResult(reference, parsed, error);
  }

  const ranked = dedupeCandidates(candidates)
    .map((candidate) => scoreCandidate(parsed, candidate))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) {
    return {
      reference,
      parsed,
      status: "missing",
      label: "Not Found",
      score: 0,
      candidate: null,
      notes: ["No matching record returned by Crossref or OpenAlex."]
    };
  }

  const status = best.score >= 75 ? "verified" : best.score >= 56 ? "review" : "missing";
  const label = status === "verified" ? "Verified" : status === "review" ? "Needs Review" : "Not Found";

  return {
    reference,
    parsed,
    status,
    label,
    score: best.score,
    candidate: best.candidate,
    notes: best.notes
  };
}

function parseCitationClues(reference) {
  const doi = reference.match(doiPattern)?.[0]?.replace(/[).,;]+$/, "") ?? "";
  const year = reference.match(yearPattern)?.[0] ?? "";
  const title = inferTitle(reference);
  const authorLead = reference.match(/^([A-Z][A-Za-z' -]{1,40})[, ]/)?.[1] ?? "";
  const isDoiOnly = Boolean(doi) && !title && !year && !authorLead;
  return { doi, year, title, authorLead, isDoiOnly };
}

function inferTitle(reference) {
  const withoutDoi = reference.replace(/doi:\s*/i, "").replace(doiPattern, "");
  const yearMatch = withoutDoi.match(yearPattern);

  if (yearMatch?.index !== undefined) {
    const afterYear = withoutDoi
      .slice(yearMatch.index + yearMatch[0].length)
      .replace(/^[).,\s]+/, "")
      .trim();
    const titleAfterYear = afterYear.split(/\.\s+/)[0]?.trim();
    if (titleAfterYear && titleAfterYear.length > 12) return titleAfterYear;
  }

  const segments = withoutDoi
    .split(/\.\s+/)
    .map((segment) => segment.replace(/^["'“”]+|["'“”]+$/g, "").trim())
    .filter((segment) => segment.length > 12);

  const likely = segments.find((segment) => {
    const hasYear = yearPattern.test(segment);
    const commaDensity = (segment.match(/,/g) ?? []).length;
    return !hasYear && commaDensity < 3;
  });

  return likely ?? segments[1] ?? segments[0] ?? withoutDoi.slice(0, 160);
}

async function fetchCrossrefDoi(doi) {
  const payload = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  return normalizeCrossref(payload.message, "Crossref DOI");
}

async function fetchCrossrefSearch(parsed) {
  const query = parsed.doi || parsed.title || parsed.reference;
  if (!query) return [];

  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: "4"
  });
  const payload = await fetchJson(`https://api.crossref.org/works?${params}`);
  return (payload.message?.items ?? []).map((item) => normalizeCrossref(item, "Crossref Search"));
}

async function fetchOpenAlexSearch(parsed) {
  const query = parsed.doi || parsed.title;
  if (!query) return [];

  const params = new URLSearchParams({
    search: query,
    "per-page": "4"
  });
  const payload = await fetchJson(`https://api.openalex.org/works?${params}`);
  return (payload.results ?? []).map(normalizeOpenAlex);
}

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeCrossref(item, source) {
  const title = firstText(item.title);
  const journal = firstText(item["container-title"]);
  const year = item.published?.["date-parts"]?.[0]?.[0] || item.created?.["date-parts"]?.[0]?.[0] || "";
  const authors = (item.author ?? []).map((author) => [author.given, author.family].filter(Boolean).join(" "));
  const doi = item.DOI || "";
  return {
    id: doi || item.URL || title,
    source,
    title,
    journal,
    year: String(year),
    authors,
    doi,
    url: item.URL || (doi ? `https://doi.org/${doi}` : "")
  };
}

function normalizeOpenAlex(item) {
  const doi = item.doi?.replace(/^https:\/\/doi.org\//i, "") ?? "";
  return {
    id: item.id || doi || item.display_name,
    source: "OpenAlex",
    title: item.display_name || "",
    journal: item.primary_location?.source?.display_name || "",
    year: String(item.publication_year || ""),
    authors: (item.authorships ?? []).map((authorship) => authorship.author?.display_name).filter(Boolean),
    doi,
    url: item.doi || item.id || ""
  };
}

function firstText(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = (candidate.doi || candidate.id || candidate.title).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreCandidate(parsed, candidate) {
  const notes = [];
  let score = 0;

  const titleSimilarity = similarity(normalizeText(parsed.title), normalizeText(candidate.title));
  score += titleSimilarity * 58;
  notes.push(`Title match: ${Math.round(titleSimilarity * 100)}%`);

  if (parsed.doi) {
    const doiMatch = normalizeDoi(parsed.doi) === normalizeDoi(candidate.doi);
    if (doiMatch && parsed.isDoiOnly) {
      return {
        candidate,
        score: 100,
        notes: ["DOI resolves to a scholarly metadata record."]
      };
    }
    score += doiMatch ? 28 : -18;
    notes.push(doiMatch ? "DOI matches." : "DOI differs or was not returned.");
  }

  if (parsed.year) {
    const yearMatch = parsed.year === candidate.year;
    score += yearMatch ? 10 : -8;
    notes.push(yearMatch ? "Year matches." : `Year differs: source has ${candidate.year || "unknown"}.`);
  }

  if (parsed.authorLead) {
    const authorText = normalizeText(candidate.authors.join(" "));
    const authorMatch = authorText.includes(normalizeText(parsed.authorLead));
    score += authorMatch ? 8 : -4;
    notes.push(authorMatch ? "Lead author appears in source metadata." : "Lead author was not confirmed.");
  }

  return {
    candidate,
    score: Math.max(0, Math.min(100, Math.round(score))),
    notes
  };
}

function normalizeDoi(doi) {
  return doi.toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "").replace(/[).,;]+$/, "").trim();
}

function normalizeText(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function similarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 2));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 2));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

function buildErrorResult(reference, parsed, error) {
  return {
    reference,
    parsed,
    status: "review",
    label: "Needs Review",
    score: 0,
    candidate: null,
    notes: [`Lookup failed: ${error.message}`]
  };
}

function renderResult(result) {
  const node = resultTemplate.content.firstElementChild.cloneNode(true);
  const status = node.querySelector(".result-status");
  status.textContent = result.label;
  status.classList.add(result.status);
  node.querySelector(".result-score").textContent = `${result.score}% confidence`;
  node.querySelector(".result-title").textContent = result.candidate?.title || result.parsed.title || "Untitled reference";
  node.querySelector(".result-original").textContent = result.reference;

  const comparison = node.querySelector(".comparison-list");
  const rows = [
    ["Source", result.candidate?.source || "None"],
    ["DOI", result.candidate?.doi || result.parsed.doi || "Not detected"],
    ["Year", result.candidate?.year || "Unknown"],
    ["Journal", result.candidate?.journal || "Unknown"],
    ["Notes", result.notes.join(" ")]
  ];

  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    comparison.append(term, description);
  }

  const links = node.querySelector(".source-links");
  if (result.candidate?.url) {
    const sourceLink = document.createElement("a");
    sourceLink.href = result.candidate.url;
    sourceLink.target = "_blank";
    sourceLink.rel = "noreferrer";
    sourceLink.textContent = "Source Record";
    links.append(sourceLink);
  }
  if (result.candidate?.doi) {
    const doiLink = document.createElement("a");
    doiLink.href = `https://doi.org/${result.candidate.doi}`;
    doiLink.target = "_blank";
    doiLink.rel = "noreferrer";
    doiLink.textContent = "DOI";
    links.append(doiLink);
  }

  resultsList.append(node);
}

function renderEmptyState() {
  resultsList.innerHTML = `
    <div class="empty-state">
      <h3>No references checked yet</h3>
      <p>Results will appear here with source links, metadata matches, and confidence notes.</p>
    </div>
  `;
}

function updateSummary(results) {
  const counts = {
    verified: results.filter((result) => result.status === "verified").length,
    review: results.filter((result) => result.status === "review").length,
    missing: results.filter((result) => result.status === "missing").length
  };
  verifiedCount.textContent = counts.verified;
  reviewCount.textContent = counts.review;
  notFoundCount.textContent = counts.missing;
  summaryStatus.textContent = `${results.length} checked`;
}

function setBusy(isBusy, busyLabel = "Checking...") {
  checkButton.disabled = isBusy;
  doiButton.disabled = isBusy;
  doiInput.disabled = isBusy;
  sampleButton.disabled = isBusy;
  clearButton.disabled = isBusy;
  checkButton.textContent = isBusy ? busyLabel : "Check References";
}

function setStatus(text, tone) {
  networkStatus.textContent = text;
  networkStatus.className = `pill ${tone}`;
}

function toCsv(results) {
  const rows = [
    ["status", "confidence", "input_reference", "matched_title", "source", "doi", "year", "journal", "notes"]
  ];
  for (const result of results) {
    rows.push([
      result.label,
      result.score,
      result.reference,
      result.candidate?.title || "",
      result.candidate?.source || "",
      result.candidate?.doi || "",
      result.candidate?.year || "",
      result.candidate?.journal || "",
      result.notes.join(" ")
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
