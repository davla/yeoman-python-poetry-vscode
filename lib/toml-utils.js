import TOML from "@iarna/toml";
import _ from "lodash";

export function pyProjectTomlPath() {
  return this.destinationPath("pyproject.toml");
}

function readToml(filePath, defaults = "") {
  return TOML.parse(this.fs.read(filePath, { defaults }));
}

export function readPyProjectToml() {
  return readToml.call(this, pyProjectTomlPath.call(this), "[tool.poetry]");
}

export function toolPoetryPathReader(path) {
  return function () {
    return _.get(readPyProjectToml.call(this), `tool.poetry.${path}`);
  };
}
