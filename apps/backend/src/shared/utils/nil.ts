export const isNil = <T>(v: T | null | undefined): v is null | undefined =>
  v === null || v === undefined;
export const isNotNil = <T>(v: T | null | undefined): v is T =>
  v !== null && v !== undefined;