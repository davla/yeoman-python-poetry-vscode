import _ from "lodash";
import Generator from "yeoman-generator";

import InputState from "./input-state.js";
import { InvalidInputValueError } from "./input.js";

export default class InputStateGenerator extends Generator {
  constructor(args, opts, inputs) {
    super(args, opts);

    this.inputState = new InputState(inputs);

    for (const option of this.inputState.options) {
      this.option(option.name, option);
    }
  }

  initializing() {
    try {
      this.inputState.mergeOptions(this._iterableOptions);
    } catch (error) {
      if (!(error instanceof InvalidInputValueError)) {
        throw error;
      }

      throw new TypeError(
        `Value "${error.value}" for option --${error.input.optionPath} is ` +
          `invalid: ${_.lowerFirst(error.reason)}`
      );
    }
  }

  async prompting() {
    const answers = await this.prompt(this.inputState.prompts);
    this.inputState.mergeAnswers(answers);
  }

  /*
   * The options field in Generator instances cannot be directly iterated on:
   * it contains much more than just the options. Hence, this private property.
   */
  get _iterableOptions() {
    const optionNames = this.inputState.options.map((option) => option.name);
    return _.pick(this.options, optionNames);
  }
}
