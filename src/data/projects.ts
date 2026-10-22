export interface Project {
  slug: string;
  title: string;
  summary: string;
  status: string;
  year: string;
  tech: string[];
  image: string;
  imageAlt: string;
  href: string;
  repo: string;
}

export const projects: Project[] = [
  {
    slug: "cube",
    title: "CUBE",
    summary:
      "A miniature six-PCB LED cube with custom displays, sensing and enclosure work.",
    status: "Shipped",
    year: "2022",
    tech: ["KiCad", "C", "ESP32", "FreeCAD"],
    image: "/images/inside_cube.webp",
    imageAlt: "Inside view of the assembled CUBE prototype.",
    href: "/projects/#cube",
    repo: "https://github.com/BenjaminJAnderson",
  },
  {
    slug: "orthodox",
    title: "ORTHODOX",
    summary:
      "A custom ortholinear keyboard with analog switches, quarter-size keycaps and a parametric enclosure.",
    status: "Shipped",
    year: "2022",
    tech: ["KiCad", "OpenSCAD", "Blender", "PCB"],
    image: "/images/orthodox.webp",
    imageAlt: "Custom ortholinear keyboard with a split layout.",
    href: "/projects/#orthodox",
    repo: "https://github.com/BenjaminJAnderson",
  },
  {
    slug: "engiebenji",
    title: "ENGIEBENJI",
    summary:
      "The making of this site: a static engineering notebook built with Markdown and GitHub Pages.",
    status: "Ongoing",
    year: "2022 —",
    tech: ["Jekyll", "Markdown", "GitHub Pages"],
    image: "/images/origin.webp",
    imageAlt: "Abstract cover image for the making of engiebenji.com.",
    href: "/projects/#engiebenji",
    repo: "https://github.com/BenjaminJAnderson/Website",
  },
];
