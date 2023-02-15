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

  it("should retrieve toolPoetryPath from pyproject.toml", async function () {
    const factory = new PyProjectTomlInputFactory({
      name: "Grotle",
      toolPoetryPath: "a",
      ioConfig: {},
    });
    const input = factory.create(this.generator);
    await input.initValue();
    (await input.getValue()).should.be.false;
  });

  it("should transform the value at toolPoetryPath upon retrieval", async function () {
    const retrieveTransform = sinon.stub().withArgs(false).returns("Muk");
    const factory = new PyProjectTomlInputFactory({
      name: "Grovyle",
      toolPoetryPath: "a",
      retrieveTransform,
      ioConfig: {},
    });
    const input = factory.create(this.generator);
    await input.initValue();
    (await input.getValue()).should.equal("Muk");
    retrieveTransform.should.have.been.calledOnceWith(false);
  });

  it("should add toolPoetryPath as extras", () => {
    const factory = new PyProjectTomlInputFactory({
      name: "shared",
      toolPoetryPath: "deep.shared",
      ioConfig: {},
    });
    factory.extras.toolPoetryPath.should.equal("deep.shared");
  });

  it("should retrieve name from pyproject.toml if toolPoetryPath is not given", async function () {
    const factory = new PyProjectTomlInputFactory({
      name: "a",
      ioConfig: {},
    });
    const input = factory.create(this.generator);
    await input.initValue();
    (await input.getValue()).should.be.false;
  });

  it("should add name as toolPoetryPath as extras if toolPoetryPath is not given", () => {
    const factory = new PyProjectTomlInputFactory({
      name: "shared",
      ioConfig: {},
    });
    factory.extras.toolPoetryPath.should.equal("shared");
  });
});
