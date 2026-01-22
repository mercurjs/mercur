export const isValidUnitValue = (value: string | undefined): boolean =>
  value === undefined || (!isNaN(Number(value)) && value.trim() !== "");

