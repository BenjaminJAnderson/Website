const ESC = "\u001b[";
const RESET = `${ESC}0m`;

function sgr(code: string, text: string): string {
  return `${ESC}${code}m${text}${RESET}`;
}

const archLogoLines = [
  "                  .o+`",
  "                 `ooo/",
  "                `+oooo:",
  "               `+oooooo:",
  "               -+oooooo+:",
  "             `/:-:++oooo+:",
  "            `/++++/+++++++:",
  "           `/++++++++++++++:",
  "          `/+++ooooooooooooo/`",
  "         ./ooosssso++osssssso+`",
  "        .oossssso-````/ossssss+`",
  "       -osssssso.      :ssssssso.",
  "      :osssssss/        osssso+++.",
  "     /ossssssss/        +ssssooo/-",
  "   `/ossssso+/:-        -:/+osssso+-",
  "  `+sso+:-`                 `.-/+oso:",
  " `++:.                           `-+/",
  " .`                                 `/ ",
];

export const archLogo = archLogoLines.map((line) => sgr("34", line)).join("\n");

export const neofetchHeader = sgr("1;36", "benji@benji");
export const neofetchRule = sgr("36", "-----------");

export const neofetchFacts = [
  { label: sgr("1;34", "OS"), value: "Arch Linux x86_64" },
  { label: sgr("1;34", "Host"), value: "V3" },
  { label: sgr("1;34", "Kernel"), value: "7.2.5-3-omarchy" },
  { label: sgr("1;34", "Uptime"), value: "1 day, 15 hours, 3 mins" },
  { label: sgr("1;34", "Packages"), value: "1177 (pacman)" },
  { label: sgr("1;34", "Shell"), value: "bash 5.3.15" },
  { label: sgr("1;34", "Resolution"), value: "2560x1600" },
  { label: sgr("1;34", "DE"), value: "Hyprland" },
  { label: sgr("1;34", "Theme"), value: "Adwaita-dark [GTK3]" },
  { label: sgr("1;34", "Icons"), value: "Yaru-wartybrown [GTK3]" },
  { label: sgr("1;34", "Terminal"), value: "ghostty" },
  {
    label: sgr("1;34", "CPU"),
    value: "AMD Ryzen 7 8840U w/ Radeon 780M Graphics (16) @ 5.134GHz",
  },
  { label: sgr("1;34", "GPU"), value: "AMD ATI c4:00.0 HawkPoint1" },
  { label: sgr("1;34", "Memory"), value: "9854MiB / 15768MiB" },
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
