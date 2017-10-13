import { DocInstance, DOC_DATA } from './doc';
import { TypeRef } from './type_ref';
import { decorateField, FieldContext, FieldMeta, FieldRef } from './fields';
import { validate, Validator, Validators } from './validators';

export type DataFieldShortOptions = '000'|'001'|'010'|'011'|'100'|'101'|'110'|'111';

export interface DataFieldOptions {
  required?: boolean;
  inputable?: boolean;
  updatable?: boolean;
  req?: boolean|0|1;
  inp?: boolean|0|1;
  upd?: boolean|0|1;
}

export class DataFieldMeta implements FieldMeta, DataFieldOptions {
  constructor (
    public validators: Validator[],
    opts: DataFieldOptions|DataFieldShortOptions = {},
    public isArray = false
  ) {
    if (!Array.isArray(validators) || validators.filter(val => typeof val !== 'function').length)
      throw new TypeError('(validators) is not array of function');
    if (typeof opts === 'string') {
      if (!/^[01]{3}$/.test(opts)) throw new Error('Invalid Short Opts');
      this.required = opts[0] === '1';
      this.inputable = opts[1] === '1';
      this.updatable = opts[2] === '1';
    } else {
      const _opts = ['required', 'inputable', 'updatable'];
      for (const opt of _opts)
        if (typeof opts[opt] === 'boolean') this[opt] = opts[opt];
        else if (
          typeof opts[opt.slice(0, 3)] === 'boolean' ||
          [0, 1].indexOf(opts[opt.slice(0, 3)]) > -1
        ) this[opt] = Boolean(opts[opt.slice(0, 3)]);
        else this[opt] = true;
    }
  }

  FieldRefClass = DataFieldRef;
  required: boolean;
  inputable: boolean;
  updatable: boolean;
}

export class DataFieldRef implements FieldRef {
  constructor(
    public typeRef: TypeRef,
    public key: string,
    public meta: DataFieldMeta
  ) { }

  async resolve(instance: any, args: {}): Promise<any> {
    const typeData: { id: string, [key: string]: any } = instance[DOC_DATA];
    if (typeData[this.key]) return typeData[this.key];
    const data = await this.typeRef.collection.findOne({id: typeData.id}, {fields: {[this.key]: true}});
    if (!data) throw new Error(`Can't fetch data for field [${this.key}] of type: ${this.typeRef.selector}`);
    instance[DOC_DATA] = {...typeData, ...data};
    return instance[DOC_DATA][this.key];
  }
}

function buildDataFieldDecorator(
  validators: Validator[], isArray = false
): { (opts: DataFieldOptions|DataFieldShortOptions): PropertyDecorator } {
  return function decorateDataField(opts: DataFieldOptions|DataFieldShortOptions): PropertyDecorator {
    const meta = new DataFieldMeta(validators, opts, isArray);
    return decorateField(meta);
  }
}

export const Data = {
  boolean: buildDataFieldDecorator([Validators.boolean]),
  color: buildDataFieldDecorator([Validators.color]),
  date: buildDataFieldDecorator([Validators.date]),
  email: buildDataFieldDecorator([Validators.email]),
  float: buildDataFieldDecorator([Validators.float]),
  shortid: buildDataFieldDecorator([Validators.shortid]),
  int: buildDataFieldDecorator([Validators.int]),
  string: buildDataFieldDecorator([Validators.string]),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators); }
};

export const DataArray = {
  boolean: buildDataFieldDecorator([Validators.boolean], true),
  color: buildDataFieldDecorator([Validators.color], true),
  date: buildDataFieldDecorator([Validators.date], true),
  email: buildDataFieldDecorator([Validators.email], true),
  float: buildDataFieldDecorator([Validators.float], true),
  shortid: buildDataFieldDecorator([Validators.shortid], true),
  int: buildDataFieldDecorator([Validators.int], true),
  string: buildDataFieldDecorator([Validators.string], true),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators, true); }
};
