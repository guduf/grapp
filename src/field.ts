import { FieldRef } from './field_ref';
import { defineMetaKey, mapMeta, Meta } from './meta';
import { TypeTarget } from './type';

export const FIELD_META = Symbol('FIELD_META');

export class FieldMeta {
  constructor(
    target: TypeTarget,
    readonly key: string,
    params: { [key: string]: any },
    public FieldRefClass: typeof FieldRef = FieldRef
  ) { }
}

export function decorateField(meta: { [key: string]: any }) {
  return function fieldDecorator(target: any, key: string) {
    const meta = new FieldMeta(target, key, {});
    setFieldMeta(target, key, meta);
  }
}

export function setFieldMeta(target: TypeTarget, key: string, meta: FieldMeta) {
  if (!(meta instanceof FieldMeta)) throw new TypeError(`meta is not a instance of FieldMeta: ${target.name || typeof target}[${key}]`);
  defineMetaKey(meta, FIELD_META, target, key);
}

export function mapFieldMeta(target: any): Map<string, FieldMeta> {
  return mapMeta(FIELD_META, target);
}
