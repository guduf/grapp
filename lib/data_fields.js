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
const doc_1 = require("./doc");
const doc_ref_1 = require("./doc_ref");
const fields_1 = require("./fields");
const validators_1 = require("./validators");
class DataFieldMeta extends fields_1.FieldMeta {
    constructor(target, key, params) {
        super(target, key, params, DataFieldRef);
        if (!Array.isArray(params.validators) || params.validators.filter(val => typeof val !== 'function').length)
            throw new TypeError('(validators) is not array of function');
        this.validators = params.validators;
        this.isArray = params.isArray;
        const _opts = ['required', 'inputable', 'updatable'];
        for (const opt of _opts)
            if (typeof params[opt] === 'boolean')
                this[opt] = params[opt];
            else if (typeof params[opt.slice(0, 3)] === 'boolean' ||
                [0, 1].indexOf(params[opt.slice(0, 3)]) > -1)
                this[opt] = Boolean(params[opt.slice(0, 3)]);
            else
                this[opt] = true;
    }
}
exports.DataFieldMeta = DataFieldMeta;
class DataFieldRef extends fields_1.FieldRef {
    constructor(typeRef, key, meta) {
        super(typeRef, key, meta);
        this.defineValue = instance => () => this._fetchData(instance);
        if (!(this.typeRef instanceof doc_ref_1.DocTypeRef))
            throw new Error('typeRef must be instance DocTypeRef for RelationFieldRef');
    }
    _fetchData(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const typeData = instance[doc_1.DOC_DATA];
            if (typeData[this.key])
                return typeData[this.key];
            const data = yield this.typeRef.grappRef.collection.findOne({ id: typeData.id }, { fields: { [this.key]: true } });
            if (!data)
                throw new Error(`Can't fetch data for field [${this.key}] of type: ${this.typeRef.selector}`);
            instance[doc_1.DOC_DATA] = Object.assign({}, typeData, data);
            return instance[doc_1.DOC_DATA][this.key];
        });
    }
}
exports.DataFieldRef = DataFieldRef;
function buildDataFieldDecorator(validators, isArray = false) {
    return (opts) => {
        return function fieldDecorator(target, key) {
            const meta = new DataFieldMeta(target, key, Object.assign({}, opts, { validators, isArray }));
            fields_1.setFieldMeta(target, key, meta);
        };
    };
}
exports.Data = {
    boolean: buildDataFieldDecorator([validators_1.Validators.boolean]),
    color: buildDataFieldDecorator([validators_1.Validators.color]),
    date: buildDataFieldDecorator([validators_1.Validators.date]),
    email: buildDataFieldDecorator([validators_1.Validators.email]),
    float: buildDataFieldDecorator([validators_1.Validators.float]),
    shortid: buildDataFieldDecorator([validators_1.Validators.shortid]),
    int: buildDataFieldDecorator([validators_1.Validators.int]),
    string: buildDataFieldDecorator([validators_1.Validators.string]),
    custom(...validators) { return buildDataFieldDecorator(validators); }
};
exports.DataArray = {
    boolean: buildDataFieldDecorator([validators_1.Validators.boolean], true),
    color: buildDataFieldDecorator([validators_1.Validators.color], true),
    date: buildDataFieldDecorator([validators_1.Validators.date], true),
    email: buildDataFieldDecorator([validators_1.Validators.email], true),
    float: buildDataFieldDecorator([validators_1.Validators.float], true),
    shortid: buildDataFieldDecorator([validators_1.Validators.shortid], true),
    int: buildDataFieldDecorator([validators_1.Validators.int], true),
    string: buildDataFieldDecorator([validators_1.Validators.string], true),
    custom(...validators) { return buildDataFieldDecorator(validators, true); }
};
//# sourceMappingURL=data_fields.js.map