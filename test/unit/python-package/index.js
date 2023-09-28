import path from "node:path";

import yeomanTest from "yeoman-test";

import "../../lib/register-chai-snapshots.js";
import PythonPackageGenerator from "../../../generators/python-package/index.js";
import { readFileInCwd } from "../../lib/file-system.js";
import restoreRunResult from "../../lib/generator-hooks.js";
import { withInput } from "../../lib/yeoman-test-input.js";

const generatorInput = [
  {
    optionName: "package-name",
    promptName: "packageName",
    inputValue: "package_name",
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

      this.runResult.assertFile(path.join("package_name", "__init__.py"));
    });

    it("should populate the pacakge __init__.py file", async function () {
      this.runResult = await this.generator;
      const fileContent = await readFileInCwd(
        this.runResult,
        path.join("package_name", "__init__.py"),
      );
      fileContent.should.matchSnapshot();
    });
  });

  describe("tests", () => {
    afterEach(restoreRunResult);

    it("should create __init__.py in the tests directory", async function () {
      this.runResult = await this.generator;

      this.runResult.assertFile(path.join("tests", "__init__.py"));
    });

    it("should populate the test __init__.py file", async function () {
      this.runResult = await this.generator;
      const fileContent = await readFileInCwd(
        this.runResult,
        path.join("tests", "__init__.py"),
      );
      fileContent.should.matchSnapshot();
    });

    it("should create a tests file named after the package in the tests directory", async function () {
      this.runResult = await this.generator;

      this.runResult.assertFile(path.join("tests", "test_package_name.py"));
    });

    it("should populate the test file", async function () {
      this.runResult = await this.generator;
      const fileContent = await readFileInCwd(
        this.runResult,
        path.join("tests", "test_package_name.py"),
      );
      fileContent.should.matchSnapshot();
    });
  });
});
