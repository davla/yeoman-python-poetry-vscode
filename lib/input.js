import _ from "lodash";

export class Input {
  static valueFunctionsDefaults = {
    retrieve: _.constant(undefined),
    transform: _.identity,
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

    this.value = undefined;
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
      this.ioConfig.prompt
    );
  }

  async getValue() {
    await this.initValue();
    return this.value;
  }

  async initValue() {
    this.value = this.value ?? (await this.valueFunctions.retrieve());
  }

  setValue(newValue) {
    const validationResult = this.valueFunctions.validate(newValue);
    if (validationResult !== true) {
      throw new InvalidInputValueError(this, newValue, validationResult);
    }

    this.value = this.valueFunctions.transform(newValue);
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
