import _ from "lodash";
import Generator from "yeoman-generator";

import { InvalidInputValueError } from "./input.js";

export default class InputGenerator extends Generator {
  constructor(args, opts, inputs = []) {
    super(args, opts);

    this.inputs = inputs.map((factory) => factory.create(this));

    for (const option of this.inputs.map((input) => input.asOption())) {
      this.option(option.name, option);
    }
  }

  async initializing() {
    try {
      this.setInputValues(this._iterableOptions, (input) => input.optionName);
    } catch (error) {
      if (!(error instanceof InvalidInputValueError)) {
        throw error;
      }

      throw new TypeError(
        `Value "${error.value}" for option --${error.input.optionName} is ` +
          `invalid: ${_.lowerFirst(error.reason)}`,
      );
    }
  }

  async prompting() {
    const answers = await this.prompt(
      this.inputs.map((input) => input.asPrompt()),
    );
    /*
     * No need to catch InvalidInputValueError here, as inquirer doesn't allow
     * invalid answers to even be entered.
     */
    this.setInputValues(answers, (input) => input.promptName);
  }

  /*
   * The options field in Generator instances cannot be directly iterated on:
   * it contains much more than just the options. Hence, this private property.
   */
  get _iterableOptions() {
    const optionNames = this.inputs.map((input) => input.optionName);
    return _.pick(this.options, optionNames);
  }

  findInput(name, getName) {
    const input = this.inputs.find((input) => getName(input) === name);
    if (input === undefined) {
      throw new TypeError(`No input named ${name} found`);
    }

    return input;
  }

  getNamedValues(getName, ...names) {
    const pairs = names.map((name) => {
      const input = this.findInput(name, (input) => input.name);
      return [getName(input), input.value];
    });
    return Object.fromEntries(pairs);
  }

  getInputValues(...names) {
    return this.getNamedValues((input) => input.name, ...names);
  }

  getOptionValues(...names) {
    return this.getNamedValues((input) => input.optionName, ...names);
  }

  setInputValues(values, getName) {
    for (const [name, newValue] of Object.entries(values)) {
      this.findInput(name, getName).value = newValue;
    }
  }
}
