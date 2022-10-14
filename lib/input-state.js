import flatten from "flat";
import _ from "lodash";

import { Input } from "./input.js";

const { unflatten } = flatten;

export default class InputState {
  constructor(inputs) {
    this.inputs = inputs.map((input) =>
      input instanceof Input ? input : new Input(input)
    );
    this.extraValues = {};
  }

  get options() {
    return this.inputs.map((input) => input.asOption());
  }

  get prompts() {
    return this.inputs.map((input) => input.asPrompt());
  }

  get values() {
    const inputValues = Object.fromEntries(
      this.inputs.map((input) => [input.path, input.value])
    );
    return unflatten(_.merge(this.extraValues, inputValues), { safe: true });
  }

  merge(newValues, inputFilter, { isTransformed, isMissingInputAllowed }) {
    const flatValues = flatten(newValues, { safe: true });
    for (const [newValueName, newValue] of Object.entries(flatValues)) {
      const input = this.inputs.find(inputFilter.bind(this, newValueName));
      if (!isMissingInputAllowed && input === undefined) {
        throw new TypeError(`No input named ${newValueName} found`);
      }

      if (input === undefined) {
        // _.merge deals with not merging newValue if it's nullish
        this.extraValues = _.merge(this.extraValues, {
          [newValueName]: newValue,
        });
      } else {
        input.setValue(newValue, { isTransformed });
      }
    }
  }

  mergeOptions(options) {
    this.merge(
      options,
      (optionPath, input) => input.optionPath === optionPath,
      { isTransformed: false, isMissingInputAllowed: false }
    );
  }

  mergeAnswers(options) {
    this.merge(
      options,
      (answerPath, input) => input.promptPath === answerPath,
      { isTransformed: false, isMissingInputAllowed: false }
    );
  }

  mergeValues(values) {
    this.merge(values, (valuePath, input) => input.path === valuePath, {
      isTransformed: true,
      isMissingInputAllowed: true,
    });
  }
}
