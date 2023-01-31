import yeomanTest from "yeoman-test";

import { InputFactory } from "../../lib/input-factories.js";
import InputGenerator from "../../lib/input-generator.js";
import { fileName } from "../../lib/paths.js";
import { readFileInCwd } from "../../test-lib/file-system.js";
import restoreRunResult from "../../test-lib/generator-hooks.js";

export default class JsonInputGenerator extends InputGenerator {
  static inputFactories = [
    new InputFactory({
      ioConfig: {
        shared: { name: "anice" },
        option: {
          type: String,
        },
        prompt: {
          type: "input",
        },
      },
      valueFunctions: {
        validate: (value) => value === "is good" || "you're lying",
        retrieve: () => Promise.resolve("is fantastic"),
      },
    }),
    new InputFactory({
      ioConfig: {
        shared: { name: "licorice" },
        option: { type: String, name: "licorice-option" },
        prompt: { type: "input" },
      },
    }),
  ];

  constructor(args, opts) {
    super(args, opts, JsonInputGenerator.inputFactories);
  }

  initializing() {
    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  async writing() {
    this.fs.writeJSON(
      this.destinationPath("output.json"),
      await this.getInputValues("anice", "licorice")
    );
  }
}

const generatorPath = fileName(import.meta);

describe("InputGenerator", () => {
  beforeEach(function () {
    this.generator = yeomanTest.run(JsonInputGenerator, {
      resolved: generatorPath,
      namespace: "input-state-generator",
    });
  });

  describe("End-to-end inputs", () => {
    afterEach(restoreRunResult);

    it("should use options as input values", async function () {
      this.runResult = await this.generator.withOptions({
        anice: "is good",
        "licorice-option": "is too",
      });
      this.runResult.assertJsonFileContent("output.json", {
        anice: "is good",
        licorice: "is too",
      });
    });

    it("should use init values for inputs if options are not given", async function () {
      this.runResult = await this.generator.withOptions({
        "licorice-option": "is too",
      });
      this.runResult.assertJsonFileContent("output.json", {
        anice: "is fantastic",
        licorice: "is too",
      });
    });

    it("should use prompts as input values if options and init values are not given", async function () {
      this.runResult = await this.generator.withPrompts({
        licorice: "is too",
      });
      this.runResult.assertJsonFileContent("output.json", {
        licorice: "is too",
      });
    });

    it("should use options if both options and prompts are given", async function () {
      this.runResult = await this.generator
        .withOptions({ anice: "is good", "licorice-option": "is too" })
        .withPrompts({ anice: "is not very good", licorice: "is not either" });
      this.runResult.assertJsonFileContent("output.json", {
        anice: "is good",
        licorice: "is too",
      });
    });

    it("should not include any extra key from the Generator.options object", async function () {
      this.runResult = await this.generator.withOptions({
        anice: "is good",
        "licorice-option": "is too",
      });
      const fileContent = JSON.parse(
        await readFileInCwd(this.runResult, "output.json")
      );
      fileContent.should.be.an("object").that.has.all.keys("anice", "licorice");
    });

    it("should ingore options that don't map to inputs", async function () {
      this.runResult = await this.generator.withOptions({
        "licorice-option": "is too",
        fennel: "and this too",
      });
      const fileContent = JSON.parse(
        await readFileInCwd(this.runResult, "output.json")
      );
      fileContent.should.be.an("object").that.does.not.have.any.keys("fennel");
    });

    it("should report invalid options values", function () {
      return this.generator
        .withOptions({
          anice: "is not very good",
        })
        .should.be.rejectedWith(
          TypeError,
          /.*is not very good.+option --anice.+you're lying.*/
        );
    });
  });

  const setGeneratorObj = async function () {
    this.runResult = await this.generator.withOptions({
      anice: "is good",
      "licorice-option": "is too",
    });
    this.generatorObj = this.runResult.generator;
  };

  describe("getInputValues", () => {
    beforeEach(setGeneratorObj);
    afterEach(restoreRunResult);

    it("should return name and value of all the given inputs", function () {
      return this.generatorObj
        .getInputValues("anice", "licorice")
        .should.eventually.deep.equal({
          anice: "is good",
          licorice: "is too",
        });
    });

    it("should report missing input names", function () {
      return this.generatorObj
        .getInputValues("fennel")
        .should.be.rejectedWith(TypeError, /No input.*fennel/);
    });
  });

  describe("getOptionValues", () => {
    beforeEach(setGeneratorObj);
    afterEach(restoreRunResult);

    it("should return option name and value of all the given inputs", function () {
      return this.generatorObj
        .getOptionValues("anice", "licorice")
        .should.eventually.deep.equal({
          anice: "is good",
          "licorice-option": "is too",
        });
    });

    it("should report missing input names", function () {
      return this.generatorObj
        .getInputValues("fennel")
        .should.be.rejectedWith(TypeError, /No input.*fennel/);
    });
  });
});
