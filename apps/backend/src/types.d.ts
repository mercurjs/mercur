/**
 * @desc We are using WithRequired utility type to make
 * fields not optional due to zod not being able to infer
 * correctly with `strict: false` enabled in tsconfig.json
 */

declare type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
