import {
  readPyProjectToml,
  readToolPoetryPath,
} from "../../lib/pyproject-toml-utils.js";

describe("toml-utils", () => {
  beforeEach(function () {
    this.pyProjectTomlDst = "dst/pyproject.toml";
    const fakeFs = { read: (_, { defaults }) => defaults };
    this.generator = {
      destinationPath: sinon.stub().returns(this.pyProjectTomlDst),
      fs: { read: sinon.stub(fakeFs, "read").callThrough() },
    };
  });

  describe("readPyProjectToml", () => {
    it("reads pyproject.toml in the generator destination path", function () {
      readPyProjectToml.call(this.generator);
      this.generator.destinationPath.should.have.been.calledOnceWith(
        "pyproject.toml"
      );
    });

    it("returns pyproject.toml content", function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns("a = 1");
      readPyProjectToml.call(this.generator).should.deep.equal({ a: 1 });
    });

    it('returns an empty "tool.poetry" sub-object for non-existing files', function () {
      readPyProjectToml
        .call(this.generator)
        .should.deep.equal({ tool: { poetry: {} } });
    });
  });

  describe("readToolPoetryPath", () => {
    it('reads keys from "tool.poetry" in pyproject.toml file', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(`
        [tool.poetry]
        b = 2
      `);
      readToolPoetryPath.call(this.generator, "b").should.equal(2);
    });

    it('reads paths from "tool.poetry" in pyproject.toml file', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(`
        [tool.poetry.c]
        d = 4
      `);
      readToolPoetryPath.call(this.generator, "c.d").should.equal(4);
    });

    it('returns undefined on missing "tool" key', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(`
        [not.tool.poetry]
        e = 5
      `);
      should.equal(readToolPoetryPath.call(this.generator, "e"), undefined);
    });

    it('returns undefined on missing "tool.poetry" path', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(`
        [tool.not.poetry]
        f = 6
      `);
      should.equal(readToolPoetryPath.call(this.generator, "f"), undefined);
    });
  });
});
