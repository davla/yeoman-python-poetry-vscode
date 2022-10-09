import path from "node:path";

import InputStateGenerator from "../../lib/input-state-generator.js";
import { moduleDirName } from "../../lib/paths.js";
import sharedInputs from "../../lib/shared/inputs.js";

const parentDir = moduleDirName(import.meta);

export default class PythonPackageGenerator extends InputStateGenerator {
  static inputs = [
    sharedInputs.pythonPackageName,
    sharedInputs.pythonPackageVersion,
  ];

  constructor(args, opts) {
    super(args, opts, PythonPackageGenerator.inputs);
  }

  initializing() {
    super.initializing();
    this.sourceRoot(path.join(parentDir, "templates"));
  }

  prompting() {
    return super.prompting();
  }

  writing() {
    const { name: packageName, version } = this.inputState.values;
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
