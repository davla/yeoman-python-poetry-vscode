import _ from "lodash";

import BaseGenerator from "../../lib/base-generator.js";
import { PyProjectTomlInputFactory } from "../../lib/input-factories.js";
import mergeConfig from "../../lib/merge-config.js";
import {
  pyProjectTomlPath,
  readPyProjectToml,
} from "../../lib/pyproject-toml-utils.js";
import sharedInputs from "../../lib/shared/inputs.js";

import {
  validateDescription,
  validatePoetryVersionRange,
} from "./validate-input.js";

export default class PoetryGenerator extends BaseGenerator {
  static authorInputNames = ["authorName", "authorEmail"];
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
      name: "pythonVersion",
      toolPoetryPath: "dependencies.python",
      ioConfig: {
        option: {
          name: "python-version",
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
      sharedInputs.packageName,
      sharedInputs.packageVersion,
      sharedInputs.authorName,
      sharedInputs.authorEmail,
      sharedInputs.repository,
      sharedInputs.license,
      ...PoetryGenerator.inputFactories,
    ]);
  }

  initializing() {
    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  async writing() {
    const diskPyProjectToml = readPyProjectToml.call(this);
    const statePyProjectToml = { tool: { poetry: await this._toolPoetry() } };
    const newPyProjectToml = PoetryGenerator._applyDefaultBuildSystem(
      mergeConfig(diskPyProjectToml, statePyProjectToml)
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

  async _makeAuthors() {
    const { authorName, authorEmail } = await this.getInputValues(
      "authorName",
      "authorEmail"
    );
    return { authors: [`${authorName} <${authorEmail}>`] };
  }

  async _toolPoetry() {
    const verbatimInputs = this.inputs.filter(
      (input) => !PoetryGenerator.authorInputNames.includes(input.name)
    );
    const inputPaths = verbatimInputs.map(
      (input) => input.extras.toolPoetryPath
    );
    const inputValues = await Promise.all(
      verbatimInputs.map((input) => input.getValue())
    );
    return {
      ..._.zipObjectDeep(inputPaths, inputValues),
      ...(await this._makeAuthors()),
    };
  }

  async _queryCurrentPythonVersion() {
    const { stdout } = await this.spawnCommand("python", ["--version"], {
      stdio: "pipe",
    });
    return stdout.split(" ")[1];
  }
}
