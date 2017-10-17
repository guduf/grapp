import { Provider } from './di';
import { TypeRef } from './type_ref';
export declare type TypeTarget = any;
export interface TypeInstance {
    id?: Promise<string>;
    [key: string]: any;
}
export interface TypeParams {
    selector?: string;
    providers?: Provider[];
}
export declare class TypeMeta implements TypeParams {
    TypeRefClass: typeof TypeRef;
    providers: Provider[];
    selector: string;
    constructor(target: TypeTarget, params: TypeParams, TypeRefClass?: typeof TypeRef);
}
export declare function decorateType(params?: TypeParams): ClassDecorator;
export declare function setTypeMeta(target: TypeTarget, meta: TypeMeta): void;
export declare function getTypeMeta<M extends TypeMeta = TypeMeta>(target: TypeTarget): M;
