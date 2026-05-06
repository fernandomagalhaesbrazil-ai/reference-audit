# Reference Audit

Reference Audit is a local browser prototype for checking whether thesis or manuscript references correspond to real scholarly records.

## What it does

- Accepts pasted references, PDF, TXT, Markdown, BibTeX, and RIS.
- Supports English and Portuguese interface text.
- Verifies a pasted DOI or DOI URL directly.
- Extracts likely reference lists from selectable-text PDFs.
- Detects DOI, year, inferred title, and lead author clues.
- Checks public metadata in Crossref and OpenAlex.
- Scores likely matches and labels each reference as `Verified`, `Needs Review`, or `Not Found`.
- Exports the audit results as CSV.

## Run it

Open `index.html` in a browser.

The browser needs internet access because lookups are made directly from the page to Crossref and OpenAlex. PDF import also loads Mozilla PDF.js from a CDN.

## Important limits

This app verifies bibliographic metadata, not scientific correctness. A `Verified` result means the citation appears to correspond to a real scholarly record with matching metadata. A `Needs Review` result should be checked manually, especially for old articles, books, chapters, preprints, references with translated titles, or malformed citation styles.

PDF extraction only works when the PDF contains selectable text. Scanned theses need OCR before upload.

The next useful additions are DOCX thesis import, PubMed-specific lookup for biomedical articles, batch reports per student, and institutional login/storage.
