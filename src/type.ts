import { Injectable, Provider } from './di';
import { TypeRef } from './type_ref';
import { defineMeta, getMeta } from './meta';
import { Source } from 'graphql';

import { FieldMeta, mapFieldMeta } from './field';

export type TypeTarget = any;

export interface TypeInstance {
  id?: Promise<string>
  [key: string]: any
}

export interface TypeParams {
  selector?: string
  providers?: Provider[]
  schema?: string
}

export class TypeMeta implements TypeParams {
  constructor(
    public target: TypeTarget,
    {selector, providers, schema}: TypeParams = {},
    readonly TypeRefClass: typeof TypeRef = TypeRef
  ) {
    this.providers  = providers || [];
    if (selector) this.selector = selector;
    else if (target.name) this.selector = target.name;
    else throw new Error('Selector is not defined');
    if (schema) this.source = new Source(schema, `@${this.selector}`);
    const fields = mapFieldMeta(target) || new Map<string, FieldMeta>();
    for (const key of Object.getOwnPropertyNames(target.prototype))
      if (
        !fields.has(key) &&
        ['constructor'].indexOf(key) < 0 &&
        key[0] !== '_'
      ) fields.set(key, new FieldMeta(target, key, {}));
    this.fields = fields;
  }

  readonly fields: Map<string, FieldMeta>
  readonly providers: Provider[];
  readonly selector: string;
  readonly source?: Source;
}

const TYPE_META = Symbol('TYPE_META');

export function decorateType(params: TypeParams = {}): ClassDecorator {
  return function docDecorator(target: TypeTarget) {
    setTypeMeta(target, new TypeMeta(target, params));
  }
}

export function setTypeMeta(target: TypeTarget, meta: TypeMeta) {
  if (!(meta instanceof TypeMeta)) throw new TypeError(`meta is not a instance of TypeMeta: ${target.name || typeof target}`);
  Injectable()(target);
  defineMeta(meta, TYPE_META, target);
}

export function getTypeMeta<M extends TypeMeta = TypeMeta>(target: TypeTarget): M {
  return getMeta<M>(TYPE_META, target);
}
