import path from "node:path";

import _ from "lodash";

import BaseGenerator from "../../lib/base-generator.js";
import inputs from "../../lib/inputs.js";
import mergeConfig from "../../lib/merge-config.js";
import { moduleDirName } from "../../lib/paths.js";
import {
  pyProjectTomlPath,
  readPyProjectToml,
} from "../../lib/pyproject-toml-utils.js";

const parentDir = moduleDirName(import.meta);

export default class PoetryGenerator extends BaseGenerator {
  static authorInputNames = ["authorName", "authorEmail"];

  constructor(args, opts) {
    super(args, opts, [
      inputs.packageName,
      inputs.packageVersion,
      inputs.authorName,
      inputs.authorEmail,
      inputs.repository,
      inputs.license,
      inputs.description,
      inputs.pythonVersion,
    ]);
  }

  initializing() {
    this.sourceRoot(path.join(parentDir, "templates"));
    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  writing() {
    const diskPyProjectToml = readPyProjectToml.call(this);
    const statePyProjectToml = { tool: { poetry: this._toolPoetry() } };
    const newPyProjectToml = this._applyDefaultBuildSystem(
      mergeConfig(diskPyProjectToml, statePyProjectToml),
    );
    this._writeToml(pyProjectTomlPath.call(this), newPyProjectToml);
  }

  _applyDefaultBuildSystem(pyProjectToml) {
    /*
     * Not use _.merge because we want to fully overwrite the default
     * "build-system" with the one on the disk, if any.
     */
    return _.assign(
      this._readToml(this.templatePath("pyproject.toml")),
      pyProjectToml,
    );
  }

  _makeAuthors() {
    const { authorName, authorEmail } = this.getInputValues(
      "authorName",
      "authorEmail",
    );
    return { authors: [`${authorName} <${authorEmail}>`] };
  }

  _toolPoetry() {
    const verbatimInputs = this.inputs.filter(
      (input) => !PoetryGenerator.authorInputNames.includes(input.name),
    );
    const toolPoertyPaths = verbatimInputs.map(
      (input) => input.extras.toolPoetryPath,
    );
    const toolPoetryValues = verbatimInputs.map((input) => input.value);
    const toolPoetry = {
      ..._.zipObjectDeep(toolPoertyPaths, toolPoetryValues),
      ...this._makeAuthors(),
    };
    return _.pickBy(toolPoetry, (value) => value !== null);
  }
}
