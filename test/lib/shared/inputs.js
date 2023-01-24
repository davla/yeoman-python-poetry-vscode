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

  describe("author", () => {
    beforeEach(function () {
      this.generator = {
        user: {
          git: {
            email: sinon.stub().returns("jin.kazama@tekken.jp"),
            name: sinon.stub().returns("Jin Kazama"),
          },
        },
      };
      this.input = sharedInputs.author.create(this.generator);
    });

    it("defaults to query git config", async function () {
      this.generator.user.git.email.returns("jin.kazama@tekken.jp");
      this.generator.user.git.name.returns("Jin Kazama");

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("Jin Kazama <jin.kazama@tekken.jp>");
      this.generator.user.git.email.should.have.been.calledOnce;
      this.generator.user.git.name.should.have.been.calledOnce;
    });

    for (const method of ["email", "name"]) {
      it(`defaults to null on undefined git config ${method}`, async function () {
        this.generator.user.git[method].returns(undefined);

        const promptDefault = await this.input.asPrompt().default();

        should.equal(promptDefault, null);
        this.generator.user.git.email.callCount.should.be.at.most(1);
        this.generator.user.git.name.callCount.should.be.at.most(1);
      });
    }
  });
});
