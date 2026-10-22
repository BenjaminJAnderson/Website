export type CommandGroup = "navigate" | "projects" | "utility";

export type CommandAction =
  | { type: "navigate"; href: string }
  | { type: "help" }
  | { type: "sections" }
  | { type: "profile" }
  | { type: "path" }
  | { type: "date" }
  | { type: "clear" }
  | { type: "uninstall" }
  | { type: "list-projects" };

export interface SiteCommand {
  id: string;
  label: string;
  description: string;
  group: CommandGroup;
  aliases?: string[];
  keywords?: string[];
  action: CommandAction;
}

export interface ProjectCommandInput {
  slug: string;
  title: string;
  summary: string;
}

export const staticCommands: SiteCommand[] = [
  {
    id: "help",
    label: "Help",
    description: "Show every available command.",
    group: "utility",
    aliases: ["?"],
    keywords: ["commands", "usage", "help"],
    action: { type: "help" },
  },
  {
    id: "about",
    label: "About",
    description: "Profile, tools and current work.",
    group: "navigate",
    aliases: ["cd about", "go about"],
    keywords: ["profile", "bio", "who"],
    action: { type: "navigate", href: "/about/" },
  },
  {
    id: "projects",
    label: "Projects",
    description: "Browse hardware, firmware and software case studies.",
    group: "navigate",
    aliases: ["work", "cd projects", "go projects"],
    keywords: ["case studies", "portfolio"],
    action: { type: "navigate", href: "/projects/" },
  },
  {
    id: "open",
    label: "Open project",
    description: "Open a project by name, for example open cube.",
    group: "projects",
    keywords: ["project", "case study"],
    action: { type: "list-projects" },
  },
  {
    id: "contact",
    label: "Contact",
    description: "Email, GitHub, LinkedIn and other links.",
    group: "navigate",
    aliases: ["email", "mail", "cd contact", "go contact"],
    keywords: ["email", "github", "linkedin"],
    action: { type: "navigate", href: "/contact/" },
  },
  {
    id: "cv",
    label: "CV",
    description: "Download the current CV as a PDF.",
    group: "navigate",
    aliases: ["resume", "download cv"],
    keywords: ["resume", "pdf"],
    action: { type: "navigate", href: "/cv/BenjaminAnderson-CV.pdf" },
  },
  {
    id: "home",
    label: "Home",
    description: "Return to the homepage.",
    group: "navigate",
    keywords: ["start", "index"],
    action: { type: "navigate", href: "/" },
  },
  {
    id: "ls",
    label: "List sections",
    description: "List the main sections of the site.",
    group: "utility",
    keywords: ["sections", "navigation"],
    action: { type: "sections" },
  },
  {
    id: "whoami",
    label: "Who am I",
    description: "Show a short profile summary.",
    group: "utility",
    aliases: ["profile", "me"],
    keywords: ["benjamin", "engineer", "bio"],
    action: { type: "profile" },
  },
  {
    id: "pwd",
    label: "Print path",
    description: "Print the current terminal path.",
    group: "utility",
    keywords: ["path", "where", "directory"],
    action: { type: "path" },
  },
  {
    id: "date",
    label: "Date",
    description: "Show the current date and time.",
    group: "utility",
    keywords: ["time", "today"],
    action: { type: "date" },
  },
  {
    id: "clear",
    label: "Clear",
    description: "Clear the terminal screen.",
    group: "utility",
    keywords: ["reset", "history"],
    action: { type: "clear" },
  },
  {
    id: "uninstall",
    label: "Uninstall",
    description:
      "Remove benji-portfolio-git and reset the website to the boot screen.",
    group: "utility",
    aliases: ["reset", "reboot"],
    keywords: ["boot", "replay", "reset", "install"],
    action: { type: "uninstall" },
  },
];

export function buildProjectCommands(
  projects: ProjectCommandInput[],
): SiteCommand[] {
  return projects.map((project) => ({
    id: `open-${project.slug}`,
    label: `Open ${project.title}`,
    description: project.summary,
    group: "projects",
    aliases: [
      ...new Set([
        `open ${project.slug}`,
        project.slug,
        project.title.toLowerCase(),
      ]),
    ],
    keywords: [
      ...new Set([project.slug, project.title, "project", "case study"]),
    ],
    action: { type: "navigate", href: `/projects/${project.slug}/` },
  }));
}
