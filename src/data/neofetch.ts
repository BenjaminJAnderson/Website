const ESC = "\u001b[";
const RESET = `${ESC}0m`;

function sgr(code: string, text: string): string {
  return `${ESC}${code}m${text}${RESET}`;
}

const logoLines = [
  ":################################",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@=------------------------",
  "-@@@@@@@.",
  "-@@@@@@@.",
  "-@@@@@@@.",
  "-@@@@@@@+------------------------",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
  "-@@@@@@@#************************",
  "-@@@@@@@:",
  "-@@@@@@@.",
  "-@@@@@@@.",
  "-@@@@@@@:",
  "-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
];

export const logoArt = logoLines.map((line) => sgr("34", line)).join("\n");

export const neofetchHeader = sgr("1;36", "benji@portfolio");
export const neofetchRule = sgr("36", "----------------");

export const neofetchFacts = [
  { label: sgr("1;34", "Name"), value: "Benjamin Anderson" },
  { label: sgr("1;34", "Degree"), value: "BEng Electronic Engineering" },
  { label: sgr("1;34", "Focus"), value: "Hardware / Software" },
  {
    label: sgr("1;34", "Interests"),
    value: "Hardware Design, 3D Printing, CNC Fabrication",
  },
  { label: sgr("1;34", "Languages"), value: "Rust, Python, C/C++" },
  { label: sgr("1;34", "Tools"), value: "Linux, Git, KiCad, FreeCAD" },
  { label: sgr("1;34", "Location"), value: "London, UK" },
] as const;

function paletteBlock(code: number): string {
  return `${ESC}${code}m   ${RESET}`;
}

function paletteRow(start: number): string {
  return Array.from({ length: 8 }, (_, index) =>
    paletteBlock(start + index),
  ).join("");
}

export const neofetchPalette = `${paletteRow(40)}\n${paletteRow(100)}`;
