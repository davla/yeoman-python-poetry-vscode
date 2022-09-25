"use strict";
import "chai/register-should.js";
import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";

import InputState from "../lib/input-state.js";
import { Input } from "../lib/input.js";

chai.use(chaiSubset);

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

      inputState.values.should.have.nested.property("an.input");
      inputState.values.should.have.nested.property("another.input");
    });

    it("Should accept object arguments", () => {
      const args = [
        { [Input.PATH_KEY]: "an.input" },
        { [Input.PATH_KEY]: "another.input" },
      ];

      const inputState = new InputState(args);

      inputState.values.should.have.nested.property("an.input");
      inputState.values.should.have.nested.property("another.input");
    });

    it("Should accept mixed arguments", () => {
      const args = [
        { [Input.PATH_KEY]: "an.input" },
        new Input({ [Input.PATH_KEY]: "another.input" }),
      ];

      const inputState = new InputState(args);

      inputState.values.should.have.nested.property("an.input");
      inputState.values.should.have.nested.property("another.input");
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

      inputState.prompts.should.have.ordered.members([prompt0, prompt1]);
    });

    it("Should return all the inputs as options", () => {
      const option0 = { key: 0 };
      const option1 = { key: 1 };
      const args = [
        sinon.createStubInstance(Input, { asOption: option0 }),
        sinon.createStubInstance(Input, { asOption: option1 }),
      ];

      const inputState = new InputState(args);

      inputState.options.should.have.members([option0, option1]);
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

      inputState.values.should.containSubset({
        fromPathKey: 7,
        fromOptionKey: false,
      });
    });

    it("Should merge answers in by name", () => {
      // TODO: assess if sinon should be used
      const args = [
        { [Input.PATH_KEY]: "fromPathKey" },
        { [Input.PROMPT_KEY]: { name: "fromPromptKey" } },
      ];
      const inputState = new InputState(args);

      inputState.mergeAnswers({ fromPathKey: 7, fromPromptKey: false });

      inputState.values.should.containSubset({
        fromPathKey: 7,
        fromPromptKey: false,
      });
    });

    it("Should merge values in by name", () => {
      // TODO: assess if sinon should be used
      const args = [
        { [Input.PATH_KEY]: "fromPathKey" },
        { name: "fromNameKey" },
      ];
      const inputState = new InputState(args);

      inputState.mergeValues({ fromPathKey: 7, fromNameKey: false });

      inputState.values.should.containSubset({
        fromPathKey: 7,
        fromNameKey: false,
      });
    });
  });

  describe("Transform", () => {
    for (const { inputType, merge } of nonTransformedMergeMethods) {
      it(`Should transform when merging ${inputType}`, () => {
        // TODO: assess if sinon should be used
        const args = [
          {
            [Input.PATH_KEY]: "fromPathKey",
            [Input.TRANSFORM_KEY]: sinon.stub().returns(42),
          },
        ];
        const inputState = new InputState(args);

        merge.call(inputState, { fromPathKey: 7 });

        inputState.values.should.containSubset({ fromPathKey: 42 });
      });
    }

    for (const { inputType, merge } of transformedMergeMethods) {
      it(`Should not transform when merging ${inputType}`, () => {
        // TODO: assess if sinon should be used
        const args = [
          {
            [Input.PATH_KEY]: "fromPathKey",
            [Input.TRANSFORM_KEY]: sinon.stub().returns(42),
          },
        ];
        const inputState = new InputState(args);

        merge.call(inputState, { fromPathKey: 7 });

        inputState.values.should.containSubset({ fromPathKey: 7 });
      });
    }
  });

  describe("Nested input paths", () => {
    for (const { inputType, merge } of mergeMethods) {
      it(
        "Should match nested keys with dotted input paths when merging " +
          inputType,
        () => {
          const args = [{ [Input.PATH_KEY]: "a.nested.key" }];
          const inputState = new InputState(args);

          merge.call(inputState, { a: { nested: { key: true } } });

          inputState.values.should.containSubset({
            a: { nested: { key: true } },
          });
        }
      );
    }

    for (const { inputType, merge } of mergeMethods) {
      it(
        "Should match dotted keys with dotted input paths when merging " +
          inputType,
        () => {
          const args = [{ [Input.PATH_KEY]: "a.dotted.path" }];
          const inputState = new InputState(args);

          merge.call(inputState, { "a.dotted.path": true });

          inputState.values.should.containSubset({
            a: { dotted: { path: true } },
          });
        }
      );
    }

    for (const { inputType, merge } of mergeMethods) {
      it(`Should preserve array values when merging ${inputType}`, () => {
        const args = [{ [Input.PATH_KEY]: "array.input" }];
        const inputState = new InputState(args);

        merge.call(inputState, { "array.input": ["an", { array: true }] });

        inputState.values.should.containSubset({
          array: { input: ["an", { array: true }] },
        });
      });
    }
  });

  describe("Missing input names", () => {
    for (const { inputType, merge } of nonTransformedMergeMethods) {
      it(`Should report missing input names when merging ${inputType}`, () => {
        const args = [{ [Input.PATH_KEY]: "a.present.name" }];
        const inputState = new InputState(args);
        (() => merge.call(inputState, { "a.missing.name": 97 })).should.throw(
          "a.missing.name"
        );
      });
    }

    for (const { inputType, merge } of transformedMergeMethods) {
      it(`Should add missing input names to values when merging ${inputType}`, () => {
        const args = [{ [Input.PATH_KEY]: "aPresentName" }];
        const inputState = new InputState(args);

        merge.call(inputState, { aMissingName: 97 });

        inputState.values.should.containSubset({ aMissingName: 97 });
      });
    }
  });
});
