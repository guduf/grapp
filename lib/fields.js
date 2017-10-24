"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const meta_1 = require("./meta");
exports.FIELDS_META = Symbol('FIELDS_META');
class FieldMeta {
    constructor(target, key, params, FieldRefClass = FieldRef) {
        this.FieldRefClass = FieldRefClass;
    }
}
exports.FieldMeta = FieldMeta;
class FieldRef {
    constructor(typeRef, key, meta) {
        this.typeRef = typeRef;
        this.key = key;
        this.meta = meta;
    }
    resolve(instance, args, context, info) {
        let fieldValue = instance[this.key];
        if (typeof fieldValue === 'undefined') {
            const proto = Object.getPrototypeOf(instance);
            if (Object.getOwnPropertyNames(proto).indexOf(this.key) >= 0) {
                fieldValue = proto[this.key];
            }
        }
        if (typeof fieldValue === 'function')
            return fieldValue.call(instance, args, context, info);
        else if (typeof fieldValue !== 'undefined')
            return fieldValue;
        else
            throw new Error('fieldValue is undefined');
    }
    resolveSubscription(instance, args, context, info) {
        if (!context.ws)
            throw new Error('resolveSubscription needs a context with ws');
        if (!(context.onSubscriptionComplete instanceof Promise))
            throw new Error('resolveSubscription needs a context with onSubscriptionComplete');
        const { pubsub } = this.typeRef.grappRef.root;
        let fieldValue = this.resolve(instance, args, context, info);
        if (!(fieldValue instanceof Observable_1.Observable))
            throw new Error('fieldValue is not a observable');
        const sub = fieldValue.subscribe(value => pubsub.publish(`Subscription:${this.key}`, { [this.key]: value }));
        context.onSubscriptionComplete.then(() => {
            console.log('sub unsubscribe');
            sub.unsubscribe();
        });
        return this.typeRef.grappRef.root.pubsub.asyncIterator(`Subscription:${this.key}`);
    }
}
exports.FieldRef = FieldRef;
function decorateField(meta) {
    return function fieldDecorator(target, key) {
        const meta = new FieldMeta(target, key, {});
        setFieldMeta(target, key, meta);
    };
}
exports.decorateField = decorateField;
function setFieldMeta(target, key, meta) {
    if (!(meta instanceof FieldMeta))
        throw new TypeError(`meta is not a instance of FieldMeta: ${target.name || typeof target}[${key}]`);
    meta_1.defineMetaKey(meta, exports.FIELDS_META, target, key);
}
exports.setFieldMeta = setFieldMeta;
function mapFieldMeta(target) {
    return meta_1.mapMeta(exports.FIELDS_META, target);
}
exports.mapFieldMeta = mapFieldMeta;
//# sourceMappingURL=fields.js.map