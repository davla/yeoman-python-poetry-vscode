import _ from "lodash";

export class Input {
  static valueFunctionsDefaults = {
    validate: _.constant(true),
    default: _.constant(null),
  };

  constructor(ioConfig, valueFunctions = {}, extras = {}) {
    this.ioConfig = {
      option: ioConfig.shared,
      prompt: ioConfig.shared,
      ...ioConfig,
    };
    this.valueFunctions = {
      ...Input.valueFunctionsDefaults,
      ...valueFunctions,
    };
    this.extras = extras;

    this._value = undefined;
  }

  get name() {
    return this.ioConfig.shared.name;
  }

  get optionName() {
    return this.asOption().name;
  }

  get promptName() {
    return this.asPrompt().name;
  }

  asOption() {
    return _.merge(_.clone(this.ioConfig.shared), this.ioConfig.option);
  }

  asPrompt() {
    return _.merge(
      _.clone(this.ioConfig.shared),
      {
        when: this.value === undefined,
        validate: this.valueFunctions.validate,
        default: this.valueFunctions.default,
      },
      this.ioConfig.prompt,
    );
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    const validationResult = this.valueFunctions.validate(newValue);
    if (validationResult !== true) {
      throw new InvalidInputValueError(this, newValue, validationResult);
    }

    this._value = newValue;
  }
}

export class InvalidInputValueError extends Error {
  constructor(input, value, reason) {
    super(`Value "${value}" for Input ${input.name} is invalid: ${reason}`);
    this.input = input;
    this.value = value;
    this.reason = reason;
  }
}
