"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("./di");
exports.COLLECTION = Symbol('COLLECTION');
exports.Collection = di_1.Inject(exports.COLLECTION);
class DocMutation {
}
exports.DocMutation = DocMutation;
class DocQuery {
}
exports.DocQuery = DocQuery;
class DocSubscription {
}
exports.DocSubscription = DocSubscription;
//# sourceMappingURL=doc_di.js.map