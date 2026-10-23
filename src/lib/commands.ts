import {
  asciiCharsetOptions,
  findAsciiCharsetOption,
  normalizeAsciiCharsetQuery,
  type AsciiCharsetOption,
} from "../data/ascii";
import type { CommandGroup, SiteCommand } from "../data/commands";
import {
  cursorTrailOptions,
  findCursorTrailOption,
  normalizeCursorTrailQuery,
  type CursorTrailOption,
} from "../data/trails";
import { levenshtein } from "./similarity";
import { findTheme, suggestThemes, type Theme } from "./themes";

export interface ParsedCommand {
  name: string;
  args: string[];
}

export interface CommandResolutionSuccess {
  kind: "success";
  command: SiteCommand;
}

export interface CommandResolutionError {
  kind: "error";
  message: string;
  suggestions: SiteCommand[];
}

export type CommandResolution =
  CommandResolutionSuccess | CommandResolutionError | { kind: "empty" };

export const commandGroupOrder: CommandGroup[] = [
  "navigate",
  "projects",
  "utility",
];

export const commandGroupLabels: Record<CommandGroup, string> = {
  navigate: "Navigate",
  projects: "Projects",
  utility: "Utility",
};

export function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseCommand(input: string): ParsedCommand {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return { name: "", args: [] };
  }

  const [head, ...rest] = normalized.split(" ");

  if (head === "cd" || head === "go") {
    return { name: rest[0] ?? "", args: rest.slice(1) };
  }

  if (head === "open") {
    return { name: "open", args: rest };
  }

  return { name: head, args: rest };
}

export function findExactCommand(
  input: string,
  commands: SiteCommand[],
): SiteCommand | undefined {
  const normalized = normalizeInput(input);

  return commands.find(
    (command) =>
      command.id === normalized ||
      command.aliases?.some((alias) => normalizeInput(alias) === normalized),
  );
}

function searchText(command: SiteCommand): string {
  return [
    command.id,
    command.label,
    command.description,
    ...(command.aliases ?? []),
    ...(command.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function scoreCommand(command: SiteCommand, query: string): number {
  if (!query) {
    return 0;
  }

  const tokens = query.split(" ");
  const haystack = searchText(command);

  if (!tokens.every((token) => haystack.includes(token))) {
    return -1;
  }

  const id = command.id.toLowerCase();
  const label = command.label.toLowerCase();

  if (
    id === query ||
    command.aliases?.some((alias) => normalizeInput(alias) === query)
  ) {
    return 0;
  }

  if (label.startsWith(query)) {
    return 1;
  }

  if (label.includes(query)) {
    return 2;
  }

  return 3;
}

export function filterCommands(
  commands: SiteCommand[],
  query: string,
): SiteCommand[] {
  const normalized = normalizeInput(query);

  return commands
    .map((command) => ({ command, score: scoreCommand(command, normalized) }))
    .filter((entry) => entry.score >= 0)
    .sort(
      (a, b) =>
        a.score - b.score ||
        commandGroupOrder.indexOf(a.command.group) -
          commandGroupOrder.indexOf(b.command.group) ||
        a.command.label.localeCompare(b.command.label),
    )
    .map((entry) => entry.command);
}

export function groupCommands(
  commands: SiteCommand[],
): Array<{ group: CommandGroup; label: string; commands: SiteCommand[] }> {
  return commandGroupOrder
    .map((group) => ({
      group,
      label: commandGroupLabels[group],
      commands: commands.filter((command) => command.group === group),
    }))
    .filter((entry) => entry.commands.length > 0);
}

export function completeCommand(
  input: string,
  commands: SiteCommand[],
  themes: Theme[] = [],
): string | undefined {
  const parsed = parseCommand(input);

  if (parsed.name === "theme") {
    const query = parsed.args.join(" ");

    if (!query) {
      return "theme ";
    }

    if (query === "list" || query === "current" || query === "reset") {
      return `theme ${query}`;
    }

    const theme =
      findTheme(query, themes) ?? suggestThemes(query, themes, 1)[0];

    return theme ? `theme ${theme.id}` : undefined;
  }

  if (
    parsed.name === "ascii" ||
    parsed.name === "charset" ||
    parsed.name === "glyphs" ||
    parsed.name === "characters"
  ) {
    const query = parsed.args.join(" ");

    if (!query) {
      return `${parsed.name} `;
    }

    if (asciiCharsetCommands.includes(query)) {
      return `${parsed.name} ${query}`;
    }

    const option = findAsciiCharsetOption(query);

    if (option) {
      return `${parsed.name} ${option.id}`;
    }

    const normalized = normalizeAsciiCharsetQuery(query);
    const matches = [
      ...new Set([
        ...asciiCharsetOptions
          .filter((item) =>
            [item.id, item.label].some((value) =>
              normalizeAsciiCharsetQuery(value).startsWith(normalized),
            ),
          )
          .map((item) => item.id),
        ...asciiCharsetCommands.filter((value) =>
          normalizeAsciiCharsetQuery(value).startsWith(normalized),
        ),
      ]),
    ];

    if (matches.length === 0) {
      return undefined;
    }

    const first = matches[0];

    if (matches.length === 1 && first) {
      return `${parsed.name} ${first}`;
    }

    let prefix = normalizeAsciiCharsetQuery(first ?? "");

    for (const item of matches.slice(1)) {
      const value = normalizeAsciiCharsetQuery(item);

      while (prefix && !value.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    }

    return prefix.length > normalized.length
      ? `${parsed.name} ${prefix}`
      : undefined;
  }

  if (parsed.name === "cursor" || parsed.name === "trail") {
    const query = parsed.args.join(" ");

    if (!query) {
      return `${parsed.name} `;
    }

    if (
      query === "list" ||
      query === "current" ||
      query === "off" ||
      query === "reset"
    ) {
      return `${parsed.name} ${query}`;
    }

    const option = findCursorTrailOption(query);

    if (option) {
      return `${parsed.name} ${option.id}`;
    }

    const normalized = normalizeCursorTrailQuery(query);
    const matches = [
      ...new Set([
        ...cursorTrailOptions.map((item) => item.id),
        ...cursorTrailCommands,
      ]),
    ].filter((value) =>
      normalizeCursorTrailQuery(value).startsWith(normalized),
    );

    if (matches.length === 0) {
      return undefined;
    }

    const first = matches[0];

    if (matches.length === 1 && first) {
      return `${parsed.name} ${first}`;
    }

    let prefix = normalizeCursorTrailQuery(first ?? "");

    for (const item of matches.slice(1)) {
      const value = normalizeCursorTrailQuery(item);

      while (prefix && !value.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    }

    return prefix.length > normalized.length
      ? `${parsed.name} ${prefix}`
      : undefined;
  }

  const match = filterCommands(commands, input)[0];

  return match ? getCanonicalInput(match) : undefined;
}

export function suggestCommands(
  input: string,
  commands: SiteCommand[],
  limit = 3,
): SiteCommand[] {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return [];
  }

  const maxDistance = Math.max(3, Math.ceil(normalized.length * 0.45));

  return commands
    .map((command) => {
      const candidates = [
        command.id,
        command.label,
        ...(command.aliases ?? []),
        ...(command.keywords ?? []),
      ].map(normalizeInput);

      return {
        command,
        distance: Math.min(
          ...candidates.map((candidate) => levenshtein(normalized, candidate)),
        ),
      };
    })
    .filter((entry) => entry.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.command);
}

const asciiCharsetCommands = ["list", "current", "reset"];
const cursorTrailCommands = ["list", "current", "off", "reset"];

function withThemeQuery(
  commands: SiteCommand[],
  query: string,
): SiteCommand | undefined {
  const command = commands.find((item) => item.id === "theme");

  if (!command) {
    return undefined;
  }

  return { ...command, action: { type: "theme", query } };
}

function themeSuggestionCommand(theme: Theme): SiteCommand {
  return {
    id: `theme ${theme.id}`,
    label: theme.name,
    description: `${theme.name} · ${theme.mode} theme`,
    group: "utility",
    action: { type: "theme", query: theme.id },
  };
}

function withAsciiCharsetQuery(
  commands: SiteCommand[],
  query: string,
): SiteCommand | undefined {
  const command = commands.find((item) => item.id === "ascii");

  if (!command) {
    return undefined;
  }

  return { ...command, action: { type: "ascii", query } };
}

function asciiCharsetSuggestionCommand(
  option: AsciiCharsetOption,
): SiteCommand {
  return {
    id: `ascii ${option.id}`,
    label: option.label,
    description: `${option.label} · ${option.description}`,
    group: "utility",
    action: { type: "ascii", query: option.id },
  };
}

function withCursorTrailQuery(
  commands: SiteCommand[],
  query: string,
): SiteCommand | undefined {
  const command = commands.find((item) => item.id === "cursor");

  if (!command) {
    return undefined;
  }

  return { ...command, action: { type: "cursor-trail", query } };
}

function cursorTrailSuggestionCommand(option: CursorTrailOption): SiteCommand {
  return {
    id: `cursor ${option.id}`,
    label: option.label,
    description: option.description,
    group: "utility",
    action: { type: "cursor-trail", query: option.id },
  };
}

export function resolveCommand(
  input: string,
  commands: SiteCommand[],
  themes: Theme[] = [],
): CommandResolution {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return { kind: "empty" };
  }

  const exact = findExactCommand(normalized, commands);
  if (exact) {
    return { kind: "success", command: exact };
  }

  const parsed = parseCommand(normalized);

  if (parsed.name === "open") {
    if (parsed.args.length === 0) {
      const open = commands.find((command) => command.id === "open");
      if (open) {
        return { kind: "success", command: open };
      }
    }

    const projectQuery = parsed.args.join(" ");
    const project = commands.find(
      (command) =>
        command.group === "projects" &&
        command.id !== "open" &&
        (command.aliases?.includes(projectQuery) ||
          command.id === `open-${projectQuery}`),
    );

    if (project) {
      return { kind: "success", command: project };
    }

    return {
      kind: "error",
      message: `No project matching “${projectQuery}”.`,
      suggestions: suggestCommands(
        projectQuery,
        commands.filter((command) => command.group === "projects"),
      ),
    };
  }

  if (parsed.name === "theme") {
    const query = parsed.args.join(" ");
    const themeCommand = withThemeQuery(commands, "list");

    if (!themeCommand) {
      return {
        kind: "error",
        message: "Theme command is unavailable.",
        suggestions: [],
      };
    }

    if (!query || query === "list") {
      return { kind: "success", command: themeCommand };
    }

    if (query === "current" || query === "reset") {
      return {
        kind: "success",
        command: {
          ...themeCommand,
          action: { type: "theme", query },
        },
      };
    }

    const theme = findTheme(query, themes);

    if (theme) {
      return {
        kind: "success",
        command: {
          ...themeCommand,
          action: { type: "theme", query: theme.id },
        },
      };
    }

    return {
      kind: "error",
      message: `No theme matching “${query}”.`,
      suggestions: suggestThemes(query, themes).map(themeSuggestionCommand),
    };
  }

  if (
    parsed.name === "ascii" ||
    parsed.name === "charset" ||
    parsed.name === "glyphs" ||
    parsed.name === "characters"
  ) {
    const query = parsed.args.join(" ");
    const asciiCommand = withAsciiCharsetQuery(commands, "list");

    if (!asciiCommand) {
      return {
        kind: "error",
        message: "ASCII character command is unavailable.",
        suggestions: [],
      };
    }

    if (!query || query === "list") {
      return { kind: "success", command: asciiCommand };
    }

    if (query === "current" || query === "reset") {
      return {
        kind: "success",
        command: {
          ...asciiCommand,
          action: { type: "ascii", query },
        },
      };
    }

    const option = findAsciiCharsetOption(query);

    if (option) {
      return {
        kind: "success",
        command: {
          ...asciiCommand,
          action: { type: "ascii", query: option.id },
        },
      };
    }

    return {
      kind: "error",
      message: `No ASCII character set matching “${query}”.`,
      suggestions: asciiCharsetOptions.map(asciiCharsetSuggestionCommand),
    };
  }

  if (parsed.name === "cursor" || parsed.name === "trail") {
    const query = parsed.args.join(" ");
    const cursorCommand = withCursorTrailQuery(commands, "list");

    if (!cursorCommand) {
      return {
        kind: "error",
        message: "Cursor trail command is unavailable.",
        suggestions: [],
      };
    }

    if (!query || query === "list") {
      return { kind: "success", command: cursorCommand };
    }

    if (query === "current" || query === "off" || query === "reset") {
      return {
        kind: "success",
        command: {
          ...cursorCommand,
          action: { type: "cursor-trail", query },
        },
      };
    }

    const option = findCursorTrailOption(query);

    if (option) {
      return {
        kind: "success",
        command: {
          ...cursorCommand,
          action: { type: "cursor-trail", query: option.id },
        },
      };
    }

    return {
      kind: "error",
      message: `No cursor trail matching “${query}”.`,
      suggestions: cursorTrailOptions.map(cursorTrailSuggestionCommand),
    };
  }

  if (!parsed.name) {
    return {
      kind: "error",
      message: "Type a command, or type help to see what is available.",
      suggestions: [],
    };
  }

  const parsedExact = findExactCommand(parsed.name, commands);
  if (parsedExact) {
    return { kind: "success", command: parsedExact };
  }

  return {
    kind: "error",
    message: `No command matching “${normalized}”.`,
    suggestions: suggestCommands(normalized, commands),
  };
}

export function getCanonicalInput(command: SiteCommand): string {
  if (command.group === "projects" && command.id.startsWith("open-")) {
    return `open ${command.id.slice("open-".length)}`;
  }

  return command.id;
}
