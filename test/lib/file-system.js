import fs from "node:fs/promises";
import path from "node:path";

import TOML from "@iarna/toml";
import glob from "fast-glob";

const fileInCwd = (runResult, fileName) =>
  path.join(runResult.cwd ?? runResult, fileName);

/**************************************
 * List
 **************************************/

export const toPosixPath = (p) => p.replace(path.sep, path.posix.sep);

/**************************************
 * Read
 **************************************/

const parseInCwd = async (parse, runResult, fileName) =>
  parse(await readFileInCwd(runResult, fileName));

export const readJsonInCwd = parseInCwd.bind(null, JSON.parse);
export const readTomlInCwd = parseInCwd.bind(null, TOML.parse);

export const readFileInCwd = (runResult, fileName) =>
  fs.readFile(fileInCwd(runResult, fileName), "utf-8");

/**************************************
 * Try parse
 **************************************/

const parsers = [JSON.parse, TOML.parse];

async function tryParseInCwd(runResult, fileName) {
  const content = await readFileInCwd(runResult, fileName);
  if (content === "") {
    return content;
  }

  for (const parser of parsers) {
    try {
      return parser(content);
    } catch {}
  }

  return content;
}

export async function readCwd(runResult, excludeFiles = []) {
  const filesInCwd = await glob(["**", ".**"], {
    cwd: (runResult.cwd ?? runResult).replace(path.sep, path.posix.sep),
    ignore: excludeFiles,
    absolute: false,
    onlyFiles: true,
  });
  const nameContentPairs = filesInCwd.map(async (fileName) => [
    toPosixPath(fileName),
    await tryParseInCwd(runResult, fileName),
  ]);
  return Object.fromEntries(await Promise.all(nameContentPairs));
}

/**************************************
 * Write
 **************************************/

const stringifyInCwd = (stringify, runResult, fileName, content) =>
  writeFileInCwd(runResult, fileName, stringify(content));

export const writeFileInCwd = (runResult, fileName, content) =>
  fs.writeFile(fileInCwd(runResult, fileName), content);

export const writeTomlInCwd = stringifyInCwd.bind(null, TOML.stringify);
export const writeJsonInCwd = stringifyInCwd.bind(null, JSON.stringify);
