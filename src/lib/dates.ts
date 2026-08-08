/** Format tenure from an ISO-ish start (YYYY-MM or YYYY-MM-DD) to now. */
export function formatTenure(start: string, end: string | null | undefined, now = new Date()): string {
  if (!end || end.toLowerCase() === "present") {
    const startDate = parseYearMonth(start);
    if (!startDate) return `${start} – Present`;

    const months =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());
    const safeMonths = Math.max(0, months);
    const years = Math.floor(safeMonths / 12);
    const rem = safeMonths % 12;

    const human =
      years === 0
        ? `~${safeMonths} month${safeMonths === 1 ? "" : "s"}`
        : rem === 0
          ? `~${years} year${years === 1 ? "" : "s"}`
          : `~${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"} (~${(safeMonths / 12).toFixed(1)} years)`;

    const asOf = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    return `${start} – Present (${human} as of ${asOf})`;
  }

  return `${start} – ${end}`;
}

function parseYearMonth(value: string): Date | null {
  const m = value.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = m[3] ? Number(m[3]) : 1;
  return new Date(year, month, day);
}

export function todayLabel(now = new Date()): string {
  return now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
