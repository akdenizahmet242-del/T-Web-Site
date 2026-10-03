import { describe, expect, it } from "vitest";

import { SLUG_PATTERN, slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["Hilton 80 cm Lake Banyo Dolabı", "hilton-80-cm-lake-banyo-dolabi"],
    ["İSTANBUL Çağdaş Şömine", "istanbul-cagdas-somine"],
    ["  Pirinç   Ayraç!!  ", "pirinc-ayrac"],
    ["IŞIK", "isik"],
    ["Ünlü Göçmen Öğün", "unlu-gocmen-ogun"],
  ])("%s → %s", (input, expected) => {
    const slug = slugify(input);
    expect(slug).toBe(expected);
    expect(SLUG_PATTERN.test(slug)).toBe(true);
  });
});
