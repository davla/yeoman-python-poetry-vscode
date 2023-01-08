import { createRequire } from "node:module";

import TOML from "@iarna/toml";
import giturl from "giturl";
import _ from "lodash";
import gitOriginUrl from "remote-origin-url";

import { PyProjectTomlInputFactory } from "../../lib/input-factories.js";
import InputGenerator from "../../lib/input-generator.js";
import sharedInputs from "../../lib/shared/inputs.js";
import { pyProjectTomlPath, readPyProjectToml } from "../../lib/toml-utils.js";

import {
  validateAuthor,
  validateDescription,
  validatePoetryVersionRange,
  validateUrl,
} from "./validate-input.js";

const require = createRequire(import.meta.url);

export default class PoetryGenerator extends InputGenerator {
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
      name: "author",
      toolPoetryPath: "authors",
      ioConfig: {
        option: {
          desc: "Name and email of the Python package author.",
          type: String,
        },
        prompt: {
          name: "author",
          message: "Python package author (name <email>)",
          type: "input",
        },
      },
      valueFunctions: {
        default() {
          return this._makeAuthor();
        },
        transform: (author) => [author],
        validate: validateAuthor,
      },
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
    new PyProjectTomlInputFactory({
      name: "repository",
      ioConfig: {
        option: {
          desc: "The URL of the project repository",
          type: String,
        },
        prompt: {
          message: "Project repository URL",
          type: "input",
        },
      },
      valueFunctions: {
        default() {
          return this._makeRepositoryUrl();
        },
        validate: validateUrl,
      },
    }),
  ];

  constructor(args, opts) {
    super(args, opts, [
      sharedInputs.pythonPackageName,
      sharedInputs.pythonPackageVersion,
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

  _writeToml(filePath, content = {}) {
    return this.fs.write(filePath, TOML.stringify(content));
  }
}
