import fs from "fs/promises";
import path from "path";

import TOML from "@iarna/toml";
import _ from "lodash";
import sinon from "sinon";
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
  version: "1.9.0",
  description: "Non-empty description",
  license: "",
};

describe("python-poetry-vscode:poetry", () => {
  let context;
  let queryGitOriginUrl;
  let spawnCommand;
  let userGitEmail;
  let userGitName;

  beforeEach(() => {
    queryGitOriginUrl = sinon
      .stub()
      .resolves("https://github.com/eddy-gordo/git_package");
    spawnCommand = sinon
      .stub()
      .withArgs("python", ["--version"], { stdio: "pipe" })
      .resolves({ stdout: "Python 3.10.2" });
    userGitName = sinon.stub().returns("Jin Kazama");
    userGitEmail = sinon.stub().returns("jin.kazama@tekken.jp");
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
      .withPrompts(mandatoryAnswers)
      .on("ready", (generator) => {
        generator.user.git.email = userGitEmail;
        generator.user.git.name = userGitName;
        generator._queryGitOriginUrl = queryGitOriginUrl;
        generator.spawnCommand = spawnCommand;
      });
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

  describe("dynamic default values", () => {
    it("queries git config for the default author", async () => {
      const run = await context;

      expect(userGitEmail.calledOnce).toBeTruthy();
      expect(userGitName.calledOnce).toBeTruthy();

      await assertPyProjectTomlContains(run, {
        tool: { poetry: { authors: ["Jin Kazama <jin.kazama@tekken.jp>"] } },
      });
    });

    it("queries current python version for default python", async () => {
      const run = await context;

      expect(
        spawnCommand.calledOnceWith("python", ["--version"], {
          stdio: "pipe",
        })
      ).toBeTruthy();

      await assertPyProjectTomlContains(run, {
        tool: { poetry: { dependencies: { python: "^3.10.2" } } },
      });
    });

    it.each([
      { protocol: "https", url: "https://github.com/hwoarang/https_package" },
      { protocol: "ssh", url: "git@github.com:hwoarang/https_package.git" },
    ])(
      "queries git config for the default project url ($protocol)",
      async ({ url }) => {
        queryGitOriginUrl.resolves(url);
        const run = await context;

        expect(queryGitOriginUrl.calledOnce).toBeTruthy();

        await assertPyProjectTomlContains(run, {
          tool: {
            poetry: {
              repository: "https://github.com/hwoarang/https_package",
            },
          },
        });
      }
    );
  });
});
