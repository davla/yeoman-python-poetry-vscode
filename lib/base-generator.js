import path from "node:path";

import TOML from "@iarna/toml";
import gitOriginUrl from "remote-origin-url";

import InputGenerator from "./input-generator.js";
import mergeConfig from "./merge-config.js";

export default class BaseGenerator extends InputGenerator {
  _mergeJson(srcFilePath, dstDir = null) {
    return this._mergeKeyValuePairsFile(srcFilePath, dstDir, {
      read: this.fs.readJSON.bind(this.fs),
      write: this.fs.writeJSON.bind(this.fs),
    });
  }

  _mergeKeyValuePairsFile(srcFilePath, dstDir, serializer) {
    const src = serializer.read(this.templatePath(srcFilePath));

    const dstFilePath = this.destinationPath(
      dstDir === null
        ? srcFilePath
        : path.join(dstDir, path.basename(srcFilePath)),
    );
    const dst = serializer.read(dstFilePath);

    serializer.write(dstFilePath, mergeConfig(dst, src));
  }

  _mergeToml(srcFilePath, dstDir = null) {
    return this._mergeKeyValuePairsFile(srcFilePath, dstDir, {
      read: this._readToml.bind(this),
      write: this._writeToml.bind(this),
    });
  }

  _queryGitOriginUrl() {
    return gitOriginUrl();
  }

  async _queryCurrentPythonVersion() {
    const { stdout } = await this.spawnCommand("python", ["--version"], {
      stdio: "pipe",
    });
    return stdout.split(" ")[1];
  }

  _readToml(filePath, defaults = "") {
    return TOML.parse(this.fs.read(filePath, { defaults }));
  }

  _writeToml(filePath, content = {}) {
    return this.fs.write(filePath, TOML.stringify(content));
  }
}
