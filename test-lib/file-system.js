import fs from "node:fs/promises";
import path from "node:path";

import TOML from "@iarna/toml";
import glob from "fast-glob";

export const readFileInCwd = (runResult, fileName) =>
  fs.readFile(fileInCwd(runResult, fileName), "utf-8");

async function tryParseInCwd(parser, runResult, fileName) {
  const content = await readFileInCwd(runResult, fileName);
  if (content === "") {
    return content;
  }

  try {
    return parser(content);
  } catch {
    return null;
  }
}

const tryReadJsonInCwd = tryParseInCwd.bind(null, JSON.parse);
const tryReadTomlInCwd = tryParseInCwd.bind(null, TOML.parse);

const fileReaders = [tryReadJsonInCwd, tryReadTomlInCwd, readFileInCwd];

const fileInCwd = (runResult, fileName) =>
  path.join(runResult.cwd ?? runResult, fileName);

export async function readCwd(runResult) {
  const filesInCwd = await glob("**", {
    cwd: (runResult.cwd ?? runResult).replace(path.sep, path.posix.sep),
    absolute: false,
    onlyFiles: true,
  });
  const nameContentPairs = filesInCwd.map(async (fileName) => [
    fileName,
    await parseFileInCwd(runResult, fileName),
  ]);
  return Object.fromEntries(await Promise.all(nameContentPairs));
}

async function parseFileInCwd(runResult, fileName) {
  const contents = fileReaders.map((reader) => reader(runResult, fileName));
  return (await Promise.all(contents)).find((content) => content !== null);
}

export const writeFileInCwd = (runResult, fileName, content) =>
  fs.writeFile(fileInCwd(runResult, fileName), content);
