import TOML from "@iarna/toml";

import { readFileInCwd, writeFileInCwd } from "./file-system.js";

export const readToml = async (runResult, fileName) =>
  TOML.parse(await readFileInCwd(runResult, fileName));

export const writeToml = (runResult, fileName, content) =>
  writeFileInCwd(runResult, fileName, TOML.stringify(content));
