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
    private create(candidate);
    private find(query);
    private findOne(query);
    private remove(id);
    private update(id, update);
    private validate(candidate);
    private _instanciate(id);
}
export declare class DocTypeRef<D = DocInstance> extends TypeRef<D, DocMeta> {
    constructor(grappRef: DocRef<D>, target: TypeTarget, meta: DocMeta);
    grappRef: DocRef<D>;
    instanciate(payload: {
        id: string;
    }): D;
}
