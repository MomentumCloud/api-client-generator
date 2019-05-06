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
exports.BASIC_TS_TYPE_REGEX = /\b(?:string|number|integer|boolean)\b/;
var BUILD_IN_TS_TYPE_REGEX = /^(?:string|number|integer|boolean|null|undefined|any|Object|Date|File|Blob)\b/;
function toCamelCase(text, lowerFirst) {
    if (text === void 0) { text = ''; }
    if (lowerFirst === void 0) { lowerFirst = true; }
    text = removeDuplicateWords(text);
    if (/^[A-Z0-9]+$/.test(text) || text === '') {
        return text;
    }
    var camelText = text.split(/[-._\/\\+*]/)
        .filter(function (word) { return !!word; })
        .map(function (word) { return "" + word[0].toUpperCase() + word.substring(1); }).join('');
    return lowerFirst
        ? /^([A-Z]+(?=[A-Z]))/.test(camelText)
            ? camelText.replace(/^([A-Z]+(?=[A-Z]))/, function (firstWord) { return firstWord.toLowerCase(); })
            : "" + camelText[0].toLowerCase() + camelText.substring(1)
        : camelText;
}
exports.toCamelCase = toCamelCase;
function dashCase(text) {
    if (text === void 0) { text = ''; }
    text = text.replace(/([A-Z]+)(?![^A-Z])/g, function (g) { return "-" + g.toLowerCase(); });
    return text.replace(/([A-Z])/g, function (g) { return "-" + g[0].toLowerCase(); }).replace(/^-/, '');
}
exports.dashCase = dashCase;
function dereferenceType(refString) {
    if (!refString) {
        return '';
    }
    return refString.replace(/#\/(?:definitions|parameters)\//, '');
}
exports.dereferenceType = dereferenceType;
function removeDuplicateWords(text) {
    return text.replace(/(.{3,})(?=\1)/ig, '');
}
exports.removeDuplicateWords = removeDuplicateWords;
function toTypescriptType(type) {
    if (!type) {
        return 'any';
    }
    if (/^number|integer|double$/i.test(type)) {
        return 'number';
    }
    else if (/^string|boolean$/i.test(type)) {
        return type.toLocaleLowerCase();
    }
    else if (/^object$/i.test(type)) {
        return '{ [key: string]: any }';
    }
    else if (/^array$/i.test(type)) {
        logWarn('Support for nested arrays is limited, using any[] as type');
        return 'any[]';
    }
    return typeName(type);
}
exports.toTypescriptType = toTypescriptType;
function typeName(name, isArray) {
    if (name === void 0) { name = 'any'; }
    if (isArray === void 0) { isArray = false; }
    var type = BUILD_IN_TS_TYPE_REGEX.test(name) ? name : toCamelCase(name, false);
    return "" + type + (isArray ? '[]' : '');
}
exports.typeName = typeName;
function fileName(name, type) {
    if (name === void 0) { name = ''; }
    if (type === void 0) { type = 'model'; }
    return dashCase(name) + "." + type;
}
exports.fileName = fileName;
function prefixImportedModels(type) {
    if (type === void 0) { type = ''; }
    return BUILD_IN_TS_TYPE_REGEX.test(type) ? type : "models." + type;
}
exports.prefixImportedModels = prefixImportedModels;
function replaceNewLines(str, replaceValue) {
    if (str === void 0) { str = ''; }
    if (replaceValue === void 0) { replaceValue = ''; }
    return str.replace(/(\r\n|\r|\n)/g, replaceValue);
}
exports.replaceNewLines = replaceNewLines;
function logWarn(str) {
    console.warn('\x1b[33m%s\x1b[0m', str);
}
exports.logWarn = logWarn;
function flattenAll(promises) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _c = (_b = (_a = Array.prototype).concat).apply;
                    _d = [_a];
                    return [4, Promise.all(promises)];
                case 1: return [2, _c.apply(_b, _d.concat([_e.sent()]))];
            }
        });
    });
}
exports.flattenAll = flattenAll;
function compareStringByKey(key) {
    return function (a, b) { return a[key] && b[key] ? ("" + a[key]).localeCompare("" + b[key]) : -1; };
}
exports.compareStringByKey = compareStringByKey;
function isReference(param) {
    return !!param.$ref;
}
exports.isReference = isReference;
//# sourceMappingURL=helper.js.map