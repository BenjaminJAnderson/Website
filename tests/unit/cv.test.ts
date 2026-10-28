import { describe, expect, it } from "vitest";
import { cv } from "../../src/data/cv";

describe("cv data", () => {
  it("contains the public CV structure", () => {
    expect(cv.name).toBe("Benjamin Anderson");
    expect(cv.role).toBe("Electronic Engineer");
    expect(cv.projects.map((project) => project.title)).toEqual([
      "Cube",
      "Orthodox",
    ]);
    expect(cv.projects[0]?.href).toBe("/projects/cube/");
    expect(cv.contact.find((item) => item.label === "email")?.value).toBe(
      "contact@engiebenji.com",
    );
    expect(cv.experience[0]?.bullets.length).toBeGreaterThan(0);
    expect(cv.education.length).toBeGreaterThan(0);
    expect(cv.references).toBe("Available on request.");
  });

  it("omits private phone and referee details", () => {
    const output = JSON.stringify(cv);

    expect(output).not.toContain("+44");
    expect(output).not.toContain("07799");
    expect(output).not.toContain("thebenjaminjanderson@gmail.com");
    expect(output).not.toContain("jason.hanson");
    expect(output).not.toContain("x.chu@sheffield.ac.uk");
    expect(output).not.toContain("luzhang1");
    expect(cv.contact.map((item) => item.label)).not.toContain("phone");
  });
});
