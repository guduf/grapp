"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fields_1 = require("./fields");
exports.DOC_DATA = Symbol('DOC_DATA');
class TypeRef {
    constructor(grappRef, target, meta) {
        this.grappRef = grappRef;
        this.target = target;
        this.meta = meta;
        const providers = [...this.meta.providers];
        const fields = new Map();
        const methodKeys = Object.getOwnPropertyNames(this.target.prototype).filter(key => {
            if (['constructor'].indexOf(key) >= 0)
                return false;
            if (key[0] === '_')
                return false;
            return true;
        });
        for (const key of methodKeys) {
            let fieldRef;
            try {
                fieldRef = new fields_1.FieldRef(this, key, this.target.prototype[key]);
            }
            catch (err) {
                console.error(err);
                throw new Error('Failed to reference Field: ' + key);
            }
            fields.set(key, fieldRef);
        }
        const fieldsMeta = fields_1.mapFieldMeta(target);
        if (fieldsMeta)
            for (const [key, fieldMeta] of fieldsMeta) {
                let fieldRef;
                try {
                    fieldRef = new fieldMeta.FieldRefClass(this, key, fieldMeta);
                }
                catch (err) {
                    console.error(err);
                    throw new Error('Failed to reference Field: ' + key);
                }
                fields.set(key, fieldRef);
            }
        this.fields = fields;
    }
    get root() { return this.grappRef.root; }
    get selector() { return this.meta.selector; }
    instanciate(payload) {
        const injector = this.grappRef.injector.resolveAndCreateChild([...this.meta.providers]);
        const instance = injector.resolveAndInstantiate(this.target);
        for (const [key, fieldRef] of this.fields)
            if (fieldRef.defineValue)
                Object.defineProperty(instance, key, {
                    get: fieldRef.defineValue(instance),
                    enumerable: true,
                    configurable: false
                });
        return instance;
    }
}
exports.TypeRef = TypeRef;
//# sourceMappingURL=type_ref.js.map