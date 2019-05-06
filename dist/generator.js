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
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var fs_extra_1 = require("fs-extra");
var Mustache = require("mustache");
var path_1 = require("path");
var swagger_parser_1 = require("swagger-parser");
var util_1 = require("util");
var helper_1 = require("./helper");
var parser_1 = require("./parser");
var ALL_TAGS_OPTION = 'all';
exports.MODEL_DIR_NAME = 'models';
function generateAPIClient(options) {
    return __awaiter(this, void 0, void 0, function () {
        var swaggerFilePath, error_1, swaggerDef, allTags, specifiedTags, usedTags, apiTagsData, allDefinitions;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    swaggerFilePath = options.sourceFile;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, swagger_parser_1.validate(swaggerFilePath, {
                            allow: {
                                json: true,
                                yaml: true,
                                empty: false,
                                unknown: false,
                            },
                            validate: {
                                schema: true,
                                spec: true,
                            }
                        })];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    error_1 = _a.sent();
                    throw new Error("Provided swagger file \"" + swaggerFilePath + "\" is invalid: " + error_1);
                case 4: return [4, swagger_parser_1.parse(swaggerFilePath)];
                case 5:
                    swaggerDef = _a.sent();
                    allTags = getAllSwaggerTags(swaggerDef.paths);
                    specifiedTags = options.splitPathTags || [];
                    usedTags = specifiedTags.length === 0
                        ? [undefined]
                        : specifiedTags[0] === ALL_TAGS_OPTION
                            ? allTags
                            : specifiedTags;
                    apiTagsData = usedTags.map(function (tag) { return parser_1.createMustacheViewModel(swaggerDef, tag, options.skipUnsupported); });
                    allDefinitions = apiTagsData.map(function (_a) {
                        var definitions = _a.definitions;
                        return definitions;
                    }).reduce(function (acc, definitions) { return acc.concat(definitions); }, [])
                        .sort(helper_1.compareStringByKey('name'))
                        .filter(function (_a, index, self) {
                        var name = _a.name;
                        return index > 0 ? name !== self[index - 1].name : true;
                    });
                    return [2, helper_1.flattenAll(apiTagsData.map(function (apiTagData) { return __awaiter(_this, void 0, void 0, function () {
                            var subFolder, clientOutputPath;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (apiTagData.methods.length === 0) {
                                            helper_1.logWarn("No swagger paths with tag " + apiTagData.swaggerTag);
                                            return [2, []];
                                        }
                                        subFolder = usedTags && usedTags[0] ? "services/" + helper_1.dashCase(apiTagData.swaggerTag) : '';
                                        clientOutputPath = path_1.join(options.outputPath, subFolder);
                                        if (!!fs_1.existsSync(clientOutputPath)) return [3, 2];
                                        return [4, fs_extra_1.ensureDir(clientOutputPath)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2, helper_1.flattenAll([
                                            generateClient(apiTagData, clientOutputPath),
                                            generateClientInterface(apiTagData, clientOutputPath)
                                        ].concat(!options.skipModuleExport
                                            ? [generateModuleExportIndex(apiTagData, clientOutputPath)]
                                            : []))];
                                }
                            });
                        }); }).concat([
                            generateModels(allDefinitions, options.outputPath),
                        ]))];
            }
        });
    });
}
exports.generateAPIClient = generateAPIClient;
function generateClient(viewContext, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var clientTemplate, result, outfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, util_1.promisify(fs_1.readFile)(__dirname + "/../templates/ngx-service.mustache")];
                case 1:
                    clientTemplate = (_a.sent()).toString();
                    result = Mustache.render(clientTemplate, viewContext);
                    outfile = path_1.join(outputPath, viewContext.serviceFileName + ".ts");
                    return [4, util_1.promisify(fs_1.writeFile)(outfile, result, 'utf-8')];
                case 2:
                    _a.sent();
                    return [2, [outfile]];
            }
        });
    });
}
function generateClientInterface(viewContext, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var template, result, outfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, util_1.promisify(fs_1.readFile)(__dirname + "/../templates/ngx-service-interface.mustache")];
                case 1:
                    template = (_a.sent()).toString();
                    result = Mustache.render(template, viewContext);
                    outfile = path_1.join(outputPath, viewContext.interfaceFileName + ".ts");
                    return [4, util_1.promisify(fs_1.writeFile)(outfile, result, 'utf-8')];
                case 2:
                    _a.sent();
                    return [2, [outfile]];
            }
        });
    });
}
function generateModels(definitions, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var outputDir, outIndexFile, modelTemplate, modelExportTemplate;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputDir = path_1.join(outputPath, exports.MODEL_DIR_NAME);
                    outIndexFile = path_1.join(outputDir, '/index.ts');
                    return [4, util_1.promisify(fs_1.readFile)(__dirname + "/../templates/ngx-model.mustache")];
                case 1:
                    modelTemplate = (_a.sent()).toString();
                    return [4, util_1.promisify(fs_1.readFile)(__dirname + "/../templates/ngx-models-export.mustache")];
                case 2:
                    modelExportTemplate = (_a.sent()).toString();
                    if (!!fs_1.existsSync(outputDir)) return [3, 4];
                    return [4, util_1.promisify(fs_1.mkdir)(outputDir)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4, util_1.promisify(fs_1.writeFile)(outIndexFile, Mustache.render(modelExportTemplate, { definitions: definitions }), 'utf-8')];
                case 5:
                    _a.sent();
                    return [2, Promise.all(definitions.map(function (definition) { return __awaiter(_this, void 0, void 0, function () {
                            var result, outfile;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        result = Mustache.render(modelTemplate, definition);
                                        outfile = path_1.join(outputDir, helper_1.fileName(definition.name, definition.isEnum ? 'enum' : 'model') + ".ts");
                                        return [4, fs_extra_1.ensureDir(path_1.dirname(outfile))];
                                    case 1:
                                        _a.sent();
                                        return [4, util_1.promisify(fs_1.writeFile)(outfile, result, 'utf-8')];
                                    case 2:
                                        _a.sent();
                                        return [2, outfile];
                                }
                            });
                        }); }).concat([
                            outIndexFile,
                        ]))];
            }
        });
    });
}
function generateModuleExportIndex(viewContext, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var exportTemplate, result, outfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, util_1.promisify(fs_1.readFile)(__dirname + "/../templates/ngx-module-export.mustache")];
                case 1:
                    exportTemplate = (_a.sent()).toString();
                    result = Mustache.render(exportTemplate, viewContext);
                    outfile = path_1.join(outputPath, '/index.ts');
                    return [4, util_1.promisify(fs_1.writeFile)(outfile, result, 'utf-8')];
                case 2:
                    _a.sent();
                    return [2, [outfile]];
            }
        });
    });
}
function getAllSwaggerTags(paths) {
    var allTags = Object.values(paths).map(function (pathDef) {
        return Object.values(pathDef)
            .map(function (_a) {
            var tags = _a.tags;
            return tags || [];
        })
            .reduce(function (acc, tags) { return acc.concat(tags); }, []);
    }).reduce(function (acc, tags) { return acc.concat(tags); }, []);
    return Array.from(new Set(allTags));
}
exports.getAllSwaggerTags = getAllSwaggerTags;
//# sourceMappingURL=generator.js.map