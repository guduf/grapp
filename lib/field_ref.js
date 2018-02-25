"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("zone.js");
require("rxjs/add/operator/map");
const Observable_1 = require("rxjs/Observable");
const shortid_1 = require("shortid");
const obs_to_async_iterable_1 = require("./obs-to-async-iterable");
class FieldRef {
    constructor(typeRef, key, meta) {
        this.typeRef = typeRef;
        this.key = key;
        this.meta = meta;
    }
    resolve(instance, args, context, info) {
        const fieldResolverZone = Zone.current.fork({
            name: `${this.typeRef.selector}:${this.key}:${shortid_1.generate()}`,
            properties: { context, info }
        });
        const { key } = this;
        function fieldResolverWrapper() {
            let fieldValue = instance[key];
            if (typeof fieldValue === 'undefined') {
                const proto = Object.getPrototypeOf(instance);
                if (Object.getOwnPropertyNames(proto).indexOf(key) >= 0) {
                    fieldValue = proto[key];
                }
            }
            if (typeof fieldValue === 'function')
                return fieldValue.call(instance, args, context, info);
            else if (typeof fieldValue !== 'undefined')
                return fieldValue;
            else
                throw new Error('fieldValue is undefined');
        }
        return fieldResolverZone.run(fieldResolverWrapper);
    }
    resolveSubscription(instance, args, context, info) {
        let fieldValue = this.resolve(instance, args, context, info);
        if (!(fieldValue instanceof Observable_1.Observable))
            throw new Error('fieldValue is not a observable');
        return obs_to_async_iterable_1.obsToAsyncIterator(fieldValue.map(value => ({ [this.key]: value })));
    }
}
exports.FieldRef = FieldRef;
//# sourceMappingURL=field_ref.js.map