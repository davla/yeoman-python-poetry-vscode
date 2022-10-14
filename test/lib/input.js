import "chai/register-should.js";
import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";

import { Input, InvalidInputValueError } from "../../lib/input.js";

chai.use(chaiSubset);

describe("Input", () => {
  describe("Keys inclusion", () => {
    it("shares any keys that's not Input.OPTION_KEY or Input.PROMPT_KEY between option and prompt", () => {
      const input = new Input({ shared: 22, property: false });
      input.asOption().should.containSubset({ shared: 22, property: false });
      input.asPrompt().should.containSubset({ shared: 22, property: false });
    });

    it("includes keys under Input.OPTION_KEY in options", () => {
      const input = new Input({ [Input.OPTION_KEY]: { field: "shovel" } });
      input.asOption().should.containSubset({ field: "shovel" });
    });

    it("includes keys under Input.PROMPT_KEY in prompts", () => {
      const input = new Input({ [Input.PROMPT_KEY]: { here: ["stuff"] } });
      input.asPrompt().should.containSubset({ here: ["stuff"] });
    });

    it("overrides shared keys with those from Input.OPTION_KEY", () => {
      const input = new Input({
        shared: 22,
        [Input.OPTION_KEY]: { shared: "shovel" },
      });
      input.asOption().should.containSubset({ shared: "shovel" });
    });

    it("overrides shared keys with those from Input.PROMPT_KEY", () => {
      const input = new Input({
        shared: 22,
        [Input.PROMPT_KEY]: { shared: ["more", "stuff"] },
      });
      input.asPrompt().should.containSubset({ shared: ["more", "stuff"] });
    });
  });

  describe("Keys exclusion", () => {
    it("excludes keys under Input.PROMPT_KEY from options", () => {
      const input = new Input({ [Input.PROMPT_KEY]: { here: ["stuff"] } });
      input.asOption().should.not.containSubset({ here: ["stuff"] });
    });

    it("excludes keys under Input.OPTION_KEY from prompts", () => {
      const input = new Input({ [Input.OPTION_KEY]: { field: "shovel" } });
      input.asPrompt().should.not.containSubset({ field: "shovel" });
    });
  });

  describe("Paths", () => {
    it("Input path should use Input.PATH_KEY when provided", () => {
      const input = new Input({ [Input.PATH_KEY]: "jellyfish" });
      input.path.should.equal("jellyfish");
    });

    it('path should default to "name" key when Input.PATH_KEY is not provided', () => {
      const input = new Input({ name: "jellyfish" });
      input.path.should.equal("jellyfish");
    });

    it('path should ignore to "name" key when Input.PATH_KEY is provided', () => {
      const input = new Input({
        [Input.PATH_KEY]: "jellyfish",
        name: "squid",
      });
      input.path.should.equal("jellyfish");
    });

    it('optionPath should use "[Input.OPTION_KEY].name" when provided', () => {
      const input = new Input({ [Input.OPTION_KEY]: { name: "aye-aye" } });
      input.optionPath.should.equal("aye-aye");
    });

    it('optionPath should use path when "[Input.OPTION_KEY].name" is not provided', () => {
      const input = new Input({ [Input.PATH_KEY]: "aye-aye" });
      input.optionPath.should.equal("aye-aye");
    });

    it('promptPath should use "[Input.PROMPT_KEY].name" when provided', () => {
      const input = new Input({ [Input.PROMPT_KEY]: { name: "aardvark" } });
      input.promptPath.should.equal("aardvark");
    });

    it('promptPath should use path when "[Input.OPTION_KEY].name" is not provided', () => {
      const input = new Input({ [Input.PATH_KEY]: "aardvark" });
      input.promptPath.should.equal("aardvark");
    });
  });

  describe("setValue", () => {
    it('should store the value directly if "isTransformed" is true', () => {
      const transform = sinon.expectation.create();
      transform.never();
      const input = new Input({ [Input.TRANSFORM_KEY]: transform });

      input.setValue(22, { isTransformed: true });

      input.value.should.equal(22);
      transform.verify();
    });

    it('should apply transform if "isTransformed" is true', () => {
      const transform = sinon.expectation.create();
      transform.once().withArgs(22).returns("this is a robbery");
      const input = new Input({ [Input.TRANSFORM_KEY]: transform });

      input.setValue(22, { isTransformed: false });

      input.value.should.equal("this is a robbery");
      transform.verify();
    });

    it('should not validate the new value if "isTransformed" is true', () => {
      const validate = sinon.expectation.create();
      validate.never();
      const input = new Input({ [Input.VALIDATE_KEY]: validate });

      input.setValue(true, { isTransformed: true });

      validate.verify();
    });

    it("should set the new value if it's valid", () => {
      const validate = sinon.expectation.create();
      validate.once().withArgs(8).returns(true);
      const input = new Input({ [Input.VALIDATE_KEY]: validate });

      input.setValue(8);

      input.value.should.equal(8);
      validate.verify();
    });

    it("shouldn't set the new value if it's not valid", () => {
      const validate = sinon.expectation.create();
      validate.once().withArgs(92).returns("I don't like it");
      const input = new Input({
        [Input.PATH_KEY]: "a.dotted.path",
        [Input.VALIDATE_KEY]: validate,
      });

      (() => input.setValue(92)).should
        .throw(InvalidInputValueError, /I don't like it/)
        .and.include({ input, value: 92, reason: "I don't like it" });

      validate.verify();
    });

    it("should validate the value before transformation", () => {
      const validate = sinon.expectation.create();
      validate.once().withArgs("Doublade").returns(true);

      const transform = sinon.stub().returns("Aegislash");

      const input = new Input({
        [Input.VALIDATE_KEY]: validate,
        [Input.TRANSFORM_KEY]: transform,
      });

      input.setValue("Doublade");

      validate.verify();
    });
  });

  describe("Prompt-specific", () => {
    it('sets "when" to false if the value is defined', () => {
      const input = new Input({});
      input.setValue(77);

      const prompt = input.asPrompt();

      prompt.when.should.be.false;
    });

    it('sets "when" to true if the value is not defined', () => {
      const input = new Input({});

      const prompt = input.asPrompt();

      prompt.when.should.be.true;
    });

    it('overrides "when" if given in Input.PROMPT_KEY', () => {
      const input = new Input({ [Input.PROMPT_KEY]: { when: 88 } });
      input.setValue("nil");

      const prompt = input.asPrompt();

      prompt.when.should.equal(88);
    });

    it('sets "validate" to the passed value for Input.VALIDATE_KEY', () => {
      const input = new Input({ [Input.VALIDATE_KEY]: "valid" });

      const prompt = input.asPrompt();

      prompt.validate.should.equal("valid");
    });

    it('overrides "validate" if given in Input.PROMPT_KEY', () => {
      const input = new Input({
        [Input.VALIDATE_KEY]: true,
        [Input.PROMPT_KEY]: { validate: 88 },
      });

      const prompt = input.asPrompt();

      prompt.validate.should.equal(88);
    });
  });
});
