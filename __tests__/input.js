import sinon from "sinon";

import { Input, InvalidInputValueError } from "../lib/input";

describe("Input", () => {
  describe("Keys inclusion", () => {
    it("shares any keys that's not Input.OPTION_KEY or Input.PROMPT_KEY between option and prompt", () => {
      const input = new Input({ shared: 22, property: false });

      expect(input.asOption()).toStrictEqual(
        expect.objectContaining({ shared: 22, property: false })
      );
      expect(input.asPrompt()).toStrictEqual(
        expect.objectContaining({ shared: 22, property: false })
      );
    });

    it("includes keys under Input.OPTION_KEY in options", () => {
      const input = new Input({ [Input.OPTION_KEY]: { field: "shovel" } });

      expect(input.asOption()).toStrictEqual(
        expect.objectContaining({ field: "shovel" })
      );
    });

    it("includes keys under Input.PROMPT_KEY in prompts", () => {
      const input = new Input({ [Input.PROMPT_KEY]: { here: ["stuff"] } });

      expect(input.asPrompt()).toStrictEqual(
        expect.objectContaining({ here: ["stuff"] })
      );
    });

    it("overrides shared keys with those from Input.OPTION_KEY", () => {
      const input = new Input({
        shared: 22,
        [Input.OPTION_KEY]: { shared: "shovel" },
      });

      expect(input.asOption()).toStrictEqual(
        expect.objectContaining({ shared: "shovel" })
      );
    });

    it("overrides shared keys with those from Input.PROMPT_KEY", () => {
      const input = new Input({
        shared: 22,
        [Input.PROMPT_KEY]: { shared: ["more", "stuff"] },
      });

      expect(input.asPrompt()).toStrictEqual(
        expect.objectContaining({ shared: ["more", "stuff"] })
      );
    });
  });

  describe("Keys exclusion", () => {
    it("excludes keys under Input.PROMPT_KEY from options", () => {
      const input = new Input({ [Input.PROMPT_KEY]: { here: ["stuff"] } });

      expect(input.asOption()).toStrictEqual(
        expect.not.objectContaining({ here: ["stuff"] })
      );
    });

    it("excludes keys under Input.OPTION_KEY from prompts", () => {
      const input = new Input({ [Input.OPTION_KEY]: { field: "shovel" } });

      expect(input.asPrompt()).toStrictEqual(
        expect.not.objectContaining({ field: "shovel" })
      );
    });
  });

  describe("Paths", () => {
    it("Input path should use Input.PATH_KEY when provided", () => {
      const input = new Input({ [Input.PATH_KEY]: "jellyfish" });
      expect(input.path).toBe("jellyfish");
    });

    it('path should default to "name" key when Input.PATH_KEY is not provided', () => {
      const input = new Input({ name: "jellyfish" });
      expect(input.path).toBe("jellyfish");
    });

    it('path should ignore to "name" key when Input.PATH_KEY is provided', () => {
      const input = new Input({
        [Input.PATH_KEY]: "jellyfish",
        name: "squid",
      });
      expect(input.path).toBe("jellyfish");
    });

    it('optionPath should use "[Input.OPTION_KEY].name" when provided', () => {
      const input = new Input({ [Input.OPTION_KEY]: { name: "aye-aye" } });
      expect(input.optionPath).toBe("aye-aye");
    });

    it('optionPath should use path when "[Input.OPTION_KEY].name" is not provided', () => {
      const input = new Input({ [Input.PATH_KEY]: "aye-aye" });
      expect(input.optionPath).toBe("aye-aye");
    });

    it('promptPath should use "[Input.PROMPT_KEY].name" when provided', () => {
      const input = new Input({ [Input.PROMPT_KEY]: { name: "aardvark" } });
      expect(input.promptPath).toBe("aardvark");
    });

    it('promptPath should use path when "[Input.OPTION_KEY].name" is not provided', () => {
      const input = new Input({ [Input.PATH_KEY]: "aardvark" });
      expect(input.promptPath).toBe("aardvark");
    });
  });

  describe("setValue", () => {
    it('should store the value directly if "isTransformed" is true', () => {
      const transform = sinon.expectation.create();
      transform.never();
      const input = new Input({ [Input.TRANSFORM_KEY]: transform });

      input.setValue(22, { isTransformed: true });

      expect(input.value).toBe(22);
      transform.verify();
    });

    it('should apply transform if "isTransformed" is true', () => {
      const transform = sinon.expectation.create();
      transform.once().withArgs(22).returns("this is a robbery");
      const input = new Input({ [Input.TRANSFORM_KEY]: transform });

      input.setValue(22, { isTransformed: false });

      expect(input.value).toBe("this is a robbery");
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

      expect(input.value).toBe(8);
      validate.verify();
    });

    it("shouldn't set the new value if it's not valid", () => {
      const validate = sinon.expectation.create();
      validate.once().withArgs(92).returns("I don't like it");
      const input = new Input({
        [Input.PATH_KEY]: "a.dotted.path",
        [Input.VALIDATE_KEY]: validate,
      });

      try {
        input.setValue(92);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidInputValueError);
        expect(err.toString()).toContain("I don't like it");
        expect(err.input).toBe(input);
        expect(err.value).toBe(92);
        expect(err.reason).toBe("I don't like it");
      }

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

      expect(prompt.when).toBeFalsy();
    });

    it('sets "when" to true if the value is not defined', () => {
      const input = new Input({});

      const prompt = input.asPrompt();

      expect(prompt.when).toBeTruthy();
    });

    it('overrides "when" if given in Input.PROMPT_KEY', () => {
      const input = new Input({ [Input.PROMPT_KEY]: { when: 88 } });
      input.setValue("nil");

      const prompt = input.asPrompt();

      expect(prompt.when).toBe(88);
    });

    it('sets "validate" to the passed value for Input.VALIDATE_KEY', () => {
      const input = new Input({ [Input.VALIDATE_KEY]: "valid" });

      const prompt = input.asPrompt();

      expect(prompt.validate).toBe("valid");
    });

    it('overrides "validate" if given in Input.PROMPT_KEY', () => {
      const input = new Input({
        [Input.VALIDATE_KEY]: true,
        [Input.PROMPT_KEY]: { validate: 88 },
      });

      const prompt = input.asPrompt();

      expect(prompt.validate).toBe(88);
    });
  });
});
