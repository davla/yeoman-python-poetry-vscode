"use strict";
import path from "path";

import "chai/register-should.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiSubset from "chai-subset";
import LicenseGenerator from "generator-license";
import _ from "lodash";
import sinon from "sinon";
import yeomanTest from "yeoman-test";

import PoetryGenerator from "../../generators/poetry/index.js";
import { moduleDirName } from "../../lib/paths.js";
import { readToml, writeToml } from "../../test-lib/toml.js";

chai.use(chaiAsPromised);
chai.use(chaiSubset);

const generatorPath = path.join(
  moduleDirName(import.meta),
  "../generators/poetry"
);

const inToolPoetry = (toolPoetryPath, content) => ({
  tool: { poetry: _.set({}, toolPoetryPath, content) },
});

const pyProjectToml = (runResult) => readToml(runResult, "pyproject.toml");

const writePyProjectToml = (content, dir) =>
  writeToml(dir, "pyproject.toml", content);

const generatorInput = [
  {
    optionName: "name",
    promptName: "name",
    toolPoetryPath: "name",
    optionValue: "option_package",
    promptValue: "prompt_package",
    pyProjectTomlValue: "py_project_toml_package",
    invalidValue: "UpperCase",
  },
  {
    optionName: "package-version",
    promptName: "version",
    toolPoetryPath: "version",
    optionValue: "2.0.2",
    promptValue: "7.7.2",
    pyProjectTomlValue: "1.0.19",
    invalidValue: "9.2",
  },
  {
    optionName: "description",
    promptName: "description",
    toolPoetryPath: "description",
    optionValue: "Option description",
    promptValue: "Prompt description",
    pyProjectTomlValue: "pyproject.toml description",
    invalidValue: "",
  },
  {
    optionName: "author",
    promptName: "author",
    toolPoetryPath: "authors.0",
    optionValue: "Steve Fox <steve.fox@tekken.uk>",
    promptValue: "Kazuya Mishima <kazuya.mishima@tekken.jp>",
    pyProjectTomlValue: "Paul Phoenix <paul.phoenix@tekken.us>",
    invalidValue: "no-real-author",
  },
  {
    optionName: "license",
    promptName: "license",
    toolPoetryPath: "license",
    optionValue: LicenseGenerator.licenses[1].value,
    promptValue: LicenseGenerator.licenses[2].value,
    pyProjectTomlValue: LicenseGenerator.licenses[3].value,
    invalidValue: "OSL-3.0",
  },
  {
    optionName: "python",
    promptName: "python",
    toolPoetryPath: "dependencies.python",
    optionValue: "^3.10.1",
    promptValue: "^3.2.0",
    pyProjectTomlValue: "^3.7.0",
    invalidValue: "not-a-version",
  },
  {
    optionName: "repository",
    promptName: "repository",
    toolPoetryPath: "repository",
    optionValue: "https://github.com/marshall-law/option_package",
    promptValue: "https://github.com/marshall-law/prompt_package",
    pyProjectTomlValue: "https://github.com/marshall-law/pyprojecttoml_package",
    invalidValue: "not-a-url",
  },
];

const mandatoryAnswers = {
  name: "mandatory_package",
  version: "1.9.0",
  description: "Non-empty description",
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
      .run(PoetryGenerator, {
        resolved: generatorPath,
        namespace: "python-poetry-vscode:poetry",
      })
      .withGenerators([
        [
          yeomanTest.createMockedGenerator(LicenseGenerator),
          "generator-license",
        ],
      ])
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
      (await pyProjectToml(run)).should.containSubset({
        tool: {
          poetry: {
            authors: ["Mokujin <mojukin@tekken.jp>", "Jack <jack@tekken.ru"],
            dependencies: { black: "^2.31.0", python: "^3.10.1" },
          },
        },
      });
    });

    it('adds the "build-system" section', async () => {
      const run = await context;
      (await pyProjectToml(run)).should.containSubset(
        PoetryGenerator.buildSystem
      );
    });

    it('leaves existing "build-system" sections untouched', async () => {
      /*
       * Use an object as "build-system" value to verify it's not merged with
       * the default value, that is itself an object.
       */
      const existingBuildSystem = {
        "build-system": {
          requires: ["setuptools", "wheel"],
        },
      };
      const run = await context.inTmpDir(
        writePyProjectToml.bind(null, existingBuildSystem)
      );
      const actualBuildSystem = _.pick(
        await readToml(run, "pyproject.toml"),
        "build-system"
      );
      actualBuildSystem.should.containSubset(existingBuildSystem);
    });
  });

  describe("options", () => {
    for (const { optionName, toolPoetryPath, optionValue } of generatorInput) {
      it(`utilizes option value for "${optionName}"`, async () => {
        const expectedContent = inToolPoetry(toolPoetryPath, optionValue);
        const run = await context.withOptions({ [optionName]: optionValue });
        (await pyProjectToml(run)).should.containSubset(expectedContent);
      });
    }

    for (const { optionName, invalidValue } of generatorInput) {
      it(`validates the "${optionName}" option`, () =>
        context.withOptions({ [optionName]: invalidValue }).should.be.rejected);
    }
  });

  describe("prompts", () => {
    for (const { promptName, toolPoetryPath, promptValue } of generatorInput) {
      it(`utilizes prompt answers for "${promptName}"`, async () => {
        const expectedContent = inToolPoetry(toolPoetryPath, promptValue);
        const run = await context.withPrompts({ [promptName]: promptValue });
        (await pyProjectToml(run)).should.containSubset(expectedContent);
      });
    }
  });

  describe("precedence", () => {
    for (const {
      optionName,
      promptName,
      toolPoetryPath,
      optionValue,
      promptValue,
    } of generatorInput) {
      it(`option "$optionName" has precedence over prompt "${promptName}"`, async () => {
        const expectedContent = inToolPoetry(toolPoetryPath, optionValue);
        const run = await context
          .withOptions({ [optionName]: optionValue })
          .withPrompts({ [promptName]: promptValue });
        (await pyProjectToml(run)).should.containSubset(expectedContent);
      });
    }

    for (const {
      promptName,
      toolPoetryPath,
      promptValue,
      pyProjectTomlValue,
    } of generatorInput) {
      it(
        `existing content at "${toolPoetryPath}" has precedence over prompt ` +
          promptName,
        async () => {
          const existingContent = inToolPoetry(
            toolPoetryPath,
            pyProjectTomlValue
          );
          const run = await context
            .inTmpDir(writePyProjectToml.bind(null, existingContent))
            .withPrompts({ [promptName]: promptValue });
          (await pyProjectToml(run)).should.containSubset(existingContent);
        }
      );
    }
  });

  describe("dynamic default values", () => {
    it("queries git config for the default author", async () => {
      const run = await context;

      userGitEmail.calledOnce.should.be.true;
      userGitName.calledOnce.should.be.true;

      (await pyProjectToml(run)).should.containSubset({
        tool: { poetry: { authors: ["Jin Kazama <jin.kazama@tekken.jp>"] } },
      });
    });

    it("queries current python version for default python", async () => {
      const run = await context;

      spawnCommand.calledOnceWith("python", ["--version"], {
        stdio: "pipe",
      }).should.be.true;

      (await pyProjectToml(run)).should.containSubset({
        tool: { poetry: { dependencies: { python: "^3.10.2" } } },
      });
    });

    [
      { protocol: "https", url: "https://github.com/hwoarang/https_package" },
      { protocol: "ssh", url: "git@github.com:hwoarang/https_package.git" },
    ].forEach(({ protocol, url }) =>
      it(`queries git config for the default project url (${protocol})`, async () => {
        queryGitOriginUrl.resolves(url);
        const run = await context;

        queryGitOriginUrl.calledOnce.should.be.true;

        (await pyProjectToml(run)).should.containSubset({
          tool: {
            poetry: {
              repository: "https://github.com/hwoarang/https_package",
            },
          },
        });
      })
    );
  });

  describe("install", () => {
    it("doesn't run poetry install", async () => {
      await context;
      spawnCommand.calledWith("poetry", ["install"]).should.be.false;
    });
  });
});
