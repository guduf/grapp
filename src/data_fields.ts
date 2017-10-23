import { DocInstance, DOC_DATA } from './doc';
import { DocTypeRef } from './doc_ref';
import { setFieldMeta, FieldMeta, FieldRef } from './fields';
import { TypeInstance, TypeTarget } from './type';
import { validate, Validator, Validators } from './validators';

export interface DataFieldOpts {
  required?: boolean;
  inputable?: boolean;
  updatable?: boolean;
  req?: boolean|0|1;
  inp?: boolean|0|1;
  upd?: boolean|0|1;
}

export interface DataFieldParams extends DataFieldOpts {
  validators: Validator[];
  isArray: boolean;
}

export class DataFieldMeta extends FieldMeta {
  constructor (
    target: TypeTarget,
    key: string,
    params: DataFieldParams
  ) {
    super(target, key, params, <typeof FieldRef>DataFieldRef);

    if (!Array.isArray(params.validators) || params.validators.filter(val => typeof val !== 'function').length)
      throw new TypeError('(validators) is not array of function');
    this.validators = params.validators;
    this.isArray = params.isArray;

    const _opts = ['required', 'inputable', 'updatable'];
    for (const opt of _opts)
      if (typeof params[opt] === 'boolean') this[opt] = params[opt];
      else if (
        typeof params[opt.slice(0, 3)] === 'boolean' ||
        [0, 1].indexOf(params[opt.slice(0, 3)]) > -1
      ) this[opt] = Boolean(params[opt.slice(0, 3)]);
      else this[opt] = true;
  }

  required: boolean;
  inputable: boolean;
  updatable: boolean;
  validators: Validator[]
  isArray: boolean;
}

export class DataFieldRef<R = any> extends FieldRef<DocTypeRef, DataFieldMeta, R> {
  constructor(typeRef: DocTypeRef, key: string, meta: DataFieldMeta) {
    super(typeRef, key, meta);
    if (!(this.typeRef instanceof DocTypeRef))
      throw new Error('typeRef must be instance DocTypeRef for RelationFieldRef');
  }

  defineValue = instance => () => this._fetchData(instance);

  private async _fetchData(instance: TypeInstance): Promise<R> {
    const typeData: { id: string, [key: string]: any } = instance[DOC_DATA];
    if (typeData[this.key]) return typeData[this.key];
    const data = await this.typeRef.grappRef.collection.findOne({id: typeData.id}, {fields: {[this.key]: true}});
    if (!data) throw new Error(`Can't fetch data for field [${this.key}] of type: ${this.typeRef.selector}`);
    instance[DOC_DATA] = {...typeData, ...data};
    return instance[DOC_DATA][this.key];
  }
}

function buildDataFieldDecorator(
  validators: Validator[],
  isArray = false
): { (opts: DataFieldOpts): PropertyDecorator } {
  return (opts: DataFieldOpts): PropertyDecorator => {
    return function fieldDecorator(target: any, key: string) {
      const meta = new DataFieldMeta(target, key, {...opts, validators, isArray});
      setFieldMeta(target, key, meta);
    }
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
