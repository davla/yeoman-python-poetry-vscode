import _ from "lodash";

import sharedInputs from "../../../../lib/shared/inputs.js";

describe("Shared inputs", () => {
  describe("packageName", () => {
    beforeEach(function () {
      this.generator = {
        destinationPath: sinon.fake(),
        fs: { read: sinon.stub() },
      };
      this.input = sharedInputs.packageName.create(this.generator);
      this.cwd = sinon.stub(process, "cwd");
    });

    afterEach(function () {
      this.cwd.restore();
    });

    it('defaults to read "name" from pyproject.toml', async function () {
      this.generator.fs.read.returns(`
        [tool.poetry]
        name = "ganryu"
      `);

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("ganryu");
      this.generator.fs.read.should.have.been.calledOnce;
      process.cwd.should.not.have.been.called;
    });

    it("defaults to the current working directory name when reading pyproject.toml is undefined", async function () {
      this.generator.fs.read.returns("");
      process.cwd.returns("/an/absolute/path/to/here");

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("here");
      process.cwd.should.have.been.calledOnce;
    });

    it("defaults to null if the current working directory is not a valid python package name", async function () {
      this.generator.fs.read.returns("");
      process.cwd.returns("/an/absolute/path/to-here");

      const promptDefault = await this.input.asPrompt().default();

      should.equal(promptDefault, null);
      process.cwd.should.have.been.calledOnce;
    });
  });

  describe("packageVersion", () => {
    beforeEach(function () {
      this.generator = {
        destinationPath: sinon.fake(),
        fs: { read: sinon.stub() },
      };
      this.input = sharedInputs.packageVersion.create(this.generator);
    });

    it('defaults to read "version" from pyproject.toml', async function () {
      this.generator.fs.read.returns(`
        [tool.poetry]
        version = "0.0.7"
      `);

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("0.0.7");
      this.generator.fs.read.should.have.been.calledOnce;
    });

    it('defaults to the "0.0.0" when reading pyproject.toml is undefined', async function () {
      this.generator.fs.read.returns("");

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("0.0.0");
    });
  });

  describe("repository", () => {
    beforeEach(function () {
      this.generator = {
        destinationPath: sinon.fake(),
        fs: { read: sinon.stub() },
        _queryGitOriginUrl: sinon.stub(),
      };
      this.input = sharedInputs.repository.create(this.generator);
    });

    it('defaults to read "repository" from pyproject.toml', async function () {
      this.generator.fs.read.returns(`
        [tool.poetry]
        repository = "https://github.com/hwoarang/https_package"
      `);

      const promptDefault = await this.input.asPrompt().default();

      promptDefault.should.equal("https://github.com/hwoarang/https_package");
      this.generator.fs.read.should.have.been.calledOnce;
      this.generator._queryGitOriginUrl.should.not.have.been.called;
    });

    [
      { protocol: "https", url: "https://github.com/hwoarang/https_package" },
      { protocol: "ssh", url: "git@github.com:hwoarang/https_package.git" },
    ].forEach(({ protocol, url }) => {
      it(`defaults to query the url of the git "origin" remote (${protocol}) when reading pyproject.toml is undefined`, async function () {
        this.generator.fs.read.returns("");
        this.generator._queryGitOriginUrl.resolves(url);

        const promptDefault = await this.input.asPrompt().default();

        promptDefault.should.equal("https://github.com/hwoarang/https_package");
        this.generator._queryGitOriginUrl.should.have.been.calledOnce;
      });
    });

    it('defaults to null when both reading pyproject.toml and querying git "origin" remote are undefined', async function () {
      this.generator.fs.read.returns("");
      this.generator._queryGitOriginUrl.resolves(undefined);

      const promptDefault = await this.input.asPrompt().default();

      should.equal(promptDefault, null);
      this.generator.fs.read.should.have.been.calledOnce;
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
          destinationPath: sinon.fake(),
          fs: { read: sinon.stub() },
          user: { git: { [gitConfigName]: this.gitConfigStub } },
        };
        this.input = sharedInputs[inputName].create(this.generator);
      });

      it('defaults to read "authors" in pyproject.toml', async function () {
        this.generator.fs.read.returns(`
          [tool.poetry]
          authors = [ "Jin Kazama <jin.kazama@tekken.jp>" ]
        `);

        const promptDefault = await this.input.asPrompt().default();

        promptDefault.should.equal(value);
        this.generator.fs.read.should.have.been.calledOnce;
      });

      it(`defaults to querying git config ${gitConfigName} when reading pyproject.toml is undefined`, async function () {
        this.generator.fs.read.returns("");
        this.gitConfigStub.returns(value);

        const promptDefault = await this.input.asPrompt().default();

        promptDefault.should.equal(value);
        this.gitConfigStub.should.have.been.calledOnce;
      });

      it(`defaults to null when both reading pyproject.toml and querying git config ${gitConfigName} are undefined`, async function () {
        this.generator.fs.read.returns("");
        this.gitConfigStub.returns(undefined);

        const promptDefault = await this.input.asPrompt().default();

        should.equal(promptDefault, null);
        this.gitConfigStub.should.have.been.calledOnce;
      });
    });
  });
});
