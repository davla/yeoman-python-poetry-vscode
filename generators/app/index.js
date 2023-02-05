import { createRequire } from "node:module";

import chalk from "chalk";
import yosay from "yosay";

import SharedInputGenerator from "../../lib/shared/input-generator.js";
import sharedInputs from "../../lib/shared/inputs.js";
import PoetryGenerator from "../poetry/index.js";
import PythonPackageGenerator from "../python-package/index.js";

const require = createRequire(import.meta.url);

export default class PythonPoetryVSCodeGenerator extends SharedInputGenerator {
  constructor(args, opts) {
    super(args, opts, Object.values(sharedInputs));
  }

  initializing() {
    this.log(
      yosay(`Welcome to the ${chalk.red("python-poetry-vscode")} generator!`)
    );

    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  async default() {
    const { repository, license } = await this.getInputValues(
      "repository",
      "license"
    );
    const [name, email] = await this._getNameAndEmail();
    this.composeWith(require.resolve("generator-license"), {
      name,
      email,
      website: repository,
      license,
    });

    await this._compose(PoetryGenerator, "../poetry/index.js", [
      "name",
      "version",
      "license",
      "author",
      "repository",
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
