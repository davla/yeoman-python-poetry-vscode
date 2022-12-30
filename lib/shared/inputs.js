import LicenseGenerator from "generator-license";

import { PyProjectTomlInputFactory } from "../input-factories.js";

import {
  validateLicense,
  validatePythonPackageName,
  validatePythonPackageVersion,
} from "./validators.js";

export default {
  pythonPackageName: new PyProjectTomlInputFactory({
    name: "name",
    ioConfig: {
      option: {
        desc: "The name of the Python package.",
        type: String,
      },
      prompt: {
        message: "Python package name",
        type: "input",
      },
    },
    valueFunctions: { validate: validatePythonPackageName },
  }),

  pythonPackageVersion: new PyProjectTomlInputFactory({
    name: "version",
    ioConfig: {
      option: {
        name: "package-version",
        desc: "The version of the Python package.",
        type: String,
      },
      prompt: {
        message: "Python package version",
        type: "input",
      },
    },
    valueFunctions: { validate: validatePythonPackageVersion },
  }),

  license: new PyProjectTomlInputFactory({
    name: "license",
    ioConfig: {
      option: {
        desc: "The license of the Python package.",
        type: String,
      },
      prompt: {
        message: "Python package license",
        type: "list",
        choices: LicenseGenerator.licenses,
        default: "GPL-3.0",
      },
    },
    valueFunctions: { validate: validateLicense },
  }),
};
