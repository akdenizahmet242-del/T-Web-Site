const turkish: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** "Hilton 80 cm Lake Banyo Dolabı" → "hilton-80-cm-lake-banyo-dolabi" */
export function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıiöşüâîû]/g, (char) => turkish[char] ?? char)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
