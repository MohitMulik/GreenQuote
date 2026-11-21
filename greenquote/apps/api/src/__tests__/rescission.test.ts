import { describe, it, expect } from "@jest/globals";
import {
  isRescissionBusinessDay,
  calculateRescissionEndDate,
  isRescissionPeriodActive,
} from "../modules/milestones/rescission.js";

describe("Statutory Cooling-Off & Right of Rescission Engine (CMP-07, CMP-08, FR-805)", () => {
  it("excludes Sundays from Reg Z business days", () => {
    // 2026-11-22 is a Sunday
    const sunday = new Date("2026-11-22T10:00:00Z");
    expect(isRescissionBusinessDay(sunday)).toBe(false);
  });

  it("includes Saturdays as Reg Z business days for rescission calculations", () => {
    // 2026-11-21 is a Saturday
    const saturday = new Date("2026-11-21T10:00:00Z");
    expect(isRescissionBusinessDay(saturday)).toBe(true);
  });

  it("excludes statutory Federal Holidays", () => {
    // Christmas Day (Dec 25)
    const christmas = new Date("2026-12-25T12:00:00Z");
    expect(isRescissionBusinessDay(christmas)).toBe(false);

    // New Year's Day (Jan 1)
    const newYear = new Date("2026-01-01T12:00:00Z");
    expect(isRescissionBusinessDay(newYear)).toBe(false);

    // Independence Day (Jul 4)
    const jul4 = new Date("2026-07-04T12:00:00Z");
    expect(isRescissionBusinessDay(jul4)).toBe(false);
  });

  it("accurately calculates 3 business days skipping Sunday", () => {
    // Thursday Nov 19, 2026
    // Day 1: Friday Nov 20
    // Day 2: Saturday Nov 21
    // (Sunday Nov 22 skipped)
    // Day 3: Monday Nov 23
    const signedDate = new Date("2026-11-19T14:30:00Z");
    const endDate = calculateRescissionEndDate(signedDate, 3);

    expect(endDate.getDate()).toBe(23); // Monday
    expect(endDate.getMonth()).toBe(10); // November (0-indexed)
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
  });

  it("correctly identifies active vs expired rescission periods", () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    const pastDate = new Date(Date.now() - 86400000); // 1 day in past

    expect(isRescissionPeriodActive(futureDate)).toBe(true);
    expect(isRescissionPeriodActive(pastDate)).toBe(false);
    expect(isRescissionPeriodActive(null)).toBe(false);
  });
});
