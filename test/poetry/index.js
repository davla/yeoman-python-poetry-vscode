import LicenseGenerator from "generator-license";
import _ from "lodash";
import Generator from "yeoman-generator";
import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import PoetryGenerator from "../../generators/poetry/index.js";
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

    Generator.prototype.user.git.email = userGitEmail;
    Generator.prototype.user.git.name = userGitName;
    PoetryGenerator.prototype._queryGitOriginUrl = queryGitOriginUrl;
    Generator.prototype.spawnCommand = spawnCommand;

    generator = yeomanTest
      .run(PoetryGenerator)
      .withGenerators([
        [
          yeomanTest.createMockedGenerator(LicenseGenerator),
          "generator-license",
        ],
      ])
      // Silence the annoying warnings
      .withAnswers(mandatoryAnswers);
  });

  describe("pyproject.toml", () => {
    it("should populate pyproject.toml", async () =>
      (await pyProjectToml(await generator)).should.matchSnapshot());

    it("creates the file in toml format", async () => {
      const runResult = await generator;
      runResult.assertFile("pyproject.toml");
      await readToml(runResult, "pyproject.toml").should.be.fulfilled;
    });

    it("merges with existing content", async () => {
      const runResult = await generator
        .doInDir(
          writePyProjectToml.bind(generator, {
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

    it('adds the "build-system" section', async () =>
      (await pyProjectToml(await generator)).should.containSubset(
        PoetryGenerator.buildSystem
      ));

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
      const runResult = await generator.doInDir(
        writePyProjectToml.bind(generator, existingBuildSystem)
      );
      (await pyProjectToml(runResult)).should.have
        .property("build-system")
        .that.deep.equals(existingBuildSystem["build-system"]);
    });
  });

  describe("input", () => {
    for (const inputTestData of generatorInput) {
      const { optionName, inputValue, outputPath } = inputTestData;
      it(`should output input "${optionName}" at "tool.poetry.${outputPath}"`, async () => {
        const expectedContent = inToolPoetry(outputPath, inputValue);
        const runResult = await withInput(generator, inputTestData);
        (await pyProjectToml(runResult)).should.containSubset(expectedContent);
      });
    }
  });

  describe("dynamic default values", () => {
    it("queries git config for the default author", async () => {
      const runResult = await generator;

      userGitEmail.should.have.been.calledOnce;
      userGitName.should.have.been.calledOnce;

      (await pyProjectToml(runResult)).should.containSubset({
        tool: { poetry: { authors: ["Jin Kazama <jin.kazama@tekken.jp>"] } },
      });
    });

    it("queries current python version for default python", async () => {
      const runResult = await generator;

      spawnCommand.should.have.been.calledOnceWith("python", ["--version"], {
        stdio: "pipe",
      });

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

        queryGitOriginUrl.should.have.been.calledOnce;

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
      spawnCommand.should.not.have.been.calledWith("poetry", ["install"]);
    });
  });
});
