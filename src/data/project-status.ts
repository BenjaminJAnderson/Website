export const statusLabels = {
  shipped: "Shipped",
  "in-progress": "In progress",
  prototype: "Prototype",
  archived: "Archived",
} as const;

export type ProjectStatus = keyof typeof statusLabels;

export const statusOrder: readonly ProjectStatus[] = [
  "shipped",
  "in-progress",
  "prototype",
  "archived",
];
