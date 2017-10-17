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
  constructor(
    target: TypeTarget,
    params: TypeParams,
    public TypeRefClass?: typeof TypeRef
  ) {
    if (typeof params !== 'object') throw new TypeError('Params is not a object');
    this.providers  = params.providers || [];
    if (params.selector) this.selector = params.selector;
    else if (target.name) this.selector = target.name;
    else throw new Error('Selector is not defined');
  }
}

const TYPE_META = Symbol('TYPE_META');

export function decorateType(params: TypeParams = {}): ClassDecorator {
  return function docDecorator(target: TypeTarget) {
    setTypeMeta(target, new TypeMeta(target, params));
  }
}

export function setTypeMeta(target: TypeTarget, meta: TypeMeta) {
  if (!(meta instanceof TypeMeta)) throw new TypeError('meta is not a instance of TypeMeta');
  Injectable()(target);
  defineMeta(meta, TYPE_META, target);
}

export function getTypeMeta<M extends TypeMeta = TypeMeta>(target: TypeTarget): M {
  return getMeta<M>(TYPE_META, target);
}
