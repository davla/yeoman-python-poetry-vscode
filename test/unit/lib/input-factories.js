import {
  ChoiceInputFactory,
  InputFactory,
  PyProjectTomlInputFactory,
} from "../../../lib/input-factories.js";

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

  describe("compose", () => {
    for (const argName of ["ioConfig", "extras"]) {
      it(`merges "${argName}" recursively`, () => {
        const thisArg = { thisShallowKey: 22, deep: { thisKey: 73 } };
        const thatArg = { thatShallowKey: false, deep: { thatKey: true } };
        const thisFactory = new InputFactory({ [argName]: thisArg });
        const thatFactory = new InputFactory({ [argName]: thatArg });

        const factory = thisFactory.compose(thatFactory);

        factory[argName].should.containSubset({
          thisShallowKey: 22,
          thatShallowKey: false,
          deep: { thisKey: 73, thatKey: true },
        });
      });

      it(`prioritizes this when merging "${argName}"`, () => {
        const thisArg = { key: 22, deep: { key: 73 } };
        const thatArg = { key: false, deep: { key: true } };
        const thisFactory = new InputFactory({ [argName]: thisArg });
        const thatFactory = new InputFactory({ [argName]: thatArg });

        const factory = thisFactory.compose(thatFactory);

        factory[argName].should.containSubset({ key: 22, deep: { key: 73 } });
      });
    }

    it("composes valueFunctions with this functions first", async () => {
      const thisFn = sinon.stub().resolves(77);
      const thatFn = sinon.stub().resolves("eight");
      const thisFactory = new InputFactory({ valueFunctions: { f: thisFn } });
      const thatFactory = new InputFactory({ valueFunctions: { f: thatFn } });

      const factory = thisFactory.compose(thatFactory);
      const res = await factory.valueFunctions.f(false);

      thisFn.should.have.been.calledBefore(thatFn);
      thisFn.should.have.been.calledOnceWith(false);
      thatFn.should.have.been.calledOnceWith(77);
      res.should.equal("eight");
    });

    it("composes valueFunctions by name", async () => {
      const thisFn = sinon.stub().resolves(77);
      const thatFn = sinon.stub().resolves("eight");
      const thisFactory = new InputFactory({ valueFunctions: { f: thisFn } });
      const thatFactory = new InputFactory({ valueFunctions: { g: thatFn } });

      const factory = thisFactory.compose(thatFactory);
      await factory.valueFunctions.f(false);

      thisFn.should.have.been.calledOnceWith(false);
      thatFn.should.have.not.been.called;
    });
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

describe("ChoiceInputFactory", () => {
  it('creates a "String" option', () => {
    const factory = new ChoiceInputFactory({ choices: [] });
    const input = factory.create({});

    const option = input.asOption();

    option.type.should.equal(String);
  });

  [
    {
      value: "Qwilfish",
      desc: 'not in "choices"',
      err: "not one of Rampardos, Gyarados",
    },
    { value: -7, desc: "negative", err: "out of range \\[0; 1\\]" },
    { value: 3, desc: "out-of-range", err: "out of range \\[0; 1\\]" },
  ].forEach(({ value, desc, err }) => {
    it(`reports ${desc} default choices`, () => {
      const args = { choices: ["Rampardos", "Gyarados"], defaultChoice: value };
      (() => new ChoiceInputFactory(args)).should.throw(
        new RegExp(`${value}.*${err}`),
      );
    });
  });

  describe("prompt", () => {
    it('creates a "list" prompt with the inputs as choices', () => {
      const factory = new ChoiceInputFactory({
        choices: ["Infernape", "Wailord"],
        defaultChoice: "Wailord",
      });
      const input = factory.create({});

      const prompt = input.asPrompt();

      prompt.should.containSubset({
        type: "list",
        choices: ["Infernape", "Wailord"],
        default: "Wailord",
      });
    });

    it('defaults to "defaultChoice"', async () => {
      const factory = new ChoiceInputFactory({
        choices: ["Oricorio"],
        defaultChoice: "Oricorio",
      });
      const input = factory.create({});

      const prompt = input.asPrompt();

      prompt.default.should.equal("Oricorio");
    });

    it('fallbacks to the default valueFunction if "defaultChoice" is not given', async () => {
      const args = {
        choices: [],
        valueFunctions: { default: sinon.stub().resolves("Clefable") },
      };
      const factory = new ChoiceInputFactory(args);
      const input = factory.create({});

      const defaultVal = await input.asPrompt().default();

      defaultVal.should.equal("Clefable");
    });

    it('validates answers in "choices"', () => {
      const factory = new ChoiceInputFactory({ choices: ["Lampent"] });
      const input = factory.create({});

      const isValid = input.asPrompt().validate("Lampent");

      isValid.should.be.true;
    });

    it('reports answers not in "choices"', () => {
      const args = { choices: ["Donphan", "Sprigatito"] };
      const factory = new ChoiceInputFactory(args);
      const input = factory.create({});

      const isValid = input.asPrompt().validate("Fletchinder");

      isValid.should.be
        .a("string")
        .and.include("Fletchinder")
        .and.include("not")
        .and.include(args.choices.join(", "));
    });

    it('calls "validate" valueFunction for answers in choices', () => {
      const validate = sinon.stub().returns("invalid answer");
      const factory = new ChoiceInputFactory({
        choices: ["Tauros"],
        valueFunctions: { validate },
      });
      const input = factory.create({});

      const isValid = input.asPrompt().validate("Tauros");

      validate.should.have.been.calledOnceWith("Tauros");
      isValid.should.equal("invalid answer");
    });
  });
});
