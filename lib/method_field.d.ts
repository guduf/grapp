import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { FieldRef } from './fields';
export declare class MethodFieldRef<I extends TypeInstance = TypeInstance, R = any> implements FieldRef<R> {
    typeRef: TypeRef;
    key: string;
    private _method;
    constructor(typeRef: TypeRef, key: string, _method: {
        (this: I, args: {}, context: {}, info: {}): R | Promise<R>;
    });
    resolve(instance: I, args: any, context: any, infos: any): Promise<R>;
}
