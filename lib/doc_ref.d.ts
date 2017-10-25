import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import { DataFieldMeta } from './data_fields';
import { Collection } from './db';
import { DocMeta, DocInstance } from './doc';
import { GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { OperationKind } from './operation';
import { OperationRef } from './operation_ref';
import { Root } from './root';
import { TypeTarget } from './type';
import { TypeRef } from './type_ref';
export declare class DocRef<D = DocInstance> extends GrappRef<DocMeta> {
    constructor(root: Root, target: GrappTarget, meta: DocMeta);
    collection: Collection;
    dataFields: Map<string, DataFieldMeta>;
    docOperationRefs: Map<OperationKind, OperationRef>;
    docTypeRef: DocTypeRef<D>;
    readonly selector: string;
    private _create(candidate);
    private _find(query);
    private _findOne(query);
    private _remove(id);
    private _update(id, update);
    private _validate(candidate);
    private _watch(query, filter?);
    private _watchOne(query, filter?);
    private _instanciate(id);
}
export declare class DocTypeRef<D = DocInstance> extends TypeRef<D, DocMeta> {
    constructor(grappRef: DocRef<D>, target: TypeTarget, meta: DocMeta);
    grappRef: DocRef<D>;
    instanciate(payload: {
        id: string;
    }): D;
}
