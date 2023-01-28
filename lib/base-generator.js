import TOML from "@iarna/toml";
import gitOriginUrl from "remote-origin-url";

import InputGenerator from "./input-generator.js";

export default class BaseGenerator extends InputGenerator {
  async _getNameAndEmail() {
    const { author } = await this.getInputValues("author");
    return author[0].match(/(.*) <(.*)>$/).slice(1);
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
