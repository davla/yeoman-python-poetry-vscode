import { createRequire } from "node:module";

import Generator from "yeoman-generator";
import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import PythonPoetryVSCodeGenerator from "../../generators/app/index.js";
import PoetryGenerator from "../../generators/poetry/index.js";
import PythonPackageGenerator from "../../generators/python-package/index.js";
import VSCodeGenerator from "../../generators/vscode/index.js";
import { readCwd } from "../../test-lib/file-system.js";
import restoreRunResult from "../../test-lib/generator-hooks.js";
import {
  cleanupSystemAccessStubs,
  setupSystemAccessStubs,
} from "../../test-lib/system-access-stubs.js";
import { withInput } from "../../test-lib/yeoman-test-input.js";

const require = createRequire(import.meta.url);

describe("python-poetry-vscode", () => {
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

    this.generator = yeomanTest.run(PythonPoetryVSCodeGenerator).withAnswers({
      packageName: "mandatory_package",
      packageVersion: "3.18.0",
      description: "I don't actually like fighting games",
    });
  });

  afterEach(function () {
    cleanupSystemAccessStubs();
    restoreRunResult.call(this);
  });

  it("should create the project scaffold files", async function () {
    this.runResult = await this.generator;
    (await readCwd(this.runResult)).should.matchSnapshot();
  });

  describe("subgenerators", () => {
    beforeEach(function () {
      this.generator = withInput(this.generator, [
        {
          optionName: "package-name",
          promptName: "packageName",
          inputValue: "tekken",
        },
        {
          optionName: "package-version",
          promptName: "packageVersion",
          inputValue: "0.5.3",
        },
        {
          optionName: "author-name",
          promptName: "authorName",
          inputValue: "Anna Williams",
        },
        {
          optionName: "author-email",
          promptName: "authorEmail",
          inputValue: "anna.williamsa@tekken.ie",
        },
        {
          optionName: "repository",
          promptName: "repository",
          inputValue: "https://github.com/steve-fox/git_package",
        },
        {
          optionName: "license",
          promptName: "license",
          inputValue: "GPL-3.0",
        },
      ]);
      this.composeWith = sinon
        .stub(Generator.prototype, "composeWith")
        .returnsThis();
    });

    afterEach(function () {
      Generator.prototype.composeWith.restore();
      restoreRunResult.call(this);
    });

    it('should call "generator-editorconf"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith(
        require.resolve("generator-editorconf"),
        {
          languages: ["python"],
          name: "tekken",
          destination: this.runResult.cwd,
        }
      );
    });

    it('should call "generator-gi"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith(
        require.resolve("generator-gi/generators/app"),
        { arguments: ["python", "visualstudiocode"] }
      );
    });

    it('should call "generator-license"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith(
        require.resolve("generator-license"),
        {
          email: "anna.williamsa@tekken.ie",
          license: "GPL-3.0",
          name: "Anna Williams",
          website: "https://github.com/steve-fox/git_package",
        }
      );
    });

    it('should call "python-poetry-vscode:poetry"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith(
        {
          Generator: PoetryGenerator,
          path: require.resolve("../../generators/poetry/index.js"),
        },
        {
          "author-name": "Anna Williams",
          "author-email": "anna.williamsa@tekken.ie",
          license: "GPL-3.0",
          "package-name": "tekken",
          "package-version": "0.5.3",
          repository: "https://github.com/steve-fox/git_package",
        }
      );
    });

    it('should call "python-poetry-vscode:python-package"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith(
        {
          Generator: PythonPackageGenerator,
          path: require.resolve("../../generators/python-package/index.js"),
        },
        {
          "package-name": "tekken",
          "package-version": "0.5.3",
        }
      );
    });

    it('should call "python-poetry-vscode:vscode"', async function () {
      this.runResult = await this.generator;
      this.composeWith.should.have.been.calledWith({
        Generator: VSCodeGenerator,
        path: require.resolve("../../generators/vscode/index.js"),
      });
    });
  });

  describe("install", () => {
    afterEach(restoreRunResult);

    it("runs poetry install exactly once", async function () {
      this.runResult = await this.generator;
      this.stubs.spawnCommand.should.have.been.calledWith("poetry", [
        "install",
      ]);
    });
  });
});
