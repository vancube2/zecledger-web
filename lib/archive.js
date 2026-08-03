// lib/archive.js
//
// Reads archive entries from content/archive/. Two formats are supported:
//
//   *.md   - Markdown with front-matter, rendered into the site's own styling.
//   *.html - a fully-designed standalone document, kept intact and shown in an
//            isolated frame so its own layout and typography survive untouched.
//
// The archive is deliberately file-based, not a database: each entry is a file
// committed to the repo, so its history is auditable and adding an entry is a
// commit. That is the right shape for considered, permanent writing.
//
// HTML entries have no front-matter, so their metadata (date, summary, tags)
// comes from an optional sidecar JSON of the same name (foo.html -> foo.json),
// with the title falling back to the document's <title> tag.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const ARCHIVE_DIR = path.join(process.cwd(), "content", "archive");

marked.setOptions({ gfm: true, breaks: false });

function listFiles() {
  try {
    return fs.readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".html"));
  } catch {
    return [];
  }
}

function slugOf(file) {
  return file.replace(/\.(md|html)$/, "");
}

// Pull a value out of an HTML <title> tag.
function titleFromHtml(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

// Read the optional sidecar metadata for an HTML entry.
function sidecar(slug) {
  try {
    const raw = fs.readFileSync(path.join(ARCHIVE_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function metaFor(file) {
  const slug = slugOf(file);
  const full = path.join(ARCHIVE_DIR, file);
  const raw = fs.readFileSync(full, "utf8");

  if (file.endsWith(".md")) {
    const { data } = matter(raw);
    return {
      slug,
      format: "md",
      title: data.title || slug,
      date: data.date || null,
      summary: data.summary || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  }

  // html
  const meta = sidecar(slug);
  return {
    slug,
    format: "html",
    title: meta.title || titleFromHtml(raw) || slug,
    date: meta.date || null,
    summary: meta.summary || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
  };
}

/** All entries, newest first, without the body. For the index. */
export function getAllEntries() {
  return listFiles()
    .map(metaFor)
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
}

/** One entry with its rendered body (md) or raw document (html), or null. */
export function getEntry(slug) {
  if (!slug || slug.includes("/") || slug.includes("..") || slug.includes("\\")) {
    return null;
  }

  const mdFile = path.join(ARCHIVE_DIR, `${slug}.md`);
  const htmlFile = path.join(ARCHIVE_DIR, `${slug}.html`);

  // Markdown entry
  if (fs.existsSync(mdFile)) {
    const raw = fs.readFileSync(mdFile, "utf8");
    const { data, content } = matter(raw);
    return {
      slug,
      format: "md",
      title: data.title || slug,
      date: data.date || null,
      summary: data.summary || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      html: marked.parse(content),
    };
  }

  // HTML entry: return the full document string, to be shown in an iframe.
  if (fs.existsSync(htmlFile)) {
    const raw = fs.readFileSync(htmlFile, "utf8");
    const meta = sidecar(slug);
    return {
      slug,
      format: "html",
      title: meta.title || titleFromHtml(raw) || slug,
      date: meta.date || null,
      summary: meta.summary || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      sources: Array.isArray(meta.sources) ? meta.sources : [],
      document: raw,
    };
  }

  return null;
}

/** Slugs only, for generateStaticParams. */
export function getAllSlugs() {
  return listFiles().map(slugOf);
}
