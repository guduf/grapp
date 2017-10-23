import { DocTypeRef } from './doc_ref';
import { FieldMeta, FieldRef } from './fields';
import { TypeTarget } from './type';
import { Validator } from './validators';
export interface DataFieldOpts {
    required?: boolean;
    inputable?: boolean;
    updatable?: boolean;
    req?: boolean | 0 | 1;
    inp?: boolean | 0 | 1;
    upd?: boolean | 0 | 1;
}
export interface DataFieldParams extends DataFieldOpts {
    validators: Validator[];
    isArray: boolean;
}
export declare class DataFieldMeta extends FieldMeta {
    constructor(target: TypeTarget, key: string, params: DataFieldParams);
    required: boolean;
    inputable: boolean;
    updatable: boolean;
    validators: Validator[];
    isArray: boolean;
}
export declare class DataFieldRef<R = any> extends FieldRef<DocTypeRef, DataFieldMeta, R> {
    constructor(typeRef: DocTypeRef, key: string, meta: DataFieldMeta);
    defineValue: (instance: any) => () => Promise<R>;
    private _fetchData(instance);
}
export declare const Data: {
    boolean: (opts: DataFieldOpts) => PropertyDecorator;
    color: (opts: DataFieldOpts) => PropertyDecorator;
    date: (opts: DataFieldOpts) => PropertyDecorator;
    email: (opts: DataFieldOpts) => PropertyDecorator;
    float: (opts: DataFieldOpts) => PropertyDecorator;
    shortid: (opts: DataFieldOpts) => PropertyDecorator;
    int: (opts: DataFieldOpts) => PropertyDecorator;
    string: (opts: DataFieldOpts) => PropertyDecorator;
    custom(...validators: Validator[]): (opts: DataFieldOpts) => PropertyDecorator;
};
export declare const DataArray: {
    boolean: (opts: DataFieldOpts) => PropertyDecorator;
    color: (opts: DataFieldOpts) => PropertyDecorator;
    date: (opts: DataFieldOpts) => PropertyDecorator;
    email: (opts: DataFieldOpts) => PropertyDecorator;
    float: (opts: DataFieldOpts) => PropertyDecorator;
    shortid: (opts: DataFieldOpts) => PropertyDecorator;
    int: (opts: DataFieldOpts) => PropertyDecorator;
    string: (opts: DataFieldOpts) => PropertyDecorator;
    custom(...validators: Validator[]): (opts: DataFieldOpts) => PropertyDecorator;
};
