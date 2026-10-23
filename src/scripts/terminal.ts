import { BOOT_SESSION_KEY } from "../data/boot";
import {
  archLogo,
  neofetchFacts,
  neofetchHeader,
  neofetchPalette,
  neofetchRule,
} from "../data/neofetch";
import { site } from "../data/site";
import type { SiteCommand } from "../data/commands";
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
import type { Theme } from "../lib/themes";
import { startBoot } from "./boot-pacman";

const HISTORY_KEY = "engiebenji.terminal-history";
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

let commands: SiteCommand[] = [];

try {
  const parsed: unknown = JSON.parse(commandData.textContent ?? "[]");
  if (Array.isArray(parsed)) {
    commands = parsed as SiteCommand[];
  }
} catch {
  commands = [];
}

const currentPath = app.dataset.path ?? "~";
let history = loadHistory();
let historyIndex = -1;
let historyMode = false;
let introTimer = 0;
let introToken = 0;
let introActive = false;

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

startBoot({ onReveal: revealTerminal, onEnter: finishBoot });
applyTheme(getActiveTheme(), false);

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
  appendLinkRow(site.cv, "cv/", "download the CV");
  setStatus("Sections listed");
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
  wrapper.className = "term-neofetch term-neofetch--arch";

  const logo = document.createElement("pre");
  logo.className = "term-ascii";
  logo.setAttribute("aria-hidden", "true");
  appendAnsi(logo, archLogo);

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
  wrapper.append(logo, details);
  output.append(wrapper);
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

function clearTerminal(): void {
  output.replaceChildren();
  input.value = "";
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
    case "profile":
      renderProfile();
      return;
    case "path":
      appendLine(currentPath);
      setStatus("Path displayed");
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

function execute(raw: string): void {
  const command = normalizeInput(raw);

  if (!command) {
    return;
  }

  if (command === "clear") {
    clearTerminal();
    return;
  }

  pushHistory(command);
  appendEcho(command);
  input.value = "";
  historyMode = false;
  historyIndex = -1;

  const resolution = resolveCommand(command, commands, themes);

  if (resolution.kind === "success") {
    handleAction(resolution.command.action);
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
    } else {
      historyMode = false;
      historyIndex = -1;
      input.value = "";
    }

    return;
  }

  if (event.key === "Tab") {
    if (!input.value.trim()) {
      return;
    }

    const completion = completeCommand(input.value, commands, themes);

    if (completion) {
      event.preventDefault();
      input.value = completion;
      historyMode = false;
      historyIndex = -1;
    }

    return;
  }

  if (event.key === "Escape") {
    input.value = "";
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
}

function submitIntroCommand(): void {
  if (!introActive) {
    return;
  }

  introActive = false;
  introToken += 1;
  window.clearTimeout(introTimer);
  introTimer = 0;

  execute(INTRO_COMMAND);
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
