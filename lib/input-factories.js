import _ from "lodash";

import { Input } from "./input.js";
import { toolPoetryPathReader } from "./toml-utils.js";

export class InputFactory {
  constructor({ ioConfig, valueFunctions = {}, extras = {} }) {
    this.ioConfig = ioConfig;
    this.valueFunctions = valueFunctions;
    this.extras = extras;
  }

  create(generator) {
    const valueFuctions = _.mapValues(this.valueFunctions, (fn) =>
      fn.bind(generator)
    );
    return new Input(this.ioConfig, valueFuctions, this.extras);
  }
}

export class PyProjectTomlInputFactory extends InputFactory {
  constructor({
    name,
    toolPoetryPath = name,
    ioConfig,
    valueFunctions = {},
    extras = {},
  }) {
    super({
      ioConfig: _.merge(ioConfig, { shared: { name } }),
      valueFunctions: {
        ...valueFunctions,
        retrieve: toolPoetryPathReader(toolPoetryPath),
      },
      extras: {
        ...extras,
        toolPoetryPath,
      },
    });
  }
}
