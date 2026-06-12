import { describe, expect, it } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  it("formats error messages with module context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error({ module: "Test" }, "Something failed", new Error("boom"));
    expect(spy).toHaveBeenCalledWith(
      "[ERROR][Test] Something failed",
      expect.any(Error)
    );
    spy.mockRestore();
  });

  it("skips debug logs outside development", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug({ module: "Test" }, "hidden");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
