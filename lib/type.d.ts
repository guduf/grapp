import { Provider } from './di';
import { TypeRef } from './type_ref';
import { Source } from 'graphql';
import { FieldMeta } from './field';
export declare type TypeTarget = any;
export interface TypeInstance {
    id?: Promise<string>;
    [key: string]: any;
}
export interface TypeParams {
    selector?: string;
    providers?: Provider[];
    schema?: string;
}
export declare class TypeMeta implements TypeParams {
    target: TypeTarget;
    readonly TypeRefClass: typeof TypeRef;
    constructor(target: TypeTarget, {selector, providers, schema}?: TypeParams, TypeRefClass?: typeof TypeRef);
    readonly fields: Map<string, FieldMeta>;
    readonly providers: Provider[];
    readonly selector: string;
    readonly source?: Source;
}
export declare function decorateType(params?: TypeParams): ClassDecorator;
export declare function setTypeMeta(target: TypeTarget, meta: TypeMeta): void;
export declare function getTypeMeta<M extends TypeMeta = TypeMeta>(target: TypeTarget): M;
