import path from "node:path";

import BaseGenerator from "../../lib/base-generator.js";
import { moduleDirName } from "../../lib/paths.js";

const parentDir = moduleDirName(import.meta);

export default class VSCodeGenerator extends BaseGenerator {
  async initializing() {
    this.sourceRoot(path.join(parentDir, "templates"));
  }

  async writing() {
    this._mergeJson("vscode/extensions.json", ".vscode");
    this._mergeJson("vscode/settings.json", ".vscode");
    this._mergeToml("poetry.toml");
    this._mergeToml("pyproject.toml");
  }
}
