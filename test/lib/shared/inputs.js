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
});
