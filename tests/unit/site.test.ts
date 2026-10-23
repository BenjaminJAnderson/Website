import { describe, expect, it } from "vitest";
import { neofetchHeader, neofetchRule } from "../../src/data/neofetch";
import { terminalIdentity } from "../../src/data/site";

describe("terminal identity", () => {
  it("uses one canonical user@host string", () => {
    expect(terminalIdentity).toBe("benji@engiebenji.com");
  });

  it("uses the identity in neofetch", () => {
    expect(neofetchHeader).toContain(terminalIdentity);
    expect(neofetchHeader).not.toContain("portfolio");
    expect(neofetchRule).toContain("-".repeat(terminalIdentity.length));
  });
});
