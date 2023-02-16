import {
  InputFactory,
  PyProjectTomlInputFactory,
} from "../../lib/input-factories.js";

describe("InputFactory", () => {
  it("forwards constructor arguments to created inputs", () => {
    const ioConfig = { option: { type: String }, prompt: { type: "input" } };
    const extras = {};
    const factory = new InputFactory({ ioConfig, valueFunctions: {}, extras });

    const input = factory.create({});

    input.extras.should.deep.equal(extras);
    input.asOption().should.deep.include(ioConfig.option);
    input.asPrompt().should.deep.include(ioConfig.prompt);
  });

  it("binds this in valueFunctions to the generator", () => {
    const valueFunctions = {
      retrieve: { bind: sinon.spy() },
      transform: { bind: sinon.spy() },
      validate: { bind: sinon.spy() },
      default: { bind: sinon.spy() },
    };
    const generator = {};
    const factory = new InputFactory({ ioConfig: {}, valueFunctions });

    factory.create(generator);

    for (const valueFunction of Object.values(valueFunctions)) {
      valueFunction.bind.should.have.been.calledOnceWith(generator);
    }
  });
});

describe("PyProjectTomlInputFactory", () => {
  it('should add name as "ioConfig.shared.name"', () => {
    const factory = new PyProjectTomlInputFactory({
      name: "shared",
      ioConfig: { shared: { desc: "An hilarious description" } },
    });
    factory.ioConfig.shared.should.deep.include({
      name: "shared",
      desc: "An hilarious description",
    });
  });

  it("should add toolPoetryPath as extras", () => {
    const factory = new PyProjectTomlInputFactory({
      name: "shared",
      toolPoetryPath: "deep.shared",
      ioConfig: {},
    });
    factory.extras.toolPoetryPath.should.equal("deep.shared");
  });

  it("should add name as toolPoetryPath as extras if toolPoetryPath is not given", () => {
    const factory = new PyProjectTomlInputFactory({
      name: "shared",
      ioConfig: {},
    });
    factory.extras.toolPoetryPath.should.equal("shared");
  });

  describe("prompt default", () => {
    beforeEach(function () {
      const tomlContent = `
        [tool.poetry]
        a = false
      `;
      this.generator = {
        destinationPath: sinon.fake(),
        fs: { read: sinon.stub().returns(tomlContent) },
      };
    });

    it("should read from pyproject.toml at toolPoetryPath", async function () {
      const factory = new PyProjectTomlInputFactory({
        name: "Grotle",
        toolPoetryPath: "a",
        ioConfig: {},
      });
      const input = factory.create(this.generator);

      const promptDefault = await input.asPrompt().default();

      promptDefault.should.be.false;
    });

    it("should transform the value read from pyproject.toml", async function () {
      const retrieveTransform = sinon.stub().withArgs(false).returns("Muk");
      const factory = new PyProjectTomlInputFactory({
        name: "Grovyle",
        toolPoetryPath: "a",
        retrieveTransform,
        ioConfig: {},
      });
      const input = factory.create(this.generator);

      const promptDefault = await input.asPrompt().default();

      promptDefault.should.equal("Muk");
      retrieveTransform.should.have.been.calledOnceWith(false);
    });

    it("should not transform values when reading undefined from pyproject.toml", async function () {
      const retrieveTransform = sinon.spy();
      const factory = new PyProjectTomlInputFactory({
        name: "Grovyle",
        toolPoetryPath: "not.a",
        retrieveTransform,
        ioConfig: {},
      });
      const input = factory.create(this.generator);

      await input.asPrompt().default();

      retrieveTransform.should.have.not.been.called;
    });

    it("should use the default value function when reading undefined from pyproject.toml", async function () {
      const getDefault = sinon.stub().resolves("Kilowattrel");
      const factory = new PyProjectTomlInputFactory({
        name: "Grovyle",
        toolPoetryPath: "not.a",
        retrieveTransform: sinon.stub().returns(undefined),
        ioConfig: {},
        valueFunctions: { default: getDefault },
      });
      const input = factory.create(this.generator);

      const promptDefault = await input.asPrompt().default();

      promptDefault.should.equal("Kilowattrel");
      getDefault.should.have.been.calledOnce;
    });

    it("should be null if both reading from pyproject.toml and the default value function are undefined", async function () {
      const factory = new PyProjectTomlInputFactory({
        name: "Grovyle",
        toolPoetryPath: "not.a",
        retrieveTransform: sinon.stub().returns(undefined),
        ioConfig: {},
        valueFunctions: { default: sinon.stub().resolves(undefined) },
      });
      const input = factory.create(this.generator);

      const promptDefault = await input.asPrompt().default();

      should.equal(promptDefault, null);
    });

    it("should read from pyproject.toml at name if toolPoetryPath is not given", async function () {
      const factory = new PyProjectTomlInputFactory({
        name: "a",
        ioConfig: {},
      });
      const input = factory.create(this.generator);
      const promptDefault = await input.asPrompt().default();
      promptDefault.should.be.false;
    });
  });
});
