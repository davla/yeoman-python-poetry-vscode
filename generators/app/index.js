import { createRequire } from "node:module";

import chalk from "chalk";
import yosay from "yosay";

import BaseGenerator from "../../lib/base-generator.js";
import sharedInputs from "../../lib/shared/inputs.js";
import PoetryGenerator from "../poetry/index.js";
import PythonPackageGenerator from "../python-package/index.js";
import VSCodeGenerator from "../vscode/index.js";

const require = createRequire(import.meta.url);

export default class PythonPoetryVSCodeGenerator extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts, Object.values(sharedInputs));
  }

  initializing() {
    const pythonPoetryVscode = chalk.blue("python-poetry-vscode");
    this.log(yosay(`Welcome to the ${pythonPoetryVscode} generator!`));
    return super.initializing();
  }

  prompting() {
    this._logDefaultAnswers();
    return super.prompting();
  }

  default() {
    const { packageName, authorName, authorEmail, repository, license } =
      this.getInputValues(
        "authorName",
        "authorEmail",
        "repository",
        "license",
        "packageName",
      );

    this.composeWith(require.resolve("generator-editorconf"), {
      languages: ["python"],
      name: packageName,
      destination: this.destinationRoot(),
    });
    this.composeWith(require.resolve("generator-gi/generators/app"), {
      arguments: ["python", "visualstudiocode"],
    });
    this.composeWith(require.resolve("generator-license"), {
      name: authorName,
      email: authorEmail,
      website: repository,
      license,
    });

    this._compose(PoetryGenerator, "../poetry/index.js", [
      "packageName",
      "packageVersion",
      "license",
      "authorName",
      "authorEmail",
      "repository",
    ]);
    this._compose(PythonPackageGenerator, "../python-package/index.js", [
      "packageName",
      "packageVersion",
    ]);
    this._compose(VSCodeGenerator, "../vscode/index.js");
  }

  async install() {
    const poetryInstall = chalk.green("poetry install");
    this.log(
      yosay(`I'll now run ${poetryInstall} to bootstrap your workspace.`),
    );

    try {
      await this.spawnCommand("poetry", ["install"]);
    } catch (err) {
      if (err.code === "ENOENT") {
        this._logUninstalledPoetry();
        process.exit(1);
      }

      throw err;
    }
  }

  _compose(generatorClass, generatorPath, optionNames = []) {
    this.composeWith(
      {
        Generator: generatorClass,
        path: require.resolve(generatorPath),
      },
      this.getOptionValues(...optionNames),
    );
  }

  _logDefaultAnswers() {
    const defaultAnswers = chalk.blue("default answers");
    const pyprojectToml = chalk.blue("pyproject.toml");
    const git = chalk.blue("git");
    this.log(
      yosay(
        `I'll now ask you some questions. The ${defaultAnswers} are derived` +
          `from the environment (e.g. existing ${pyprojectToml}, ` +
          `${git} configuration...).`,
      ),
    );
  }

  _logUninstalledPoetry() {
    const url = "https://python-poetry.org/docs/#installation";
    const oops = chalk.red("Oops!");
    const poetry = chalk.blue("poetry");
    const intallLink = chalk.green(url);
    this.log(
      yosay(
        `${oops} It looks like you don't have ${poetry} installed. ` +
          `You can install it here: ${intallLink}.`,
        {
          maxLength: url.length + 1,
        },
      ),
    );
  }
}
