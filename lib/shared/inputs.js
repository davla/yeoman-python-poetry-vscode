import { Input } from "../input.js";

import {
  validatePythonPackageName,
  validatePythonPackageVersion,
} from "./validators.js";

export default {
  pythonPackageName: {
    [Input.PATH_KEY]: "name",
    [Input.VALIDATE_KEY]: validatePythonPackageName,
    [Input.PROMPT_KEY]: {
      message: "Python package name",
      type: "input",
    },
    [Input.OPTION_KEY]: {
      desc: "The name of the Python package.",
      type: String,
    },
  },

  pythonPackageVersion: {
    [Input.PATH_KEY]: "version",
    [Input.VALIDATE_KEY]: validatePythonPackageVersion,
    [Input.PROMPT_KEY]: {
      message: "Python package version",
      type: "input",
    },
    [Input.OPTION_KEY]: {
      name: "package-version",
      desc: "The version of the Python package.",
      type: String,
    },
  },
};
