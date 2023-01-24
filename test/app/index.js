import { createRequire } from "node:module";

import Generator from "yeoman-generator";
import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import PythonPoetryVSCodeGenerator from "../../generators/app/index.js";
import PoetryGenerator from "../../generators/poetry/index.js";
import PythonPackageGenerator from "../../generators/python-package/index.js";
import { readCwd } from "../../test-lib/file-system.js";
import {
  cleanupSystemAccessStubs,
  setupSystemAccessStubs,
} from "../../test-lib/system-access-stubs.js";
import { withInput } from "../../test-lib/yeoman-test-input.js";

const require = createRequire(import.meta.url);

describe("python-poetry-vscode", () => {
  beforeEach(function () {
    const stubs = setupSystemAccessStubs();
    stubs.queryGitOriginUrl.resolves(
      "https://github.com/eddy-gordo/git_package"
    );
    stubs.spawnCommand
      .withArgs("python", ["--version"], { stdio: "pipe" })
      .resolves({ stdout: "Python 3.10.2" });
    stubs.userGitEmail.returns("jin.kazama@tekken.jp");
    stubs.userGitName.returns("Jin Kazama");

    this.generator = yeomanTest.run(PythonPoetryVSCodeGenerator).withAnswers({
      name: "mandatory_package",
      version: "3.18.0",
      description: "I don't actually like fighting games",
    });
  });

  afterEach(cleanupSystemAccessStubs);

  it("should create the project scaffold files", async function () {
    const runResult = await this.generator;
    (await readCwd(runResult)).should.matchSnapshot();
  });

  describe("subgenerators", () => {
    beforeEach(function () {
      this.generator = withInput(this.generator, [
        {
          optionName: "name",
          promptName: "name",
          inputValue: "tekken",
        },
        {
          optionName: "package-version",
          promptName: "version",
          inputValue: "0.5.3",
        },
        {
          optionName: "author",
          promptName: "author",
          inputValue: "Anna Williams <anna.williamsa@tekken.ie>",
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

    afterEach(() => {
      Generator.prototype.composeWith.restore();
    });

    it('should call "generator-license"', async function () {
      await this.generator;
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
      await this.generator;
      this.composeWith.should.have.been.calledWith(
        {
          Generator: PoetryGenerator,
          path: require.resolve("../../generators/poetry/index.js"),
        },
        {
          author: ["Anna Williams <anna.williamsa@tekken.ie>"],
          license: "GPL-3.0",
          name: "tekken",
          "package-version": "0.5.3",
          repository: "https://github.com/steve-fox/git_package",
        }
      );
    });

    it('should call "python-poetry-vscode:python-package"', async function () {
      await this.generator;
      this.composeWith.should.have.been.calledWith(
        {
          Generator: PythonPackageGenerator,
          path: require.resolve("../../generators/python-package/index.js"),
        },
        {
          name: "tekken",
          "package-version": "0.5.3",
        }
      );
    });
  });
});