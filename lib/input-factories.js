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
    super({
      ioConfig: _.merge(ioConfig, { shared: { name } }),
      valueFunctions: {
        ...valueFunctions,
        async default() {
          const toolPoetryValue = readToolPoetryPath.call(this, toolPoetryPath);
          if (toolPoetryValue !== undefined) {
            return retrieveTransform(toolPoetryValue);
          }

          return (await valueFunctions.default?.call(this)) ?? null;
        },
      },
      extras: {
        ...extras,
        toolPoetryPath,
      },
    });
  }
}
