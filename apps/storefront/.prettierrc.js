// Rigby Shared Prettier config
module.exports = {
  singleQuote: true,
  semi: true,
  tabWidth: 2,
  endOfLine: 'auto',
  printWidth: 100,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  quoteProps: 'as-needed',
  proseWrap: 'preserve',

  // Plugins for import sorting and Tailwind CSS class sorting
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],

  singleAttributePerLine: true,

  // Order for imports
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "^react$",
    "^react-dom$",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "@/.*",
    "",
    "^[.]"
  ],
  importOrderParserPlugins: ["typescript", "jsx"],
  importOrderTypeScriptVersion: "5.0.0",

  // Functions to detect Tailwind classes
  tailwindFunctions: ["clsx", "cn", "twmerge", "cva", "tw"]
};