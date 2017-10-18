"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operation_ref_1 = require("./operation_ref");
const type_1 = require("./type");
class OperationMeta extends type_1.TypeMeta {
    constructor(target, kind, params) {
        super(target, Object.assign({}, params, { selector: `@${kind}` }), operation_ref_1.OperationRef);
        this.kind = kind;
    }
}
exports.OperationMeta = OperationMeta;
function decorateOperation(kind, params = {}) {
    return function oprationDecorator(target) {
        type_1.setTypeMeta(target, new OperationMeta(target, kind, params));
    };
}
exports.decorateOperation = decorateOperation;
function decorateMutation(params = {}) {
    return decorateOperation('mutation', params);
}
exports.decorateMutation = decorateMutation;
function decorateQuery(params = {}) {
    return decorateOperation('query', params);
}
exports.decorateQuery = decorateQuery;
//# sourceMappingURL=operation.js.map