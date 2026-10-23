import { site } from "./site";

export interface ContactChannel {
  id: string;
  index: string;
  label: string;
  glyph: string;
  title: string;
  description: string;
  value: string;
  href: string;
  action: string;
  rel?: string;
  copy?: boolean;
}

export const contactChannels: readonly ContactChannel[] = [
  {
    id: "email",
    index: "01",
    label: "EMAIL",
    glyph: "@",
    title: "Direct message",
    description: "Preferred contact",
    value: site.email,
    href: `mailto:${site.email}`,
    action: "OPEN",
    copy: true,
  },
  {
    id: "github",
    index: "02",
    label: "GITHUB",
    glyph: "git",
    title: "Code & projects",
    description: "Repositories / commits",
    value: "github.com/BenjaminJAnderson",
    href: site.github,
    action: "INSPECT",
    rel: "me",
  },
  {
    id: "linkedin",
    index: "03",
    label: "LINKEDIN",
    glyph: "in",
    title: "Professional network",
    description: "Experience / career",
    value: "linkedin.com/in/engiebenji",
    href: site.linkedin,
    action: "CONNECT",
    rel: "me",
  },
  {
    id: "twitter",
    index: "04",
    label: "SOCIAL",
    glyph: "x",
    title: "Twitter / X",
    description: "Occasional updates",
    value: "@engiebenji1999",
    href: site.twitter,
    action: "VIEW",
    rel: "me",
  },
];
