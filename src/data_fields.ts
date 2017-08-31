import { DocInstance, DocTarget } from './doc';
import { DOC_DATA, DocRef } from './doc_ref';
import { decorateField } from './fields';
import { validate, Validator, Validators } from './validators';

export interface DataFieldOptions {
  required?: boolean;
  inputable?: boolean;
  updatable?: boolean;
  req?: boolean;
  inp?: boolean;
  upd?: boolean;
}

export class DataFieldMeta implements DataFieldOptions {
  required: boolean;
  inputable: boolean;
  updatable: boolean;
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

  buildResolver(docRef: DocRef, instance: DocInstance, key: string): { (): Promise<any> } {
    return async () => {
      const docData: { id: string, [key: string]: any } = instance[DOC_DATA];
      if (docData[key]) return docData[key];
      const collection  = await docRef.collection;
      const data = await collection.findOne({id: docData.id}, {fields: {[key]: true}});
      instance[DOC_DATA] = {...docData, data};
      return instance[DOC_DATA][key];
    };
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
  float: buildDataFieldDecorator([Validators.float]),
  shortid: buildDataFieldDecorator([Validators.shortid]),
  int: buildDataFieldDecorator([Validators.int]),
  string: buildDataFieldDecorator([Validators.string]),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators); }
};

export const DataArray = {
  boolean: buildDataFieldDecorator([Validators.boolean], true),
  float: buildDataFieldDecorator([Validators.float], true),
  shortid: buildDataFieldDecorator([Validators.shortid], true),
  int: buildDataFieldDecorator([Validators.int], true),
  string: buildDataFieldDecorator([Validators.string], true),
  custom(...validators: Validator[]) { return buildDataFieldDecorator(validators, true); }
};
