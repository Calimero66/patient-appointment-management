import { z } from "zod";

export const stringOptional = () =>
  z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : val))
    .optional();

export const stringNullable = () =>
  z
    .string()
    .transform((val) => (val.trim() === "" ? null : val))
    .nullable()
    .optional();

export const dateOptional = () =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return new Date(val as string);
  }, z.date());
