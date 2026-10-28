#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "scripts", "project-sources.json");
const defaultTimeoutMs = 12_000;
const statuses = new Set(["shipped", "in-progress", "prototype", "archived"]);
const requiredFields = [
  "title",
  "summary",
  "status",
  "year",
  "cover",
  "coverAlt",
  "tech",
];

export function parseProjectMarkdown(text) {
  if (typeof text !== "string") {
    return {
      frontmatter: null,
      body: "",
      errors: ["content is not text"],
    };
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(
    text,
  );

  if (!match) {
    return {
      frontmatter: null,
      body: "",
      errors: ["missing YAML frontmatter"],
    };
  }

  try {
    const frontmatter = parseYaml(match[1]);

    if (
      !frontmatter ||
      typeof frontmatter !== "object" ||
      Array.isArray(frontmatter)
    ) {
      return {
        frontmatter: null,
        body: match[2].trim(),
        errors: ["frontmatter is not an object"],
      };
    }

    return {
      frontmatter,
      body: match[2].trim(),
      errors: [],
    };
  } catch (error) {
    return {
      frontmatter: null,
      body: "",
      errors: [`invalid YAML: ${error instanceof Error ? error.message : error}`],
    };
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function checkImage(cachePath, reference, label, problems) {
  if (!cachePath || !isNonEmptyString(reference)) {
    return;
  }

  const imagePath = resolve(dirname(cachePath), reference);

  if (!existsSync(imagePath)) {
    problems.push(`${label} not found: ${reference}`);
  }
}

export function validateProjectMarkdown(text, options = {}) {
  const { cachePath } = options;
  const parsed = parseProjectMarkdown(text);
  const problems = [...parsed.errors];

  if (!parsed.frontmatter) {
    return { ...parsed, valid: false };
  }

  const { frontmatter, body } = parsed;

  for (const field of requiredFields) {
    if (!(field in frontmatter)) {
      problems.push(`missing field: ${field}`);
    }
  }

  if (!isNonEmptyString(frontmatter.title)) {
    problems.push("title must be a non-empty string");
  }

  if (!isNonEmptyString(frontmatter.summary)) {
    problems.push("summary must be a non-empty string");
  } else if (frontmatter.summary.length > 180) {
    problems.push("summary must be 180 characters or fewer");
  }

  if (!statuses.has(frontmatter.status)) {
    problems.push(
      `status must be one of: ${[...statuses].join(", ")}`,
    );
  }

  if (!Number.isInteger(frontmatter.year)) {
    problems.push("year must be an integer");
  }

  if (!isNonEmptyString(frontmatter.cover)) {
    problems.push("cover must be a non-empty path");
  } else {
    checkImage(cachePath, frontmatter.cover, "cover", problems);
  }

  if (!isNonEmptyString(frontmatter.coverAlt)) {
    problems.push("coverAlt must be a non-empty string");
  }

  if (!isStringArray(frontmatter.tech)) {
    problems.push("tech must be an array of strings");
  }

  if ("tags" in frontmatter && !isStringArray(frontmatter.tags)) {
    problems.push("tags must be an array of strings");
  }

  if ("role" in frontmatter && typeof frontmatter.role !== "string") {
    problems.push("role must be a string");
  }

  if ("period" in frontmatter && typeof frontmatter.period !== "string") {
    problems.push("period must be a string");
  }

  for (const field of ["date", "updated"]) {
    if (!(field in frontmatter)) {
      continue;
    }

    const value = frontmatter[field];
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      problems.push(`${field} must be a valid date`);
    }
  }

  if ("repo" in frontmatter && !isUrl(frontmatter.repo)) {
    problems.push("repo must be a valid URL");
  }

  if ("demo" in frontmatter && !isUrl(frontmatter.demo)) {
    problems.push("demo must be a valid URL");
  }

  if ("featured" in frontmatter && typeof frontmatter.featured !== "boolean") {
    problems.push("featured must be a boolean");
  }

  if ("draft" in frontmatter && typeof frontmatter.draft !== "boolean") {
    problems.push("draft must be a boolean");
  }

  if ("order" in frontmatter && typeof frontmatter.order !== "number") {
    problems.push("order must be a number");
  }

  if ("gallery" in frontmatter) {
    if (!Array.isArray(frontmatter.gallery)) {
      problems.push("gallery must be an array");
    } else {
      for (const [index, item] of frontmatter.gallery.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          problems.push(`gallery[${index}] must be an object`);
          continue;
        }

        if (!isNonEmptyString(item.alt)) {
          problems.push(`gallery[${index}].alt must be a non-empty string`);
        }

        if (!isNonEmptyString(item.src)) {
          problems.push(`gallery[${index}].src must be a non-empty path`);
        } else {
          checkImage(
            cachePath,
            item.src,
            `gallery[${index}].src`,
            problems,
          );
        }

        if ("caption" in item && typeof item.caption !== "string") {
          problems.push(`gallery[${index}].caption must be a string`);
        }
      }
    }
  }

  if (body.length === 0) {
    problems.push("body must not be empty");
  }

  return {
    ...parsed,
    valid: problems.length === 0,
    errors: problems,
  };
}

export function buildRawUrl(project, ref) {
  const path = project.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const safeRef = ref
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://raw.githubusercontent.com/${project.repo}/${safeRef}/${path}`;
}

export function chooseProjectContent({
  remoteText,
  cacheText,
  localText,
  cachePath,
  preferLocal = false,
}) {
  const order = preferLocal
    ? [
        ["local", localText],
        ["remote", remoteText],
        ["cache", cacheText],
      ]
    : [
        ["remote", remoteText],
        ["cache", cacheText],
        ["local", localText],
      ];
  const failures = [];

  for (const [source, text] of order) {
    if (!isNonEmptyString(text)) {
      continue;
    }

    const result = validateProjectMarkdown(text, { cachePath });

    if (result.valid) {
      return { text, source, ...result };
    }

    failures.push({ source, errors: result.errors });
  }

  return { text: null, source: null, failures };
}

function readIfExists(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function isLocallyModified(relativePath) {
  if (!existsSync(join(root, ".git"))) {
    return false;
  }

  return (
    gitOutput([
      "status",
      "--porcelain",
      "--untracked-files=all",
      "--",
      relativePath,
    ]).length > 0
  );
}

function resolveRefs(project) {
  const refs = [];
  const activeRef =
    process.env.PROJECT_SYNC_REF?.trim() ||
    process.env.GITHUB_HEAD_REF?.trim() ||
    process.env.GITHUB_REF_NAME?.trim() ||
    gitOutput(["branch", "--show-current"]);

  if (activeRef) {
    refs.push(activeRef);
  }

  if (project.ref && !refs.includes(project.ref)) {
    refs.push(project.ref);
  }

  return refs;
}

async function fetchText(url, timeoutMs = defaultTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "engiebenji-project-sync" },
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    return { ok: true, text: await response.text() };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "request timed out"
          : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function syncProject(project, options) {
  const cachePath = join(root, project.cache);
  const localPath = join(root, project.path);
  const cacheText = readIfExists(cachePath);
  const localText = readIfExists(localPath);
  const preferLocal = options.local || isLocallyModified(project.path);
  const localIsValid =
    preferLocal && validateProjectMarkdown(localText, { cachePath }).valid;
  let remoteText = null;

  if (!options.offline && !localIsValid) {
    for (const ref of resolveRefs(project)) {
      const url = buildRawUrl(project, ref);
      const result = await fetchText(url);

      if (result.ok) {
        remoteText = result.text;
        break;
      }

      console.warn(
        `[projects] ${project.id}: could not fetch ${url} (${result.error})`,
      );
    }
  }

  const chosen = chooseProjectContent({
    remoteText,
    cacheText,
    localText,
    cachePath,
    preferLocal,
  });

  if (!chosen.text) {
    const details = chosen.failures
      .map((failure) => `  ${failure.source}: ${failure.errors.join("; ")}`)
      .join("\n");

    throw new Error(
      `[projects] ${project.id}: no valid Markdown source\n${details}`,
    );
  }

  if (chosen.text !== cacheText) {
    mkdirSync(dirname(cachePath), { recursive: true });
    const tempPath = `${cachePath}.tmp`;
    const output = chosen.text.endsWith("\n")
      ? chosen.text
      : `${chosen.text}\n`;

    writeFileSync(tempPath, output, "utf8");
    renameSync(tempPath, cachePath);
  }

  console.log(
    `[projects] ${project.id}: ${chosen.source} -> ${project.cache}`,
  );
}

async function main() {
  if (process.env.SKIP_PROJECT_SYNC === "1") {
    console.log("[projects] sync skipped (SKIP_PROJECT_SYNC=1)");
    return;
  }

  const args = new Set(process.argv.slice(2));
  const options = {
    offline: args.has("--offline"),
    local: args.has("--local"),
  };
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  for (const project of manifest.projects) {
    try {
      await syncProject(project, options);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : String(error),
      );
      process.exitCode = 1;
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
