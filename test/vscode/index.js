import fs from "node:fs/promises";
import path from "node:path";

import yeomanTest from "yeoman-test";

import "../../test-lib/register-chai-snapshots.js";
import VSCodeGenerator from "../../generators/vscode/index.js";
import {
  readJsonInCwd,
  readTomlInCwd,
  writeTomlInCwd,
} from "../../test-lib/file-system.js";
import restoreRunResult from "../../test-lib/generator-hooks.js";
import {
  cleanupSystemAccessStubs,
  setupSystemAccessStubs,
} from "../../test-lib/system-access-stubs.js";

async function writeVsCodeConfig(fileName, content, dstDir) {
  const filePath = path.join(dstDir, ".vscode", fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(content));
}

const toPosixPath = (p) => p.replace(path.sep, path.posix.sep);

describe("python-poetry-vscode:vscode", () => {
  beforeEach(function () {
    this.stubs = setupSystemAccessStubs();
    this.generator = yeomanTest.run(VSCodeGenerator);
  });

  afterEach(cleanupSystemAccessStubs);

  describe("vscode config", () => {
    afterEach(restoreRunResult);

    for (const fileName of ["settings", "extensions"]) {
      const filePath = path.join(".vscode", `${fileName}.json`);

      it(`creates ${toPosixPath(filePath)} in JSON format`, async function () {
        this.runResult = await this.generator;
        this.runResult.assertFile(filePath);
        await readJsonInCwd(this.runResult, filePath).should.be.fulfilled;
      });

      it(`populates ${toPosixPath(filePath)}`, async function () {
        this.runResult = await this.generator;
        (await readJsonInCwd(this.runResult, filePath)).should.matchSnapshot();
      });
    }

    it(`merges .vscode/settings.json with existing content`, async function () {
      const content = {
        "python.linting.ignorePatterns": [".venv"],
        "[python]": {
          "editor.guides.indentation": true,
        },
      };
      this.runResult = await this.generator.doInDir(
        writeVsCodeConfig.bind(this.generator, "settings.json", content)
      );
      const fileInDst = path.join(".vscode", "settings.json");
      (await readJsonInCwd(this.runResult, fileInDst)).should.containSubset({
        "python.linting.ignorePatterns": ["**/site-packages/**/*.py", ".venv"],
        "[python]": {
          "editor.defaultFormatter": "ms-python.black-formatter",
          "editor.guides.indentation": true,
        },
      });
    });

    it(`merges .vscode/extensions.json with existing content`, async function () {
      const existingContent = {
        recommendations: ["BriteSnow.vscode-toggle-quotes"],
      };
      this.runResult = await this.generator.doInDir(
        writeVsCodeConfig.bind(
          this.generator,
          "extensions.json",
          existingContent
        )
      );
      const fileInDst = path.join(".vscode", "extensions.json");
      (await readJsonInCwd(this.runResult, fileInDst)).should.containSubset({
        recommendations: [
          "ms-python.black-formatter",
          "BriteSnow.vscode-toggle-quotes",
        ],
      });
    });
  });

  describe("poetry config", () => {
    afterEach(restoreRunResult);

    for (const fileName of ["poetry", "pyproject"]) {
      const filePath = fileName + ".toml";

      it(`creates ${toPosixPath(filePath)} in TOML format`, async function () {
        this.runResult = await this.generator;
        this.runResult.assertFile(filePath);
        await readTomlInCwd(this.runResult, filePath).should.be.fulfilled;
      });

      it(`populates ${toPosixPath(filePath)}`, async function () {
        this.runResult = await this.generator;
        (await readTomlInCwd(this.runResult, filePath)).should.matchSnapshot();
      });
    }

    it("merges poetry.toml with existing content", async function () {
      const existingContent = {
        virtualenvs: { create: true },
        installer: { parallel: false },
      };
      this.runResult = await this.generator.doInDir((dstDir) =>
        writeTomlInCwd(dstDir, "poetry.toml", existingContent)
      );
      (await readTomlInCwd(this.runResult, "poetry.toml")).should.containSubset(
        {
          virtualenvs: { create: true, "in-project": true },
          installer: { parallel: false },
        }
      );
    });

    it("merges pyproject.toml with existing content", async function () {
      const existingContent = {
        tool: {
          poetry: {
            dependencies: { pylint: "^2.15.0" },
            name: "existing_package",
          },
        },
      };
      this.runResult = await this.generator.doInDir((dstDir) =>
        writeTomlInCwd(dstDir, "pyproject.toml", existingContent)
      );
      (
        await readTomlInCwd(this.runResult, "pyproject.toml")
      ).should.containSubset({
        tool: {
          poetry: {
            dependencies: {
              black: "^22.12.0",
              isort: "^5.12.0",
              pylint: "^2.15.0",
            },
            name: "existing_package",
          },
        },
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
