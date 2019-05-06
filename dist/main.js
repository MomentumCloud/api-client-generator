#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generator_1 = require("./generator");
var opt = require("optimist");
var git_1 = require("./git");
var fs_1 = require("fs");
var path_1 = require("path");
var helper_1 = require("./helper");
var optimist = opt
    .usage('Usage: api-client-generator -s path/to/swagger.[json|yaml]')
    .alias('h', 'help')
    .alias('s', 'source')
    .alias('o', 'output')
    .alias('C', 'commit')
    .alias('v', 'verbose')
    .alias('t', 'splitPathTags')
    .alias('m', 'skipModule')
    .alias('u', 'skipUnsupported')
    .describe('s', 'Path to the swagger file')
    .describe('o', 'Path where generated files should be emitted')
    .describe('C', 'Autocommit changes')
    .describe('v', 'Print error stack traces')
    .describe('t', 'Generates services and models only for the specified tags.'
    + ' Use `,` (comma) as the separator for multiple tags. Use `all` to emit a service per tag')
    .describe('m', 'Skip creating index file with module export')
    .describe('u', 'Skip generating unsupported "consumes" APIs');
var argv = optimist.argv;
if (argv.help) {
    optimist.showHelp();
    process.exit(0);
}
if (typeof argv.source === 'undefined' && argv.source !== true) {
    console.error('Swagger file (-s) must be specified. See --help');
    process.exit(1);
}
var options = {
    outputPath: argv.output || './output',
    sourceFile: argv.source,
    splitPathTags: argv.splitPathTags ? argv.splitPathTags.split(',') : [],
    skipModuleExport: argv.skipModule === true || argv.skipModule === 'true',
    skipUnsupported: argv.skipUnsupported === true || argv.skipUnsupported === 'true'
};
var generate = argv.commit ?
    git_1.commitAfter(generator_1.generateAPIClient) :
    generator_1.generateAPIClient;
generate(options)
    .then(function (newFiles) {
    console.info('Angular API client generated successfully');
    var legacyFiles = fs_1.readdirSync(path_1.join(argv.output, generator_1.MODEL_DIR_NAME))
        .map(function (file) { return path_1.join(argv.output, generator_1.MODEL_DIR_NAME, file); })
        .filter(function (file) { return !newFiles.includes(file); });
    if (legacyFiles.length > 0) {
        helper_1.logWarn("\nLegacy models discovered:\n" + legacyFiles.join('\n'));
    }
})
    .catch(function (error) { return console.error.apply(console, argv.verbose ?
    ['Error encountered during generating:', error] :
    [error.message]); });
//# sourceMappingURL=main.js.map