import Generator from "yeoman-generator";

import BaseGenerator from "../../lib/base-generator.js";

export function setupSystemAccessStubs() {
  return {
    userGitEmail: sinon.stub(Generator.prototype.user.git, "email"),
    userGitName: sinon.stub(Generator.prototype.user.git, "name"),
    queryGitOriginUrl: sinon.stub(
      BaseGenerator.prototype,
      "_queryGitOriginUrl",
    ),
    spawnCommand: sinon.stub(Generator.prototype, "spawnCommand"),
  };
}

export function cleanupSystemAccessStubs() {
  Generator.prototype.user.git.email.restore();
  Generator.prototype.user.git.name.restore();
  BaseGenerator.prototype._queryGitOriginUrl.restore();
  Generator.prototype.spawnCommand.restore();
}
