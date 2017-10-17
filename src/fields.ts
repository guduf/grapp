import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';

import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { defineMetaKey, mapMeta, Meta } from './meta';

export const FIELDS_META = Symbol('FIELDS_META');

export interface FieldContext {

}

export interface FieldMeta {
  FieldRefClass: { new (typeRef: TypeRef, key: string, meta: FieldMeta) }
  [key: string]: any
}

export interface FieldResolver<R = any> extends GraphQLFieldResolver<TypeInstance, FieldContext> {
  (
    source: TypeInstance,
    args: { [key: string]: any },
    context: any,
    info: GraphQLResolveInfo
  ): R|Promise<R>
}

export interface FieldRef<R = any> {
  typeRef: TypeRef
  key: string
  meta?: FieldMeta
  resolve: FieldResolver<R>
  defineProperty?: { (instance: TypeInstance): void }
}

export function decorateField(meta: { [key: string]: any }) {
  return function fieldDecorator(target: any, key: string) {
    defineMetaKey(meta, FIELDS_META, target, key);
  }
}

export function mapFieldMeta(target: any): Map<string, FieldMeta> {
  return mapMeta(FIELDS_META, target);
}
