const input = document.querySelector("#referenceInput");
const fileInput = document.querySelector("#fileInput");
const doiInput = document.querySelector("#doiInput");
const doiButton = document.querySelector("#doiButton");
const languageSelect = document.querySelector("#languageSelect");
const checkButton = document.querySelector("#checkButton");
const clearButton = document.querySelector("#clearButton");
const sampleButton = document.querySelector("#sampleButton");
const feedbackButton = document.querySelector("#feedbackButton");
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
let currentLanguage = localStorage.getItem("referenceAuditLanguage") || "en";
let currentStatus = { key: "ready", tone: "neutral", params: {} };
let resultFilter = "all";

const pdfJsVersion = "5.6.205";

const translations = {
  en: {
    pageTitle: "Reference Audit",
    eyebrow: "Thesis Reference Audit",
    headline: "Reference verifier for technical manuscripts",
    languageLabel: "Language",
    ready: "Ready",
    checkedCount: "{count} checked",
    checkingProgress: "{current} of {total}",
    referencesTitle: "References",
    sampleButton: "Sample",
    fileDrop: "Import PDF, TXT, BibTeX, RIS, or Markdown",
    fileHelp: "PDF import extracts the references section from selectable text. Scanned PDFs still need OCR first.",
    doiLookupLabel: "DOI Lookup",
    doiButton: "Verify DOI",
    referencePlaceholder: "Paste bibliography entries here. Use one reference per line, or paste BibTeX / RIS blocks.",
    checkButton: "Check References",
    clearButton: "Clear",
    resultsTitle: "Audit Results",
    downloadButton: "Download CSV",
    feedbackButton: "Feedback",
    showAllButton: "Show All",
    metricsAria: "Audit summary",
    verifiedLabel: "Verified",
    reviewLabel: "Needs Review",
    notFoundLabel: "Not Found",
    emptyTitle: "No references checked yet",
    emptyText: "Results will appear here with source links, metadata matches, and confidence notes.",
    reading: "Reading...",
    readingPdf: "Reading PDF",
    readingPdfPage: "Reading PDF {page}/{pages}",
    pdfImported: "PDF Imported",
    reviewPdfText: "Review PDF Text",
    candidateReferences: "{count} candidate references",
    zeroReferencesFound: "0 references found",
    fileImported: "File Imported",
    importFailed: "Import Failed",
    noReferencesFound: "No references found",
    checking: "Checking",
    checkingButton: "Checking...",
    complete: "Complete",
    showingVerified: "Showing verified",
    noVerifiedResults: "No verified references",
    noDoiFound: "No DOI found",
    enterDoi: "Enter a DOI or DOI URL",
    checkingDoiButton: "Checking DOI...",
    source: "Source",
    year: "Year",
    journal: "Journal",
    notes: "Notes",
    none: "None",
    unknown: "Unknown",
    notDetected: "Not detected",
    confidence: "{score}% confidence",
    untitledReference: "Untitled reference",
    sourceRecord: "Source Record",
    csvStatus: "status",
    csvConfidence: "confidence",
    csvInputReference: "input_reference",
    csvMatchedTitle: "matched_title",
    csvSource: "source",
    csvDoi: "doi",
    csvYear: "year",
    csvJournal: "journal",
    csvNotes: "notes",
    noteNoMatchingRecord: "No matching record returned by Crossref or OpenAlex.",
    noteDoiResolves: "DOI resolves to a scholarly metadata record.",
    noteTitleMatch: "Title match: {percent}%",
    noteDoiMatches: "DOI matches.",
    noteDoiDiffers: "DOI differs or was not returned.",
    noteYearMatches: "Year matches.",
    noteYearDiffers: "Year differs: source has {year}.",
    noteLeadAuthorMatches: "Lead author appears in source metadata.",
    noteLeadAuthorMissing: "Lead author was not confirmed.",
    noteLookupFailed: "Lookup failed: {message}",
    statusVerified: "Verified",
    statusReview: "Needs Review",
    statusMissing: "Not Found"
  },
  pt: {
    pageTitle: "Auditoria de Referencias",
    eyebrow: "Auditoria de Referencias de Teses",
    headline: "Verificador de referencias para manuscritos tecnicos",
    languageLabel: "Idioma",
    ready: "Pronto",
    checkedCount: "{count} verificados",
    checkingProgress: "{current} de {total}",
    referencesTitle: "Referencias",
    sampleButton: "Exemplo",
    fileDrop: "Importar PDF, TXT, BibTeX, RIS ou Markdown",
    fileHelp: "A importacao de PDF extrai a secao de referencias de texto selecionavel. PDFs escaneados precisam de OCR primeiro.",
    doiLookupLabel: "Busca por DOI",
    doiButton: "Verificar DOI",
    referencePlaceholder: "Cole as referencias bibliograficas aqui. Use uma referencia por linha, ou cole blocos BibTeX / RIS.",
    checkButton: "Verificar Referencias",
    clearButton: "Limpar",
    resultsTitle: "Resultados da Auditoria",
    downloadButton: "Baixar CSV",
    feedbackButton: "Feedback",
    showAllButton: "Mostrar Todas",
    metricsAria: "Resumo da auditoria",
    verifiedLabel: "Verificado",
    reviewLabel: "Revisar",
    notFoundLabel: "Nao Encontrado",
    emptyTitle: "Nenhuma referencia verificada ainda",
    emptyText: "Os resultados aparecerao aqui com links das fontes, comparacao de metadados e notas de confianca.",
    reading: "Lendo...",
    readingPdf: "Lendo PDF",
    readingPdfPage: "Lendo PDF {page}/{pages}",
    pdfImported: "PDF Importado",
    reviewPdfText: "Revisar Texto do PDF",
    candidateReferences: "{count} referencias candidatas",
    zeroReferencesFound: "0 referencias encontradas",
    fileImported: "Arquivo Importado",
    importFailed: "Falha na Importacao",
    noReferencesFound: "Nenhuma referencia encontrada",
    checking: "Verificando",
    checkingButton: "Verificando...",
    complete: "Concluido",
    showingVerified: "Mostrando verificadas",
    noVerifiedResults: "Nenhuma referencia verificada",
    noDoiFound: "Nenhum DOI encontrado",
    enterDoi: "Digite um DOI ou URL de DOI",
    checkingDoiButton: "Verificando DOI...",
    source: "Fonte",
    year: "Ano",
    journal: "Periodico",
    notes: "Notas",
    none: "Nenhuma",
    unknown: "Desconhecido",
    notDetected: "Nao detectado",
    confidence: "{score}% de confianca",
    untitledReference: "Referencia sem titulo",
    sourceRecord: "Registro da Fonte",
    csvStatus: "status",
    csvConfidence: "confianca",
    csvInputReference: "referencia_informada",
    csvMatchedTitle: "titulo_encontrado",
    csvSource: "fonte",
    csvDoi: "doi",
    csvYear: "ano",
    csvJournal: "periodico",
    csvNotes: "notas",
    noteNoMatchingRecord: "Nenhum registro correspondente foi retornado pelo Crossref ou OpenAlex.",
    noteDoiResolves: "O DOI resolve para um registro de metadados academicos.",
    noteTitleMatch: "Correspondencia do titulo: {percent}%",
    noteDoiMatches: "O DOI corresponde.",
    noteDoiDiffers: "O DOI difere ou nao foi retornado.",
    noteYearMatches: "O ano corresponde.",
    noteYearDiffers: "O ano difere: a fonte informa {year}.",
    noteLeadAuthorMatches: "O primeiro autor aparece nos metadados da fonte.",
    noteLeadAuthorMissing: "O primeiro autor nao foi confirmado.",
    noteLookupFailed: "Falha na busca: {message}",
    statusVerified: "Verificado",
    statusReview: "Revisar",
    statusMissing: "Nao Encontrado"
  }
};

const sampleReferences = `Miller, S. L. (1953). A production of amino acids under possible primitive earth conditions. Science, 117(3046), 528-529. doi:10.1126/science.117.3046.528
Lowry, O. H., Rosebrough, N. J., Farr, A. L., & Randall, R. J. (1951). Protein measurement with the Folin phenol reagent. Journal of Biological Chemistry, 193(1), 265-275.
Watson, J. D., & Crick, F. H. C. (1953). Molecular structure of nucleic acids; a structure for deoxyribose nucleic acid. Nature, 171, 737-738.
Fake, A. B. (2022). Enzymatic moonlight signaling in imaginary chloroplast mammals. Journal of Impossible Biochemistry, 44(9), 100-108.`;

const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const yearPattern = /\b(18|19|20)\d{2}\b/;

languageSelect.addEventListener("change", () => {
  setLanguage(languageSelect.value);
});

sampleButton.addEventListener("click", () => {
  input.value = sampleReferences;
  input.focus();
});

clearButton.addEventListener("click", () => {
  input.value = "";
  doiInput.value = "";
  latestResults = [];
  resultFilter = "all";
  downloadButton.disabled = true;
  feedbackButton.disabled = true;
  feedbackButton.textContent = t("feedbackButton");
  updateSummary([]);
  renderEmptyState();
  setStatus("ready", "neutral");
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    setBusy(true, "reading");
    if (isPdfFile(file)) {
      setStatus("readingPdf", "neutral");
      const pdfText = await extractTextFromPdf(file);
      const referenceSection = extractReferencesSection(pdfText);
      const extractedReferences = formatExtractedReferences(referenceSection || pdfText);
      input.value = extractedReferences;
      const count = parseReferences(extractedReferences).length;
      setStatus(count ? "pdfImported" : "reviewPdfText", count ? "ok" : "warn");
      summaryStatus.textContent = count ? t("candidateReferences", { count }) : t("zeroReferencesFound");
    } else {
      input.value = await file.text();
      setStatus("fileImported", "ok");
    }
  } catch (error) {
    setStatus("importFailed", "bad");
    summaryStatus.textContent = error.message;
  } finally {
    setBusy(false);
    fileInput.value = "";
  }
});

checkButton.addEventListener("click", async () => {
  const references = parseReferences(input.value);
  if (!references.length) {
    setStatus("noReferencesFound", "warn");
    return;
  }

  await auditReferences(references, "checkingButton");
});

doiButton.addEventListener("click", async () => {
  const dois = extractDoiValues(doiInput.value);
  if (!dois.length) {
    setStatus("noDoiFound", "warn");
    summaryStatus.textContent = t("enterDoi");
    return;
  }

  await auditReferences(dois.map((doi) => `DOI: ${doi}`), "checkingDoiButton");
});

feedbackButton.addEventListener("click", () => {
  if (!latestResults.length) return;
  resultFilter = resultFilter === "verified" ? "all" : "verified";
  renderResults();
  updateResultActions();
  setStatus(resultFilter === "verified" ? "showingVerified" : "complete", resultFilter === "verified" ? "neutral" : "ok");
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

function setLanguage(language) {
  currentLanguage = translations[language] ? language : "en";
  localStorage.setItem("referenceAuditLanguage", currentLanguage);
  languageSelect.value = currentLanguage;
  document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : "en";
  document.title = t("pageTitle");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  networkStatus.textContent = t(currentStatus.key, currentStatus.params);
  networkStatus.className = `pill ${currentStatus.tone}`;

  renderResults();
  updateSummary(latestResults);
  updateResultActions();
}

function t(key, params = {}) {
  const dictionary = translations[currentLanguage] || translations.en;
  const template = dictionary[key] || translations.en[key] || key;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}

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
  resultFilter = "all";
  latestResults = [];
  updateResultActions();
  setBusy(true, busyLabel);
  setStatus("checking", "neutral");
  resultsList.replaceChildren();

  for (const [index, reference] of references.entries()) {
    summaryStatus.textContent = t("checkingProgress", { current: index + 1, total: references.length });
    const result = await verifyReference(reference);
    latestResults.push(result);
    renderResults();
    updateSummary(latestResults);
  }

  setBusy(false);
  setStatus("complete", "ok");
  updateResultActions();
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
    setStatus("readingPdfPage", "neutral", { page: pageNumber, pages: pdf.numPages });
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push(textItemsToLines(textContent.items));
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
  const positionedItems = items
    .map((item) => ({
      text: item.str?.replace(/\s+/g, " ").trim() || "",
      x: Number.isFinite(item.transform?.[4]) ? item.transform[4] : 0,
      y: Number.isFinite(item.transform?.[5]) ? item.transform[5] : 0,
      width: Number.isFinite(item.width) ? item.width : 0
    }))
    .filter((item) => item.text);

  const lineGroups = [];
  for (const item of positionedItems.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lineGroups.find((group) => Math.abs(group.y - item.y) <= 3);
    if (line) {
      line.items.push(item);
      line.y = (line.y + item.y) / 2;
    } else {
      lineGroups.push({ y: item.y, items: [item] });
    }
  }

  return orderPdfLines(lineGroups)
    .map((line) => line.items.sort((a, b) => a.x - b.x))
    .map((itemsInLine) => joinLineItems(itemsInLine))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function orderPdfLines(lineGroups) {
  const lines = lineGroups.map((group) => ({
    ...group,
    minX: Math.min(...group.items.map((item) => item.x)),
    maxX: Math.max(...group.items.map((item) => item.x + item.width))
  }));

  const startPositions = [...new Set(lines.map((line) => Math.round(line.minX / 10) * 10))].sort((a, b) => a - b);
  let largestGap = 0;
  let columnBreak = null;

  for (let index = 1; index < startPositions.length; index += 1) {
    const gap = startPositions[index] - startPositions[index - 1];
    if (gap > largestGap) {
      largestGap = gap;
      columnBreak = (startPositions[index] + startPositions[index - 1]) / 2;
    }
  }

  if (columnBreak && largestGap > 140) {
    const leftColumn = lines.filter((line) => line.minX < columnBreak);
    const rightColumn = lines.filter((line) => line.minX >= columnBreak);
    if (leftColumn.length >= 3 && rightColumn.length >= 3) {
      return [leftColumn, rightColumn]
        .map((column) => column.sort((a, b) => b.y - a.y || a.minX - b.minX))
        .flat();
    }
  }

  return lines.sort((a, b) => b.y - a.y || a.minX - b.minX);
}

function joinLineItems(itemsInLine) {
  let line = "";
  let previousEnd = null;

  for (const item of itemsInLine) {
    const gap = previousEnd === null ? 0 : item.x - previousEnd;
    const separator = !line || gap < 1 || /^[,.;:)\]]/.test(item.text) ? "" : " ";
    line = `${line}${separator}${item.text}`;
    previousEnd = item.x + item.width;
  }

  return line;
}

function normalizeExtractedPdfText(text) {
  return text
    .replace(/\u00ad/g, "")
    .replace(/([A-Za-z])-\s*\n\s*([A-Za-z])/g, "$1$2")
    .replace(/\bdoi\s*:\s*/gi, "doi:")
    .replace(/https?:\s+\/\s+\//gi, "https://")
    .replace(/\s+([,.;:)\]])/g, "$1")
    .replace(/([(])\s+/g, "$1");
}

function formatExtractedReferences(text) {
  const lines = normalizeExtractedPdfText(text)
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
  return splitMergedReferences(entries)
    .map(cleanReference)
    .filter((entry) => entry.length > 12)
    .join("\n");
}

function splitMergedReferences(entries) {
  return entries.flatMap((entry) => {
    const numberedParts = entry.split(/\s+(?=(?:\[\d+\]|\d+\.)\s+)/g).filter(Boolean);
    if (numberedParts.length > 1) return numberedParts;
    return entry.split(/\.\s+(?=[A-Z][A-Za-z' -]{1,45},\s+(?:[A-Z]\.|[A-Z][a-z]))/g)
      .map((part, index, parts) => index < parts.length - 1 ? `${part}.` : part)
      .filter(Boolean);
  });
}

function isReferenceStart(line) {
  return /^\s*(?:\[\d+\]|\d+\.|\d+\s+|[A-Z][A-Za-z' -]{1,45},\s+(?:[A-Z]\.|[A-Z][a-z])|[A-Z][A-Za-z' -]{1,45}\s+[A-Z]{1,3}(?:,|\s+\())/.test(line);
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
      score: 0,
      candidate: null,
      notes: [note("noteNoMatchingRecord")]
    };
  }

  const status = best.score >= 75 ? "verified" : best.score >= 56 ? "review" : "missing";

  return {
    reference,
    parsed,
    status,
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
  notes.push(note("noteTitleMatch", { percent: Math.round(titleSimilarity * 100) }));

  if (parsed.doi) {
    const doiMatch = normalizeDoi(parsed.doi) === normalizeDoi(candidate.doi);
    if (doiMatch && parsed.isDoiOnly) {
      return {
        candidate,
        score: 100,
        notes: [note("noteDoiResolves")]
      };
    }
    score += doiMatch ? 28 : -18;
    notes.push(note(doiMatch ? "noteDoiMatches" : "noteDoiDiffers"));
  }

  if (parsed.year) {
    const yearMatch = parsed.year === candidate.year;
    score += yearMatch ? 10 : -8;
    notes.push(yearMatch ? note("noteYearMatches") : note("noteYearDiffers", { year: candidate.year || t("unknown").toLowerCase() }));
  }

  if (parsed.authorLead) {
    const authorText = normalizeText(candidate.authors.join(" "));
    const authorMatch = authorText.includes(normalizeText(parsed.authorLead));
    score += authorMatch ? 8 : -4;
    notes.push(note(authorMatch ? "noteLeadAuthorMatches" : "noteLeadAuthorMissing"));
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

function note(key, params = {}) {
  return { key, params };
}

function formatNote(value) {
  if (typeof value === "string") return value;
  return t(value.key, value.params);
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
    score: 0,
    candidate: null,
    notes: [note("noteLookupFailed", { message: error.message })]
  };
}

function getStatusLabel(status) {
  if (status === "verified") return t("statusVerified");
  if (status === "review") return t("statusReview");
  return t("statusMissing");
}

function renderResult(result) {
  const node = resultTemplate.content.firstElementChild.cloneNode(true);
  const status = node.querySelector(".result-status");
  status.textContent = getStatusLabel(result.status);
  status.classList.add(result.status);
  node.querySelector(".result-score").textContent = t("confidence", { score: result.score });
  node.querySelector(".result-title").textContent = result.candidate?.title || result.parsed.title || t("untitledReference");
  node.querySelector(".result-original").textContent = result.reference;

  const comparison = node.querySelector(".comparison-list");
  const rows = [
    [t("source"), result.candidate?.source || t("none")],
    ["DOI", result.candidate?.doi || result.parsed.doi || t("notDetected")],
    [t("year"), result.candidate?.year || t("unknown")],
    [t("journal"), result.candidate?.journal || t("unknown")],
    [t("notes"), result.notes.map(formatNote).join(" ")]
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
    sourceLink.textContent = t("sourceRecord");
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
      <h3>${t("emptyTitle")}</h3>
      <p>${t("emptyText")}</p>
    </div>
  `;
}

function renderResults() {
  resultsList.replaceChildren();

  if (!latestResults.length) {
    renderEmptyState();
    return;
  }

  const visibleResults = resultFilter === "verified"
    ? latestResults.filter((result) => result.status === "verified")
    : latestResults;

  if (!visibleResults.length) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>${t("noVerifiedResults")}</h3>
        <p>${t("emptyText")}</p>
      </div>
    `;
    return;
  }

  visibleResults.forEach(renderResult);
}

function updateResultActions() {
  const hasResults = latestResults.length > 0;
  const hasVerified = latestResults.some((result) => result.status === "verified");
  downloadButton.disabled = !hasResults;
  feedbackButton.disabled = !hasVerified;
  feedbackButton.textContent = resultFilter === "verified" ? t("showAllButton") : t("feedbackButton");
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
  summaryStatus.textContent = t("checkedCount", { count: results.length });
}

function setBusy(isBusy, busyLabel = "checkingButton") {
  checkButton.disabled = isBusy;
  doiButton.disabled = isBusy;
  doiInput.disabled = isBusy;
  sampleButton.disabled = isBusy;
  clearButton.disabled = isBusy;
  feedbackButton.disabled = isBusy || !latestResults.some((result) => result.status === "verified");
  downloadButton.disabled = isBusy || !latestResults.length;
  checkButton.textContent = isBusy ? t(busyLabel) : t("checkButton");
}

function setStatus(key, tone, params = {}) {
  currentStatus = { key, tone, params };
  networkStatus.textContent = t(key, params);
  networkStatus.className = `pill ${tone}`;
}

function toCsv(results) {
  const rows = [
    [t("csvStatus"), t("csvConfidence"), t("csvInputReference"), t("csvMatchedTitle"), t("csvSource"), t("csvDoi"), t("csvYear"), t("csvJournal"), t("csvNotes")]
  ];
  for (const result of results) {
    rows.push([
      getStatusLabel(result.status),
      result.score,
      result.reference,
      result.candidate?.title || "",
      result.candidate?.source || "",
      result.candidate?.doi || "",
      result.candidate?.year || "",
      result.candidate?.journal || "",
      result.notes.map(formatNote).join(" ")
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

setLanguage(currentLanguage);
