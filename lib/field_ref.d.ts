import 'zone.js';
import 'rxjs/add/operator/map';
import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';
import { Observable } from 'rxjs/Observable';
import { FieldMeta } from './field';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
export interface FieldResolver<R = any, C = {
    [key: string]: any;
}> extends GraphQLFieldResolver<TypeInstance, C> {
    (source: TypeInstance, args: {
        [key: string]: any;
    }, context: any, info: GraphQLResolveInfo): R | Promise<R>;
}
export interface FieldSubscriptionResolver<R = any, C = {
    [key: string]: any;
}> extends GraphQLFieldResolver<TypeInstance, C> {
    (source: {}, args: {
        [key: string]: any;
    }, context: any, info: GraphQLResolveInfo): AsyncIterator<R>;
}
export declare class FieldRef<T extends TypeRef = TypeRef, M extends FieldMeta = FieldMeta, R = any> {
    typeRef: T;
    key: string;
    meta: M;
    constructor(typeRef: T, key: string, meta?: M);
    defineValue?: {
        (instance: TypeInstance): {
            (): R | Promise<R> | FieldResolver<R>;
        };
    };
    resolve(instance: TypeInstance, args: {
        [key: string]: any;
    }, context: {
        [key: string]: any;
    }, info: GraphQLResolveInfo): R | Promise<R> | Observable<R>;
    resolveSubscription(instance: TypeInstance, args: {
        [key: string]: any;
    }, context: {
        [key: string]: any;
    }, info: GraphQLResolveInfo): AsyncIterator<{
        [key: string]: R;
    }>;
}
