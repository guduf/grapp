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
const fields_1 = require("./fields");
const validators_1 = require("./validators");
class DataFieldMeta {
    constructor(validators, opts = {}, isArray = false) {
        this.validators = validators;
        this.isArray = isArray;
        this.FieldRefClass = DataFieldRef;
        if (!Array.isArray(validators) || validators.filter(val => typeof val !== 'function').length)
            throw new TypeError('(validators) is not array of function');
        if (typeof opts === 'string') {
            if (!/^[01]{3}$/.test(opts))
                throw new Error('Invalid Short Opts');
            this.required = opts[0] === '1';
            this.inputable = opts[1] === '1';
            this.updatable = opts[2] === '1';
        }
        else {
            const _opts = ['required', 'inputable', 'updatable'];
            for (const opt of _opts)
                if (typeof opts[opt] === 'boolean')
                    this[opt] = opts[opt];
                else if (typeof opts[opt.slice(0, 3)] === 'boolean' ||
                    [0, 1].indexOf(opts[opt.slice(0, 3)]) > -1)
                    this[opt] = Boolean(opts[opt.slice(0, 3)]);
                else
                    this[opt] = true;
        }
    }
}
exports.DataFieldMeta = DataFieldMeta;
class DataFieldRef {
    constructor(typeRef, key, meta) {
        this.typeRef = typeRef;
        this.key = key;
        this.meta = meta;
    }
    defineProperty(instance) {
        const descriptor = {
            get: () => { return this.resolve(instance); },
            set: (newValue) => { throw new Error('You cant set a decorated property'); },
            enumerable: true,
            configurable: false
        };
        Object.defineProperty(instance, this.key, descriptor);
    }
    resolve(instance) {
        return __awaiter(this, void 0, void 0, function* () {
            const typeData = instance[doc_1.DOC_DATA];
            if (typeData[this.key])
                return typeData[this.key];
            const data = yield this.typeRef.collection.findOne({ id: typeData.id }, { fields: { [this.key]: true } });
            if (!data)
                throw new Error(`Can't fetch data for field [${this.key}] of type: ${this.typeRef.selector}`);
            instance[doc_1.DOC_DATA] = Object.assign({}, typeData, data);
            return instance[doc_1.DOC_DATA][this.key];
        });
    }
}
exports.DataFieldRef = DataFieldRef;
function buildDataFieldDecorator(validators, isArray = false) {
    return function decorateDataField(opts) {
        const meta = new DataFieldMeta(validators, opts, isArray);
        return fields_1.decorateField(meta);
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