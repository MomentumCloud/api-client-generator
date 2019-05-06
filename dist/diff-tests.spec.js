"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var dir_compare_1 = require("dir-compare");
var fs_1 = require("fs");
var rimraf = require("rimraf");
var util_1 = require("util");
var generator_1 = require("./generator");
var TESTS_OUT_DIR = __dirname + "/../tests/tests-output";
var TestReference = (function () {
    function TestReference(name, swaggerFileExt, skipIndex, tags) {
        if (swaggerFileExt === void 0) { swaggerFileExt = 'yaml'; }
        if (skipIndex === void 0) { skipIndex = false; }
        this.name = name;
        this.swaggerFileExt = swaggerFileExt;
        this.skipIndex = skipIndex;
        this.tags = tags;
        this.refDir = __dirname + "/../tests/" + this.name;
        this.genDir = TESTS_OUT_DIR + "/" + this.name;
    }
    return TestReference;
}());
var COMPARE_OPTIONS = {
    compareSize: true,
};
var stateSymbols = {
    equal: '==',
    left: '->',
    right: '<-',
    distinct: '!=',
};
function compareWithReference(reference) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, same, equal, distinct, differences, left, right, diffSet, result_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, generator_1.generateAPIClient({
                        sourceFile: reference.refDir + "/swagger." + reference.swaggerFileExt,
                        outputPath: reference.genDir,
                        skipModuleExport: reference.skipIndex,
                        splitPathTags: reference.tags ? reference.tags.split(',') : []
                    })
                        .catch(function (err) { return console.error("Error has occurred while generating api client for " + reference.name, err); })];
                case 1:
                    _b.sent();
                    return [4, dir_compare_1.compare(reference.refDir + "/api", reference.genDir, COMPARE_OPTIONS)];
                case 2:
                    _a = _b.sent(), same = _a.same, equal = _a.equal, distinct = _a.distinct, differences = _a.differences, left = _a.left, right = _a.right, diffSet = _a.diffSet;
                    if (!same) {
                        result_1 = ' Output should be the same, but there are differences.\n\n';
                        result_1 += "differences: " + differences + "\n\n";
                        result_1 += "equal: " + equal + "\n";
                        result_1 += "distinct: " + distinct + "\n";
                        result_1 += "left: " + left + "\n";
                        result_1 += "right: " + right + "\n";
                        result_1 += '[ reference dir ]               [ test dir ]\n';
                        diffSet.forEach(function (_a) {
                            var name1 = _a.name1, name2 = _a.name2, state = _a.state, type1 = _a.type1, type2 = _a.type2;
                            if (stateSymbols[state] !== stateSymbols.equal) {
                                result_1 += "(" + type1 + ") " + name1 + "  " + stateSymbols[state] + "  " + name2 + " (" + type2 + ")\n";
                            }
                        });
                        return [2, result_1 + "\nUse diff on folders below to acquire more info\ndiff " + reference.refDir + "/api " + reference.genDir + "\n\n"];
                    }
                    return [4, util_1.promisify(rimraf)(reference.genDir)];
                case 3:
                    _b.sent();
                    return [2, null];
            }
        });
    });
}
describe('Diff compare', function () {
    beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fs_1.existsSync(TESTS_OUT_DIR)) return [3, 2];
                    return [4, util_1.promisify(rimraf)(TESTS_OUT_DIR)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [4, util_1.promisify(fs_1.mkdir)(TESTS_OUT_DIR)];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it('should check with [ custom ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('custom');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
    it('should check with [ esquare ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('esquare');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
    it('should check with [ GCloud firestore ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('gcloud-firestore');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
    it('should check with [ GitHub ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('github', 'yaml', false, 'all');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
    it('should check with [ filtered API ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('filtered-api', 'json', true, 'DummySelector,NonExistingTag,Project,Products');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
    it('should check with [ All tags ] reference', function () { return __awaiter(_this, void 0, void 0, function () {
        var reference, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reference = new TestReference('with-all-tags', 'json', false, 'all');
                    _a = expect;
                    return [4, compareWithReference(reference)];
                case 1:
                    _a.apply(void 0, [_b.sent()]).toBeNull();
                    return [2];
            }
        });
    }); });
});
//# sourceMappingURL=diff-tests.spec.js.map