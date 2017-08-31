import { DocInstance } from './doc';
import { DocRef } from './doc_ref';
import { defineMetaKey, mapMeta, Meta } from './meta';

export const FIELDS_META = Symbol('FIELDS_META');

export interface FieldMeta extends Meta {
  buildResolver(docRef: DocRef, docInstance: DocInstance, key: string): { (): Promise<any> }
}

export function decorateField<M extends FieldMeta>(meta: M) {
  return function fieldDecorator(target: any, key: string) {
    defineMetaKey(meta, FIELDS_META, target, key);
  }
}

export function getFieldsMeta(target: any): Map<string, FieldMeta> {
  return mapMeta(FIELDS_META, target);
}
