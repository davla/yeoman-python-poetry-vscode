"use strict";
import TOML from "@iarna/toml";
import _ from "lodash";
import Generator from "yeoman-generator";

import InputState from "../../lib/input-state.js";
import Input from "../../lib/input.js";

export default class PoetryGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts, {});

    this.inputState = new InputState([
      {
        [Input.PATH_KEY]: "name",
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
        [Input.TRANSFORM_KEY]: (author) => [author],
        [Input.PROMPT_KEY]: {
          name: "author",
          message: "Python package author (name <email>)",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          name: "author",
          desc: "Name and email of the Python package author.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "license",
        [Input.PROMPT_KEY]: {
          message: "Python package license",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          desc: "The license of the Python package.",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "dependencies.python",
        [Input.PROMPT_KEY]: {
          name: "python",
          message: "Python versions compatible with the package",
          type: "input",
        },
        [Input.OPTION_KEY]: {
          name: "python",
          desc: "The range of Python versions compatible with the package ",
          type: String,
        },
      },
      {
        [Input.PATH_KEY]: "repository",
        [Input.PROMPT_KEY]: {
          message: "Project repository URL",
          type: "input",
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
    this.inputState.mergeOptions(this._iterableOptions);
  }

  async prompting() {
    const answers = await this.prompt(this.inputState.prompts);
    this.inputState.mergeAnswers(answers);
  }

  async writing() {
    const statePyProjectToml = { tool: { poetry: this.inputState.values } };
    const newPyProjectToml = _.merge(
      this._diskPyProjectToml,
      statePyProjectToml
    );
    this._writeToml(this._pyProjectTomlPath, newPyProjectToml);
  }

  install() {}

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

  _readToml(filePath, defaults = "") {
    return TOML.parse(this.fs.read(filePath, { defaults }));
  }

  _writeToml(filePath, content = {}) {
    return this.fs.write(filePath, TOML.stringify(content));
  }
}
