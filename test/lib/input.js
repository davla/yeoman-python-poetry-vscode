import "chai/register-should.js";
import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import { Input, InvalidInputValueError } from "../../lib/input.js";

chai.use(chaiSubset);
chai.use(sinonChai);

describe("Input", () => {
  describe("asOption", () => {
    it('includes keys under "shared"', () => {
      const input = new Input({ shared: { count: 22, property: false } });
      input.asOption().should.containSubset({ count: 22, property: false });
    });

    it('includes keys under "option"', () => {
      const input = new Input({ option: { field: "shovel" } });
      input.asOption().should.containSubset({ field: "shovel" });
    });

    it('overrides shared keys with those from "option"', () => {
      const input = new Input({
        shared: { property: 22 },
        option: { property: "shovel" },
      });
      input.asOption().should.containSubset({ property: "shovel" });
    });

    it('excludes keys under "prompt"', () => {
      const input = new Input({ prompt: { here: ["stuff"] } });
      input.asOption().should.not.containSubset({ here: ["stuff"] });
    });

    it("should not add option keys to shared keys", () => {
      const input = new Input({ shared: {}, option: { a: "key" } });
      input.asOption();
      input.asPrompt().should.not.containSubset({ a: "key" });
    });
  });

  describe("asPrompt", () => {
    it('includes keys under "shared"', () => {
      const input = new Input({ shared: { count: 22, property: false } });
      input.asPrompt().should.containSubset({ count: 22, property: false });
    });

    it('includes keys under "prompt"', () => {
      const input = new Input({ prompt: { here: ["stuff"] } });
      input.asPrompt().should.containSubset({ here: ["stuff"] });
    });

    it('overrides shared keys with those from "prompt"', () => {
      const input = new Input({
        shared: { property: 22 },
        prompt: { property: ["more", "stuff"] },
      });
      input.asPrompt().should.containSubset({ property: ["more", "stuff"] });
    });

    it('excludes keys under "option"', () => {
      const input = new Input({ option: { field: "shovel" } });
      input.asPrompt().should.not.containSubset({ field: "shovel" });
    });

    it("should not add prompt keys to shared keys", () => {
      const input = new Input({ shared: {}, prompt: { a: "key" } });
      input.asPrompt();
      input.asOption().should.not.containSubset({ a: "key" });
    });

    it('sets "when" to false if the value is defined', () => {
      const input = new Input({});
      input.setValue(77);
      input.asPrompt().when.should.be.false;
    });

    it('sets "when" to true if the value is not defined', () => {
      const input = new Input({});
      input.asPrompt().when.should.be.true;
    });

    it('overrides "when" if given in "prompt"', () => {
      new Input({ prompt: { when: 88 } }).asPrompt().when.should.equal(88);
    });

    for (const functionName of ["validate", "default"]) {
      it(`sets "${functionName}" to the "${functionName}" value function`, () => {
        new Input({}, { [functionName]: true })
          .asPrompt()
          [functionName].should.equal(true);
      });

      it(`overrides "${functionName}" if given in "prompt"`, () => {
        const input = new Input(
          { prompt: { [functionName]: 88 } },
          { [functionName]: true }
        );
        input.asPrompt()[functionName].should.equal(88);
      });
    }
  });

  describe("Names", () => {
    it('Input name should use "shared.name" when provided', () => {
      const input = new Input({ shared: { name: "jellyfish" } });
      input.name.should.equal("jellyfish");
    });

    it('optionName should use "option.name" when provided over "shared.name"', () => {
      const input = new Input({
        shared: { name: "jellyfish" },
        option: { name: "aye-aye" },
      });
      input.optionName.should.equal("aye-aye");
    });

    it('optionName should use "shared.name" when "option.name" is not provided', () => {
      const input = new Input({ shared: { name: "aye-aye" } });
      input.optionName.should.equal("aye-aye");
    });

    it('promptName should use "prompt.name" when provided over "shared.name"', () => {
      const input = new Input({
        shared: { name: "jellyfish" },
        prompt: { name: "aardvark" },
      });
      input.promptName.should.equal("aardvark");
    });

    it('promptName should use "shared.name" when "prompt.name" is not provided', () => {
      const input = new Input({ shared: { name: "aardvark" } });
      input.promptName.should.equal("aardvark");
    });
  });

  describe("setValue", () => {
    it("should apply transform", async () => {
      const transform = sinon.stub().withArgs(22).returns("this is a robbery");
      const input = new Input({}, { transform });

      input.setValue(22);

      (await input.getValue()).should.equal("this is a robbery");
      transform.should.have.been.calledOnceWith(22);
    });

    it("should set the new value if it's valid", async () => {
      const validate = sinon.stub().withArgs(8).returns(true);
      const input = new Input({}, { validate });

      input.setValue(8);

      (await input.getValue()).should.equal(8);
      validate.should.have.been.calledOnceWith(8);
    });

    it("shouldn't set the new value if it's not valid", () => {
      const validate = sinon.stub().withArgs(92).returns("I don't like it");
      const input = new Input({ shared: { name: "yaha" } }, { validate });

      (() => input.setValue(92)).should
        .throw(InvalidInputValueError, /I don't like it/)
        .and.include({ input, value: 92, reason: "I don't like it" });

      validate.should.have.been.calledOnceWith(92);
    });

    it("should validate the value before transformation", () => {
      const validate = sinon.stub().withArgs("Doublade").returns(true);
      const transform = sinon.stub().returns("Aegislash");

      const input = new Input({}, { validate, transform });

      input.setValue("Doublade");

      validate.should.have.been.calledOnceWith("Doublade");
    });
  });

  describe("initValue", () => {
    it(`should't use the "retrieve" value function if value is set`, async () => {
      const retrieve = sinon.spy();
      const input = new Input({}, { retrieve });
      input.setValue(false);

      await input.initValue();

      (await input.getValue()).should.equal(false);
      retrieve.should.not.have.been.called;
    });

    it('should use the "retrieve" value function if value is not set', async () => {
      const retrieve = sinon.stub().resolves("Buizel");
      const input = new Input({}, { retrieve });

      await input.initValue();

      (await input.getValue()).should.equal("Buizel");
      retrieve.should.have.been.calledOnce;
    });
  });

  describe("getValue", () => {
    it('should return the set value and not call the "retrieve" value function', async () => {
      const retrieve = sinon.spy();
      const input = new Input({}, { retrieve });

      input.setValue(false);

      (await input.getValue()).should.equal(false);
      retrieve.should.have.not.been.called;
    });

    it('should use the "retrieve" value function if the value is not set', async () => {
      const retrieve = sinon.stub().resolves("Pawmo");
      const input = new Input({}, { retrieve });

      (await input.getValue()).should.equal("Pawmo");
      retrieve.should.have.been.calledOnce;
    });
  });

  describe("extras", () => {
    it("stores extras", () =>
      new Input({}, {}, { extra: 0 }).extras.should.deep.equal({ extra: 0 }));
  });
});
