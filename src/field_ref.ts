import 'zone.js';
import 'rxjs/add/operator/map';

import { Subscription } from 'rxjs/Subscription';
import { GraphQLResolveInfo, GraphQLFieldResolver, FieldDefinitionNode } from 'graphql';
import { Observable } from 'rxjs/Observable';
import { generate as shortid } from 'shortid';
import * as WebSocket from 'ws';

import { FieldMeta } from './field';
import { obsToAsyncIterator } from './obs-to-async-iterable';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';


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

export class FieldRef<
  T extends TypeRef = TypeRef,
  M extends FieldMeta = FieldMeta,
  R = any
> {
  constructor(
    readonly typeRef: T,
    readonly key: string,
    meta: M,
    readonly definition: FieldDefinitionNode
  ) { }

  defineValue?: { (instance: TypeInstance): { (): R|Promise<R>|FieldResolver<R> } }

  resolve(
    instance: TypeInstance,
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ): R|Promise<R>|Observable<R> {
    const fieldResolverZone = Zone.current.fork({
      name: `${this.typeRef.selector}:${this.key}:${shortid()}`,
      properties: {context, info}
    });
    const {key} = this;
    function fieldResolverWrapper(): R|Promise<R>|Observable<R> {
      let fieldValue = instance[key];
      if (typeof fieldValue === 'undefined') {
        const proto = Object.getPrototypeOf(instance);
        if (Object.getOwnPropertyNames(proto).indexOf(key) >= 0) {
          fieldValue = proto[key];
        }
      }
      if (typeof fieldValue === 'function')
        return fieldValue.call(instance, args, context, info);
      else if (typeof fieldValue !== 'undefined') return fieldValue;
      else throw new Error('fieldValue is undefined');
    }
    return fieldResolverZone.run<R|Promise<R>|Observable<R>>(fieldResolverWrapper);
  }

  resolveSubscription(
    instance: TypeInstance,
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ): AsyncIterator<{ [key: string]: R }> {
    let fieldValue = <Observable<R>>this.resolve(instance, args, context, info)
    if (!(fieldValue instanceof Observable)) throw new Error('fieldValue is not a observable');
    return obsToAsyncIterator(fieldValue.map(value => ({[this.key]: value})));
  }
}
