import { createRequire } from "node:module";

import TOML from "@iarna/toml";
import LicenseGenerator from "generator-license";
import giturl from "giturl";
import _ from "lodash";
import gitOriginUrl from "remote-origin-url";

import InputStateGenerator from "../../lib/input-state-generator.js";
import { Input } from "../../lib/input.js";
import sharedInputs from "../../lib/shared/inputs.js";

import {
  validateAuthor,
  validateDescription,
  validateLicense,
  validatePoetryVersionRange,
  validateUrl,
} from "./validate-input.js";

const require = createRequire(import.meta.url);

export default class PoetryGenerator extends InputStateGenerator {
  static buildSystem = {
    "build-system": {
      requires: ["poetry-core"],
      "build-backend": "poetry.core.masonry.api",
    },
  };

  constructor(args, opts) {
    super(args, opts, [
      sharedInputs.pythonPackageName,
      sharedInputs.pythonPackageVersion,
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
  }

  async initializing() {
    const diskToolPoetry = this._diskPyProjectToml.tool?.poetry ?? {};
    this.inputState.mergeValues(diskToolPoetry);
    super.initializing();
  }

  prompting() {
    return super.prompting();
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

  static _applyDefaultBuildSystem(pyProjectToml) {
    /*
     * Not use _.merge because we want to fully overwrite the default
     * "build-system" with the one on the disk, if any.
     */
    return _.assign(_.clone(PoetryGenerator.buildSystem), pyProjectToml);
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
