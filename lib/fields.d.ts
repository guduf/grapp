import { GraphQLResolveInfo, GraphQLFieldResolver } from 'graphql';
import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
export declare const FIELDS_META: symbol;
export interface FieldResolver<R = any, C = {
    [key: string]: any;
}> extends GraphQLFieldResolver<TypeInstance, C> {
    (source: TypeInstance, args: {
        [key: string]: any;
    }, context: any, info: GraphQLResolveInfo): R | Promise<R>;
}
export declare class FieldMeta {
    FieldRefClass: typeof FieldRef;
    constructor(target: TypeTarget, key: string, params: {
        [key: string]: any;
    }, FieldRefClass?: typeof FieldRef);
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
    }, info: GraphQLResolveInfo): R;
}
export declare function decorateField(meta: {
    [key: string]: any;
}): (target: any, key: string) => void;
export declare function setFieldMeta(target: TypeTarget, key: string, meta: FieldMeta): void;
export declare function mapFieldMeta(target: any): Map<string, FieldMeta>;
