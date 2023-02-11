import {
  readPyProjectToml,
  toolPoetryPathReader,
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

  describe("toolPoetryPathReader", () => {
    it('reads keys from "tool.poetry" in pyproject.toml file', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[tool.poetry]
         b = 2`
      );
      const reader = toolPoetryPathReader("b");
      reader.call(this.generator).should.equal(2);
    });

    it('reads paths from "tool.poetry" in pyproject.toml file', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[tool.poetry.c]
         d = 4`
      );
      const reader = toolPoetryPathReader("c.d");
      reader.call(this.generator).should.equal(4);
    });

    it('returns undefined on missing "tool" key', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[not.tool.poetry]
         e = 5`
      );
      const reader = toolPoetryPathReader("e");
      should.not.exist(reader.call(this.generator));
    });

    it('returns undefined on missing "tool.poetry" path', function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[tool.not.poetry]
         f = 6`
      );
      const reader = toolPoetryPathReader("f");
      should.not.exist(reader.call(this.generator));
    });

    it("applies the transform function when the path exists", function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[tool.poetry]
         g = 7`
      );
      const transform = sinon.stub().withArgs(7).returns("bananas");
      const reader = toolPoetryPathReader("g", transform);

      reader.call(this.generator, transform).should.equal("bananas");
      transform.should.have.been.calledOnceWith(7);
    });

    it("doesn't apply the transform function when the path doesn't exists", function () {
      this.generator.fs.read.withArgs(this.pyProjectTomlDst).returns(
        `[tool.poetry]
         h = 8`
      );
      const transform = sinon.spy();
      const reader = toolPoetryPathReader("i", transform);

      reader.call(this.generator);
      transform.should.have.not.been.called;
    });
  });
});
