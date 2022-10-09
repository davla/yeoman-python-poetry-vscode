import "chai/register-should.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import yeomanTest from "yeoman-test";

import InputStateGenerator from "../../lib/input-state-generator.js";
import { Input } from "../../lib/input.js";
import { fileName } from "../../lib/paths.js";
import { readFileInCwd } from "../../test-lib/file-system.js";

chai.use(chaiAsPromised);

export default class JsonInputStateGenerator extends InputStateGenerator {
  constructor(args, opts) {
    super(args, opts, [
      {
        [Input.PATH_KEY]: "anice",
        [Input.VALIDATE_KEY]: (value) => value === "is good" || "you're lying",
        [Input.OPTION_KEY]: {
          type: String,
        },
        [Input.PROMPT_KEY]: {
          type: "input",
        },
      },
      {
        [Input.PATH_KEY]: "licorice",
        [Input.OPTION_KEY]: {
          type: String,
        },
        [Input.PROMPT_KEY]: {
          type: "input",
        },
      },
    ]);
  }

  initializing() {
    return super.initializing();
  }

  prompting() {
    return super.prompting();
  }

  writing() {
    this.fs.writeJSON(
      this.destinationPath("output.json"),
      this.inputState.values
    );
  }
}

const generatorPath = fileName(import.meta);

describe("InputStateGenerator", () => {
  beforeEach(function () {
    this.generator = yeomanTest.run(JsonInputStateGenerator, {
      resolved: generatorPath,
      namespace: "input-state-generator",
    });
  });

  it("should utilize inputs as options", async function () {
    const runResult = await this.generator.withOptions({
      anice: "is good",
      licorice: "is too",
    });
    runResult.assertJsonFileContent("output.json", {
      anice: "is good",
      licorice: "is too",
    });
  });

  it("should utilize inputs as prompts", async function () {
    const runResult = await this.generator.withPrompts({
      anice: "is good",
      licorice: "is too",
    });
    runResult.assertJsonFileContent("output.json", {
      anice: "is good",
      licorice: "is too",
    });
  });

  it("should utilize options if both options and prompts are given", async function () {
    const runResult = await this.generator
      .withOptions({ anice: "is good", licorice: "is too" })
      .withPrompts({ anice: "is not very good", licorice: "is not either" });
    runResult.assertJsonFileContent("output.json", {
      anice: "is good",
      licorice: "is too",
    });
  });

  it("should not include any extra key from the Generator.options object", async function () {
    const runResult = await this.generator.withOptions({
      anice: "is good",
      licorice: "is too",
    });
    const fileContent = JSON.parse(
      await readFileInCwd(runResult, "output.json")
    );
    fileContent.should.be.an("object").that.has.all.keys("anice", "licorice");
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
