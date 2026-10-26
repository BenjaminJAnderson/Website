export const site = {
  name: "Benjamin Anderson",
  user: "benji",
  host: "engiebenji.com",
  role: "Electronics engineer",
  description:
    "Portfolio of Benjamin Anderson, an electronics engineer building hardware, firmware and tools.",
  email: "thebenjaminjanderson@gmail.com",
  github: "https://github.com/BenjaminJAnderson",
  linkedin: "https://www.linkedin.com/in/engiebenji/",
  twitter: "https://twitter.com/engiebenji1999",
  cv: "/cv/",
  cvPdf: "/cv/BenjaminAnderson-CV.pdf",
} as const;

export const terminalIdentity = `${site.user}@${site.host}`;
