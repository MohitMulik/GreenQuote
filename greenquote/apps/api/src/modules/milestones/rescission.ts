/**
 * Statutory Cooling-Off & Right of Rescission Engine
 * Compliance: FTC Cooling-Off Rule 16 C.F.R. Part 429 & TILA Reg Z 12 C.F.R. §1026.23
 * Requirements: CMP-07, CMP-08, FR-805
 */

/**
 * Standard Federal Holidays (Month is 0-indexed)
 */
const FEDERAL_HOLIDAYS_FIXED = [
  { month: 0, day: 1 }, // New Year's Day (Jan 1)
  { month: 5, day: 19 }, // Juneteenth (Jun 19)
  { month: 6, day: 4 }, // Independence Day (Jul 4)
  { month: 10, day: 11 }, // Veterans Day (Nov 11)
  { month: 11, day: 25 }, // Christmas Day (Dec 25)
];

/**
 * Checks whether a given calendar date is a business day under Reg Z §1026.2(a)(6).
 * For rescission purposes, Reg Z defines business days as all calendar days EXCEPT
 * Sundays and specified federal public holidays. (Saturdays ARE business days for rescission!).
 */
export function isRescissionBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  // Sundays are excluded
  if (dayOfWeek === 0) {
    return false;
  }

  const month = date.getMonth();
  const day = date.getDate();

  // Check fixed federal holidays
  for (const holiday of FEDERAL_HOLIDAYS_FIXED) {
    if (holiday.month === month && holiday.day === day) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates the exact statutory rescission period expiration date.
 * Under Reg Z §1026.23(a)(3), the consumer may exercise the right to rescind until midnight
 * of the THIRD business day following the date of the transaction.
 *
 * @param startDate The date the transaction/e-signature occurred
 * @param businessDays Number of business days (default 3)
 * @returns Date representing the midnight cutoff when the rescission period expires
 */
export function calculateRescissionEndDate(startDate: Date, businessDays = 3): Date {
  const current = new Date(startDate.getTime());
  let addedDays = 0;

  // Advance day by day until required business days have elapsed
  while (addedDays < businessDays) {
    current.setDate(current.getDate() + 1);
    if (isRescissionBusinessDay(current)) {
      addedDays++;
    }
  }

  // Set cutoff time to midnight at end of the 3rd business day (23:59:59.999)
  current.setHours(23, 59, 59, 999);
  return current;
}

/**
 * Checks whether the statutory rescission window is currently active.
 */
export function isRescissionPeriodActive(
  rescissionEndsAt?: Date | string | null,
  now = new Date()
): boolean {
  if (!rescissionEndsAt) return false;
  const cutoff = typeof rescissionEndsAt === "string" ? new Date(rescissionEndsAt) : rescissionEndsAt;
  return now.getTime() < cutoff.getTime();
}
