import 'reflect-metadata';
export declare type Meta = {
    [key: string]: any;
};
export declare function defineMeta<M extends Meta = Meta>(meta: M, symbol: Symbol, target: any): void;
export declare function defineMetaKey<M extends Meta = Meta>(meta: M, symbol: Symbol, target: any, key: string): void;
export declare function mapMeta<M extends Meta = Meta>(symbol: Symbol, target: any): Map<string, M>;
export declare function getMeta<M extends Meta = Meta>(symbol: Symbol, target: any): M;
