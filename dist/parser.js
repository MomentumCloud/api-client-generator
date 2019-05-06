"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var helper_1 = require("./helper");
function createMustacheViewModel(swagger, swaggerTag, skipUnsupported) {
    var methods = parseMethods(swagger, swaggerTag, skipUnsupported);
    var camelSwaggerTag = helper_1.toCamelCase(swaggerTag, false);
    return {
        isSecure: !!swagger.securityDefinitions,
        swagger: swagger,
        swaggerTag: swaggerTag,
        domain: determineDomain(swagger),
        methods: methods,
        definitions: parseDefinitions(swagger.definitions, swagger.parameters, swaggerTag ? methods : undefined),
        serviceName: camelSwaggerTag ? camelSwaggerTag + "APIClient" : 'APIClient',
        serviceFileName: helper_1.fileName(camelSwaggerTag ? camelSwaggerTag + "APIClient" : 'api-client', 'service'),
        interfaceName: camelSwaggerTag ? camelSwaggerTag + "APIClientInterface" : 'APIClientInterface',
        interfaceFileName: helper_1.fileName(camelSwaggerTag ? camelSwaggerTag + "APIClient" : 'api-client', 'interface'),
    };
}
exports.createMustacheViewModel = createMustacheViewModel;
function determineDomain(_a) {
    var schemes = _a.schemes, host = _a.host, basePath = _a.basePath;
    var protocol = host && schemes && schemes.length > 0 ? schemes[0] + "://" : '//';
    var domain = host
        ? host
        : '${window.location.hostname}${window.location.port ? \':\'+window.location.port : \'\'}';
    var base = ('/' === basePath || !basePath ? '' : basePath);
    return "" + protocol + domain + base;
}
exports.determineDomain = determineDomain;
function parseMethods(_a, swaggerTag, skipUnsupported) {
    var paths = _a.paths, security = _a.security, parameters = _a.parameters, _b = _a.responses, responses = _b === void 0 ? {} : _b;
    var _c;
    var supportedMethods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];
    var unsupportedConsumes = ['multipart/form-data'];
    return (_c = []).concat.apply(_c, Object.entries(paths)
        .map(function (_a) {
        var pathName = _a[0], pathDef = _a[1];
        return Object.entries(pathDef).filter(function (_a) {
            var methodType = _a[0], operation = _a[1];
            var op = operation;
            var unsupportedCheck = !skipUnsupported || (skipUnsupported && !unsupportedConsumes.some(function (uc) { return (operation.consumes || []).some(function (oc) { return oc === uc; }); }));
            return unsupportedCheck &&
                supportedMethods.indexOf(methodType.toUpperCase()) !== -1 &&
                (!swaggerTag || (op.tags && op.tags.includes(swaggerTag)));
        }).map(function (_a) {
            var methodType = _a[0], operation = _a[1];
            var okResponse = operation.responses['200'] || operation.responses['201'];
            var responseType = determineResponseType(okResponse && helper_1.isReference(okResponse)
                ? responses[helper_1.dereferenceType(okResponse.$ref)]
                : okResponse);
            return {
                hasJsonResponse: true,
                isSecure: security !== undefined || operation.security !== undefined,
                methodName: helper_1.toCamelCase(operation.operationId
                    ? (!swaggerTag ? operation.operationId : operation.operationId.replace(swaggerTag + "_", ''))
                    : methodType + "_" + pathName.replace(/[{}]/g, '')),
                methodType: methodType.toUpperCase(),
                parameters: transformParameters((pathDef.parameters || []).concat((operation.parameters || [])), parameters || {}),
                path: pathName.replace(/{(.*?)}/g, function (_) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    return "${args." + helper_1.toCamelCase(args[0]) + "}";
                }),
                responseTypeName: responseType.name,
                response: helper_1.prefixImportedModels(responseType.type),
                description: helper_1.replaceNewLines(operation.description, '$1   * '),
            };
        });
    }));
}
function parseDefinitions(definitions, parameters, methods) {
    if (definitions === void 0) { definitions = {}; }
    if (parameters === void 0) { parameters = {}; }
    var allDefs = Object.entries(definitions)
        .map(function (_a) {
        var key = _a[0], definition = _a[1];
        return defineEnumOrInterface(key, definition);
    }).concat(Object.entries(parameters).filter(function (_a) {
        var definition = _a[1];
        return (definition.enum && definition.enum.length !== 0) || definition.schema;
    })
        .map(function (_a) {
        var key = _a[0], definition = _a[1];
        return defineEnumOrInterface(key, definition);
    }));
    if (methods) {
        var filterByName_1 = function (defName, parentDefs) {
            if (parentDefs === void 0) { parentDefs = []; }
            var namedDefs = allDefs.filter(function (_a) {
                var name = _a.name;
                return name === defName;
            });
            return namedDefs
                .reduce(function (acc, def) { return acc.concat(def.properties
                .filter(function (prop) { return prop.typescriptType && prop.isRef; })
                .reduce(function (a, prop) { return parentDefs.some(function (_a) {
                var name = _a.name;
                return name === prop.typescriptType;
            })
                ? a
                : a.concat(filterByName_1(prop.typescriptType, namedDefs)); }, [])); }, namedDefs);
        };
        return methods.reduce(function (acc, method) { return acc.concat(method.parameters.reduce(function (a, param) { return a.concat(filterByName_1(helper_1.toCamelCase(param.typescriptType, false))); }, filterByName_1(helper_1.toCamelCase(method.responseTypeName, false)))); }, []);
    }
    return allDefs;
}
function defineEnumOrInterface(key, definition) {
    return definition.enum && definition.enum.length !== 0
        ? defineEnum(definition.enum, key, definition.type === 'integer', definition.description)
        : defineInterface(('schema' in definition ? definition.schema : definition) || {}, key);
}
function defineEnum(enumSchema, definitionKey, isNumeric, enumDesc) {
    if (enumSchema === void 0) { enumSchema = []; }
    if (isNumeric === void 0) { isNumeric = false; }
    if (enumDesc === void 0) { enumDesc = ''; }
    var splitDesc = enumDesc.split('\n');
    var descKeys = splitDesc.length > 1
        ? splitDesc.reduce(function (acc, cur) {
            var _a;
            var captured = /(\d) (\w+)/.exec(cur);
            return captured ? __assign({}, acc, (_a = {}, _a[captured[1]] = captured[2], _a)) : acc;
        }, {})
        : null;
    return {
        name: helper_1.typeName(definitionKey),
        properties: enumSchema && enumSchema.map(function (val) { return ({
            name: (isNumeric
                ? descKeys ? descKeys[val.toString()] : val.toString()
                : val.toString()).replace(/[\W\s]+/, '_'),
            value: val.toString(),
        }); }),
        description: helper_1.replaceNewLines(enumDesc, '$1 * '),
        isEnum: true,
        isNumeric: isNumeric,
        imports: [],
        renderFileName: function () { return function (text, render) { return helper_1.fileName(render(text), 'enum'); }; },
    };
}
function parseInterfaceProperties(properties, requiredProps) {
    if (properties === void 0) { properties = {}; }
    if (requiredProps === void 0) { requiredProps = []; }
    return Object.entries(properties).map(function (_a) {
        var propName = _a[0], propSchema = _a[1];
        var isArray = /^array$/i.test(propSchema.type || '');
        var ref = propSchema.additionalProperties ? propSchema.additionalProperties.$ref : propSchema.$ref;
        var typescriptType = helper_1.toTypescriptType(isArray
            ? determineArrayType(propSchema)
            : ref
                ? helper_1.dereferenceType(ref)
                : propSchema.additionalProperties
                    ? propSchema.additionalProperties.type
                    : propSchema.type);
        return {
            isArray: isArray,
            isDictionary: propSchema.additionalProperties,
            isRef: !!parseReference(propSchema),
            isRequired: requiredProps.includes(propName),
            name: /^[A-Za-z_$][\w$]*$/.test(propName) ? propName : "'" + propName + "'",
            description: helper_1.replaceNewLines(propSchema.description),
            type: typescriptType.replace('[]', ''),
            typescriptType: typescriptType,
        };
    }).sort(helper_1.compareStringByKey('name'));
}
function parseReference(schema) {
    if ('$ref' in schema && schema.$ref) {
        return schema.$ref;
    }
    else if (schema.type === 'array' && schema.items) {
        if ('$ref' in schema.items && schema.items.$ref) {
            return schema.items.$ref;
        }
        else if (!Array.isArray(schema.items) && schema.items.items && '$ref' in schema.items.items && schema.items.items.$ref) {
            return schema.items.items.$ref;
        }
    }
    else if (schema.additionalProperties && schema.additionalProperties.$ref) {
        return schema.additionalProperties.$ref;
    }
    return '';
}
function determineArrayType(property) {
    if (property === void 0) { property = {}; }
    if (Array.isArray(property.items)) {
        helper_1.logWarn('Arrays with type diversity are currently not supported');
        return 'any';
    }
    if (property.items && property.items.$ref) {
        return helper_1.typeName(helper_1.dereferenceType(property.items.$ref));
    }
    else if (property.items && property.items.type) {
        if (/^array$/i.test(property.items.type || '')) {
            return determineArrayType(property.items) + "[]";
        }
        return helper_1.typeName(property.items.type);
    }
    return helper_1.typeName(property.type);
}
function defineInterface(schema, definitionKey) {
    var name = helper_1.typeName(definitionKey);
    var extendInterface = schema.allOf
        ? helper_1.toCamelCase(helper_1.dereferenceType((schema.allOf.find(function (allOfSchema) { return !!allOfSchema.$ref; }) || {}).$ref), false)
        : undefined;
    var allOfProps = schema.allOf ? schema.allOf.reduce(function (props, allOfSchema) { return (__assign({}, props, allOfSchema.properties)); }, {}) : {};
    var properties = parseInterfaceProperties(__assign({}, schema.properties, allOfProps), schema.required);
    return {
        name: name,
        description: helper_1.replaceNewLines(schema.description, '$1 * '),
        properties: properties,
        imports: properties
            .filter(function (_a) {
            var isRef = _a.isRef;
            return isRef;
        })
            .map(function (_a) {
            var type = _a.type;
            return type || '';
        })
            .filter(function (type) { return type !== name; })
            .concat(extendInterface ? [extendInterface] : [])
            .sort()
            .filter(function (el, i, a) { return (i === a.indexOf(el)) ? 1 : 0; }),
        isEnum: false,
        extend: extendInterface,
        renderFileName: function () { return function (text, render) { return helper_1.fileName(render(text), 'model'); }; },
    };
}
function determineResponseType(response) {
    if (response == null) {
        helper_1.logWarn('200 or 201 response not specified; `any` will be used');
        return { name: 'any', type: 'any' };
    }
    var schema = response.schema;
    if (schema == null) {
        helper_1.logWarn('200 or 201 response schema not specified; `any` will be used');
        return { name: 'any', type: 'any' };
    }
    var nullable = schema['x-nullable'] || false;
    if (schema.type === 'array') {
        var items = schema.items;
        if (items == null) {
            helper_1.logWarn('`items` field not present; `any[]` will be used');
            return { name: 'any', type: 'any[]' };
        }
        if (Array.isArray(items)) {
            helper_1.logWarn('Arrays with type diversity are currently not supported; `any[]` will be used');
            return { name: 'any', type: 'any[]' };
        }
        var name_1 = items.$ref ? helper_1.dereferenceType(items.$ref) : items.type;
        var type = nullable ? helper_1.typeName(name_1, true) + " | null" : helper_1.typeName(name_1, true);
        return { name: name_1, type: type };
    }
    if (schema.$ref != null) {
        var name_2 = helper_1.dereferenceType(schema.$ref);
        var type = nullable ? helper_1.typeName(name_2) + " | null" : helper_1.typeName(name_2);
        return { name: name_2, type: type };
    }
    return { name: 'any', type: 'any' };
}
function transformParameters(parameters, allParams) {
    return parameters.map(function (param) {
        var ref = param.$ref || ('schema' in param && (param.schema && param.schema.$ref)) || '';
        var derefName = ref ? helper_1.dereferenceType(ref) : undefined;
        var paramRef = derefName ? allParams[derefName] || {} : {};
        var name = 'name' in paramRef ? paramRef.name : param.name;
        var type = ('type' in param && param.type) || (paramRef && 'type' in paramRef && paramRef.type) || '';
        var isArray = /^array$/i.test(type);
        var typescriptType = helper_1.toTypescriptType(isArray
            ? determineArrayType(param)
            : (!ref || (paramRef && 'type' in paramRef && !paramRef.enum && paramRef.type && helper_1.BASIC_TS_TYPE_REGEX.test(paramRef.type)))
                ? type
                : derefName);
        return __assign({}, param, determineParamType('in' in paramRef ? paramRef.in : param.in), { description: helper_1.replaceNewLines(param.description || paramRef.description, ' '), camelCaseName: helper_1.toCamelCase(name), importType: helper_1.prefixImportedModels(typescriptType), isArray: isArray, isRequired: param.isRequired || param.required || paramRef.required, name: name,
            typescriptType: typescriptType });
    });
}
function determineParamType(paramType) {
    if (!paramType) {
        return {};
    }
    switch (paramType) {
        case 'body':
            return { isBodyParameter: true };
        case 'formData':
            helper_1.logWarn("Form parameters are currently unsupported and will not be generated properly");
            return { isFormParameter: true };
        case 'header':
            return { isHeaderParameter: true };
        case 'path':
            return { isPathParameter: true };
        case 'query' || 'modelbinding':
            return { isQueryParameter: true };
        default:
            helper_1.logWarn("Unsupported parameter type  [ " + paramType + " ]");
            return {};
    }
}
//# sourceMappingURL=parser.js.map