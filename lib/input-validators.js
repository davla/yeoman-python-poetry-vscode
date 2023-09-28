import { validate as emailValidator } from "email-validator";
import LicenseGenerator from "generator-license";
import semver from "semver";

export const validPep440PrereleaseTags = ["a", "b", "rc", "dev"];

export function validateDescription(description) {
  return (description ?? "") === ""
    ? "Python package descriptions can't be empty"
    : true;
}

export function validateEmail(email) {
  return emailValidator(email) || `"${email}" is not a valid email address`;
}

export function validateLicense(license) {
  return (
    LicenseGenerator.licenses.map(({ value }) => value).includes(license) ||
    `License "${license}" is not supported`
  );
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

export function validatePythonPackageName(packageName) {
  if (packageName === "") {
    return "Python package names can't be empty";
  }

  if (packageName.toLowerCase() !== packageName) {
    return "PEP 8 recommends all lowercase names for python package names.";
  }

  if (/^\d/.test(packageName)) {
    return "Python package names can't start with a digit.";
  }

  if (/\W/.test(packageName)) {
    return "Python package names can only contain letters, digits or underscores.";
  }

  return true;
}

export function validatePythonPackageVersion(packageVersion) {
  if (packageVersion.includes("-")) {
    return "PEP 440 forbids dashes in version numbers. Omit it before prerelease tags (e.g. 1.0.0a3).";
  }

  if (/\D\.\d+$/.test(packageVersion)) {
    return "PEP 440 doesn't allow dots before the prerelease number. Omit it (e.g. 1.0.0a3).";
  }

  const version = semver.valid(packageVersion, { loose: true });
  if (version === null) {
    return "Not a valid semantic version. Use of semantic versioning is encouraged by PEP 440.";
  }

  const prerelease = semver.prerelease(version);
  if (prerelease === null) {
    return true;
  }

  const prereleaseTag = prerelease[0].replace(/\d*$/, "");
  if (!validPep440PrereleaseTags.includes(prereleaseTag)) {
    const tags = validPep440PrereleaseTags.join(", ");
    return `PEP 440 only allows these prerelease tags: ${tags}`;
  }

  return true;
}

export function validateUrl(url) {
  try {
    return url === null || new URL(url) !== undefined;
  } catch {
    return "Invalid URL";
  }
}
