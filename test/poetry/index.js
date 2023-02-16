import LicenseGenerator from "generator-license";
import _ from "lodash";
import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import PoetryGenerator from "../../generators/poetry/index.js";
import { readTomlInCwd, writeTomlInCwd } from "../../test-lib/file-system.js";
import restoreRunResult from "../../test-lib/generator-hooks.js";
import {
  cleanupSystemAccessStubs,
  setupSystemAccessStubs,
} from "../../test-lib/system-access-stubs.js";
import { withInput } from "../../test-lib/yeoman-test-input.js";

const inToolPoetry = (toolPoetryPath, content) => ({
  tool: { poetry: _.set({}, toolPoetryPath, content) },
});

const pyProjectToml = (runResult) => readTomlInCwd(runResult, "pyproject.toml");

function writePyProjectToml(content, dir) {
  return writeTomlInCwd(dir, "pyproject.toml", content);
}

const generatorInput = [
  {
    optionName: "package-name",
    promptName: "packageName",
    outputPath: "name",
    inputValue: "input_package",
  },
  {
    optionName: "package-version",
    promptName: "packageVersion",
    outputPath: "version",
    inputValue: "2.0.2",
  },
  {
    optionName: "description",
    promptName: "description",
    outputPath: "description",
    inputValue: "Input description",
  },
  {
    optionName: "license",
    promptName: "license",
    outputPath: "license",
    inputValue: LicenseGenerator.licenses[1].value,
  },
  {
    optionName: "python-version",
    promptName: "pythonVersion",
    outputPath: "dependencies.python",
    inputValue: "^3.10.1",
  },
  {
    optionName: "repository",
    promptName: "repository",
    outputPath: "repository",
    inputValue: "https://github.com/marshall-law/input_package",
  },
];

const mandatoryAnswers = {
  packageName: "mandatory_package",
  packageVersion: "1.9.0",
  description: "Non-empty description",
};

describe("python-poetry-vscode:poetry", () => {
  beforeEach(function () {
    this.stubs = setupSystemAccessStubs();
    this.stubs.queryGitOriginUrl.resolves(
      "https://github.com/eddy-gordo/git_package"
    );
    this.stubs.spawnCommand
      .withArgs("python", ["--version"], { stdio: "pipe" })
      .resolves({ stdout: "Python 3.10.2" });
    this.stubs.userGitEmail.returns("jin.kazama@tekken.jp");
    this.stubs.userGitName.returns("Jin Kazama");

    this.generator = yeomanTest
      .run(PoetryGenerator)
      // Silence the annoying warnings
      .withAnswers(mandatoryAnswers);
  });

  afterEach(cleanupSystemAccessStubs);

  describe("pyproject.toml", () => {
    afterEach(restoreRunResult);

    it("should populate pyproject.toml", async function () {
      this.runResult = await this.generator;
      return (await pyProjectToml(this.runResult)).should.matchSnapshot();
    });

    it("creates the file in toml format", async function () {
      this.runResult = await this.generator;
      this.runResult.assertFile("pyproject.toml");
      await readTomlInCwd(this.runResult, "pyproject.toml").should.be.fulfilled;
    });

    it("merges with existing content", async function () {
      this.runResult = await this.generator
        .doInDir(
          writePyProjectToml.bind(this.generator, {
            tool: {
              poetry: {
                authors: ["Combot <combot@tekken.jp>"],
                dependencies: { black: "^2.31.0" },
              },
            },
          })
        )
        .withOptions({
          "author-name": "Mokujin",
          "author-email": "mojukin@tekken.jp",
          "python-version": "^3.10.1",
        });
      (await pyProjectToml(this.runResult)).should.containSubset({
        tool: {
          poetry: {
            authors: [
              "Mokujin <mojukin@tekken.jp>",
              "Combot <combot@tekken.jp>",
            ],
            dependencies: { black: "^2.31.0", python: "^3.10.1" },
          },
        },
      });
    });

    it('adds the "build-system" section', async function () {
      this.runResult = await this.generator;
      return (await pyProjectToml(this.runResult)).should.containSubset(
        PoetryGenerator.buildSystem
      );
    });

    it('leaves existing "build-system" sections untouched', async function () {
      /*
       * Use an object as "build-system" value to verify it's not merged with
       * the default value, that is itself an object.
       */
      const existingBuildSystem = {
        "build-system": {
          requires: ["setuptools", "wheel"],
        },
      };
      this.runResult = await this.generator.doInDir(
        writePyProjectToml.bind(this.generator, existingBuildSystem)
      );
      (await pyProjectToml(this.runResult)).should.have
        .property("build-system")
        .that.deep.equals(existingBuildSystem["build-system"]);
    });
  });

  describe("input", () => {
    afterEach(restoreRunResult);

    for (const inputTestData of generatorInput) {
      const { optionName, inputValue, outputPath } = inputTestData;
      it(`should output input "${optionName}" at "tool.poetry.${outputPath}"`, async function () {
        const expectedContent = inToolPoetry(outputPath, inputValue);
        this.runResult = await withInput(this.generator, inputTestData);
        (await pyProjectToml(this.runResult)).should.containSubset(
          expectedContent
        );
      });
    }

    it('should output inputs authorName and authorEmail at "tool.poetry.author.0"', async function () {
      const expectedContent = inToolPoetry(
        "authors.0",
        "Paul Phoenix <paul.phoenix@tekken.us>"
      );
      this.runResult = await withInput(this.generator, [
        {
          optionName: "author-name",
          promptName: "authorName",
          inputValue: "Paul Phoenix",
        },
        {
          optionName: "author-email",
          promptName: "authorEmail",
          inputValue: "paul.phoenix@tekken.us",
        },
      ]);
      (await pyProjectToml(this.runResult)).should.containSubset(
        expectedContent
      );
    });
  });

  describe("dynamic default values", () => {
    afterEach(restoreRunResult);

    it("reads python version from pyproject.toml", async function () {
      const toolPoetry = {
        tool: { poetry: { dependencies: { python: "^3.7.2" } } },
      };
      this.runResult = await this.generator.doInDir(
        writePyProjectToml.bind(this.generator, toolPoetry)
      );
      this.stubs.spawnCommand.should.not.have.been.called;
      (await pyProjectToml(this.runResult)).should.containSubset(toolPoetry);
    });

    it("queries current python version for default python", async function () {
      this.runResult = await this.generator;
      this.stubs.spawnCommand.should.have.been.calledOnceWith(
        "python",
        ["--version"],
        {
          stdio: "pipe",
        }
      );

      (await pyProjectToml(this.runResult)).should.containSubset({
        tool: { poetry: { dependencies: { python: "^3.10.2" } } },
      });
    });
  });

  describe("install", () => {
    afterEach(restoreRunResult);

    it("doesn't run poetry install", async function () {
      this.runResult = await this.generator;
      this.stubs.spawnCommand.should.not.have.been.calledWith("poetry", [
        "install",
      ]);
    });
  });
});
