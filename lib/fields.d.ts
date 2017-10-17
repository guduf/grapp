import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
export declare const FIELDS_META: symbol;
export interface FieldContext {
}
export interface FieldMeta {
    FieldRefClass: {
        new (typeRef: TypeRef, key: string, meta: FieldMeta);
    };
    [key: string]: any;
}
export interface FieldResolver<R = any> extends GraphQLFieldResolver<TypeInstance, FieldContext> {
    (source: TypeInstance, args: {
        [key: string]: any;
    }, context: any, info: GraphQLResolveInfo): R | Promise<R>;
}
export interface FieldRef<R = any> {
    typeRef: TypeRef;
    key: string;
    meta?: FieldMeta;
    resolve: FieldResolver<R>;
    defineProperty?: {
        (instance: TypeInstance): void;
    };
}
export declare function decorateField(meta: {
    [key: string]: any;
}): (target: any, key: string) => void;
export declare function mapFieldMeta(target: any): Map<string, FieldMeta>;
