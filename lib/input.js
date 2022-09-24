"use strict";
import _ from "lodash";

export class InvalidInputValueError extends Error {
  constructor(input, value, reason) {
    super(`Value "${value}" for Input ${input.name} is invalid: ${reason}`);
    this.input = input;
    this.value = value;
    this.reason = reason;
  }
}

export class Input {
  static PATH_KEY = Symbol("path");
  static OPTION_KEY = Symbol("option");
  static PROMPT_KEY = Symbol("prompt");
  static TRANSFORM_KEY = Symbol("transform");
  static VALIDATE_KEY = Symbol("validate");
  static specialKeys = [this.OPTION_KEY, this.PROMPT_KEY];

  constructor(args) {
    this.shared = _.pickBy(args, (_, key) => !Input.specialKeys.includes(key));
    this.option = args[Input.OPTION_KEY] ?? this.shared;
    this.prompt = args[Input.PROMPT_KEY] ?? this.shared;

    this.transform = args[Input.TRANSFORM_KEY] ?? _.identity;
    this.validate = args[Input.VALIDATE_KEY] ?? _.stubTrue;

    this.value = undefined;
  }

  setValue(newValue, { isTransformed } = { isTransformed: false }) {
    if (isTransformed) {
      this.value = newValue;
      return;
    }

    const validationResult = this.validate(newValue);
    if (validationResult !== true) {
      throw new InvalidInputValueError(this, newValue, validationResult);
    }

    this.value = this.transform(newValue);
  }

  get path() {
    return this.shared[Input.PATH_KEY] ?? this.shared.name;
  }

  get optionPath() {
    return this.asOption().name;
  }

  get promptPath() {
    return this.asPrompt().name;
  }

  get sharedWithName() {
    return _.merge(this.shared, { name: this.path });
  }

  asOption() {
    return _.merge(this.sharedWithName, this.option);
  }

  asPrompt() {
    return _.merge(
      this.sharedWithName,
      {
        when: this.value === undefined,
        validate: this.validate,
      },
      this.prompt
    );
  }
}
