export function parseYmdDate(input: string): Date | null {
  const v = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;

  const [yyyyRaw, mmRaw, ddRaw] = v.split("-");
  const yyyy = Number(yyyyRaw);
  const mm = Number(mmRaw);
  const dd = Number(ddRaw);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;

  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null;
  }

  return date;
}

export function formatYmdDate(date: Date | null): string {
  if (!date) return "";
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

