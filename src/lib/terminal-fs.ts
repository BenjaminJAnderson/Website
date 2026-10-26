export type TerminalNodeKind = "dir" | "file";

export interface TerminalNode {
  name: string;
  route: string;
  kind: TerminalNodeKind;
  description?: string;
  children?: TerminalNode[];
}

export interface TerminalProjectInput {
  slug: string;
  summary: string;
}

export type TerminalPathResult =
  | { kind: "found"; node: TerminalNode }
  | { kind: "error"; reason: "not-found" | "not-directory"; path: string };

export type TerminalPathCommand = "cd" | "ls" | "cat";

const ROOT_NAME = "~";

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function findChild(node: TerminalNode, name: string): TerminalNode | undefined {
  const target = normalizeName(name);

  return node.children?.find((child) => normalizeName(child.name) === target);
}

function commonPrefix(values: string[]): string {
  if (values.length === 0) {
    return "";
  }

  let prefix = values[0] ?? "";

  for (const value of values.slice(1)) {
    while (prefix && !value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }

    if (!prefix) {
      return "";
    }
  }

  return prefix;
}

export function buildTerminalFileSystem(
  projects: TerminalProjectInput[],
  cvPath: string,
  cvDescription = "download the CV",
): TerminalNode {
  return {
    name: ROOT_NAME,
    route: "/",
    kind: "dir",
    children: [
      {
        name: "about",
        route: "/about/",
        kind: "dir",
        description: "profile and current work",
      },
      {
        name: "cv",
        route: cvPath,
        kind: "file",
        description: cvDescription,
      },
      {
        name: "projects",
        route: "/projects/",
        kind: "dir",
        description: "project index",
        children: projects.map((project) => ({
          name: project.slug,
          route: `/projects/${project.slug}/`,
          kind: "dir",
          description: project.summary,
        })),
      },
    ],
  };
}

export function normalizeRoute(route: string): string {
  const path = route.split(/[?#]/, 1)[0] ?? "";
  const segments = path.split("/").filter(Boolean);

  return segments.length > 0 ? `/${segments.join("/")}/` : "/";
}

export function parentRoute(route: string): string {
  const segments = normalizeRoute(route).split("/").filter(Boolean);
  segments.pop();

  return segments.length > 0 ? `/${segments.join("/")}/` : "/";
}

export function findNodeByRoute(
  root: TerminalNode,
  route: string,
): TerminalNode | undefined {
  const target = normalizeRoute(route);

  if (root.kind === "dir" && normalizeRoute(root.route) === target) {
    return root;
  }

  for (const child of root.children ?? []) {
    const match = findNodeByRoute(child, route);

    if (match) {
      return match;
    }
  }

  return undefined;
}

export function listDirectory(node: TerminalNode): TerminalNode[] {
  if (node.kind !== "dir") {
    return [];
  }

  return [...(node.children ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function resolvePath(
  root: TerminalNode,
  currentRoute: string,
  input: string,
): TerminalPathResult {
  const raw = input.trim();
  const current = findNodeByRoute(root, normalizeRoute(currentRoute)) ?? root;
  const absolute =
    raw === "~" ||
    raw.startsWith("~/") ||
    raw.startsWith("/") ||
    raw.startsWith("~");
  let node = absolute ? root : current;
  let path = raw;

  if (path === "~") {
    path = "";
  } else if (path.startsWith("~/")) {
    path = path.slice(2);
  } else if (path.startsWith("/")) {
    path = path.slice(1);
  }

  const segments = path.split("/").filter(Boolean);

  for (const segment of segments) {
    if (segment === ".") {
      continue;
    }

    if (node.kind !== "dir") {
      return { kind: "error", reason: "not-directory", path: raw };
    }

    if (segment === "..") {
      node = findNodeByRoute(root, parentRoute(node.route)) ?? root;
      continue;
    }

    const child = findChild(node, segment);

    if (!child) {
      return { kind: "error", reason: "not-found", path: raw };
    }

    node = child;
  }

  return { kind: "found", node };
}

function resolveCompletionBase(
  root: TerminalNode,
  currentRoute: string,
  pathText: string,
  parentText: string,
): TerminalNode | undefined {
  if (parentText) {
    const result = resolvePath(root, currentRoute, parentText);

    if (result.kind !== "found" || result.node.kind !== "dir") {
      return undefined;
    }

    return result.node;
  }

  if (pathText.startsWith("/") || pathText.startsWith("~")) {
    return root;
  }

  return findNodeByRoute(root, normalizeRoute(currentRoute)) ?? root;
}

export function completePath(
  input: string,
  root: TerminalNode,
  currentRoute: string,
  command: TerminalPathCommand,
): string | undefined {
  const trimmed = input.trimStart();
  const match = /^(cd|ls|cat)(?=\s|$)/i.exec(trimmed);

  if (!match || match[1]?.toLowerCase() !== command) {
    return undefined;
  }

  const rest = trimmed.slice(match[0].length).trim();

  if (!rest) {
    return `${command} `;
  }

  const lastSlash = rest.lastIndexOf("/");
  const parentText = lastSlash >= 0 ? rest.slice(0, lastSlash) : "";
  const partial = lastSlash >= 0 ? rest.slice(lastSlash + 1) : rest;
  const base = resolveCompletionBase(root, currentRoute, rest, parentText);

  if (!base || base.kind !== "dir") {
    return undefined;
  }

  const prefixText = rest.slice(0, rest.length - partial.length);
  const matches = (base.children ?? [])
    .filter(
      (entry) =>
        (command === "cd" ? entry.kind === "dir" : true) &&
        entry.name.toLowerCase().startsWith(partial.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (matches.length === 0) {
    return undefined;
  }

  if (matches.length === 1) {
    const matchNode = matches[0];

    if (!matchNode) {
      return undefined;
    }

    return `${command} ${prefixText}${matchNode.name}${
      matchNode.kind === "dir" ? "/" : ""
    }`;
  }

  const prefix = commonPrefix(matches.map((entry) => entry.name));

  if (prefix.length <= partial.length) {
    return undefined;
  }

  return `${command} ${prefixText}${prefix}`;
}
