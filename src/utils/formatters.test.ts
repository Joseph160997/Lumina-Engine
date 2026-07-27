import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatRunTime } from "./formatters";

// formatCurrency

describe("formatCurrency", () => {
  it("should format a positive integer as USD currency", () => {
    // ARRANGE
    const amount = 1000;

    // ACT
    const result = formatCurrency(amount);

    // ASSERT
    expect(result).toBe("$1,000.00");
  });

  it("should format zero as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("should format large numbers with comma separators", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567.00");
  });

  it("should format decimal amounts correctly", () => {
    expect(formatCurrency(99.99)).toBe("$99.99");
  });
});

// formatDate

describe("formatDate", () => {
  it("should format a valid date in Spanish short format", () => {
    // ARRANGE — creamos una fecha conocida
    const date = new Date(2023, 0, 15);

    // ACT
    const result = formatDate(date);

    // ASSERT — "15 ene 2022" en locale es-ES
    expect(result).toBe("15 ene 2023");
  });

  it("should return 'Fecha no disponible' when given null", () => {
    expect(formatDate(null)).toBe("Fecha no disponible");
  });

  it("should return 'Fecha no disponible' when given an invalid date", () => {
    // new Date("not-a-date") produce un Invalid Date (getTime() === NaN)
    const invalidDate = new Date("not-a-date");
    expect(formatDate(invalidDate)).toBe("Fecha no disponible");
  });
});

// formatRunTime

describe("formatRunTime", () => {
  it("should format hours and minutes when both are present", () => {
    // 125 min = 2h 5m
    expect(formatRunTime(125)).toBe("2h 5m");
  });

  it("should format only minutes when less than 60", () => {
    expect(formatRunTime(45)).toBe("45m");
  });

  it("should format only hours when minutes are zero", () => {
    expect(formatRunTime(120)).toBe("2h");
  });

  it("should return 'Duración no disponible' when given null", () => {
    expect(formatRunTime(null)).toBe("Duración no disponible");
  });

  it("should return 'Duración no disponible' when given zero", () => {
    expect(formatRunTime(0)).toBe("Duración no disponible");
  });

  it("should return 'Duración no disponible' when given a negative number", () => {
    expect(formatRunTime(-10)).toBe("Duración no disponible");
  });
});
