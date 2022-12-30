import TOML from "@iarna/toml";
import flatten from "flat";

export function pyProjectTomlPath() {
  return this.destinationPath("pyproject.toml");
}

function readToml(filePath, defaults = "") {
  return TOML.parse(this.fs.read(filePath, { defaults }));
}

export function readPyProjectToml() {
  return readToml.call(this, pyProjectTomlPath.call(this), "[tool.poetry]");
}

function readToolPoetry() {
  return readPyProjectToml.call(this).tool?.poetry ?? {};
}

export function toolPoetryPathReader(path) {
  return function () {
    /*
     * { safe: true } ensure correct flattening of arrays. For more info, check
     * the documentation: https://github.com/hughsk/flat#safe.
     */
    return flatten(readToolPoetry.call(this), { safe: true })[path];
  };
}
