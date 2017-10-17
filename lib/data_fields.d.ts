import { DocRef } from './doc_ref';
import { FieldMeta, FieldRef } from './fields';
import { TypeInstance } from './type';
import { Validator } from './validators';
export declare type DataFieldShortOptions = '000' | '001' | '010' | '011' | '100' | '101' | '110' | '111';
export interface DataFieldOptions {
    required?: boolean;
    inputable?: boolean;
    updatable?: boolean;
    req?: boolean | 0 | 1;
    inp?: boolean | 0 | 1;
    upd?: boolean | 0 | 1;
}
export declare class DataFieldMeta implements FieldMeta, DataFieldOptions {
    validators: Validator[];
    isArray: boolean;
    constructor(validators: Validator[], opts?: DataFieldOptions | DataFieldShortOptions, isArray?: boolean);
    FieldRefClass: typeof DataFieldRef;
    required: boolean;
    inputable: boolean;
    updatable: boolean;
}
export declare class DataFieldRef implements FieldRef {
    typeRef: DocRef;
    key: string;
    meta: DataFieldMeta;
    constructor(typeRef: DocRef, key: string, meta: DataFieldMeta);
    defineProperty(instance: TypeInstance): void;
    resolve(instance: TypeInstance): Promise<any>;
}
export declare const Data: {
    boolean: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    color: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    date: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    email: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    float: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    shortid: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    int: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    string: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    custom(...validators: Validator[]): (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
};
export declare const DataArray: {
    boolean: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    color: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    date: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    email: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    float: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    shortid: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    int: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    string: (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
    custom(...validators: Validator[]): (opts: DataFieldOptions | "000" | "001" | "010" | "011" | "100" | "101" | "110" | "111") => PropertyDecorator;
};
