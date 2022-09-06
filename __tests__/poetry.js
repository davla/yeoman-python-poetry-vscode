import fs from "fs/promises";
import path from "path";

import TOML from "@iarna/toml";
import _ from "lodash";
import yeomanTest from "yeoman-test";

import PoetryGenerator from "../generators/poetry";
import { moduleDirName } from "../lib/paths";

import { assertTomlFileContent } from "./__lib__/toml-assertions.js";

const generatorPath = path.join(
  moduleDirName(import.meta),
  "../generators/poetry"
);

const assertPyProjectTomlContains = (run, content) =>
  assertTomlFileContent(run, "pyproject.toml", content);

const inToolPoetry = (toolPoetryPath, content) => ({
  tool: { poetry: _.set({}, toolPoetryPath, content) },
});

const writePyProjectToml = (content, parentDir) =>
  fs.writeFile(path.join(parentDir, "pyproject.toml"), TOML.stringify(content));

const generatorInput = [
  {
    optionName: "name",
    promptName: "name",
    toolPoetryPath: "name",
    optionValue: "option_package",
    promptValue: "prompt_package",
    pyProjectTomlValue: "py_project_toml_package",
  },
  {
    optionName: "package-version",
    promptName: "version",
    toolPoetryPath: "version",
    optionValue: "2.0.2",
    promptValue: "7.7.2",
    pyProjectTomlValue: "1.0.19",
  },
  {
    optionName: "description",
    promptName: "description",
    toolPoetryPath: "description",
    optionValue: "Option description",
    promptValue: "Prompt description",
    pyProjectTomlValue: "pyproject.toml description",
  },
  {
    optionName: "author",
    promptName: "author",
    toolPoetryPath: "authors.0",
    optionValue: "Steve Fox <steve.fox@tekken.uk>",
    promptValue: "Kazuya Mishima <kazuya.mishima@tekken.jp>",
    pyProjectTomlValue: "Paul Phoenix <paul.phoenix@tekken.us>",
  },
  {
    optionName: "license",
    promptName: "license",
    toolPoetryPath: "license",
    optionValue: "GPL-3.0-or-later",
    promptValue: "CC-BY-4.0",
    pyProjectTomlValue: "PSF-2.0",
  },
  {
    optionName: "python",
    promptName: "python",
    toolPoetryPath: "dependencies.python",
    optionValue: "^3.10.1",
    promptValue: "^3.2.0",
    pyProjectTomlValue: "^3.7.0",
  },
  {
    optionName: "repository",
    promptName: "repository",
    toolPoetryPath: "repository",
    optionValue: "https://github.com/marshall-law/option_package",
    promptValue: "https://github.com/marshall-law/prompt_package",
    pyProjectTomlValue: "https://github.com/marshall-law/pyprojecttoml_package",
  },
];

const mandatoryAnswers = {
  name: "mandatory_package",
  author: "Yoshimitsu <yoshimitsu@tekken.jp>",
  version: "1.9.0",
  description: "Non-empty description",
  license: "",
  repository: "https://repository.com",
  python: "3.7.2",
};

describe("python-poetry-vscode:poetry", () => {
  let context;

  beforeEach(() => {
    context = yeomanTest
      .run(
        PoetryGenerator,
        {
          resolved: generatorPath,
          namespace: "python-poetry-vscode:poetry",
        },
        {}
      )
      // Silence the annoying warnings
      .withPrompts(mandatoryAnswers);
  });

  describe("pyproject.toml", () => {
    it("creates the file", async () => {
      const run = await context;
      return run.assertFile("pyproject.toml");
    });

    it("merges with existing content", async () => {
      const run = await context
        .inTmpDir(
          writePyProjectToml.bind(null, {
            tool: {
              poetry: {
                authors: ["King <king@tekken.mx>", "Jack <jack@tekken.ru"],
                dependencies: { black: "^2.31.0" },
              },
            },
          })
        )
        .withOptions({
          author: "Mokujin <mojukin@tekken.jp>",
          python: "^3.10.1",
        });
      await assertPyProjectTomlContains(run, {
        tool: {
          poetry: {
            authors: ["Mokujin <mojukin@tekken.jp>", "Jack <jack@tekken.ru"],
            dependencies: { black: "^2.31.0", python: "^3.10.1" },
          },
        },
      });
    });
  });

  describe("options", () => {
    it.each(generatorInput)(
      'utilizes option value for "$optionName"',
      async ({ optionName, toolPoetryPath, optionValue }) => {
        const expectedContent = inToolPoetry(toolPoetryPath, optionValue);
        const run = await context.withOptions({ [optionName]: optionValue });
        await assertPyProjectTomlContains(run, expectedContent);
      }
    );
  });

  describe("prompts", () => {
    it.each(generatorInput)(
      'utilizes prompt answers for "$promptName"',
      async ({ promptName, toolPoetryPath, promptValue }) => {
        const expectedContent = inToolPoetry(toolPoetryPath, promptValue);
        const run = await context.withPrompts({ [promptName]: promptValue });
        await assertPyProjectTomlContains(run, expectedContent);
      }
    );
  });

  describe("precedence", () => {
    it.each(generatorInput)(
      'option "$optionName" has precedence over prompt "$promptName"',
      async ({
        optionName,
        promptName,
        toolPoetryPath,
        optionValue,
        promptValue,
      }) => {
        const expectedContent = inToolPoetry(toolPoetryPath, optionValue);
        const run = await context
          .withOptions({ [optionName]: optionValue })
          .withPrompts({ [promptName]: promptValue });
        await assertPyProjectTomlContains(run, expectedContent);
      }
    );

    it.each(generatorInput)(
      'existing content at "$toolPoetryPath" has precedence over prompt ' +
        '"$promptName"',
      async ({
        promptName,
        toolPoetryPath,
        promptValue,
        pyProjectTomlValue,
      }) => {
        const existingContent = inToolPoetry(
          toolPoetryPath,
          pyProjectTomlValue
        );
        const run = await context
          .inTmpDir(writePyProjectToml.bind(null, existingContent))
          .withPrompts({ [promptName]: promptValue });
        await assertPyProjectTomlContains(run, existingContent);
      }
    );
  });
});
