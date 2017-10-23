"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operation_ref_1 = require("./operation_ref");
const type_1 = require("./type");
exports.OPERATION_KINDS = ['Mutation', 'Query', 'Subscription'];
class OperationMeta extends type_1.TypeMeta {
    constructor(target, kind, params) {
        super(target, params, operation_ref_1.OperationRef);
        this.kind = kind;
    }
}
exports.OperationMeta = OperationMeta;
function decorateOperation(kind, params = {}) {
    return function operationDecorator(target) {
        type_1.setTypeMeta(target, new OperationMeta(target, kind, params));
    };
}
exports.decorateOperation = decorateOperation;
function decorateMutation(params = {}) {
    return decorateOperation('Mutation', params);
}
exports.decorateMutation = decorateMutation;
function decorateQuery(params = {}) {
    return decorateOperation('Query', params);
}
exports.decorateQuery = decorateQuery;
function decorateSubscription(params = {}) {
    return decorateOperation('Subscription', params);
}
exports.decorateSubscription = decorateSubscription;
//# sourceMappingURL=operation.js.map