"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helper_1 = require("./helper");
describe('[helpers] to camelCase', function () {
    it('should convert dash to camelCase', function () {
        expect(helper_1.toCamelCase('some-service')).toEqual('someService');
        expect(helper_1.toCamelCase('some-really-long-service')).toEqual('someReallyLongService');
        expect(helper_1.toCamelCase('a42-wololo')).toEqual('a42Wololo');
        expect(helper_1.toCamelCase('--param')).toEqual('param');
    });
    it('should convert some separators to camelCase', function () {
        expect(helper_1.toCamelCase('folder/some_really-long.service')).toEqual('folderSomeReallyLongService');
    });
    it('should convert to camelCase and capitalize firs letter', function () {
        expect(helper_1.toCamelCase('my-awesome.model', false)).toEqual('MyAwesomeModel');
    });
});
describe('[helpers] remove duplicate words', function () {
    it('should remove duplicates in sentence', function () {
        expect(helper_1.removeDuplicateWords('modelmodel')).toEqual('model');
        expect(helper_1.removeDuplicateWords('UserModelModel')).toEqual('UserModel');
        expect(helper_1.removeDuplicateWords('shipmentShipmentAddress')).toEqual('ShipmentAddress');
        expect(helper_1.removeDuplicateWords('idWololoID')).toEqual('idWololoID');
        expect(helper_1.removeDuplicateWords('UrlichUrl')).toEqual('UrlichUrl');
    });
});
//# sourceMappingURL=helpers.spec.js.map