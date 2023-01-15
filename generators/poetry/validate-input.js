import { validate as validateEmail } from "email-validator";
import semver from "semver";

export function validateAuthor(authorString) {
  const match = authorString.match(/^(.+)\s*<(.+)>/);
  if (match === null) {
    return "Invalid author string";
  }

  if (!validateEmail(match[2])) {
    return "Invalid email";
  }

  return true;
}

export function validateDescription(description) {
  return (description ?? "") === ""
    ? "Python package descriptions can't be empty"
    : true;
}

export function validatePoetryVersionRange(range) {
  if (/\s+-\s+/.test(range)) {
    return "Poetry doesn't support hyphen range syntax";
  }

  /*
   * Poetry version ranges allow commas, while node.js ones don't. However, the
   * semantics are the same.
   */
  if (semver.validRange(range.replace(",", " ")) === null) {
    return "Invalid version range";
  }

  return true;
}
