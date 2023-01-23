import Generator from "yeoman-generator";

import SharedInputGenerator from "../lib/shared/input-generator.js";

export default function setupSystemAccessStubs() {
  const stubs = {
    userGitEmail: sinon.stub(),
    userGitName: sinon.stub(),
    queryGitOriginUrl: sinon.stub(),
    spawnCommand: sinon.stub(),
  };

  Generator.prototype.user.git.email = stubs.userGitEmail;
  Generator.prototype.user.git.name = stubs.userGitName;
  SharedInputGenerator.prototype._queryGitOriginUrl = stubs.queryGitOriginUrl;
  Generator.prototype.spawnCommand = stubs.spawnCommand;

  return stubs;
}
