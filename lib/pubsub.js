"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_subscriptions_1 = require("graphql-subscriptions");
class PubSub extends graphql_subscriptions_1.PubSub {
    constructor() {
        super();
    }
    completeOperation(ws, opId) {
        console.log(`completeOperation`, opId);
    }
    connect(connectionParams, ws) {
        console.log(`connect`, connectionParams);
    }
    startOperation(msg, params, ws) {
        msg = Object.assign({}, msg, { payload: Object.assign({}, msg.payload, { variables: Object.assign({}, msg.payload.variables, { opId: msg.id }) }) });
        console.log(`startOperation`, msg);
        return null;
    }
    disconnect(ws) {
        console.log('disconnect');
    }
}
exports.PubSub = PubSub;
//# sourceMappingURL=pubsub.js.map