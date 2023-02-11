import _ from "lodash";

import sharedInputs from "../../../lib/shared/inputs.js";

describe("Shared inputs", () => {
  describe("repository", () => {
    beforeEach(function () {
      this.generator = {
        _queryGitOriginUrl: sinon.stub(),
      };
      this.input = sharedInputs.repository.create(this.generator);
    });

    [
      { protocol: "https", url: "https://github.com/hwoarang/https_package" },
      { protocol: "ssh", url: "git@github.com:hwoarang/https_package.git" },
    ].forEach(({ protocol, url }) =>
      it(`defaults to query the url of the git "origin" remote (${protocol})`, async function () {
        this.generator._queryGitOriginUrl.resolves(url);

        const promptDefault = await this.input.asPrompt().default();

        promptDefault.should.equal("https://github.com/hwoarang/https_package");
        this.generator._queryGitOriginUrl.should.have.been.calledOnce;
      })
    );

    it('defaults to null on undefined git "origin" remotes', async function () {
      this.generator._queryGitOriginUrl.resolves(undefined);

      const promptDefault = await this.input.asPrompt().default();

      should.equal(promptDefault, null);
      this.generator._queryGitOriginUrl.should.have.been.calledOnce;
    });
  });

  [
    { gitConfigName: "email", value: "jin.kazama@tekken.jp" },
    { gitConfigName: "name", value: "Jin Kazama" },
  ].forEach(({ gitConfigName, value }) => {
    const inputName = "author" + _.capitalize(gitConfigName);
    describe(inputName, () => {
      beforeEach(function () {
        this.gitConfigStub = sinon.stub().returns(value);
        this.generator = {
          user: { git: { [gitConfigName]: this.gitConfigStub } },
        };
        this.input = sharedInputs[inputName].create(this.generator);
      });

      it("defaults to query git config", async function () {
        this.gitConfigStub.returns(value);

        const promptDefault = await this.input.asPrompt().default();

        promptDefault.should.equal(value);
        this.gitConfigStub.should.have.been.calledOnce;
      });

      it(`defaults to null on undefined git config ${gitConfigName}`, async function () {
        this.gitConfigStub.returns(undefined);

        const promptDefault = await this.input.asPrompt().default();

        should.equal(promptDefault, null);
        this.gitConfigStub.should.have.been.calledOnce;
      });

      it("is retrieved from the authors field in pyproject.toml", async function () {
        this.generator.fs = {
          read: sinon.stub().returns(
            `[tool.poetry]
             authors = [ "Jin Kazama <jin.kazama@tekken.jp>" ]`
          ),
        };
        this.generator.destinationPath = sinon.fake();

        (await this.input.getValue()).should.equal(value);
      });
    });
  });
});
