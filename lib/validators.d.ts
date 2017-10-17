export declare function validate<T = any>(val: T, ...validators: Validator[]): T;
export interface Validator {
    (value: any): void | Promise<void>;
}
export declare const Validators: {
    boolean(val: boolean): void;
    color(val: string): void;
    date(val: Date): void;
    email(val: string): void;
    float(val: number): void;
    int(val: number): void;
    number(val: number): void;
    shortid(val: string): void;
    string(val: string): void;
};
