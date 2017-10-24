"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
function subscribe(schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, subscribeFieldResolver) {
    contextValue = Object.assign({}, contextValue, { foo: 'bar' });
    return graphql_1.subscribe(schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, subscribeFieldResolver);
}
exports.subscribe = subscribe;
//# sourceMappingURL=subscribe.js.map