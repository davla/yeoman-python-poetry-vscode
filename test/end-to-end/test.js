import fs from "node:fs/promises";
import path from "node:path";

import { execa } from "execa";

import { moduleDirName } from "../../lib/paths.js";
import { readCwd } from "../lib/file-system.js";

import "../lib/register-chai-snapshots.js";

const endToEndPath = path.join(
  moduleDirName(import.meta),
  "test",
  "end-to-end",
);

describe("end-to-end tests", () => {
  beforeEach(function () {
    this.prepare = async function (subGeneratorName = null) {
      this.outputPath = path.join(endToEndPath, subGeneratorName ?? "app");
      await fs.mkdir(this.outputPath, { recursive: true });

      this.generatorName = "python-poetry-vscode";
      if (subGeneratorName !== null) {
        this.generatorName += ":" + subGeneratorName;
      }
    };

    this.execTest = async function (parameters = {}) {
      const cliArgs = Object.entries(parameters).flatMap(([key, value]) => [
        "--" + key,
        value,
      ]);
      await execa("npx", ["yo", this.generatorName, ...cliArgs], {
        cwd: this.outputPath,
      });

      (await readCwd(this.outputPath)).should.matchSnapshot();
    };
  });

  afterEach(async function () {
    await fs.rm(this.outputPath, { recursive: true });
  });

  it.skip("python-poetry-vscode", async function () {
    await this.prepare();
    await this.execTest({
      "author-email": "jin.kazama@tekken.jp",
      "author-name": "Jin Kazama",
      description: "I don't actually like fighting games",
      license: "GPL-3.0",
      "package-name": "tekken-3",
      "package-version": "0.5.3",
      "python-version": "^3.10.2",
      repository: "https://github.com/jin-kazama/tekken-3",
    });
  });

  it("python-poetry-vscode:poetry", async function () {
    await this.prepare("poetry");
    await this.execTest({
      "author-email": "paul.phoenix@tekken.us",
      "author-name": "Paul Phoenix",
      description: "I don't actually like fighting games",
      license: "MIT",
      "package-name": "tekken",
      "package-version": "2.0.2",
      "python-version": "^3.10.0",
      repository: "https://github.com/paul-phoenix/tekken",
    });
  });

  it("python-poetry-vscode:python-package", async function () {
    await this.prepare("python-package");
    await this.execTest({
      "package-name": "yoyo",
      "package-version": "1.9.0",
    });
  });

  it("python-poetry-vscode:vscode", async function () {
    await this.prepare("vscode");
    await this.execTest();
  });
});
