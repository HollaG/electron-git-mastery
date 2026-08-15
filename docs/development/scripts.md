# package.json scripts

`npm run transpile:electron`
This script transpiles the Electron code written in TypeScript to JavaScript. You must transpile if you have made changes in Electron code (under `/src/electron`). Dist scripts also run this before packaging.

`npm run dev`
This script starts the Vite React development server (`http://localhost:5123`) and, in parallel, transpiles the Electron main process then launches Electron in development mode.

`npm run format`
This script formats the repo with Prettier (`prettier --write .`). Config lives in `.prettierrc.json` (single quotes, no semicolons). Generated folders and `package-lock.json` are listed in `.prettierignore`.
