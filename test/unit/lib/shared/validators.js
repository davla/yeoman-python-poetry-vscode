import LicenseGenerator from "generator-license";

import {
  validPep440PrereleaseTags,
  validateEmail,
  validateLicense,
  validatePythonPackageName,
  validatePythonPackageVersion,
  validateUrl,
} from "../../../../lib/shared/validators.js";

describe("Shared validators", () => {
  describe("Author email", () => {
    it("Should report invalid emails", () =>
      validateEmail("not-an-email").should.include("not").and.include("valid"));

    it("Should not report valid emails", () =>
      validateEmail("valid@email.com").should.be.true);
  });

  describe("License", () => {
    it("Should report unsupported licenses", () =>
      validateLicense("OFL-1.1").should.include("not supported"));

    it("Should not report supported licenses", () =>
      validateLicense(LicenseGenerator.licenses[0].value).should.be.true);
  });

  describe("Python package name", () => {
    it("Should report empty names", () =>
      validatePythonPackageName("").should.include("empty"));

    it("Should report non-lowercase names", () =>
      validatePythonPackageName("PACKAGE")
        .should.include("PEP 8")
        .and.string("lowercase"));

    it("Should report names with a leading digit", () =>
      validatePythonPackageName("2sich").should.include("digit"));

    it("Should report names that are not valid identifiers", () =>
      validatePythonPackageName("kebab-case-for-the-win")
        .should.include("letters")
        .and.string("digits")
        .and.string("underscores"));

    it("Should not report valid names", () =>
      validatePythonPackageName("valid_name").should.be.true);
  });

  describe("Python package version", () => {
    it("Should report version numbers containing dashes", () =>
      validatePythonPackageVersion("9.0.0-a17")
        .should.include("PEP 440")
        .and.string("dash"));

    it("Should report dot before prerelease number", () =>
      validatePythonPackageVersion("17.4.9b.10")
        .should.include("PEP 440")
        .and.string("dot")
        .and.string("prerelease number"));

    it("Should report non-semantic version numbers", () =>
      validatePythonPackageVersion("3rc17")
        .should.include("PEP 440")
        .and.string("semantic version"));

    it("Should report prerelease tags not allowed by PEP 440", () => {
      const errorMessage = validatePythonPackageVersion("6.1.82alpha17");
      errorMessage.should.include("PEP 440").and.string("prerelease");
      for (const tag of validPep440PrereleaseTags) {
        errorMessage.should.include(tag);
      }
    });

    it("Should not report versions that comply to PEP 440 and semantic versioning", () =>
      validatePythonPackageVersion("1.7.0").should.be.true);
  });

  describe("URL", () => {
    it("Should report non-URL strings", () =>
      validateUrl("not-an-url").should.include("Invalid URL"));

    it("Should report SSH URLs", () =>
      validateUrl("git@github.com:heihachi/mishima.git").should.include(
        "Invalid URL",
      ));

    [
      { protocol: "http", url: "http://github.com/heihachi/mishima" },
      { protocol: "https", url: "https://github.com/heihachi/mishima" },
    ].forEach(({ protocol, url }) =>
      it(`Should not report valid ${protocol} addresses`, () =>
        validateUrl(url).should.be.true),
    );
  });
});
