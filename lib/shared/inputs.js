import path from "node:path";

import LicenseGenerator from "generator-license";
import giturl from "giturl";
import _ from "lodash";

import { PyProjectTomlInputFactory } from "../input-factories.js";

import {
  validateEmail,
  validateLicense,
  validatePythonPackageName,
  validatePythonPackageVersion,
  validateUrl,
} from "./validators.js";

const parseNameInAuthorString = (author) =>
  _.takeWhile(author, (c) => c !== "<")
    .join("")
    .trim();

const parseEmailFromAuthorString = (author) =>
  _.dropWhile(author, (c) => c !== "<")
    .slice(1, -1)
    .join("")
    .trim();

export default {
  packageName: new PyProjectTomlInputFactory({
    name: "packageName",
    toolPoetryPath: "name",
    ioConfig: {
      option: {
        name: "package-name",
        desc: "The name of the Python package.",
        type: String,
      },
      prompt: {
        message: "Python package name",
        type: "input",
      },
    },
    valueFunctions: {
      default() {
        const dirName = path.basename(process.cwd());
        return validatePythonPackageName(dirName) === true ? dirName : null;
      },
      validate: validatePythonPackageName,
    },
  }),

  packageVersion: new PyProjectTomlInputFactory({
    name: "packageVersion",
    toolPoetryPath: "version",
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
    valueFunctions: {
      default: () => "0.0.0",
      validate: validatePythonPackageVersion,
    },
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

  authorName: new PyProjectTomlInputFactory({
    name: "authorName",
    toolPoetryPath: "authors",
    retrieveTransform: (authors) => parseNameInAuthorString(authors[0]),
    ioConfig: {
      option: {
        desc: "Name of the Python package author.",
        name: "author-name",
        type: String,
      },
      prompt: {
        message: "Python package author name",
        type: "input",
      },
    },
    valueFunctions: {
      default() {
        return this.user.git.name() ?? null;
      },
    },
  }),

  authorEmail: new PyProjectTomlInputFactory({
    name: "authorEmail",
    toolPoetryPath: "authors",
    retrieveTransform: (authors) => parseEmailFromAuthorString(authors[0]),
    ioConfig: {
      option: {
        desc: "Email of the Python package author.",
        name: "author-email",
        type: String,
      },
      prompt: {
        message: "Python package author email",
        type: "input",
      },
    },
    valueFunctions: {
      default() {
        return this.user.git.email() ?? null;
      },
      validate: validateEmail,
    },
  }),
};
