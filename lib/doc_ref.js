"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("rxjs/add/observable/fromPromise");
require("rxjs/add/observable/merge");
require("rxjs/add/operator/do");
require("rxjs/add/operator/filter");
require("rxjs/add/operator/map");
require("rxjs/add/operator/mergeMap");
const Observable_1 = require("rxjs/Observable");
const shortid_1 = require("shortid");
const data_fields_1 = require("./data_fields");
const doc_1 = require("./doc");
const doc_di_1 = require("./doc_di");
const grapp_ref_1 = require("./grapp_ref");
const type_ref_1 = require("./type_ref");
const validators_1 = require("./validators");
const DOC_EVENT = 'DOC_EVENT';
class DocEvent {
    constructor(doc, kind, ids = null) {
        this.doc = doc;
        this.kind = kind;
        this.ids = ids;
        if (!doc)
            throw new Error('Doc missing');
        if (['insert', 'update', 'remove'].indexOf(this.kind) < 0)
            throw new Error('Invalid kind');
    }
}
exports.DocEvent = DocEvent;
class DocRef extends grapp_ref_1.GrappRef {
    constructor(root, target, meta) {
        super(root, target, meta);
        this.collection = this.root.db.collection(this.meta.collectionName);
        this.docEvents = Observable_1.Observable.create((observer) => {
            this.root.pubsub.subscribe(DOC_EVENT, e => observer.next(e), {});
        });
        const docMutation = {
            create: (candidate) => this._create(candidate),
            remove: id => this._remove(id),
            update: (id, update) => this._update(id, update),
            validate: (candidate) => this._validate(candidate)
        };
        const docQuery = {
            find: query => this._find(query),
            findOne: query => this._findOne(query)
        };
        const docSubscription = {
            watch: (query, filter) => this._watch(query, filter),
            watchOne: (query, filter) => this._watchOne(query, filter)
        };
        this.injector = this.injector.resolveAndCreateChild([
            { provide: doc_di_1.COLLECTION, useValue: this.collection },
            { provide: doc_di_1.DocMutation, useValue: docMutation },
            { provide: doc_di_1.DocQuery, useValue: docQuery },
            { provide: doc_di_1.DocSubscription, useValue: docSubscription }
        ]);
        try {
            this.docTypeRef = new DocTypeRef(this, target, meta);
        }
        catch (err) {
            console.error(err);
            throw new Error('Cannot reference docTypeRef: ' + target.name || typeof target);
        }
        this.typeRefs.set(this.meta.selector, this.docTypeRef);
        const dataFields = new Map();
        for (const [fieldName, fieldRef] of this.docTypeRef.fields)
            if (fieldRef instanceof data_fields_1.DataFieldRef)
                dataFields.set(fieldName, fieldRef.meta);
        this.dataFields = dataFields;
    }
    publishDocEvent(doc, kind, ids) {
        this.root.pubsub.publish(DOC_EVENT, new DocEvent(doc, kind, ids));
    }
    _create(candidate) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = candidate['id'] = (candidate['id'] || shortid_1.generate());
            let body = {};
            for (const [fieldName, fieldMeta] of this.dataFields) {
                const value = candidate[fieldName];
                if (fieldMeta.inputable) {
                    if (fieldMeta.required && typeof value === 'undefined')
                        throw new Error('Required field: ' + fieldName);
                    if (typeof value !== 'undefined') {
                        try {
                            if (fieldMeta.isArray) {
                                if (!Array.isArray(value))
                                    throw new TypeError(`${this.meta.selector}[${fieldName}]: Invalid Array`);
                                for (const val of value)
                                    validators_1.validate(val, ...fieldMeta.validators);
                            }
                            else
                                validators_1.validate(value, ...fieldMeta.validators);
                        }
                        catch (err) {
                            throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                        }
                        body[fieldName] = value;
                    }
                }
            }
            yield this.collection.insertOne(Object.assign({}, body, { id }));
            this.publishDocEvent(this.docTypeRef.selector, 'insert', [id]);
            return this._instanciate(id);
        });
    }
    _find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.collection.find(query, { id: true }).toArray();
            return ids.map(({ id }) => this._instanciate(id));
        });
    }
    _findOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = yield this.collection.find(query, { id: true }).limit(1).toArray();
            return ids.length ? this._instanciate(ids[0].id) : null;
        });
    }
    _remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.collection.remove({ id });
            this.publishDocEvent(this.docTypeRef.selector, 'remove', [id]);
            return Boolean(data.result.n);
        });
    }
    _update(id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = {};
            for (const [fieldName, fieldMeta] of this.dataFields)
                if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                    const value = update[fieldName];
                    if (fieldMeta.updatable) {
                        if (typeof value !== 'undefined') {
                            try {
                                if (fieldMeta.isArray) {
                                    if (!Array.isArray(value))
                                        throw new TypeError('Invalid Array');
                                    for (const val of value)
                                        validators_1.validate(val, ...fieldMeta.validators);
                                }
                                else
                                    validators_1.validate(value, ...fieldMeta.validators);
                            }
                            catch (err) {
                                throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                            }
                            body[fieldName] = value;
                        }
                    }
                }
            yield this.collection.updateOne({ id }, { $set: body });
            this.publishDocEvent(this.docTypeRef.selector, 'update', [id]);
            return this._instanciate(id);
        });
    }
    _validate(candidate) {
        const body = {};
        for (const [fieldName, fieldMeta] of this.dataFields)
            if (fieldMeta instanceof data_fields_1.DataFieldMeta) {
                const value = candidate[fieldName];
                if (typeof value === 'undefined') {
                    if (fieldMeta.required)
                        throw new TypeError(`Required field [${fieldName}]`);
                }
                else {
                    try {
                        if (fieldMeta.isArray) {
                            if (!Array.isArray(value))
                                throw new TypeError(`Invalid Array`);
                            for (const val of value)
                                validators_1.validate(val, ...fieldMeta.validators);
                        }
                        else
                            validators_1.validate(value, ...fieldMeta.validators);
                    }
                    catch (err) {
                        throw new Error(`${this.meta.selector}[${fieldName}]: ${err.message}`);
                    }
                    body[fieldName] = value;
                }
            }
        return body;
    }
    _watch(query, filter) {
        return Observable_1.Observable.merge(Observable_1.Observable.fromPromise(this._find(query)), this.docEvents
            .mergeMap(e => {
            if (typeof filter !== 'function')
                return Promise.resolve(false);
            let filterResult = filter(e);
            if (!(filterResult instanceof Promise))
                filterResult = Promise.resolve(filterResult);
            return filterResult.then(filtered => {
                if (typeof filtered !== 'boolean')
                    throw new Error('WatchFilter must return a boolean');
                return filtered;
            });
        })
            .filter(filtered => !filtered)
            .mergeMap(() => this._find(query))
            .do(console.log));
    }
    _watchOne(query, filter) {
        return Observable_1.Observable.merge(Observable_1.Observable.fromPromise(this._findOne(query)), this.docEvents
            .mergeMap(e => {
            if (typeof filter !== 'function')
                return Promise.resolve(false);
            let filterResult = filter(e);
            if (!(filterResult instanceof Promise))
                filterResult = Promise.resolve(filterResult);
            return filterResult.then(filtered => {
                if (typeof filtered !== 'boolean')
                    throw new Error('WatchFilter must return a boolean');
                return filtered;
            });
        })
            .filter(filtered => !filtered)
            .mergeMap(() => this._findOne(query)));
    }
    _instanciate(id) {
        return this.docTypeRef.instanciate({ id });
    }
}
exports.DocRef = DocRef;
class DocTypeRef extends type_ref_1.TypeRef {
    constructor(grappRef, target, meta) {
        super(grappRef, target, meta);
        if (!doc_1.checkDocId(target))
            throw new Error('TypeTarget has no been decorated with DocId');
        const idMeta = new data_fields_1.DataFieldMeta(target, 'id', {
            required: true,
            inputable: true,
            updatable: false,
            validators: [validators_1.Validators.shortid], isArray: false
        });
        this.fields.set('id', new data_fields_1.DataFieldRef(this, 'id', idMeta));
    }
    instanciate(payload) {
        if (!payload || !payload.id)
            throw new Error('Instanciate doc requires a payload with id member');
        const instance = type_ref_1.TypeRef.prototype.instanciate.call(this, payload);
        instance[doc_1.DOC_DATA] = { id: payload.id };
        return instance;
    }
}
exports.DocTypeRef = DocTypeRef;
//# sourceMappingURL=doc_ref.js.map