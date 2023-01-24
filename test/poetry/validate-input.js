import {
  validateDescription,
  validatePoetryVersionRange,
} from "../../generators/poetry/validate-input.js";

describe("Poetry input validation", () => {
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
});
