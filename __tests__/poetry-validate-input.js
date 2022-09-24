"use strict";
import LicenseGenerator from "generator-license";

import {
  validPep440PrereleaseTags,
  validateAuthor,
  validateDescription,
  validateLicense,
  validatePoetryVersionRange,
  validatePythonPackageName,
  validatePythonPackageVersion,
  validateUrl,
} from "../generators/poetry/validate-input";

describe("Poetry input validation", () => {
  describe("Author", () => {
    it.each([
      { reason: "different format", authorString: "not-an-author-string" },
      { reason: "empty name", authorString: "<valid@email.com>" },
      { reason: "empty email", authorString: "Yoshimitsu <>" },
    ])("Should report author strings with $reason", ({ authorString }) => {
      expect(validateAuthor(authorString)).toContain("Invalid author string");
    });

    it("Should report invalid emails", () => {
      expect(validateAuthor("Yoshimitsu <not@an-email#for%sure>")).toContain(
        "Invalid email"
      );
    });

    it("Should not report valid author strings", () => {
      expect(validateAuthor("Yoshimitsu <yoshimitsu@tekken.jp>")).toBe(true);
    });
  });

  describe("Description", () => {
    it.each([
      { testText: "empty", description: "" },
      { testText: "null", description: null },
      { testText: "undefined", description: undefined },
    ])("Should report $testText descriptions", ({ description }) => {
      expect(validateDescription(description)).toContain("empty");
    });

    it("Should not report valid descriptions", () => {
      expect(validateDescription("King of Iron Fist Tournament")).toBe(true);
    });
  });

  describe("License", () => {
    it("Should report unsupported licenses", () => {
      expect(validateLicense("OFL-1.1")).toContain("not supported");
    });

    it("Should not report supported licenses", () => {
      expect(validateLicense(LicenseGenerator.licenses[0].value)).toBe(true);
    });
  });

  describe("Python package name", () => {
    it("Should report empty names", () => {
      expect(validatePythonPackageName("")).toContain("empty");
    });

    it("Should report non-lowercase names", () => {
      const errorMessage = validatePythonPackageName("PACKAGE");
      expect(errorMessage).toContain("PEP 8");
      expect(errorMessage).toContain("lowercase");
    });

    it("Should report names with a leading digit", () => {
      expect(validatePythonPackageName("2sich")).toContain("digit");
    });

    it("Should report names that are not valid identifiers", () => {
      const errorMessage = validatePythonPackageName("kebab-case-for-the-win");
      expect(errorMessage).toContain("letters");
      expect(errorMessage).toContain("digits");
      expect(errorMessage).toContain("underscores");
    });

    it("Should not report valid names", () => {
      expect(validatePythonPackageName("valid_name")).toBe(true);
    });
  });

  describe("Python package version", () => {
    it("Should report version numbers containing dashes", () => {
      const errorMessage = validatePythonPackageVersion("9.0.0-a17");
      expect(errorMessage).toContain("PEP 440");
      expect(errorMessage).toContain("dash");
    });

    it("Should report dot before prerelease number", () => {
      const errorMessage = validatePythonPackageVersion("17.4.9b.10");
      expect(errorMessage).toContain("PEP 440");
      expect(errorMessage).toContain("dot");
      expect(errorMessage).toContain("prerelease number");
    });

    it("Should report non-semantic version numbers", () => {
      const errorMessage = validatePythonPackageVersion("3rc17");
      expect(errorMessage).toContain("PEP 440");
      expect(errorMessage).toContain("semantic version");
    });

    it("Should report prerelease tags not allowed by PEP 440", () => {
      const errorMessage = validatePythonPackageVersion("6.1.82alpha17");
      expect(errorMessage).toContain("PEP 440");
      expect(errorMessage).toContain("prerelease");
      for (const tag of validPep440PrereleaseTags) {
        expect(errorMessage).toContain(tag);
      }
    });

    it("Should not report versions that comply to PEP 440 and semantic versioning", () => {
      expect(validatePythonPackageVersion("1.7.0")).toBe(true);
    });
  });

  describe("Poetry version range", () => {
    it("Should report hypen range syntax", () => {
      const errorMessage = validatePoetryVersionRange("1.* - 3.*");
      expect(errorMessage).toContain("Poetry");
      expect(errorMessage).toContain("hyphen range");
    });

    it("Should not report caret requirements", () => {
      expect(validatePoetryVersionRange("^7.2.9")).toBe(true);
    });

    it("Should not report tilde requirements", () => {
      expect(validatePoetryVersionRange("~0.27")).toBe(true);
    });

    it.each(["*", "X", "x"])(
      'Should not report wildcars requirements with "%s"',
      (wildcard) => {
        expect(validatePoetryVersionRange(`~5.${wildcard}`)).toBe(true);
      }
    );

    it.each([",", " ", "||"])(
      'Should not report multiple version requirements separated by "%s"',
      (separator) => {
        expect(validatePoetryVersionRange(`2.7${separator}6.3`));
      }
    );

    it.each(["=", "<", ">", "<=", ">="])(
      'Should not report inequality requirements with "%s"',
      (operator) => {
        expect(validatePoetryVersionRange(`${operator}22.7`)).toBe(true);
      }
    );
  });

  describe("URL", () => {
    it("Should report non-URL strings", () => {
      expect(validateUrl("not-an-url")).toContain("Invalid URL");
    });

    it("Should report SSH URLs", () => {
      expect(validateUrl("git@github.com:heihachi/mishima.git")).toContain(
        "Invalid URL"
      );
    });

    it.each([
      { protocol: "http", url: "http://github.com/heihachi/mishima" },
      { protocol: "https", url: "https://github.com/heihachi/mishima" },
    ])("Should not report valid $protocol addresses", ({ url }) => {
      expect(validateUrl(url)).toBe(true);
    });
  });
});
