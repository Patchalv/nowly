module.exports = {
  // Lint & format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': (filenames) => [
    `eslint --fix ${filenames.map((f) => `"${f}"`).join(' ')}`,
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],

  // Format other files
  '**/*.{json,md,mdx,css,html,yml,yaml,scss}': (filenames) =>
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
};
