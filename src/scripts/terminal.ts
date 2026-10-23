import {
  asciiCharsetOptions,
  defaultAsciiCharset,
  findAsciiCharsetOption,
  type AsciiCharsetOption,
} from "../data/ascii";
import { BOOT_SESSION_KEY } from "../data/boot";
import {
  logoArt,
  neofetchFacts,
  neofetchHeader,
  neofetchPalette,
  neofetchRule,
} from "../data/neofetch";
import { site } from "../data/site";
import type { SiteCommand } from "../data/commands";
import {
  CURSOR_TRAIL_STORAGE_KEY,
  cursorTrailOptions,
  defaultCursorTrail,
  findCursorTrailOption,
  normalizeCursorTrailPreference,
  type CursorTrailOption,
  type CursorTrailPreference,
} from "../data/trails";
import {
  THEME_STORAGE_KEY,
  defaultTheme,
  themeById,
  themes,
} from "../data/themes";
import { appendAnsi } from "../lib/ansi";
import {
  completeCommand,
  getCanonicalInput,
  groupCommands,
  normalizeInput,
  resolveCommand,
} from "../lib/commands";
import {
  completePath,
  listDirectory,
  normalizeRoute,
  resolvePath,
  type TerminalNode,
} from "../lib/terminal-fs";
import type { Theme } from "../lib/themes";
import {
  applyAsciiCharset,
  getActiveAsciiCharset,
  readAsciiCharsetPreference,
  resetAsciiCharsetPreference,
  saveAsciiCharsetPreference,
} from "./ascii-charset";
import { startBoot } from "./boot-pacman";
import { applyCursorTrail, destroyCursorTrail } from "./cursor-trail";
import { mountNeofetchLogo } from "./neofetch-logo";
import { mountTerminalCursor } from "./terminal-cursor";
import {
  mountTerminalEffects,
  type TerminalEffectsHandle,
} from "./terminal-effects";
import { mountTerminalRipple } from "./terminal-ripple";

const HISTORY_KEY = "engiebenji.terminal-history";
const PREVIOUS_ROUTE_KEY = "engiebenji.terminal-previous-route";
const NAVIGATION_RIPPLE_DELAY_MS = 250;
const HISTORY_LIMIT = 30;
const INTRO_COMMAND = "help";
const INTRO_START_DELAY_MS = 300;
const INTRO_TYPE_DELAY_MS = 95;
const INTRO_SUBMIT_DELAY_MS = 320;

const app = document.querySelector<HTMLElement>("[data-terminal-app]")!;
const output = document.querySelector<HTMLElement>("[data-terminal-output]")!;
const screen = document.querySelector<HTMLElement>(".terminal-screen")!;
const form = document.querySelector<HTMLFormElement>("[data-terminal-form]")!;
const input = document.querySelector<HTMLInputElement>(
  "[data-terminal-input]",
)!;
const status = document.querySelector<HTMLElement>("#terminal-status")!;
const commandData =
  document.querySelector<HTMLScriptElement>("#terminal-commands")!;
const fileSystemData = document.querySelector<HTMLScriptElement>(
  "#terminal-filesystem",
);

let commands: SiteCommand[] = [];

try {
  const parsed: unknown = JSON.parse(commandData.textContent ?? "[]");
  if (Array.isArray(parsed)) {
    commands = parsed as SiteCommand[];
  }
} catch {
  commands = [];
}

let fileSystem: TerminalNode = {
  name: "~",
  route: "/",
  kind: "dir",
  children: [],
};

try {
  const parsed: unknown = JSON.parse(fileSystemData?.textContent ?? "null");
  if (
    parsed &&
    typeof parsed === "object" &&
    (parsed as TerminalNode).kind === "dir"
  ) {
    fileSystem = parsed as TerminalNode;
  }
} catch {
  fileSystem = {
    name: "~",
    route: "/",
    kind: "dir",
    children: [],
  };
}

const currentPath = app.dataset.path ?? "~";
const currentRoute = normalizeRoute(app.dataset.route ?? "/");
let history = loadHistory();
let historyIndex = -1;
let historyMode = false;
let introTimer = 0;
let introToken = 0;
let introActive = false;
let cursorTrailPreference = readCursorTrailPreference();
let cursorTrailStarted = false;
let terminalEffects: TerminalEffectsHandle | null = null;
const logoHandles = new Set<() => void>();

input.addEventListener("input", () => {
  cancelIntro();
  historyMode = false;
  historyIndex = -1;
});

input.addEventListener("keydown", handleKeyDown);
form.addEventListener("submit", handleSubmit);
document.addEventListener("click", handleCommandClick);
document.addEventListener("pointerdown", cancelIntro, true);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelIntro();
  }
});
app.addEventListener("click", handleAppClick);
window.addEventListener("pagehide", destroyCursorTrail);
window.addEventListener("pagehide", destroyTerminalEffects);

const terminalCursor = mountTerminalCursor(input);
const promptCursor = document.querySelector<HTMLElement>(
  "[data-terminal-cursor]",
);
const terminalRipple = mountTerminalRipple();
window.addEventListener("pagehide", terminalRipple.destroy);

applyAsciiCharset(readAsciiCharsetPreference());
startBoot({ onReveal: revealTerminal, onEnter: finishBoot });
applyTheme(getActiveTheme(), false);

const pageLogo = document.querySelector<HTMLElement>("[data-neofetch-logo]");
if (pageLogo) {
  logoHandles.add(mountNeofetchLogo(pageLogo));
}

function loadHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed: unknown = JSON.parse(raw ?? "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(-HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveHistory(): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    return;
  }
}

function pushHistory(value: string): void {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "clear") {
    return;
  }

  history = [...history.filter((item) => item !== trimmed), trimmed].slice(
    -HISTORY_LIMIT,
  );
  saveHistory();
}

function setStatus(message: string): void {
  status.textContent = message;
}

function scrollOutput(): void {
  screen.scrollTop = screen.scrollHeight;
}

function appendLine(text: string, className = "terminal-line"): HTMLElement {
  const line = document.createElement("div");
  line.className = className;
  line.textContent = text;
  output.append(line);
  scrollOutput();
  return line;
}

function appendEcho(command: string): void {
  const echo = document.createElement("div");
  echo.className = "terminal-echo";

  const prompt = document.createElement("span");
  prompt.className = "terminal-echo__prompt";
  prompt.textContent = "$";

  echo.append(prompt, document.createTextNode(` ${command}`));
  output.append(echo);
  scrollOutput();
}

function appendCommandRow(command: SiteCommand): void {
  const row = document.createElement("div");
  row.className = "terminal-command-row";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "term-command";
  button.dataset.terminalCommand = getCanonicalInput(command);
  button.textContent = getCanonicalInput(command);

  const description = document.createElement("span");
  description.className = "terminal-dim";
  description.textContent = command.description;

  row.append(button, description);
  output.append(row);
  scrollOutput();
}

function appendLinkRow(href: string, label: string, description: string): void {
  const row = document.createElement("div");
  row.className = "terminal-command-row";

  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;

  const text = document.createElement("span");
  text.className = "terminal-dim";
  text.textContent = description;

  row.append(link, text);
  output.append(row);
  scrollOutput();
}

function appendInlineLinks(
  links: Array<{ label: string; href: string }>,
): void {
  const line = document.createElement("div");
  line.className = "terminal-line";

  links.forEach((item, index) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    line.append(link);

    if (index < links.length - 1) {
      line.append(document.createTextNode("  "));
    }
  });

  output.append(line);
  scrollOutput();
}

function renderHelp(): void {
  appendLine("available commands:", "terminal-line terminal-dim");

  for (const group of groupCommands(commands)) {
    appendLine(`${group.label.toLowerCase()}:`, "terminal-line terminal-group");

    for (const command of group.commands) {
      appendCommandRow(command);
    }
  }

  setStatus("Help displayed");
}

function renderSections(): void {
  appendLine("available sections:", "terminal-line terminal-dim");
  appendLinkRow("/about/", "about/", "profile and current work");
  appendLinkRow("/projects/", "projects/", "project index");
  appendLinkRow("/contact/", "contact/", "email and links");
  appendLinkRow(site.cv, "cv", "download the CV");
  setStatus("Sections listed");
}

function renderDirectory(target = ""): void {
  const result = resolvePath(fileSystem, currentRoute, target || ".");

  if (result.kind === "error") {
    renderError(
      `ls: cannot access '${target || "."}': No such file or directory`,
      [],
    );
    return;
  }

  if (result.node.kind === "file") {
    appendInlineLinks([{ label: result.node.name, href: result.node.route }]);
    setStatus(`File: ${result.node.name}`);
    return;
  }

  const entries = listDirectory(result.node);

  if (entries.length === 0) {
    appendLine("no entries.", "terminal-line terminal-dim");
    setStatus("Directory is empty");
    return;
  }

  appendInlineLinks(
    entries.map((entry) => ({
      label: entry.kind === "dir" ? `${entry.name}/` : entry.name,
      href: entry.route,
    })),
  );
  setStatus(
    `${entries.length} ${entries.length === 1 ? "entry" : "entries"} listed`,
  );
}

function readPreviousRoute(): string | undefined {
  try {
    const value = sessionStorage.getItem(PREVIOUS_ROUTE_KEY);
    return value ? normalizeRoute(value) : undefined;
  } catch {
    return undefined;
  }
}

function rememberRoute(route: string): void {
  try {
    sessionStorage.setItem(PREVIOUS_ROUTE_KEY, route);
  } catch {
    return;
  }
}

function navigateToDirectory(node: TerminalNode, delay = 0): void {
  if (node.kind !== "dir" || node.route === currentRoute) {
    return;
  }

  rememberRoute(currentRoute);

  if (delay > 0) {
    window.setTimeout(() => window.location.assign(node.route), delay);
    return;
  }

  window.location.assign(node.route);
}

function handleCd(target: string, delay = 0): void {
  if (target === "-") {
    const previous = readPreviousRoute();

    if (!previous) {
      renderError("cd: OLDPWD not set", []);
      return;
    }

    const result = resolvePath(fileSystem, currentRoute, previous);

    if (result.kind !== "found" || result.node.kind !== "dir") {
      renderError("cd: OLDPWD not set", []);
      return;
    }

    navigateToDirectory(result.node, delay);
    return;
  }

  const result = resolvePath(fileSystem, currentRoute, target || "/");

  if (result.kind === "error") {
    renderError(
      result.reason === "not-directory"
        ? `cd: not a directory: ${target}`
        : `cd: no such file or directory: ${target}`,
      [],
    );
    return;
  }

  if (result.node.kind !== "dir") {
    renderError(`cd: not a directory: ${target}`, []);
    return;
  }

  navigateToDirectory(result.node, delay);
}

function renderProjects(): void {
  appendLine("projects:", "terminal-line terminal-dim");

  for (const command of commands.filter(
    (item) => item.group === "projects" && item.id !== "open",
  )) {
    appendCommandRow(command);
  }

  setStatus("Projects listed");
}

function renderNeofetch(): void {
  const wrapper = document.createElement("div");
  wrapper.className = "term-neofetch term-neofetch--logo";

  const logoHost = document.createElement("div");
  logoHost.className = "term-neofetch__logo";
  logoHost.dataset.neofetchLogo = "";
  logoHost.setAttribute("aria-hidden", "true");

  const logo = document.createElement("pre");
  logo.className = "term-ascii";
  logo.dataset.neofetchLogoFallback = "";
  appendAnsi(logo, logoArt);
  logoHost.append(logo);

  const details = document.createElement("div");
  details.className = "term-neofetch__details";

  const header = document.createElement("p");
  header.className = "term-neofetch__header";
  appendAnsi(header, neofetchHeader);

  const rule = document.createElement("p");
  rule.className = "term-neofetch__rule";
  appendAnsi(rule, neofetchRule);

  const facts = document.createElement("dl");
  facts.className = "term-facts";

  for (const fact of neofetchFacts) {
    const label = document.createElement("dt");
    appendAnsi(label, fact.label);

    const value = document.createElement("dd");
    value.textContent = fact.value;

    facts.append(label, value);
  }

  const palette = document.createElement("pre");
  palette.className = "term-palette";
  palette.setAttribute("aria-hidden", "true");
  appendAnsi(palette, neofetchPalette);

  details.append(header, rule, facts, palette);
  wrapper.append(logoHost, details);
  output.append(wrapper);
  logoHandles.add(mountNeofetchLogo(logoHost));
  scrollOutput();
  setStatus("System information displayed");
}

function renderProfile(): void {
  appendLine(site.name, "terminal-line terminal-heading");
  appendLine(site.role, "terminal-line");
  appendLine(
    "hardware design, embedded systems and PCB development",
    "terminal-line terminal-muted",
  );
  appendInlineLinks([
    { label: "github", href: site.github },
    { label: "linkedin", href: site.linkedin },
    { label: "email", href: `mailto:${site.email}` },
    { label: "about", href: "/about/" },
  ]);
  setStatus("Profile displayed");
}

function getActiveTheme(): Theme {
  const id = document.documentElement.dataset.theme;
  return (id ? themeById.get(id) : undefined) ?? defaultTheme;
}

function applyTheme(theme: Theme, persist = true): void {
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.style.colorScheme = theme.mode;

  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );

  if (meta) {
    meta.content = theme.colors.background;
  }

  if (!persist) {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    return;
  }
}

function appendThemeRow(theme: Theme): void {
  const row = document.createElement("div");
  row.className = "terminal-command-row";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "term-command";
  button.dataset.terminalCommand = `theme ${theme.id}`;
  button.textContent = theme.id;

  const description = document.createElement("span");
  description.className = "terminal-dim";
  const current = theme.id === getActiveTheme().id ? " · current" : "";
  description.textContent = `${theme.name} · ${theme.mode}${current}`;

  row.append(button, description);
  output.append(row);
}

function renderThemeList(): void {
  appendLine("themes:", "terminal-line terminal-dim");

  for (const theme of themes) {
    appendThemeRow(theme);
  }

  scrollOutput();
  setStatus(`${themes.length} themes listed`);
}

function renderCurrentTheme(): void {
  const theme = getActiveTheme();

  appendLine(`${theme.name} (${theme.id})`, "terminal-line terminal-heading");
  appendLine(`mode: ${theme.mode}`, "terminal-line terminal-dim");
  appendLine(
    `background: ${theme.colors.background}`,
    "terminal-line terminal-dim",
  );
  appendLine(`accent: ${theme.colors.accent}`, "terminal-line terminal-dim");
  appendLine("run theme list to see all themes", "terminal-line terminal-dim");
  setStatus(`Current theme: ${theme.name}`);
}

function handleTheme(query: string): void {
  if (query === "list") {
    renderThemeList();
    return;
  }

  if (query === "current") {
    renderCurrentTheme();
    return;
  }

  if (query === "reset") {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {}

    applyTheme(defaultTheme, false);
    appendLine(
      `theme reset to ${defaultTheme.name} (${defaultTheme.id}).`,
      "terminal-line",
    );
    setStatus(`Theme reset to ${defaultTheme.name}`);
    return;
  }

  const theme = themeById.get(query);

  if (!theme) {
    renderError(`No theme matching “${query}”.`, []);
    return;
  }

  applyTheme(theme);
  appendLine(`theme set to ${theme.name} (${theme.id}).`, "terminal-line");
  setStatus(`Theme: ${theme.name}`);
}

function appendAsciiCharsetRow(option: AsciiCharsetOption): void {
  const row = document.createElement("div");
  row.className = "terminal-command-row";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "term-command";
  button.dataset.terminalCommand = `ascii ${option.id}`;
  button.textContent = option.id;

  const description = document.createElement("span");
  description.className = "terminal-dim";
  const current = option.id === getActiveAsciiCharset() ? " · current" : "";
  description.textContent = `${option.chars.trim()} · ${option.label}${current}`;

  row.append(button, description);
  output.append(row);
}

function renderAsciiCharsetList(): void {
  appendLine("ascii characters:", "terminal-line terminal-dim");

  for (const option of asciiCharsetOptions) {
    appendAsciiCharsetRow(option);
  }

  scrollOutput();
  setStatus(`${asciiCharsetOptions.length} ASCII character sets listed`);
}

function renderCurrentAsciiCharset(): void {
  const option = findAsciiCharsetOption(getActiveAsciiCharset());

  if (!option) {
    return;
  }

  appendLine(
    `ascii characters: ${option.id}`,
    "terminal-line terminal-heading",
  );
  appendLine(`name: ${option.label}`, "terminal-line terminal-dim");
  appendLine(`chars: ${option.chars}`, "terminal-line terminal-dim");
  appendLine(`glyphs: ${option.chars.trim()}`, "terminal-line terminal-dim");
  setStatus(`ASCII characters: ${option.label}`);
}

function setAsciiCharset(id: string): void {
  const option = findAsciiCharsetOption(id);

  if (!option) {
    renderError(`No ASCII character set matching “${id}”.`, []);
    return;
  }

  applyAsciiCharset(option.id);
  saveAsciiCharsetPreference(option.id);
  appendLine(
    `ascii characters set to ${option.label} (${option.id}).`,
    "terminal-line",
  );
  setStatus(`ASCII characters: ${option.label}`);
}

function handleAsciiCharset(query: string): void {
  if (query === "list") {
    renderAsciiCharsetList();
    return;
  }

  if (query === "current") {
    renderCurrentAsciiCharset();
    return;
  }

  if (query === "reset") {
    resetAsciiCharsetPreference();
    applyAsciiCharset(defaultAsciiCharset);

    const option = findAsciiCharsetOption(defaultAsciiCharset);
    appendLine(
      `ascii characters reset to ${option?.label ?? defaultAsciiCharset}.`,
      "terminal-line",
    );
    setStatus(`ASCII characters: ${option?.label ?? defaultAsciiCharset}`);
    return;
  }

  setAsciiCharset(query);
}

function readCursorTrailPreference(): CursorTrailPreference {
  try {
    return normalizeCursorTrailPreference(
      localStorage.getItem(CURSOR_TRAIL_STORAGE_KEY),
    );
  } catch {
    return defaultCursorTrail;
  }
}

function saveCursorTrailPreference(preference: CursorTrailPreference): void {
  try {
    localStorage.setItem(CURSOR_TRAIL_STORAGE_KEY, preference);
  } catch {
    return;
  }
}

function appendCursorTrailRow(option: CursorTrailOption): void {
  const row = document.createElement("div");
  row.className = "terminal-command-row";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "term-command";
  button.dataset.terminalCommand = `cursor ${option.id}`;
  button.textContent = option.id;

  const description = document.createElement("span");
  description.className = "terminal-dim";
  const current = option.id === cursorTrailPreference ? " · current" : "";
  description.textContent = `${option.description}${current}`;

  row.append(button, description);
  output.append(row);
}

function renderCursorTrailList(): void {
  appendLine("cursor trails:", "terminal-line terminal-dim");

  for (const option of cursorTrailOptions) {
    appendCursorTrailRow(option);
  }

  scrollOutput();
  setStatus(`${cursorTrailOptions.length} cursor trails listed`);
}

function renderCurrentCursorTrail(): void {
  const option =
    findCursorTrailOption(cursorTrailPreference) ??
    findCursorTrailOption(defaultCursorTrail);

  if (!option) {
    return;
  }

  appendLine(`cursor trail: ${option.id}`, "terminal-line terminal-heading");
  appendLine(option.description, "terminal-line terminal-dim");
  setStatus(`Cursor trail: ${option.id}`);
}

function setCursorTrail(preference: CursorTrailPreference): void {
  cursorTrailPreference = preference;
  cursorTrailStarted = true;
  saveCursorTrailPreference(preference);

  const handle = applyCursorTrail(preference);

  if (preference === "off") {
    appendLine("cursor trail disabled.", "terminal-line");
    setStatus("Cursor trail disabled");
    return;
  }

  const option = findCursorTrailOption(preference);
  appendLine(
    `cursor trail set to ${option?.label ?? preference}.`,
    "terminal-line",
  );

  if (!handle || !handle.supported) {
    appendLine(
      "cursor trail is unavailable on this device.",
      "terminal-line terminal-dim",
    );
  }

  setStatus(`Cursor trail: ${option?.label ?? preference}`);
}

function handleCursorTrail(query: string): void {
  if (query === "list") {
    renderCursorTrailList();
    return;
  }

  if (query === "current") {
    renderCurrentCursorTrail();
    return;
  }

  if (query === "reset") {
    setCursorTrail(defaultCursorTrail);
    return;
  }

  if (query === "off") {
    setCursorTrail("off");
    return;
  }

  const option = findCursorTrailOption(query);

  if (!option) {
    renderError(`No cursor trail matching “${query}”.`, []);
    return;
  }

  setCursorTrail(option.id);
}

function renderDate(): void {
  appendLine(
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date()),
  );
  setStatus("Date displayed");
}

function renderError(message: string, suggestions: SiteCommand[]): void {
  appendLine(message, "terminal-line terminal-error");

  if (suggestions.length > 0) {
    appendLine("did you mean:", "terminal-line terminal-dim");

    for (const suggestion of suggestions) {
      appendCommandRow(suggestion);
    }
  }

  setStatus(message);
}

function destroyLogos(): void {
  for (const destroy of logoHandles) {
    destroy();
  }

  logoHandles.clear();
}

function clearTerminal(): void {
  destroyLogos();
  output.replaceChildren();
  input.value = "";
  terminalCursor.sync();
  historyMode = false;
  historyIndex = -1;
  setStatus("Terminal cleared");
  focusInput();
}

function focusInput(): void {
  if (window.matchMedia("(pointer: fine)").matches) {
    input.focus();
  }
}

function handleAction(action: SiteCommand["action"]): void {
  switch (action.type) {
    case "navigate":
      window.location.assign(action.href);
      return;
    case "help":
      renderHelp();
      return;
    case "sections":
      renderSections();
      return;
    case "list-projects":
      renderProjects();
      return;
    case "neofetch":
      renderNeofetch();
      return;
    case "theme":
      handleTheme(action.query);
      return;
    case "ascii":
      handleAsciiCharset(action.query);
      return;
    case "cursor-trail":
      handleCursorTrail(action.query);
      return;
    case "profile":
      renderProfile();
      return;
    case "path":
      appendLine(currentPath);
      setStatus("Path displayed");
      return;
    case "change-directory":
      handleCd("");
      return;
    case "list-directory":
      renderDirectory();
      return;
    case "date":
      renderDate();
      return;
    case "clear":
      clearTerminal();
      return;
    case "uninstall":
      try {
        sessionStorage.removeItem(BOOT_SESSION_KEY);
      } catch {
        // Reloading still gives a fresh boot attempt when storage is unavailable.
      }

      appendLine(
        ":: removing benji-portfolio-git...",
        "terminal-line terminal-dim",
      );
      window.setTimeout(() => window.location.reload(), 450);
      return;
  }
}

function ensureTerminalEffects(): void {
  if (!terminalEffects) {
    terminalEffects = mountTerminalEffects(output);
  }
}

function destroyTerminalEffects(): void {
  terminalEffects?.stop();
  terminalEffects = null;
}

function execute(raw: string, withRipple = true, reveal = true): void {
  const command = normalizeInput(raw);

  if (!command) {
    return;
  }

  const rippled =
    withRipple && promptCursor ? terminalRipple.trigger(promptCursor) : false;

  if (command === "clear") {
    clearTerminal();
    return;
  }

  if (reveal) {
    ensureTerminalEffects();
  }

  pushHistory(command);
  appendEcho(command);
  input.value = "";
  terminalCursor.sync();
  historyMode = false;
  historyIndex = -1;

  if (command === "cd" || command.startsWith("cd ")) {
    handleCd(command.slice(3).trim(), rippled ? NAVIGATION_RIPPLE_DELAY_MS : 0);
    focusInput();
    return;
  }

  if (command === "ls" || command.startsWith("ls ")) {
    renderDirectory(command.slice(3).trim());
    focusInput();
    return;
  }

  const resolution = resolveCommand(command, commands, themes);

  if (resolution.kind === "success") {
    const action = resolution.command.action;

    if (action.type === "navigate" && rippled) {
      window.setTimeout(
        () => window.location.assign(action.href),
        NAVIGATION_RIPPLE_DELAY_MS,
      );
    } else {
      handleAction(action);
    }

    focusInput();
    return;
  }

  if (resolution.kind === "error") {
    renderError(resolution.message, resolution.suggestions);
  } else {
    appendLine("type a command, or type help", "terminal-line terminal-dim");
  }

  focusInput();
}

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault();
  cancelIntro();
  execute(input.value);
}

function getShellCommand(inputValue: string): "cd" | "ls" | undefined {
  const match = /^(cd|ls)(?=\s|$)/i.exec(inputValue.trimStart());
  const command = match?.[1]?.toLowerCase();

  return command === "cd" || command === "ls" ? command : undefined;
}

function handleKeyDown(event: KeyboardEvent): void {
  cancelIntro();

  if (event.key === "ArrowUp") {
    event.preventDefault();

    if (history.length === 0) {
      return;
    }

    if (!historyMode) {
      if (input.value) {
        return;
      }

      historyMode = true;
      historyIndex = history.length - 1;
    } else if (historyIndex > 0) {
      historyIndex -= 1;
    }

    input.value = history[historyIndex] ?? "";
    terminalCursor.sync();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    if (!historyMode) {
      return;
    }

    if (historyIndex < history.length - 1) {
      historyIndex += 1;
      input.value = history[historyIndex] ?? "";
      terminalCursor.sync();
    } else {
      historyMode = false;
      historyIndex = -1;
      input.value = "";
      terminalCursor.sync();
    }

    return;
  }

  if (event.key === "Tab") {
    if (!input.value.trim()) {
      return;
    }

    const shellCommand = getShellCommand(input.value);

    if (shellCommand) {
      event.preventDefault();
      const completion = completePath(
        input.value,
        fileSystem,
        currentRoute,
        shellCommand,
      );

      if (completion) {
        input.value = completion;
        input.setSelectionRange(completion.length, completion.length);
        terminalCursor.sync();
        historyMode = false;
        historyIndex = -1;
      }

      return;
    }

    const completion = completeCommand(input.value, commands, themes);

    if (completion) {
      event.preventDefault();
      input.value = completion;
      terminalCursor.sync();
      historyMode = false;
      historyIndex = -1;
    }

    return;
  }

  if (event.key === "Escape") {
    input.value = "";
    terminalCursor.sync();
    historyMode = false;
    historyIndex = -1;
    return;
  }

  if (event.key.toLowerCase() === "l" && event.ctrlKey) {
    event.preventDefault();
    clearTerminal();
  }
}

function handleCommandClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest<HTMLElement>("[data-terminal-command]");

  if (!button) {
    return;
  }

  event.preventDefault();
  const command = button.dataset.terminalCommand ?? "";
  execute(command);
}

function handleAppClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  if (event.target.closest("a, button, input, textarea, select")) {
    return;
  }

  focusInput();
}

function revealTerminal(): void {
  form.hidden = false;
}

function finishBoot(freshBoot: boolean): void {
  const boot = document.querySelector<HTMLElement>("[data-terminal-boot]");

  if (boot) {
    boot.hidden = true;
  }

  form.hidden = false;
  input.focus();
  terminalCursor.sync();
  terminalRipple.prime();

  if (!cursorTrailStarted) {
    cursorTrailStarted = true;
    applyCursorTrail(cursorTrailPreference);
  }

  if (freshBoot) {
    startIntroCommand();
  }
}

function startIntroCommand(): void {
  if (currentPath !== "~") {
    return;
  }

  cancelIntro();
  introActive = true;

  const token = ++introToken;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const submit = (): void => {
    if (!introActive || token !== introToken) {
      return;
    }

    submitIntroCommand();
  };

  if (reducedMotion) {
    setIntroValue(INTRO_COMMAND);
    introTimer = window.setTimeout(submit, INTRO_START_DELAY_MS);
    return;
  }

  let index = 0;

  const typeNext = (): void => {
    if (!introActive || token !== introToken) {
      return;
    }

    index += 1;
    setIntroValue(INTRO_COMMAND.slice(0, index));

    if (index < INTRO_COMMAND.length) {
      introTimer = window.setTimeout(typeNext, INTRO_TYPE_DELAY_MS);
      return;
    }

    introTimer = window.setTimeout(submit, INTRO_SUBMIT_DELAY_MS);
  };

  introTimer = window.setTimeout(typeNext, INTRO_START_DELAY_MS);
}

function setIntroValue(value: string): void {
  input.value = value;

  if (document.activeElement === input) {
    input.setSelectionRange(value.length, value.length);
  }

  terminalCursor.sync();
}

function submitIntroCommand(): void {
  if (!introActive) {
    return;
  }

  introActive = false;
  introToken += 1;
  window.clearTimeout(introTimer);
  introTimer = 0;

  execute(INTRO_COMMAND, false, false);
}

function cancelIntro(): void {
  if (!introActive) {
    return;
  }

  introActive = false;
  introToken += 1;
  window.clearTimeout(introTimer);
  introTimer = 0;
}
