import mergeConfig from "../../../lib/merge-config.js";

describe("mergeConfig", () => {
  it("merges array of non-plain objects by concatenation", () => {
    const dst = { array: [32, false, new Error()] };
    const src = { array: [null, ["Kuma", "Panda"]] };

    mergeConfig(dst, src).should.deep.equal({
      array: [null, ["Kuma", "Panda"], 32, false, new Error()],
    });
  });

  it("doesn't introduce duplicates when concatenating arrays", () => {
    const dst = { array: ["Jack", "Mokujin"] };
    const src = { array: ["Jack", "Combot"] };

    mergeConfig(dst, src).should.deep.equal({
      array: ["Jack", "Combot", "Mokujin"],
    });
  });

  it("merges array with plain objects recursively", () => {
    const dst = { array: [{ key: "value" }, false] };
    const src = { array: [{ anotherKey: "another-value" }, 7.5] };

    mergeConfig(dst, src).should.deep.equal({
      array: [{ key: "value", anotherKey: "another-value" }, 7.5],
    });
  });

  it("merges plain objects recursively", () => {
    const dst = { a: { deep: { value: 42 } }, flag: false };
    const src = { a: { deep: { file: "Ling Xiaoyu" } }, flag: true };

    mergeConfig(dst, src).should.deep.equal({
      a: { deep: { value: 42, file: "Ling Xiaoyu" } },
      flag: true,
    });
  });
});
