// lib/archive.js
//
// Reads archive entries from content/archive/*.md at request time.
//
// The archive is deliberately file-based, not a database. An archive is a
// durable, version-controlled record: each entry is a Markdown file committed to
// the repo, so its history is auditable and it costs nothing to host. Adding an
// entry is a commit, which is the right shape for considered, permanent writing
// about the Zcash ecosystem rather than a live feed.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const ARCHIVE_DIR = path.join(process.cwd(), "content", "archive");

// Configure marked once. GitHub-flavoured line breaks off (we write real
// paragraphs), headings and lists on. No raw HTML is emitted from untrusted
// input because every entry is authored in-repo, not user-submitted.
marked.setOptions({
  gfm: true,
  breaks: false,
});

function readDir() {
  try {
    return fs.readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    // No archive dir yet, or unreadable. An empty archive is a valid state.
    return [];
  }
}

/**
 * All entries, newest first, without the rendered body. Used for the index.
 * Each entry's slug is its filename without the .md extension.
 */
export function getAllEntries() {
  return readDir()
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(ARCHIVE_DIR, file), "utf8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        date: data.date || null,
        summary: data.summary || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    })
    .sort((a, b) => {
      // Newest first. Entries without a date sort to the bottom.
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
}

/**
 * One entry with its rendered HTML body, or null if the slug does not exist.
 */
export function getEntry(slug) {
  // Guard against path traversal: a slug is a bare filename, nothing else.
  if (!slug || slug.includes("/") || slug.includes("..") || slug.includes("\\")) {
    return null;
  }
  const file = path.join(ARCHIVE_DIR, `${slug}.md`);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    date: data.date || null,
    summary: data.summary || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    sources: Array.isArray(data.sources) ? data.sources : [],
    html: marked.parse(content),
  };
}

/** Slugs only, for generateStaticParams. */
export function getAllSlugs() {
  return readDir().map((f) => f.replace(/\.md$/, ""));
}
