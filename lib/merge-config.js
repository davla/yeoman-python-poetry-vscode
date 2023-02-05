import _ from "lodash";

const isArrayOfNonPlainObjects = (value) =>
  _.isArray(value) && !value.some(_.isPlainObject);

const mergeCustomizer = (dst, src) =>
  isArrayOfNonPlainObjects(dst) && isArrayOfNonPlainObjects(src)
    ? Array.from(new Set(src.concat(dst)))
    : undefined;

/*
 * The overall idea here is that, when merging two or more configuration files,
 * array of non key-value pairs should be concatenated. This is the case, for
 * example, for list of file paths to be included/ignored, or for lists of
 * author names and emails.
 * On the other hand, key-value pair groups should be merged into one,
 * regardless of whether they are in an array or not.
 *
 * This approach is by no means universal, and will likely fail in many cases.
 * It's just simple to implement and it served me well so far. ;)
 */
const mergeConfig = (...objects) => _.mergeWith(...objects, mergeCustomizer);

export default mergeConfig;
