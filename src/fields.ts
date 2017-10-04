import { GraphQLResolveInfo } from 'graphql';
import { DocInstance, DocContext } from './doc';
import { DocRef } from './doc_ref';
import { defineMetaKey, mapMeta, Meta } from './meta';

export const FIELDS_META = Symbol('FIELDS_META');

export interface FieldContext<D = DocInstance> extends DocContext<D> {
  doc: D
  key: string
}

export interface FieldMeta {
  RefClass: { new (docRef: DocRef, key: string, meta: FieldMeta) }
  [key: string]: any
}

export interface FieldResolver<T = any> {
  (
    args: { [key: string]: any },
    context: FieldContext,
    info: GraphQLResolveInfo
  ): T|Promise<T>
}

export interface FieldRef<T = any> {
  docRef: DocRef
  key: string
  meta: FieldMeta
  resolve: FieldResolver<T>
}

export function decorateField(meta: { [key: string]: any }) {
  return function fieldDecorator(target: any, key: string) {
    defineMetaKey(meta, FIELDS_META, target, key);
  }
}

export function mapFieldMeta(target: any): Map<string, FieldMeta> {
  return mapMeta(FIELDS_META, target);
}
