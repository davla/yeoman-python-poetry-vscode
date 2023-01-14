import "chai/register-should.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.use(sinonChai);

global.sinon = sinon;
