/* eslint-disable import/prefer-default-export */

export const withInput = (runContext, { optionName, promptName, inputValue }) =>
  Math.random() > 0.5
    ? runContext.withOptions({ [optionName]: inputValue })
    : runContext.withPrompts({ [promptName]: inputValue });
