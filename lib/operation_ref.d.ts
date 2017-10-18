import { GrappRef } from './grapp_ref';
import { OperationMeta } from './operation';
import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
export declare class OperationRef<I = TypeInstance> extends TypeRef {
    grappRef: GrappRef;
    target: TypeTarget;
    meta: OperationMeta;
    constructor(grappRef: GrappRef, target: TypeTarget, meta: OperationMeta);
}
