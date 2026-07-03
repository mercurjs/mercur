import kleur from "kleur";

export const highlighter = {
  error: (text: string) => kleur.red(text),
  warn: (text: string) => kleur.yellow(text),
  info: (text: string) => kleur.blue(text),
  success: (text: string) => kleur.green(text),
  dim: (text: string) => kleur.cyan(text),
};
