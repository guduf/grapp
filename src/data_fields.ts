import { DocInstance, DocTarget } from './doc';
import { DOC_DATA, DocRef } from './doc_ref';
import { decorateField, FieldContext, FieldMeta, FieldRef } from './fields';
import { validate, Validator, Validators } from './validators';

export interface DataFieldOptions {
  required?: boolean;
  inputable?: boolean;
  updatable?: boolean;
  req?: boolean;
  inp?: boolean;
  upd?: boolean;
}

export class DataFieldMeta implements FieldMeta, DataFieldOptions {
  constructor (
    public validators: Validator[],
    opts: DataFieldOptions = {},
    public isArray = false
  ) {
    if (!Array.isArray(validators) || validators.filter(val => typeof val !== 'function').length)
      throw new TypeError('(validators) is not array of function');
    const _opts = ['required', 'inputable', 'updatable'];
    for (const opt of _opts)
      if (typeof opts[opt] === 'boolean') this[opt] = opts[opt];
      else if (typeof opts[opt.slice(0, 3)] === 'boolean') this[opt] = opts[opt.slice(0, 3)];
      else this[opt] = true;
  }

  RefClass = DataFieldRef;
  required: boolean;
  inputable: boolean;
  updatable: boolean;
}

export class DataFieldRef implements FieldRef {
  constructor(
    public docRef: DocRef,
    public key: string,
    public meta: DataFieldMeta
  ) { }

  async resolve(args: {}, {docRef, doc, key}: FieldContext): Promise<any> {
    const docData: { id: string, [key: string]: any } = doc[DOC_DATA];
    if (docData[key]) return docData[key];
    const data = await docRef.collection.findOne({id: docData.id}, {fields: {[key]: true}});
    if (!data) throw new Error(`Can't fetch data for field [${key}] of type: ${docRef.selector}`);
    doc[DOC_DATA] = {...docData, ...data};
    return doc[DOC_DATA][key];
  }
}

function buildDataFieldDecorator(
  validators: Validator[], isArray = false
): { (opts: DataFieldOptions): PropertyDecorator } {
  return function decorateDataField(opts: DataFieldOptions): PropertyDecorator {
    const meta = new DataFieldMeta(validators, opts, isArray);
    return decorateField(meta);
  }
}

export const Data = {
  boolean: buildDataFieldDecorator([Validators.boolean]),
  color: buildDataFieldDecorator([Validators.color]),
  float: buildDataFieldDecorator([Validators.float]),
  shortid: buildDataFieldDecorator([Validators.shortid]),
  int: buildDataFieldDecorator([Validators.int]),
  string: buildDataFieldDecorator([Validators.string]),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators); }
};

export const DataArray = {
  boolean: buildDataFieldDecorator([Validators.boolean], true),
  color: buildDataFieldDecorator([Validators.color], true),
  float: buildDataFieldDecorator([Validators.float], true),
  shortid: buildDataFieldDecorator([Validators.shortid], true),
  int: buildDataFieldDecorator([Validators.int], true),
  string: buildDataFieldDecorator([Validators.string], true),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators, true); }
};
