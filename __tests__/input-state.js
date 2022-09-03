import sinon from "sinon";

import InputState from "../lib/input-state.js";
import Input from "../lib/input.js";

const nonTransformedMergeMethods = [
  {
    inputType: "options",
    merge(values) {
      this.mergeOptions(values);
    },
  },
  {
    inputType: "answers",
    merge(values) {
      this.mergeAnswers(values);
    },
  },
];

const transformedMergeMethods = [
  {
    inputType: "values",
    merge(values) {
      this.mergeValues(values);
    },
  },
];

const mergeMethods = nonTransformedMergeMethods.concat(transformedMergeMethods);

describe("InputState", () => {
  describe("Arguments", () => {
    it("Should accept Input argumets", () => {
      const args = [
        new Input({ [Input.PATH_KEY]: "an.input" }),
        new Input({ [Input.PATH_KEY]: "another.input" }),
      ];

      const inputState = new InputState(args);

      expect(inputState.values).toHaveProperty("an.input");
      expect(inputState.values).toHaveProperty("another.input");
    });

    it("Should accept object arguments", () => {
      const args = [
        { [Input.PATH_KEY]: "an.input" },
        { [Input.PATH_KEY]: "another.input" },
      ];

      const inputState = new InputState(args);

      expect(inputState.values).toHaveProperty("an.input");
      expect(inputState.values).toHaveProperty("another.input");
    });

    it("Should accept mixed arguments", () => {
      const args = [
        { [Input.PATH_KEY]: "an.input" },
        new Input({ [Input.PATH_KEY]: "another.input" }),
      ];

      const inputState = new InputState(args);

      expect(inputState.values).toHaveProperty("an.input");
      expect(inputState.values).toHaveProperty("another.input");
    });
  });

  describe("Collections", () => {
    it("Should return all the inputs as prompts in order", () => {
      const prompt0 = { key: 0 };
      const prompt1 = { key: 1 };
      const args = [
        sinon.createStubInstance(Input, { asPrompt: prompt0 }),
        sinon.createStubInstance(Input, { asPrompt: prompt1 }),
      ];

      const inputState = new InputState(args);

      expect(inputState.prompts).toStrictEqual([prompt0, prompt1]);
    });

    it("Should return all the inputs as options", () => {
      const option0 = { key: 0 };
      const option1 = { key: 1 };
      const args = [
        sinon.createStubInstance(Input, { asOption: option0 }),
        sinon.createStubInstance(Input, { asOption: option1 }),
      ];

      const inputState = new InputState(args);

      expect(inputState.options).toStrictEqual(
        expect.arrayContaining([option0, option1])
      );
    });
  });

  describe("Merge", () => {
    it("Should merge options in by name", () => {
      // TODO: assess if sinon should be used
      const args = [
        { [Input.PATH_KEY]: "fromPathKey" },
        { [Input.OPTION_KEY]: { name: "fromOptionKey" } },
      ];
      const inputState = new InputState(args);

      inputState.mergeOptions({ fromPathKey: 7, fromOptionKey: false });

      expect(inputState.values).toStrictEqual(
        expect.objectContaining({
          fromPathKey: 7,
          fromOptionKey: false,
        })
      );
    });

    it("Should merge answers in by name", () => {
      // TODO: assess if sinon should be used
      const args = [
        { [Input.PATH_KEY]: "fromPathKey" },
        { [Input.PROMPT_KEY]: { name: "fromPromptKey" } },
      ];
      const inputState = new InputState(args);

      inputState.mergeAnswers({ fromPathKey: 7, fromPromptKey: false });

      expect(inputState.values).toStrictEqual(
        expect.objectContaining({
          fromPathKey: 7,
          fromPromptKey: false,
        })
      );
    });

    it("Should merge values in by name", () => {
      // TODO: assess if sinon should be used
      const args = [
        { [Input.PATH_KEY]: "fromPathKey" },
        { name: "fromNameKey" },
      ];
      const inputState = new InputState(args);

      inputState.mergeValues({ fromPathKey: 7, fromNameKey: false });

      expect(inputState.values).toStrictEqual(
        expect.objectContaining({
          fromPathKey: 7,
          fromNameKey: false,
        })
      );
    });
  });

  describe("Transform", () => {
    it.each(nonTransformedMergeMethods)(
      "Should transform when merging $inputType",
      ({ merge }) => {
        // TODO: assess if sinon should be used
        const args = [
          {
            [Input.PATH_KEY]: "fromPathKey",
            [Input.TRANSFORM_KEY]: sinon.stub().returns(42),
          },
        ];
        const inputState = new InputState(args);

        merge.call(inputState, { fromPathKey: 7 });

        expect(inputState.values).toStrictEqual(
          expect.objectContaining({ fromPathKey: 42 })
        );
      }
    );

    it.each(transformedMergeMethods)(
      "Should not transform when merging $inputType",
      ({ merge }) => {
        // TODO: assess if sinon should be used
        const args = [
          {
            [Input.PATH_KEY]: "fromPathKey",
            [Input.TRANSFORM_KEY]: sinon.stub().returns(42),
          },
        ];
        const inputState = new InputState(args);

        merge.call(inputState, { fromPathKey: 7 });

        expect(inputState.values).toStrictEqual(
          expect.objectContaining({ fromPathKey: 7 })
        );
      }
    );
  });

  describe("Nested input paths", () => {
    it.each(mergeMethods)(
      "Should match nested keys with dotted input paths when merging $inputType",
      ({ merge }) => {
        const args = [{ [Input.PATH_KEY]: "a.nested.key" }];
        const inputState = new InputState(args);

        merge.call(inputState, { a: { nested: { key: true } } });

        expect(inputState.values).toStrictEqual(
          expect.objectContaining({ a: { nested: { key: true } } })
        );
      }
    );

    it.each(mergeMethods)(
      "Should match dotted keys with dotted input paths when merging $inputType",
      ({ merge }) => {
        const args = [{ [Input.PATH_KEY]: "a.dotted.path" }];
        const inputState = new InputState(args);

        merge.call(inputState, { "a.dotted.path": true });

        expect(inputState.values).toStrictEqual(
          expect.objectContaining({ a: { dotted: { path: true } } })
        );
      }
    );
  });

  describe("Missing input names", () => {
    it.each(nonTransformedMergeMethods)(
      "Should report missing input names when merging $inputType",
      ({ merge }) => {
        const args = [{ [Input.PATH_KEY]: "a.present.name" }];
        const inputState = new InputState(args);
        expect(() =>
          merge.call(inputState, { "a.missing.name": 97 })
        ).toThrowError("a.missing.name");
      }
    );

    it.each(transformedMergeMethods)(
      "Should add missing input names to values when merging $inputType",
      ({ merge }) => {
        const args = [{ [Input.PATH_KEY]: "aPresentName" }];
        const inputState = new InputState(args);

        merge.call(inputState, { aMissingName: 97 });

        expect(inputState.values).toStrictEqual(
          expect.objectContaining({ aMissingName: 97 })
        );
      }
    );
  });
});
