import LicenseGenerator from "generator-license";
import _ from "lodash";
import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import PoetryGenerator from "../../generators/poetry/index.js";
import {
  cleanupSystemAccessStubs,
  setupSystemAccessStubs,
} from "../../test-lib/system-access-stubs.js";
import { readToml, writeToml } from "../../test-lib/toml.js";
import { withInput } from "../../test-lib/yeoman-test-input.js";

const inToolPoetry = (toolPoetryPath, content) => ({
  tool: { poetry: _.set({}, toolPoetryPath, content) },
});

const pyProjectToml = (runResult) => readToml(runResult, "pyproject.toml");

function writePyProjectToml(content, dir) {
  return writeToml(dir, "pyproject.toml", content);
}

const generatorInput = [
  {
    optionName: "name",
    promptName: "name",
    outputPath: "name",
    inputValue: "input_package",
  },
  {
    optionName: "package-version",
    promptName: "version",
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
    optionName: "author",
    promptName: "author",
    outputPath: "authors.0",
    inputValue: "Paul Phoenix <paul.phoenix@tekken.us>",
  },
  {
    optionName: "license",
    promptName: "license",
    outputPath: "license",
    inputValue: LicenseGenerator.licenses[1].value,
  },
  {
    optionName: "python",
    promptName: "python",
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
  name: "mandatory_package",
  version: "1.9.0",
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
    it("should populate pyproject.toml", async function () {
      return (await pyProjectToml(await this.generator)).should.matchSnapshot();
    });

    it("creates the file in toml format", async function () {
      const runResult = await this.generator;
      runResult.assertFile("pyproject.toml");
      await readToml(runResult, "pyproject.toml").should.be.fulfilled;
    });

    it("merges with existing content", async function () {
      const runResult = await this.generator
        .doInDir(
          writePyProjectToml.bind(this.generator, {
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

    it('adds the "build-system" section', async function () {
      return (await pyProjectToml(await this.generator)).should.containSubset(
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
      const runResult = await this.generator.doInDir(
        writePyProjectToml.bind(this.generator, existingBuildSystem)
      );
      (await pyProjectToml(runResult)).should.have
        .property("build-system")
        .that.deep.equals(existingBuildSystem["build-system"]);
    });
  });

  describe("input", () => {
    for (const inputTestData of generatorInput) {
      const { optionName, inputValue, outputPath } = inputTestData;
      it(`should output input "${optionName}" at "tool.poetry.${outputPath}"`, async function () {
        const expectedContent = inToolPoetry(outputPath, inputValue);
        const runResult = await withInput(this.generator, inputTestData);
        (await pyProjectToml(runResult)).should.containSubset(expectedContent);
      });
    }
  });

  describe("dynamic default values", () => {
    it("queries current python version for default python", async function () {
      const runResult = await this.generator;
      this.stubs.spawnCommand.should.have.been.calledOnceWith(
        "python",
        ["--version"],
        {
          stdio: "pipe",
        }
      );

      (await pyProjectToml(runResult)).should.containSubset({
        tool: { poetry: { dependencies: { python: "^3.10.2" } } },
      });
    });
  });

  describe("install", () => {
    it("doesn't run poetry install", async function () {
      await this.generator;
      this.stubs.spawnCommand.should.not.have.been.calledWith("poetry", [
        "install",
      ]);
    });
  });
});
