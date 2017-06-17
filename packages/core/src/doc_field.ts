import { DocTarget } from './doc';

export interface DocFieldOptions {
  required?: boolean;
  inputable?: boolean;
  updatable?: boolean;
  private?: boolean;
  req?: boolean;
  inp?: boolean;
  upd?: boolean;
  pri?: boolean;
}

export class DocFieldMeta implements DocFieldOptions {
  required: boolean;
  inputable: boolean;
  updatable: boolean;
  key: string;
  validators: Function[];
  constructor (opts: DocFieldOptions, validators: Validator[]) {

  }
}

export interface Validator {
  (value: any): void|Promise<void>
}

const validators: { [key: string]: Validator } = {
  float(val: number) {
    validators.number(val);
    if (val < Math.pow(-2, 63) || val > Math.pow(-2, 63) - 1)
      throw new Error('Exceed 64-bit range');
  },
  int(val: number) {
    validators.number(val);
    if (val !== Math.floor(val)) throw new Error('Not a integer');
    if (val < Math.pow(-2, 31) || val > Math.pow(-2, 31) - 1)
      throw new Error('Exceed 32-bit range');
  },
  boolean(val: boolean) {
    if (typeof val !== 'boolean') throw new Error('Not a boolean');
  },
  string(val: string) {
    if (typeof val !== 'string') throw new Error('Not a string');
  },
  number(val: number) {
    if (typeof val !== 'number') throw new Error('Not a number');
  },
  shortid(val: string) {
    validators.string(val);
    if (!/^[\w-]{7,14}$/.test(val)) throw new Error('Not a shortid');
  }
}

const DOC_FIELD_METADATA = Symbol('DOC_FIELD_METADATA');

function decorateField(docProto: any, key: string, docFieldMeta: DocFieldMeta) {
  const map = getFieldsMeta(docProto) || new Map<string, DocFieldMeta>();
  map.set(key, docFieldMeta);
  Reflect.defineMetadata(DOC_FIELD_METADATA, map, docProto);

}

export function getFieldsMeta(docProto: any): Map<string, DocFieldMeta> {
  return Reflect.getMetadata(DOC_FIELD_METADATA, docProto)
}

export function IntField(opts: DocFieldOptions): PropertyDecorator {
  return function decorateIntField(docProto: any, key: string) {
    const docField = new DocFieldMeta(opts, [validators.integer]);
    decorateField(docProto, key, docField);
  }
}

export function StringField(opts: DocFieldOptions): PropertyDecorator {
  return function decorateIntField(docProto: any, key: string) {
    const docField = new DocFieldMeta(opts, [validators.string]);
    decorateField(docProto, key, docField);
  }
}

export function BooleanField(opts: DocFieldOptions): PropertyDecorator {
  return function decorateIntField(docProto: any, key: string) {
    const docField = new DocFieldMeta(opts, [validators.boolean]);
    decorateField(docProto, key, docField);
  }
}

export function IdField(opts: DocFieldOptions): PropertyDecorator {
  return function decorateIntField(docProto: any, key: string) {
    const docFieldMeta = new DocFieldMeta(opts, [validators.shortid]);
    decorateField(docProto, key, docFieldMeta);
  }
}

export const Fields = {
  Id: IdField,
  String: StringField,
  Int: IntField,
  Boolean: BooleanField
};
