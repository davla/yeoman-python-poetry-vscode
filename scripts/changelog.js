import fs from "node:fs/promises";
import { EOL } from "node:os";
import readline from "node:readline";
import { pipeline } from "node:stream/promises";

import formatDate from "date-format";
import { docopt } from "docopt";
import { execa } from "execa";

const defaultUnreleasedHeadingContent = "[Unreleased]";

const globalOptions =
  "[--changelog <file>] [--unreleased <content>] [--level <level>]";

const doc = `
Usage:
  changelog read-unreleased ${globalOptions}
  changelog update --version <version> ${globalOptions}

Options:
  --help, -H                Show this text.
  --changelog=<file>        Changelog file [default: CHANGELOG.md].
  --unreleased=<content>    Heading content of the unreleased section [default: ${defaultUnreleasedHeadingContent}].
  --level=<level>           Heading level of the unreleased heading section [default: 2].
  --version=<version>       Release version.
`;

/**************************************
 *             Utilities
 **************************************/

function makeHeadings(unreleasedHeadingContent, headingLevel, version = null) {
  const headingStart = "#".repeat(headingLevel);
  const releaseDate = formatDate("yyyy-MM-dd", new Date());
  return {
    headingStart: new RegExp(`^${headingStart}\\s`),
    newReleaseHeading: `${headingStart} [${version}] - ${releaseDate}`,
    unreleasedHeading: `${headingStart} ${unreleasedHeadingContent}`,
  };
}

/**************************************
 *         Read unreleased
 **************************************/

const findUnreleasedSection = (unreleasedHeadingContent, headingLevel) =>
  async function* (lines) {
    const { headingStart, unreleasedHeading } = makeHeadings(
      unreleasedHeadingContent,
      headingLevel,
    );

    let isHeadingFound = false;
    let sectionHasContent = false;
    for await (const rawLine of lines) {
      const line = rawLine.trim();

      if (line === unreleasedHeading) {
        isHeadingFound = true;
        continue;
      }

      if (isHeadingFound && line.search(headingStart) !== -1) {
        break;
      }

      if (isHeadingFound) {
        yield line + EOL;
        sectionHasContent ||= line !== "";
      }
    }

    if (!sectionHasContent) {
      console.error("Changelog not updated for next release!");
      process.exit(64);
    }
  };

const readLines = async (fileName, options = { encoding: "utf-8" }) =>
  /*
   * The crlfDelay option is used to recognize all instances of CR LF as a
   * single line break.
   */
  readline.createInterface({
    input: (await fs.open(fileName)).createReadStream(options),
    crlfDelay: Infinity,
  });

export const readUnreleased = async (
  changelogFile,
  unreleasedHeadingContent,
  headingLevel,
) =>
  pipeline(
    await readLines(changelogFile),
    findUnreleasedSection(unreleasedHeadingContent, headingLevel),
    process.stdout,
  );

/**************************************
 *              Update
 **************************************/

async function updateHeadings(
  changelogFile,
  version,
  unreleasedHeadingContent,
  headingLevel,
) {
  const content = await fs.readFile(changelogFile, "utf8");

  const { newReleaseHeading, unreleasedHeading } = makeHeadings(
    unreleasedHeadingContent,
    headingLevel,
    version,
  );
  const result = content.replace(
    unreleasedHeading,
    unreleasedHeading + "\n\n" + newReleaseHeading,
  );

  await fs.writeFile(changelogFile, result, "utf8");
}

async function commitChangelog(changelogFile, version) {
  await execa("git", ["add", changelogFile]);
  await execa("git", [
    "commit",
    "-m",
    `docs(changelog): update to version ${version}`,
  ]);
  await execa("git", ["push"]);
}

export async function update(
  version,
  changelogFile,
  unreleasedHeadingContent,
  headingLevel,
) {
  await updateHeadings(
    changelogFile,
    version,
    unreleasedHeadingContent,
    headingLevel,
  );
  await commitChangelog(changelogFile, version);
}

/**************************************
 *              Main
 **************************************/

function parseArgs() {
  const {
    "--changelog": changelogFile,
    "--unreleased": unreleasedHeadingContent,
    "--level": level,
    "--version": version,
    "read-unreleased": shouldRead,
    update: shouldUpdate,
  } = docopt(doc);
  return {
    changelogFile,
    unreleasedHeadingContent,
    headingLevel: parseInt(level, 10),
    version,
    shouldRead,
    shouldUpdate,
  };
}

function main() {
  const {
    changelogFile,
    unreleasedHeadingContent,
    headingLevel,
    version,
    shouldRead,
    shouldUpdate,
  } = parseArgs();

  if (shouldRead) {
    return readUnreleased(
      changelogFile,
      unreleasedHeadingContent,
      headingLevel,
    );
  }

  if (shouldUpdate) {
    return update(
      version,
      changelogFile,
      unreleasedHeadingContent,
      headingLevel,
    );
  }
}

await main();
