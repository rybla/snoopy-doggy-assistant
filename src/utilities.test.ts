import { afterAll, describe, expect, it, setSystemTime } from "bun:test";
import { nextTimeOfDay } from "@/utilities";

describe("nextTimeOfDay", () => {
  // We use fixed system time for deterministic tests
  const baseTime = new Date("2026-05-04T12:00:00Z");

  it("returns today if the target time is more than one minute after now", () => {
    setSystemTime(baseTime); // 12:00
    // Target 12:02
    const result = nextTimeOfDay({ hour: 12, minute: 2 });
    expect(result.toISOString()).toBe("2026-05-04T12:02:00.000Z");
  });

  it("returns today if the target time is exactly one minute after now", () => {
    setSystemTime(baseTime); // 12:00
    // Target 12:01
    const result = nextTimeOfDay({ hour: 12, minute: 1 });
    expect(result.toISOString()).toBe("2026-05-04T12:01:00.000Z");
  });

  it("returns tomorrow if the target time is less than one minute after now", () => {
    setSystemTime(baseTime); // 12:00
    // Target 12:00:30 (but we only have hour/minute)
    // Target 12:00
    const result = nextTimeOfDay({ hour: 12, minute: 0 });
    expect(result.toISOString()).toBe("2026-05-05T12:00:00.000Z");
  });

  it("returns tomorrow if the target time is earlier than now", () => {
    setSystemTime(baseTime); // 12:00
    // Target 11:00
    const result = nextTimeOfDay({ hour: 11, minute: 0 });
    expect(result.toISOString()).toBe("2026-05-05T11:00:00.000Z");
  });

  it("handles day rollover correctly", () => {
    const endOfDay = new Date("2026-05-04T23:59:30Z");
    setSystemTime(endOfDay); // 23:59:30
    // Target 00:00
    // now + 1min = 00:00:30 (next day)
    // target 00:00 today is 23:59:30 ago.
    // target 00:00 today (2026-05-04 00:00) < startTime (2026-05-05 00:00:30) -> true
    // returns 2026-05-05 00:00
    const result = nextTimeOfDay({ hour: 0, minute: 0 });
    expect(result.toISOString()).toBe("2026-05-05T00:00:00.000Z");
  });

  afterAll(() => {
    setSystemTime(); // Reset system time
  });
});
