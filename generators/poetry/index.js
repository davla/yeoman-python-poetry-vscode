"use strict";
import { createRequire } from "node:module";

import TOML from "@iarna/toml";
import LicenseGenerator from "generator-license";
import giturl from "giturl";
import _ from "lodash";
import gitOriginUrl from "remote-origin-url";
import Generator from "yeoman-generator";

import InputState from "../../lib/input-state.js";
import { Input, InvalidInputValueError } from "../../lib/input.js";

import {
  validateAuthor,
  validateDescription,
  validateLicense,
  validatePoetryVersionRange,
  validatePythonPackageName,
  validatePythonPackageVersion,
  validateUrl,
} from "./validate-input.js";

const require = createRequire(import.meta.url);

export default class PoetryGenerator extends Generator {
  static buildSystem = {
    "build-system": {
      requires: ["poetry-core"],
      "build-backend": "poetry.core.masonry.api",
    },
  };

  constructor(args, opts) {
    super(args, opts, {});

    this.inputState = new InputState([
      {
        [Input.PATH_KEY]: "name",
        [Input.VALIDATE_KEY]: validatePythonPackageName,
        [Input.PROMPT_KEY]: {
          message: "Python package name",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          desc: "The name of the Python package.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "version",
        [Input.VALIDATE_KEY]: validatePythonPackageVersion,
        [Input.PROMPT_KEY]: {
          message: "Python package version",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          name: "package-version",
          desc: "The version of the Python package.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "description",
        [Input.VALIDATE_KEY]: validateDescription,
        [Input.PROMPT_KEY]: {
          message: "Python package description",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          desc: "The description of the Python package.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "authors",
        [Input.VALIDATE_KEY]: validateAuthor,
        [Input.TRANSFORM_KEY]: (author) => [author],
        [Input.PROMPT_KEY]: {
          name: "author",
          message: "Python package author (name <email>)",
          type: "input",
          default: () => this._makeAuthor(),
        },
        [Input.OPTION_KEY]: {
          name: "author",
          desc: "Name and email of the Python package author.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "license",
        [Input.VALIDATE_KEY]: validateLicense,
        [Input.PROMPT_KEY]: {
          message: "Python package license",
          type: "list",
          choices: LicenseGenerator.licenses,
          default: "GPL-3.0",
        },
        [Input.OPTION_KEY]: {
          desc: "The license of the Python package.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "dependencies.python",
        [Input.VALIDATE_KEY]: validatePoetryVersionRange,
        [Input.PROMPT_KEY]: {
          name: "python",
          message: "Python versions compatible with the package",
          type: "input",
          default: async () => `^${await this._queryCurrentPythonVersion()}`,
        },
        [Input.OPTION_KEY]: {
          name: "python",
          desc: "The range of Python versions compatible with the package ",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "repository",
        [Input.VALIDATE_KEY]: validateUrl,
        [Input.PROMPT_KEY]: {
          message: "Project repository URL",
          type: "input",
          default: () => this._makeRepositoryUrl(),
        },
        [Input.OPTION_KEY]: {
          desc: "The URL of the project repository",
          type: String,
        },
      },
    ]);

    for (const option of this.inputState.options) {
      this.option(option.name, option);
    }
  }

  async initializing() {
    const diskToolPoetry = this._diskPyProjectToml.tool?.poetry ?? {};
    this.inputState.mergeValues(diskToolPoetry);
    try {
      this.inputState.mergeOptions(this._iterableOptions);
    } catch (err) {
      this._emitInvalidOptionValueError(err);
    }
  }

  async prompting() {
    const answers = await this.prompt(this.inputState.prompts);
    this.inputState.mergeAnswers(answers);
  }

  default() {
    const { authors, repository, license } = this.inputState.values;
    const [name, email] = authors[0].match(/(.*) <(.*)>$/).slice(1);

    this.composeWith(require.resolve("generator-license"), {
      name,
      email,
      website: repository,
      license,
    });
  }

  async writing() {
    const statePyProjectToml = { tool: { poetry: this.inputState.values } };
    const newPyProjectToml = PoetryGenerator._applyDefaultBuildSystem(
      _.merge(this._diskPyProjectToml, statePyProjectToml)
    );
    this._writeToml(this._pyProjectTomlPath, newPyProjectToml);
  }

  get _diskPyProjectToml() {
    return this._readToml(this._pyProjectTomlPath);
  }

  get _pyProjectTomlPath() {
    return this.destinationPath("pyproject.toml");
  }

  /*
   * The options field in Generator instances cannot be directly iterated on:
   * it contains much more than just the options. Hence, this private property.
   */
  get _iterableOptions() {
    const optionNames = this.inputState.options.map((option) => option.name);
    return _.pick(this.options, optionNames);
  }

  static _applyDefaultBuildSystem(pyProjectToml) {
    /*
     * Not use _.merge because we want to fully overwrite the default
     * "build-system" with the one on the disk, if any.
     */
    return _.assign(_.clone(PoetryGenerator.buildSystem), pyProjectToml);
  }

  _emitInvalidOptionValueError(err) {
    if (!(err instanceof InvalidInputValueError)) {
      throw err;
    }

    const errorMessage =
      `Value "${err.value}" for option --${err.input.optionPath} is ` +
      `invalid: ${_.lowerFirst(err.reason)}`;
    this.emit("error", new TypeError(errorMessage));
  }

  _makeAuthor() {
    const userName = this.user.git.name();
    const email = this.user.git.email();

    if (userName === undefined || email === undefined) {
      return null;
    }

    return `${userName} <${email}>`;
  }

  async _makeRepositoryUrl() {
    const url = await this._queryGitOriginUrl();
    return url === undefined ? null : giturl.parse(url);
  }

  async _queryCurrentPythonVersion() {
    const { stdout } = await this.spawnCommand("python", ["--version"], {
      stdio: "pipe",
    });
    return stdout.split(" ")[1];
  }

  _queryGitOriginUrl() {
    return gitOriginUrl();
  }

  _readToml(filePath, defaults = "") {
    return TOML.parse(this.fs.read(filePath, { defaults }));
  }

  _writeToml(filePath, content = {}) {
    return this.fs.write(filePath, TOML.stringify(content));
  }
}
