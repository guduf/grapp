import { FieldRef } from './field_ref';
import { TypeTarget } from './type';
export declare const FIELD_META: unique symbol;
export declare class FieldMeta {
    readonly key: string;
    FieldRefClass: typeof FieldRef;
    constructor(target: TypeTarget, key: string, params: {
        [key: string]: any;
    }, FieldRefClass?: typeof FieldRef);
}
export declare function decorateField(meta: {
    [key: string]: any;
}): (target: any, key: string) => void;
export declare function setFieldMeta(target: TypeTarget, key: string, meta: FieldMeta): void;
export declare function mapFieldMeta(target: any): Map<string, FieldMeta>;
