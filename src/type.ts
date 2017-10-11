import { Injectable, Provider } from './di';
import { TypeRef } from './type_ref';
import { GrappContext } from './grapp';
import { defineMeta, getMeta } from './meta';

export type TypeTarget = any;

export interface TypeInstance {
  id?: Promise<string>
  [key: string]: any
}

export interface TypeParams {
  selector?: string
  providers?: Provider[]
}

export class TypeMeta implements TypeParams {
  providers: Provider[];
  selector: string;

  constructor(target: TypeTarget, params: TypeParams) {
    this.providers  = params.providers || [];
    this.selector = params.selector;
  }
}

const TYPE_META = Symbol('TYPE_META');

export function decorateType(params: TypeParams = {}): ClassDecorator {
  if (typeof params !== 'object') throw new TypeError();
  return function docDecorator(target: TypeTarget) {
    if (!params.selector) params.selector = target.name;

    Injectable()(target);
    defineMeta(new TypeMeta(target, params), TYPE_META, target);
  }
}

export function getTypeMeta(target: TypeTarget): TypeMeta {
  return getMeta<TypeMeta>(TYPE_META, target);
}
