import fs from "fs/promises";
import path from "path";

import TOML from "@iarna/toml";

const fileInCwd = (runResult, fileName) =>
  path.join(runResult.cwd ?? runResult, fileName);

export const readToml = async (runResult, fileName) =>
  TOML.parse(await fs.readFile(fileInCwd(runResult, fileName), "utf-8"));

export const writeToml = (runResult, fileName, content) =>
  fs.writeFile(fileInCwd(runResult, fileName), TOML.stringify(content));
