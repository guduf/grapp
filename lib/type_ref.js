"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_ref_1 = require("./field_ref");
const type_1 = require("./type");
exports.DOC_DATA = Symbol('DOC_DATA');
class TypeRef {
    constructor(grappRef, meta, definition) {
        this.grappRef = grappRef;
        this.meta = meta;
        this.injector = this.grappRef.injector.resolveAndCreateChild([...meta.providers]);
        this.fields = this._mapFieldDefinitions(definition.fields, meta.fields);
    }
    get root() { return this.grappRef.root; }
    get selector() { return this.meta.selector; }
    instanciate(payload) {
        const injector = this.injector.resolveAndCreateChild([...this.meta.providers]);
        const instance = injector.resolveAndInstantiate(this.meta.target);
        for (const [key, fieldRef] of this.fields)
            if (fieldRef.defineValue)
                Object.defineProperty(instance, key, {
                    get: fieldRef.defineValue(instance),
                    enumerable: true,
                    configurable: false
                });
        return instance;
    }
    _mapFieldDefinitions(definitions, metaMap) {
        const references = new Map();
        for (const definition of definitions) {
            const key = definition.name.value;
            const meta = metaMap.get(key);
            if (!(meta instanceof type_1.TypeMeta))
                throw new ReferenceError(`Failed to get field meta for field key: ${key}`);
            if (references.has(meta.selector))
                throw new ReferenceError(`Duplicate meta field key: '${key}'`);
            let fieldRef;
            try {
                fieldRef = new meta.FieldRefClass(this, key, meta);
            }
            catch (catched) {
                console.error(catched);
                throw new Error(`Failed to instanciate field reference '${key}': ${catched.message}`);
            }
            if (!(fieldRef instanceof field_ref_1.FieldRef))
                throw new TypeError(`Type reference with key '${key}' is not a instance of TypeRef`);
            references.set(key, fieldRef);
        }
        return references;
    }
}
exports.TypeRef = TypeRef;
//# sourceMappingURL=type_ref.js.map