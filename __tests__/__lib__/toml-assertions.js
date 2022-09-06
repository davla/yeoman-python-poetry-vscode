import fs from "fs/promises";
import path from "path";

import TOML from "@iarna/toml";

export const assertTomlFileContent = async (runResult, fileName, content) => {
  const filePath = path.join(runResult.cwd, fileName);
  const tomlContent = TOML.parse(await fs.readFile(filePath, "utf-8"));
  runResult.assertObjectContent(tomlContent, content);
};
