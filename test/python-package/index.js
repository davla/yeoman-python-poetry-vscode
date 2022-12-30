import path from "node:path";

import chai from "chai";
import { jestSnapshotPlugin as chaiSnapshot } from "mocha-chai-jest-snapshot";
import yeomanTest from "yeoman-test";

import PythonPackageGenerator from "../../generators/python-package/index.js";
import { readFileInCwd } from "../../test-lib/file-system.js";
import { withInput } from "../../test-lib/yeoman-test-input.js";

chai.use(chaiSnapshot());

const generatorInput = [
  {
    optionName: "name",
    promptName: "name",
    inputValue: "package_name",
  },
  {
    optionName: "package-version",
    promptName: "version",
    inputValue: "1.9.0",
  },
];

describe("python-poetry-vscode:python-package", () => {
  beforeEach(function () {
    this.generator = withInput(
      yeomanTest.run(PythonPackageGenerator),
      generatorInput
    );
  });

  describe("sources", () => {
    it("should create __init__.py in a directory named after the package", async function () {
      const runResult = await this.generator;

      runResult.assertFile(path.join("package_name", "__init__.py"));
    });

    it("should populate the pacakge __init__.py file", async function () {
      const runResult = await this.generator;
      const fileContent = await readFileInCwd(
        runResult,
        path.join("package_name", "__init__.py")
      );
      fileContent.should.matchSnapshot();
    });
  });

  describe("tests", () => {
    it("should create __init__.py in the tests directory", async function () {
      const runResult = await this.generator;

      runResult.assertFile(path.join("tests", "__init__.py"));
    });

    it("should populate the test __init__.py file", async function () {
      const runResult = await this.generator;
      const fileContent = await readFileInCwd(
        runResult,
        path.join("tests", "__init__.py")
      );
      fileContent.should.matchSnapshot();
    });

    it("should create a tests file named after the package in the tests directory", async function () {
      const runResult = await this.generator;

      runResult.assertFile(path.join("tests", "test_package_name.py"));
    });

    it("should populate the test file", async function () {
      const runResult = await this.generator;
      const fileContent = await readFileInCwd(
        runResult,
        path.join("tests", "test_package_name.py")
      );
      fileContent.should.matchSnapshot();
    });
  });
});
