import Generator from "yeoman-generator";

import SharedInputGenerator from "../lib/shared/input-generator.js";

export function setupSystemAccessStubs() {
  return {
    userGitEmail: sinon.stub(Generator.prototype.user.git, "email"),
    userGitName: sinon.stub(Generator.prototype.user.git, "name"),
    queryGitOriginUrl: sinon.stub(
      SharedInputGenerator.prototype,
      "_queryGitOriginUrl"
    ),
    spawnCommand: sinon.stub(Generator.prototype, "spawnCommand"),
  };
}

export function cleanupSystemAccessStubs() {
  Generator.prototype.user.git.email.restore();
  Generator.prototype.user.git.name.restore();
  SharedInputGenerator.prototype._queryGitOriginUrl.restore();
  Generator.prototype.spawnCommand.restore();
}
