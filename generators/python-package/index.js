import path from "node:path";

import InputGenerator from "../../lib/input-generator.js";
import { moduleDirName } from "../../lib/paths.js";
import sharedInputs from "../../lib/shared/inputs.js";

const parentDir = moduleDirName(import.meta);

export default class PythonPackageGenerator extends InputGenerator {
  static inputs = [sharedInputs.packageName, sharedInputs.packageVersion];

  constructor(args, opts) {
    super(args, opts, PythonPackageGenerator.inputs);
  }

  async initializing() {
    await super.initializing();
    this.sourceRoot(path.join(parentDir, "templates"));
  }

  prompting() {
    return super.prompting();
  }

  async writing() {
    const { packageName, packageVersion: version } = await this.getInputValues(
      "packageName",
      "packageVersion"
    );
    this.fs.copyTpl(
      this.templatePath("__init__.py"),
      this.destinationPath(packageName, "__init__.py"),
      { version }
    );
    this.fs.copy(
      this.templatePath("tests", "__init__.py"),
      this.destinationPath("tests", "__init__.py")
    );
    this.fs.copyTpl(
      this.templatePath("tests", "test.py"),
      this.destinationPath("tests", `test_${packageName}.py`),
      { packageName, version }
    );
  }
}
