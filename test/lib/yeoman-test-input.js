/* eslint-disable import/prefer-default-export */

import _ from "lodash";

export function withInput(runContext, inputData) {
  const inputs = _.flatten([inputData]);
  const [optionData, promptData] = _.partition(
    inputs,
    (_) => Math.random() > 0.5,
  );
  const options = optionData.map(({ optionName, inputValue }) => ({
    [optionName]: inputValue,
  }));
  const prompts = promptData.map(({ promptName, inputValue }) => ({
    [promptName]: inputValue,
  }));
  return runContext
    .withOptions(_.merge(...options))
    .withAnswers(_.merge(...prompts));
}
