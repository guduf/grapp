"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRAPP_OPERATIONS = Symbol('GRAPP_OPERATIONS');
function onConnect(connectionParams, ws) {
    ws[exports.GRAPP_OPERATIONS] = new Map();
    return { ws: ws };
}
exports.onConnect = onConnect;
function onOperation({ id, payload }, params, ws) {
    const operations = ws[exports.GRAPP_OPERATIONS];
    let completeOperation;
    let onSubscriptionComplete = new Promise(resolve => (completeOperation = resolve));
    operations.set(id, completeOperation);
    return Object.assign({}, params, { context: Object.assign({}, params.context, { onSubscriptionComplete }) });
}
exports.onOperation = onOperation;
function onOperationComplete(ws, id) {
    const operations = ws[exports.GRAPP_OPERATIONS];
    const completeOperation = operations.get(id);
    if (typeof completeOperation === 'function')
        completeOperation();
    operations.delete(id);
}
exports.onOperationComplete = onOperationComplete;
function onDisconnect(ws) {
    const operations = ws[exports.GRAPP_OPERATIONS];
    for (const [, completeOperation] of operations)
        if (typeof completeOperation === 'function')
            completeOperation();
}
exports.onDisconnect = onDisconnect;
//# sourceMappingURL=options.js.map