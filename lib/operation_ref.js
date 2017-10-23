"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_ref_1 = require("./type_ref");
class OperationRef extends type_ref_1.TypeRef {
    constructor(grappRef, target, meta) {
        super(grappRef, target, meta);
        this.grappRef = grappRef;
        this.target = target;
        this.meta = meta;
    }
    get kind() { return this.meta.kind; }
    get instance() {
        return this._instance ? this._instance : (this._instance = this.instanciate({}));
    }
}
exports.OperationRef = OperationRef;
//# sourceMappingURL=operation_ref.js.map