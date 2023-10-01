import _ from "lodash";

import { Input } from "./input.js";
import { readToolPoetryPath } from "./pyproject-toml-utils.js";

async function flowAsyncStep(acc, fn) {
  /*
   * Node.js allows awaiting non-Promise values. As a consequence, we can just
   * await the accumulator, without worrying if it's a Promise or not.
   */
  return fn.call(this, await acc);
}

const flowAsync = (...fns) =>
  function (input) {
    return fns.reduce(flowAsyncStep.bind(this), input);
  };

export class InputFactory {
  constructor({ ioConfig, valueFunctions = {}, extras = {} }) {
    this.ioConfig = ioConfig;
    this.valueFunctions = valueFunctions;
    this.extras = extras;
  }

  create(generator) {
    const valueFuctions = _.mapValues(this.valueFunctions, (fn) =>
      fn.bind(generator),
    );
    return new Input(this.ioConfig, valueFuctions, this.extras);
  }

  compose(that) {
    this.ioConfig = _.merge(that.ioConfig, this.ioConfig);
    this.extras = _.merge(that.extras, this.extras);
    this.valueFunctions = _.mergeWith(
      _.clone(this.valueFunctions),
      that.valueFunctions,
      (thisFn, thatFn) => flowAsync(thisFn ?? _.identity, thatFn ?? _.identity),
    );

    return this;
  }

  static callOr(valueFn, thisArg, defaultVal, ...args) {
    return valueFn === undefined ? defaultVal : valueFn.call(thisArg, ...args);
  }
}

export class PyProjectTomlInputFactory extends InputFactory {
  constructor({
    name,
    toolPoetryPath = name,
    retrieveTransform = _.identity,
    ioConfig,
    valueFunctions = {},
    extras = {},
  }) {
    const defaultValueFunction = async function () {
      const toolPoetryValue = readToolPoetryPath.call(this, toolPoetryPath);
      const result =
        toolPoetryValue === undefined
          ? InputFactory.callOr(valueFunctions.default, this, null)
          : retrieveTransform(toolPoetryValue);
      return (await result) ?? null;
    };

    super({
      ioConfig: _.merge(ioConfig, { shared: { name } }),
      valueFunctions: { ...valueFunctions, default: defaultValueFunction },
      extras: { ...extras, toolPoetryPath },
    });
  }
}

export class ChoiceInputFactory extends InputFactory {
  constructor({
    choices,
    defaultChoice = undefined,
    ioConfig,
    valueFunctions = {},
    ...args
  }) {
    ChoiceInputFactory.validateDefault(choices, defaultChoice);

    const option = { type: String };
    const prompt = { type: "list", choices, default: defaultChoice };
    const choiceFunctions = {
      default: ChoiceInputFactory.makeDefault(valueFunctions, defaultChoice),
      validate: ChoiceInputFactory.makeValidate(valueFunctions, choices),
    };

    super({
      ioConfig: _.merge({ option, prompt }, ioConfig),
      valueFunctions: { ...valueFunctions, ...choiceFunctions },
      ...args,
    });
  }

  static validateDefault(choices, defaultChoice) {
    if (defaultChoice === undefined) {
      return;
    }

    const errPrefix = `Default input choice ${defaultChoice}`;

    if (
      typeof defaultChoice === "number" &&
      (defaultChoice < 0 || defaultChoice >= choices.length)
    ) {
      const maxIndex = choices.length - 1;
      throw new RangeError(`${errPrefix} out of range [0; ${maxIndex}]`);
    }

    if (!choices.includes(defaultChoice)) {
      throw new Error(`${errPrefix} is not one of ${choices.join(", ")}`);
    }
  }

  static makeDefault(valueFunctions, defaultChoice) {
    return function () {
      return InputFactory.callOr(valueFunctions.default, this, defaultChoice);
    };
  }

  static makeValidate(valueFunctions, choices) {
    return function (value) {
      return choices.includes(value)
        ? InputFactory.callOr(valueFunctions.validate, this, true, value)
        : `${value} is not one of ${choices.join(", ")}`;
    };
  }
}
