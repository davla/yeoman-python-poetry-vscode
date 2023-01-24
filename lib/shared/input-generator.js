import gitOriginUrl from "remote-origin-url";

import InputGenerator from "../input-generator.js";

export default class SharedInputGenerator extends InputGenerator {
  async _getNameAndEmail() {
    const { author } = await this.getInputValues("author");
    return author[0].match(/(.*) <(.*)>$/).slice(1);
  }

  _queryGitOriginUrl() {
    return gitOriginUrl();
  }
}
