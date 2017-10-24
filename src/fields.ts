import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';
import { Observable } from 'rxjs/Observable';
import * as WebSocket from 'ws';

import { OperationRef } from './operation_ref';
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

export interface FieldSubscriptionResolver<R = any, C = { [key: string]: any }> extends GraphQLFieldResolver<TypeInstance, C> {
  (
    source: {},
    args: { [key: string]: any },
    context: any,
    info: GraphQLResolveInfo
  ): AsyncIterator<R>
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
  ): R|Promise<R> {
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

  resolveSubscription(
    instance: TypeInstance,
    args: { [key: string]: any },
    context: { onSubscriptionComplete: Promise<void> },
    info: GraphQLResolveInfo
  ): AsyncIterator<R> {
    if (!(context.onSubscriptionComplete instanceof Promise))
    throw new Error('resolveSubscription needs a context with onSubscriptionComplete');
    const {pubsub} = this.typeRef.grappRef.root;
    let fieldValue = this.resolve(instance, args, context, info);
    if (!(fieldValue instanceof Observable)) throw new Error('fieldValue is not a observable');
    const sub = fieldValue.subscribe(value => pubsub.publish(`Subscription:${this.key}`, {[this.key]: value}));
    context.onSubscriptionComplete.then(() => {
      sub.unsubscribe();
    })
    return this.typeRef.grappRef.root.pubsub.asyncIterator<R>(`Subscription:${this.key}`);
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
