import { DocInstance } from './doc';
import { Collection as dbCollection } from './db';
export declare const COLLECTION: symbol;
export declare const Collection: ParameterDecorator;
export interface Collection<S = {
    id: string;
    [key: string]: any;
}> extends dbCollection<S> {
}
export declare abstract class DocMutation<D = DocInstance> {
    create: {
        (candidate: {
            [key: string]: any;
        }): Promise<D>;
    };
    update: {
        (id: string, update: {
            [key: string]: any;
        }): Promise<D>;
    };
    remove: {
        (id: string): Promise<boolean>;
    };
    validate: {
        (candidate: {
            [key: string]: any;
        }): {
            [key: string]: any;
        };
    };
}
export declare abstract class DocQuery<D = DocInstance> {
    find: {
        (query: {
            [key: string]: any;
        }): Promise<D[]>;
    };
    findOne: {
        (query: {
            [key: string]: any;
        }): Promise<D>;
    };
}
