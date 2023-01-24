import LicenseGenerator from "generator-license";
import giturl from "giturl";

import { PyProjectTomlInputFactory } from "../input-factories.js";

import {
  validateAuthor,
  validateLicense,
  validatePythonPackageName,
  validatePythonPackageVersion,
  validateUrl,
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

  repository: new PyProjectTomlInputFactory({
    name: "repository",
    ioConfig: {
      option: {
        desc: "The URL of the project repository",
        type: String,
      },
      prompt: {
        message: "Project repository URL",
        type: "input",
      },
    },
    valueFunctions: {
      async default() {
        const url = await this._queryGitOriginUrl();
        return url === undefined ? null : giturl.parse(url);
      },
      validate: validateUrl,
    },
  }),

  author: new PyProjectTomlInputFactory({
    name: "author",
    toolPoetryPath: "authors",
    ioConfig: {
      option: {
        desc: "Name and email of the Python package author.",
        type: String,
      },
      prompt: {
        name: "author",
        message: "Python package author (name <email>)",
        type: "input",
      },
    },
    valueFunctions: {
      default() {
        const userName = this.user.git.name();
        const email = this.user.git.email();

        if (userName === undefined || email === undefined) {
          return null;
        }

        return `${userName} <${email}>`;
      },
      transform: (author) => [author],
      validate: validateAuthor,
    },
  }),
};
