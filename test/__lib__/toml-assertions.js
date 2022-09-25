import fs from "fs/promises";
import path from "path";

import TOML from "@iarna/toml";

export const readToml = async (runResult, fileName) => {
  const filePath = path.join(runResult.cwd, fileName);
  return TOML.parse(await fs.readFile(filePath, "utf-8"));
};

export const assertTomlFileContent = async (runResult, fileName, content) =>
  runResult.assertObjectContent(await readToml(runResult, fileName), content);
