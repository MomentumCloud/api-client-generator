import {
  Operation,
  Path,
  Response,
  Schema,
  Spec as Swagger,
  Parameter as SwaggerParameter,
  Reference,
} from 'swagger-schema-official';
import {
  Definition,
  Method, MethodType,
  MustacheData,
  Parameter,
  Property,
  Render,
  RenderFileName,
  ResponseType
} from './types';
import {
  BASIC_TS_TYPE_REGEX,
  toCamelCase,
  dereferenceType,
  fileName,
  prefixImportedModels,
  replaceNewLines,
  toTypescriptType,
  typeName,
  logWarn,
  compareStringByKey,
  isReference,
} from './helper';

interface Parameters {
  [parameterName: string]: SwaggerParameter
}

interface ExtendedParameters {
  [parameterName: string]: ExtendedParameter
}

type ExtendedParameter = (SwaggerParameter) & {
  'enum': EnumType;
  schema: Schema;
  type: 'string' | 'integer';
  required: boolean;
};

interface Definitions {
  [definitionsName: string]: Schema;
}

type EnumType = string[] | number[] | boolean[] | {}[];

type ExtendedSwaggerParam = Parameter | Reference;

export function createMustacheViewModel(swagger: Swagger, swaggerTag?: string, skipUnsupported?: boolean): MustacheData {
  const methods = parseMethods(swagger, swaggerTag, skipUnsupported);
  const camelSwaggerTag = toCamelCase(swaggerTag, false);
  return {
    isSecure: !!swagger.securityDefinitions,
    swagger: swagger,
    swaggerTag,
    domain: determineDomain(swagger),
    methods: methods,
    definitions: parseDefinitions(swagger.definitions, swagger.parameters, swaggerTag ? methods : undefined),
    serviceName: camelSwaggerTag ? `${camelSwaggerTag}APIClient` : 'APIClient',
    serviceFileName: fileName(camelSwaggerTag ? `${camelSwaggerTag}APIClient` : 'api-client', 'service'),
    interfaceName: camelSwaggerTag ? `${camelSwaggerTag}APIClientInterface` : 'APIClientInterface',
    interfaceFileName: fileName(camelSwaggerTag ? `${camelSwaggerTag}APIClient` : 'api-client', 'interface'),
  };
}

export function determineDomain({schemes, host, basePath}: Swagger): string {

  // if the host is defined then try and use a protocol from the swagger file
  // otherwise use the current protocol of loaded app
  const protocol = host && schemes && schemes.length > 0 ? `${schemes[0]}://` : '//';

  // if no host exists in the swagger file use a window location relative path
  const domain = host
    ? host // tslint:disable-next-line:no-invalid-template-strings
    : '${window.location.hostname}${window.location.port ? \':\'+window.location.port : \'\'}';
  const base = ('/' === basePath || !basePath ? '' : basePath);
  return `${protocol}${domain}${base}`;
}

function parseMethods({paths, security, parameters, responses = {}}: Swagger, swaggerTag?: string, skipUnsupported?: boolean): Method[] {
  const supportedMethods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];
  const unsupportedConsumes = ['multipart/form-data'];

  return ([] as Method[]).concat(...Object.entries(paths)
    .map(([pathName, pathDef]: [string, Path]) =>
      Object.entries(pathDef).filter(([methodType, operation]) => {
        const op = (<Operation>operation);

        const unsupportedCheck = !skipUnsupported || (
          skipUnsupported && !unsupportedConsumes.some(uc => (operation.consumes || []).some((oc: string) => oc === uc))
        );

        return unsupportedCheck &&
          supportedMethods.indexOf(methodType.toUpperCase()) !== -1 && // skip unsupported methods
          (!swaggerTag || (op.tags && op.tags.includes(swaggerTag))); // if tag is defined take only paths including this tag
      }).map(([methodType, operation]: [string, Operation]) => {
          const okResponse: Response | Reference = operation.responses['200'] || operation.responses['201'];

          const responseType = determineResponseType(
            okResponse && isReference(okResponse)
              ? responses[dereferenceType(okResponse.$ref)]
              : okResponse
          );

          return {
            hasJsonResponse: true,
            isSecure: security !== undefined || operation.security !== undefined,
            methodName: toCamelCase(operation.operationId
              ? (!swaggerTag ? operation.operationId : operation.operationId.replace(`${swaggerTag}_`, ''))
              : `${methodType}_${pathName.replace(/[{}]/g, '')}`
            ),
            methodType: methodType.toUpperCase() as MethodType,
            parameters: transformParameters(
              [...(pathDef.parameters || []), ...(operation.parameters || [])],
              parameters || {}
            ),
            // turn path interpolation `{this}` into string template `${args.this}
            path: pathName.replace(
              /{(.*?)}/g,
              (_: string, ...args: string[]): string => `\${args.${toCamelCase(args[0])}}`),
            responseTypeName: responseType.name,
            response: prefixImportedModels(responseType.type),
            description: replaceNewLines(operation.description, '$1   * '),
          };
        }
      )
    ));
}

function parseDefinitions(
  definitions: Definitions = {},
  parameters: Parameters = {},
  methods?: Method[]
): Definition[] {
  const allDefs = [
    ...Object.entries(definitions)
      .map(([key, definition]) => defineEnumOrInterface(key, definition)),

    ...Object.entries(
      parameters as ExtendedParameters  // type cast because of wrong typing in BaseParameter (should contain enum property)
    ).filter(([, definition]) => (definition.enum && definition.enum.length !== 0) || definition.schema)
      .map(([key, definition]) => defineEnumOrInterface(key, definition)),
  ];

  if (methods) {
    const filterByName = (defName: string, parentDefs: Definition[] = []): Definition[] => {
      const namedDefs = allDefs.filter(({name}) => name === defName);
      return namedDefs
        .reduce<Definition[]>(
          (acc, def) => [
            ...acc,
            ...def.properties
              .filter(prop => prop.typescriptType && prop.isRef)
              .reduce<Definition[]>(
                (a, prop) => parentDefs.some(({name}) => name === prop.typescriptType)
                  ? a // do not parse if type def is already in parsed definitions
                  : [...a, ...filterByName(prop.typescriptType!, namedDefs)],
                []
              )
          ],
          namedDefs
        );
    };

    return methods.reduce<Definition[]>(
      (acc, method) => [
        ...acc,
        ...method.parameters.reduce(
          (a, param) => [
            ...a,
            ...filterByName(toCamelCase(param.typescriptType, false)),
          ],
          filterByName(toCamelCase(method.responseTypeName, false))
        )
      ],
      []
    );
  }

  return allDefs;
}

function defineEnumOrInterface(key: string, definition: Schema | ExtendedParameter): Definition {
  return definition.enum && definition.enum.length !== 0
    ? defineEnum(definition.enum, key, definition.type === 'integer', definition.description)
    : defineInterface(('schema' in definition ? definition.schema : definition) || {}, key);
}

function defineEnum(
  enumSchema: (string | boolean | number | {})[] = [],
  definitionKey: string,
  isNumeric: boolean = false,
  enumDesc: string = '',
): Definition {
  const splitDesc = enumDesc.split('\n');
  const descKeys: { [key: string]: string } | null = splitDesc.length > 1
    ? splitDesc.reduce<{ [key: string]: string }>(
      (acc, cur) => {
        const captured = /(\d) (\w+)/.exec(cur); // parse the `- 42 UltimateAnswer` description syntax
        return captured ? {...acc, [captured[1]]: captured[2]} : acc;
      },
      {}
    )
    : null;

  return {
    name: typeName(definitionKey),
    properties: enumSchema && enumSchema.map((val) => ({
      name: (
        isNumeric
          ? descKeys ? descKeys[val.toString()] : val.toString()
          : val.toString()
      ).replace(/[\W\s]+/, '_'),
      value: val.toString(),
    })),
    description: replaceNewLines(enumDesc, '$1 * '),
    isEnum: true,
    isNumeric,
    imports: [],
    renderFileName: (): RenderFileName => (text: string, render: Render): string => fileName(render(text), 'enum'),
  };
}

function parseInterfaceProperties(
  properties: { [propertyName: string]: Schema } = {},
  requiredProps: string[] = [],
): Property[] {
  return Object.entries<Schema>(properties).map(
    ([propName, propSchema]: [string, Schema]) => {
      const isArray = /^array$/i.test(propSchema.type || '');
      const ref = propSchema.additionalProperties ? propSchema.additionalProperties.$ref : propSchema.$ref;
      const typescriptType = toTypescriptType(isArray
        ? determineArrayType(propSchema)
        : ref
          ? dereferenceType(ref)
          : propSchema.additionalProperties
            ? propSchema.additionalProperties.type
            : propSchema.type
      );

      return {
        isArray,
        isDictionary: propSchema.additionalProperties,
        isRef: !!parseReference(propSchema),
        isRequired: requiredProps.includes(propName),
        name: /^[A-Za-z_$][\w$]*$/.test(propName) ? propName : `'${propName}'`,
        description: replaceNewLines(propSchema.description),
        type: typescriptType.replace('[]', ''),
        typescriptType,
      };
    }
  ).sort(compareStringByKey('name')); // tslint:disable-line:no-array-mutation
}

function parseReference(schema: Schema): string {
  if ('$ref' in schema && schema.$ref) {
    return schema.$ref;
  } else if (schema.type === 'array' && schema.items) {
    if ('$ref' in schema.items && schema.items.$ref) {
      return schema.items.$ref;
    } else if (!Array.isArray(schema.items) && schema.items.items && '$ref' in schema.items.items && schema.items.items.$ref) {
      return schema.items.items.$ref;
    }
  } else if (schema.additionalProperties && schema.additionalProperties.$ref) {
    return schema.additionalProperties.$ref;
  }

  return '';
}

function determineArrayType(property: Schema = {}): string {
  if (Array.isArray(property.items)) {
    logWarn('Arrays with type diversity are currently not supported');
    return 'any';
  }

  if (property.items && property.items.$ref) {
    return typeName(dereferenceType(property.items.$ref));
  } else if (property.items && property.items.type) {
    if (/^array$/i.test(property.items.type || '')) {
      return `${determineArrayType(property.items)}[]`;
    }

    return typeName(property.items.type);
  }

  return typeName(property.type);
}

function defineInterface(schema: Schema, definitionKey: string): Definition {
  const name = typeName(definitionKey);
  const extendInterface: string | undefined = schema.allOf
    ? toCamelCase(dereferenceType((schema.allOf.find(allOfSchema => !!allOfSchema.$ref) || {}).$ref), false)
    : undefined;
  const allOfProps: Schema = schema.allOf ? schema.allOf.reduce((props, allOfSchema) => ({...props, ...allOfSchema.properties}), {}) : {};
  const properties: Property[] = parseInterfaceProperties(
    {
      ...schema.properties,
      ...allOfProps,
    } as { [propertyName: string]: Schema },
    schema.required,
  );

  return {
    name: name,
    description: replaceNewLines(schema.description, '$1 * '),
    properties: properties,
    imports: properties
      .filter(({isRef}) => isRef)
      .map(({type}) => type || '')
      .filter((type) => type !== name)
      .concat(extendInterface ? [extendInterface] : [])
      .sort() // tslint:disable-line:no-array-mutation
      // filter duplicate imports
      .filter((el, i, a) => (i === a.indexOf(el)) ? 1 : 0),
    isEnum: false,
    extend: extendInterface,
    renderFileName: (): RenderFileName => (text: string, render: Render): string => fileName(render(text), 'model'),
  };
}

function determineResponseType(response: Response): ResponseType {
  if (response == null) { // TODO: check non-200 response codes
    logWarn('200 or 201 response not specified; `any` will be used');
    return {name: 'any', type: 'any'};
  }

  const {schema} = response;
  if (schema == null) {
    logWarn('200 or 201 response schema not specified; `any` will be used');
    return {name: 'any', type: 'any'};
  }

  const nullable = (schema as Schema & { 'x-nullable'?: boolean })['x-nullable'] || false;
  if (schema.type === 'array') {
    const {items} = schema;
    if (items == null) {
      logWarn('`items` field not present; `any[]` will be used');
      return {name: 'any', type: 'any[]'};
    }

    if (Array.isArray(items)) {
      logWarn('Arrays with type diversity are currently not supported; `any[]` will be used');
      return {name: 'any', type: 'any[]'};
    }

    const name = items.$ref ? dereferenceType(items.$ref) : items.type;
    const type = nullable ? `${typeName(name, true)} | null` : typeName(name, true);
    return {name, type};
  }

  if (schema.$ref != null) {
    const name = dereferenceType(schema.$ref);
    const type = nullable ? `${typeName(name)} | null` : typeName(name);
    return {name, type};
  }

  return {name: 'any', type: 'any'};
}

function transformParameters(
  parameters: ExtendedSwaggerParam[],
  allParams: Parameters
): Parameter[] {
  return parameters.map((param: ExtendedSwaggerParam) => {
    const ref = param.$ref || ('schema' in param && (param.schema && param.schema.$ref)) || '';
    const derefName = ref ? dereferenceType(ref) : undefined;
    const paramRef: Partial<SwaggerParameter> = derefName ? allParams[derefName] || {} : {};
    const name = 'name' in paramRef ? paramRef.name : (param as Parameter).name;
    const type = ('type' in param && param.type) || (paramRef && 'type' in paramRef && paramRef.type) || '';
    const isArray = /^array$/i.test(type);
    const typescriptType = toTypescriptType(isArray
      ? determineArrayType(param as Schema)
      : (!ref || (paramRef && 'type' in paramRef && !paramRef.enum && paramRef.type && BASIC_TS_TYPE_REGEX.test(paramRef.type)))
        ? type
        : derefName
    );

    return {
      ...param,
      ...determineParamType('in' in paramRef ? paramRef.in : (param as Parameter).in),

      description: replaceNewLines((param as Parameter).description || paramRef.description, ' '),
      camelCaseName: toCamelCase(name),
      importType: prefixImportedModels(typescriptType),
      isArray,
      isRequired: (param as Parameter).isRequired || (param as Parameter).required || paramRef.required,
      name,
      typescriptType,
    };
  });
}

function determineParamType(paramType: string | undefined): { isBodyParameter?: boolean } |
  { isFormParameter?: boolean } |
  { isHeaderParameter?: boolean } |
  { isPathParameter?: boolean } |
  { isQueryParameter?: boolean } {

  if (!paramType) {
    return {};
  }

  switch (paramType) {
    case 'body':
      return {isBodyParameter: true};
    case 'formData':
      logWarn(`Form parameters are currently unsupported and will not be generated properly`);
      return {isFormParameter: true};
    case 'header':
      return {isHeaderParameter: true};
    case 'path':
      return {isPathParameter: true};
    case 'query' || 'modelbinding':
      return {isQueryParameter: true};
    default:
      logWarn(`Unsupported parameter type  [ ${paramType} ]`);
      return {};
  }
}
