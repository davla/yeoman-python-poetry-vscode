import chai from "chai";
import { jestSnapshotPlugin as chaiSnapshot } from "mocha-chai-jest-snapshot";

chai.use(chaiSnapshot());
