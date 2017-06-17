import { Injector } from './di';
import { DocRef, getDocTypeMeta, DocTypePayload } from './doc';
import { GrappRef, SchemaDef } from './grapp_ref';
import { getTypeMeta, TypeMeta, TYPE_PAYLOAD_TOKEN } from './type';
import { Resolver } from './core';
import { GenericDocType } from './doc_type';

export class TypeRef {
  constructor(private _grappRef: GrappRef, private _target: any) {
    if (!(this._meta = getTypeMeta(_target)))
      throw new TypeError(`typeTarget(${_target.name}) has no meta.`);
    const typeProto: { [key: string]: Resolver<any, any> } = _target.prototype;
    for (const field of Object.getOwnPropertyNames(typeProto)) if (field !== 'constructor') {
      const resolver: Resolver<any, any> =
          function resolveField(this: GenericDocType, args, context, info): Promise<any> {
            return typeProto[field].call(this, args, context, info);
          };
      this._resolvers.set(field, resolver);
    }
    const docTarget = getDocTypeMeta(_target);
    if (docTarget) {
      if (!(this._docRef = this._grappRef.getDoc(docTarget)))
        throw new Error(`docTarget(${docTarget.name}) is not referenced`);
      for (const [field] of this._docRef.meta.fields) {
        const resolver: Resolver<any, any> =
          function resolveDocField(this: GenericDocType): Promise<any> { return this.doc[field]; };
        this._resolvers.set(field, resolver);
      }
    }
    const providers = [
      ...this._meta.providers
    ];
    this._injector = Injector.resolveAndCreate(providers, this._grappRef.injector);
    this._schemaDef = this._grappRef.parseSchema(this.meta);
  }
  get meta() { return this._meta; }
  get schemaDef() { return this._schemaDef; }
  instanciate(payload: any): any {
    const providers = [];
    if (this._docRef) {
      const typeBuiler = (target, payload) => this._grappRef.buildType(target, payload);
      const docTypePayload: DocTypePayload = {
        db: undefined,
        typeBuilder: {build: typeBuiler},
        meta: this._docRef.meta,
        docState: {id: 'foo'}
      }
      providers.push({provide: DocTypePayload, useValue: docTypePayload});
    }
    else providers.push({provide: TYPE_PAYLOAD_TOKEN, useValue: payload});
    const injector = Injector.resolveAndCreate(providers, this._injector);
    let instance: GenericDocType;
    try { instance = injector.resolveAndInstantiate(<any>this._target); }
    catch (err) {
      console.error(err.message);
      throw new Error(`Failed to instanciate Type(${this._target.name})`);
    }
    const resolvedInstance: { [key: string]: Resolver<any, any> } = {
      id: () => instance.id
    };
    for (const [key, resolver] of this._resolvers) {
      resolvedInstance[key] = (args, context, info) => {
        const result = resolver.call(instance, args, context, info);
        return result;
      }
    }
    return resolvedInstance;
  }
  private _docRef: DocRef;
  private _injector: Injector;
  private _schemaDef: SchemaDef;
  private _meta: TypeMeta;
  private _resolvers: Map<string, Resolver<any, any>> = new Map();
}
