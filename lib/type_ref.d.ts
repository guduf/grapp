import { Injector } from './di';
import { FieldRef } from './fields';
import { GrappRef } from './grapp_ref';
import { TypeMeta, TypeTarget, TypeInstance } from './type';
export declare const DOC_DATA: symbol;
export declare class TypeRef<I extends TypeInstance = TypeInstance, M extends TypeMeta = TypeMeta> {
    grappRef: GrappRef;
    target: TypeTarget;
    meta: M;
    injector: Injector;
    fields: Map<string, FieldRef>;
    readonly selector: string;
    constructor(grappRef: GrappRef, target: TypeTarget, meta: M);
    instanciate(payload: {
        [key: string]: any;
    }): I;
}
