import path from "node:path";

import yeomanTest from "yeoman-test";

import PythonPackageGenerator from "../../../generators/python-package/index.js";
import restoreRunResult from "../../lib/generator-hooks.js";
import { withInput } from "../../lib/yeoman-test-input.js";

const generatorInput = [
  {
    optionName: "package-name",
    promptName: "packageName",
    inputValue: "tekken_7",
  },
  {
    optionName: "package-version",
    promptName: "packageVersion",
    inputValue: "1.9.0",
  },
];

describe("python-poetry-vscode:python-package", () => {
  beforeEach(function () {
    this.generator = withInput(
      yeomanTest.run(PythonPackageGenerator),
      generatorInput,
    );
  });

  describe("sources", () => {
    afterEach(restoreRunResult);

    it("should create __init__.py in a directory named after the package", async function () {
      this.runResult = await this.generator;
      this.runResult.assertFile(path.join("tekken_7", "__init__.py"));
    });
  });

  describe("tests", () => {
    afterEach(restoreRunResult);

    it("should create __init__.py in the tests directory", async function () {
      this.runResult = await this.generator;
      this.runResult.assertFile(path.join("tests", "__init__.py"));
    });

    it("should create a tests file named after the package in the tests directory", async function () {
      this.runResult = await this.generator;
      this.runResult.assertFile(path.join("tests", "test_tekken_7.py"));
    });
  });
});
