import _ from "lodash";

import BaseGenerator from "./base-generator.js";

const readToml = BaseGenerator.prototype._readToml;

export function pyProjectTomlPath() {
  return this.destinationPath("pyproject.toml");
}

export function readPyProjectToml() {
  return readToml.call(this, pyProjectTomlPath.call(this), "[tool.poetry]");
}

export function readToolPoetryPath(path) {
  return _.get(readPyProjectToml.call(this), `tool.poetry.${path}`);
}
