import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';

import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { defineMetaKey, mapMeta, Meta } from './meta';

export const FIELDS_META = Symbol('FIELDS_META');

export interface FieldResolver<R = any, C = { [key: string]: any }> extends GraphQLFieldResolver<TypeInstance, C> {
  (
    source: TypeInstance,
    args: { [key: string]: any },
    context: any,
    info: GraphQLResolveInfo
  ): R|Promise<R>
}

export class FieldMeta {
  constructor(
    target: TypeTarget,
    key: string,
    params: { [key: string]: any },
    public FieldRefClass: typeof FieldRef = FieldRef
  ) { }
}

export class FieldRef<
  T extends TypeRef = TypeRef,
  M extends FieldMeta = FieldMeta,
  R = any
> {
  constructor(
    public typeRef: T,
    public key: string,
    public meta?: M
  ) { }

  defineValue?: { (instance: TypeInstance): { (): R|Promise<R>|FieldResolver<R> } }

  resolve(
    instance: TypeInstance,
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ): R {
    let fieldValue = instance[this.key];
    if (typeof fieldValue === 'undefined') {
      const proto = Object.getPrototypeOf(instance);
      if (Object.getOwnPropertyNames(proto).indexOf(this.key) >= 0) {
        fieldValue = proto[this.key];
      }
    }
    if (typeof fieldValue === 'function')
      return fieldValue.call(instance, args, context, info);
    else if (typeof fieldValue !== 'undefined') return fieldValue;
    else throw new Error('fieldValue is undefined');
  }
}

export function decorateField(meta: { [key: string]: any }) {
  return function fieldDecorator(target: any, key: string) {
    const meta = new FieldMeta(target, key, {});
    setFieldMeta(target, key, meta);
  }
}

export function setFieldMeta(target: TypeTarget, key: string, meta: FieldMeta) {
  if (!(meta instanceof FieldMeta)) throw new TypeError(`meta is not a instance of FieldMeta: ${target.name || typeof target}[${key}]`);
  defineMetaKey(meta, FIELDS_META, target, key);
}

export function mapFieldMeta(target: any): Map<string, FieldMeta> {
  return mapMeta(FIELDS_META, target);
}
