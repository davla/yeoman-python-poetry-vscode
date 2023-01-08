import { createRequire } from "node:module";

import chalk from "chalk";
import yosay from "yosay";

import InputGenerator from "../../lib/input-generator.js";
import sharedInputs from "../../lib/shared/inputs.js";
import PoetryGenerator from "../poetry/index.js";
import PythonPackageGenerator from "../python-package/index.js";

const require = createRequire(import.meta.url);

export default class PythonPoetryVSCodeGenerator extends InputGenerator {
  constructor(args, opts) {
    super(args, opts, [
      sharedInputs.pythonPackageName,
      sharedInputs.pythonPackageVersion,
      sharedInputs.license,
    ]);
  }

  initializing() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the dazzling ${chalk.red(
          "generator-python-poetry-vscode"
        )} generator!`
      )
    );

    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  async default() {
    await this._compose(PoetryGenerator, "../poetry/index.js", [
      "name",
      "version",
      "license",
    ]);
    await this._compose(PythonPackageGenerator, "../python-package/index.js", [
      "name",
      "version",
    ]);
  }

  async _compose(generatorClass, generatorPath, optionNames) {
    this.composeWith(
      {
        Generator: generatorClass,
        path: require.resolve(generatorPath),
      },
      await this.getOptionValues(...optionNames)
    );
  }
}
