import { createRequire } from "node:module";

import TOML from "@iarna/toml";
import _ from "lodash";

import { PyProjectTomlInputFactory } from "../../lib/input-factories.js";
import SharedInputGenerator from "../../lib/shared/input-generator.js";
import sharedInputs from "../../lib/shared/inputs.js";
import { pyProjectTomlPath, readPyProjectToml } from "../../lib/toml-utils.js";

import {
  validateDescription,
  validatePoetryVersionRange,
} from "./validate-input.js";

const require = createRequire(import.meta.url);

export default class PoetryGenerator extends SharedInputGenerator {
  static buildSystem = {
    "build-system": {
      requires: ["poetry-core"],
      "build-backend": "poetry.core.masonry.api",
    },
  };

  static inputFactories = [
    new PyProjectTomlInputFactory({
      name: "description",
      ioConfig: {
        option: {
          desc: "The description of the Python package.",
          type: String,
        },
        prompt: {
          message: "Python package description",
          type: "input",
        },
      },
      valueFunctions: { validate: validateDescription },
    }),
    new PyProjectTomlInputFactory({
      name: "python",
      toolPoetryPath: "dependencies.python",
      ioConfig: {
        option: {
          desc: "The range of Python versions compatible with the package ",
          type: String,
        },
        prompt: {
          message: "Python versions compatible with the package",
          type: "input",
        },
      },
      valueFunctions: {
        async default() {
          return `^${await this._queryCurrentPythonVersion()}`;
        },
        validate: validatePoetryVersionRange,
      },
    }),
  ];

  constructor(args, opts) {
    super(args, opts, [
      sharedInputs.pythonPackageName,
      sharedInputs.pythonPackageVersion,
      sharedInputs.license,
      sharedInputs.repository,
      sharedInputs.author,
      ...PoetryGenerator.inputFactories,
    ]);
  }

  initializing() {
    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  async default() {
    const { author, repository, license } = await this.getInputValues(
      "author",
      "repository",
      "license"
    );
    const [name, email] = author[0].match(/(.*) <(.*)>$/).slice(1);

    this.composeWith(require.resolve("generator-license"), {
      name,
      email,
      website: repository,
      license,
    });
  }

  async writing() {
    const diskPyProjectToml = readPyProjectToml.call(this);
    const statePyProjectToml = { tool: { poetry: await this._toolPoetry() } };
    const newPyProjectToml = PoetryGenerator._applyDefaultBuildSystem(
      _.merge(diskPyProjectToml, statePyProjectToml)
    );
    this._writeToml(pyProjectTomlPath.call(this), newPyProjectToml);
  }

  static _applyDefaultBuildSystem(pyProjectToml) {
    /*
     * Not use _.merge because we want to fully overwrite the default
     * "build-system" with the one on the disk, if any.
     */
    return _.assign(_.clone(PoetryGenerator.buildSystem), pyProjectToml);
  }

  async _toolPoetry() {
    const inputPaths = this.inputs.map((input) => input.extras.toolPoetryPath);
    const inputValues = await Promise.all(
      this.inputs.map((input) => input.getValue())
    );
    return _.zipObjectDeep(inputPaths, inputValues);
  }

  async _queryCurrentPythonVersion() {
    const { stdout } = await this.spawnCommand("python", ["--version"], {
      stdio: "pipe",
    });
    return stdout.split(" ")[1];
  }

  _writeToml(filePath, content = {}) {
    return this.fs.write(filePath, TOML.stringify(content));
  }
}
