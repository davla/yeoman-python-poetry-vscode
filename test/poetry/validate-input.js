import {
  validateAuthor,
  validateDescription,
  validatePoetryVersionRange,
  validateUrl,
} from "../../generators/poetry/validate-input.js";

describe("Poetry input validation", () => {
  describe("Author", () => {
    [
      { reason: "different format", authorString: "not-an-author-string" },
      { reason: "empty name", authorString: "<valid@email.com>" },
      { reason: "empty email", authorString: "Yoshimitsu <>" },
    ].forEach(({ reason, authorString }) =>
      it(`Should report author strings with ${reason}`, () =>
        validateAuthor(authorString).should.include("Invalid author string"))
    );

    it("Should report invalid emails", () =>
      validateAuthor("Yoshimitsu <not@an-email#for%sure>").should.include(
        "Invalid email"
      ));

    it("Should not report valid author strings", () =>
      validateAuthor("Yoshimitsu <yoshimitsu@tekken.jp>").should.be.true);
  });

  describe("Description", () => {
    [
      { testText: "empty", description: "" },
      { testText: "null", description: null },
      { testText: "undefined", description: undefined },
    ].forEach(({ testText, description }) =>
      it(`Should report ${testText} descriptions`, () =>
        validateDescription(description).should.include("empty"))
    );

    it("Should not report valid descriptions", () =>
      validateDescription("King of Iron Fist Tournament").should.be.true);
  });

  describe("Poetry version range", () => {
    it("Should report hypen range syntax", () =>
      validatePoetryVersionRange("1.* - 3.*")
        .should.include("Poetry")
        .and.string("hyphen range"));

    it("Should not report caret requirements", () =>
      validatePoetryVersionRange("^7.2.9").should.be.true);

    it("Should not report tilde requirements", () =>
      validatePoetryVersionRange("~0.27").should.be.true);

    for (const wildcard of ["*", "X", "x"]) {
      it(`Should not report wildcars requirements with "${wildcard}"`, () =>
        validatePoetryVersionRange(`~5.${wildcard}`).should.be.true);
    }

    for (const separator of [",", " ", "||"]) {
      it(`Should not report multiple version requirements separated by "${separator}"`, () =>
        validatePoetryVersionRange(`2.7${separator}6.3`).should.be.true);
    }

    for (const operator of ["=", "<", ">", "<=", ">="]) {
      it(`Should not report inequality requirements with "${operator}"`, () =>
        validatePoetryVersionRange(`${operator}22.7`).should.be.true);
    }
  });

  describe("URL", () => {
    it("Should report non-URL strings", () =>
      validateUrl("not-an-url").should.include("Invalid URL"));

    it("Should report SSH URLs", () =>
      validateUrl("git@github.com:heihachi/mishima.git").should.include(
        "Invalid URL"
      ));

    [
      { protocol: "http", url: "http://github.com/heihachi/mishima" },
      { protocol: "https", url: "https://github.com/heihachi/mishima" },
    ].forEach(({ protocol, url }) =>
      it(`Should not report valid ${protocol} addresses`, () =>
        validateUrl(url).should.be.true)
    );
  });
});
