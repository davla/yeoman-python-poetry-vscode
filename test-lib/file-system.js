import fs from "node:fs/promises";
import path from "node:path";

const fileInCwd = (runResult, fileName) =>
  path.join(runResult.cwd ?? runResult, fileName);

export const readFileInCwd = (runResult, fileName) =>
  fs.readFile(fileInCwd(runResult, fileName), "utf-8");

export const writeFileInCwd = (runResult, fileName, content) =>
  fs.writeFile(fileInCwd(runResult, fileName), content);
