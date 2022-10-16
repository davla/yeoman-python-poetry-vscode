import path from "node:path";

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
import { withInput } from "../../test-lib/yeoman-test-input.js";

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
    outputPath: "name",
    inputValue: "input_package",
    outputValue: "output_package",
  },
  {
    optionName: "package-version",
    promptName: "version",
    outputPath: "version",
    inputValue: "2.0.2",
    outputValue: "1.0.19",
  },
  {
    optionName: "description",
    promptName: "description",
    outputPath: "description",
    inputValue: "Input description",
    outputValue: "Output description",
  },
  {
    optionName: "author",
    promptName: "author",
    outputPath: "authors.0",
    inputValue: "Steve Fox <steve.fox@tekken.uk>",
    outputValue: "Paul Phoenix <paul.phoenix@tekken.us>",
  },
  {
    optionName: "license",
    promptName: "license",
    outputPath: "license",
    inputValue: LicenseGenerator.licenses[1].value,
    outputValue: LicenseGenerator.licenses[2].value,
  },
  {
    optionName: "python",
    promptName: "python",
    outputPath: "dependencies.python",
    inputValue: "^3.10.1",
    outputValue: "^3.7.0",
  },
  {
    optionName: "repository",
    promptName: "repository",
    outputPath: "repository",
    inputValue: "https://github.com/marshall-law/input_package",
    outputValue: "https://github.com/marshall-law/output_package",
  },
];

const mandatoryAnswers = {
  name: "mandatory_package",
  version: "1.9.0",
  description: "Non-empty description",
};

describe("python-poetry-vscode:poetry", () => {
  let generator;
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
    generator = yeomanTest
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
      (await generator).assertFile("pyproject.toml");
    });

    it("merges with existing content", async () => {
      const runResult = await generator
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
      (await pyProjectToml(runResult)).should.containSubset({
        tool: {
          poetry: {
            authors: ["Mokujin <mojukin@tekken.jp>", "Jack <jack@tekken.ru"],
            dependencies: { black: "^2.31.0", python: "^3.10.1" },
          },
        },
      });
    });

    it('adds the "build-system" section', async () => {
      const runResult = await generator;
      (await pyProjectToml(runResult)).should.containSubset(
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
      const runResult = await generator.inTmpDir(
        writePyProjectToml.bind(null, existingBuildSystem)
      );
      const actualBuildSystem = _.pick(
        await readToml(runResult, "pyproject.toml"),
        "build-system"
      );
      actualBuildSystem.should.containSubset(existingBuildSystem);
    });
  });

  describe("input", () => {
    for (const inputTestData of generatorInput) {
      const { optionName, inputValue, outputPath } = inputTestData;
      it(`should output input "${optionName}" at "${outputPath}"`, async () => {
        const expectedContent = inToolPoetry(outputPath, inputValue);
        const runResult = await withInput(generator, inputTestData);
        (await pyProjectToml(runResult)).should.containSubset(expectedContent);
      });
    }
  });

  describe("precedence", () => {
    for (const {
      optionName,
      outputPath,
      inputValue,
      outputValue,
    } of generatorInput) {
      it(`option "${optionName}" has precedence over existing content at "${outputPath}"`, async () => {
        const existingContent = inToolPoetry(outputPath, outputValue);
        const expectedContent = inToolPoetry(outputPath, inputValue);
        const runResult = await generator
          .inTmpDir(writePyProjectToml.bind(null, existingContent))
          .withOptions({ [optionName]: inputValue });
        (await pyProjectToml(runResult)).should.containSubset(expectedContent);
      });
    }

    for (const {
      promptName,
      outputPath,
      inputValue,
      outputValue,
    } of generatorInput) {
      it(
        `existing content at "${outputPath}" has precedence over prompt ` +
          promptName,
        async () => {
          const existingContent = inToolPoetry(outputPath, outputValue);
          const runResult = await generator
            .inTmpDir(writePyProjectToml.bind(null, existingContent))
            .withPrompts({ [promptName]: inputValue });
          (await pyProjectToml(runResult)).should.containSubset(
            existingContent
          );
        }
      );
    }
  });

  describe("dynamic default values", () => {
    it("queries git config for the default author", async () => {
      const runResult = await generator;

      userGitEmail.calledOnce.should.be.true;
      userGitName.calledOnce.should.be.true;

      (await pyProjectToml(runResult)).should.containSubset({
        tool: { poetry: { authors: ["Jin Kazama <jin.kazama@tekken.jp>"] } },
      });
    });

    it("queries current python version for default python", async () => {
      const runResult = await generator;

      spawnCommand.calledOnceWith("python", ["--version"], {
        stdio: "pipe",
      }).should.be.true;

      (await pyProjectToml(runResult)).should.containSubset({
        tool: { poetry: { dependencies: { python: "^3.10.2" } } },
      });
    });

    [
      { protocol: "https", url: "https://github.com/hwoarang/https_package" },
      { protocol: "ssh", url: "git@github.com:hwoarang/https_package.git" },
    ].forEach(({ protocol, url }) =>
      it(`queries git config for the default project url (${protocol})`, async () => {
        queryGitOriginUrl.resolves(url);
        const runResult = await generator;

        queryGitOriginUrl.calledOnce.should.be.true;

        (await pyProjectToml(runResult)).should.containSubset({
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
      await generator;
      spawnCommand.calledWith("poetry", ["install"]).should.be.false;
    });
  });
});
