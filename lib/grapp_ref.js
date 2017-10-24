"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const type_1 = require("./type");
const operation_1 = require("./operation");
class GrappRef {
    constructor(root, target, meta) {
        this.root = root;
        this.target = target;
        this.meta = meta;
        this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
        const providers = [...this.meta.providers];
        this.injector = this.root.injector.resolveAndCreateChild(providers);
        const typeRefs = new Map();
        for (const grappRef of this.imports)
            for (const [key, typeRef] of grappRef.typeRefs)
                typeRefs.set(key, typeRef);
        for (const target of this.meta.types) {
            const typeRef = this.referenceType(target);
            typeRefs.set(typeRef.selector, typeRef);
        }
        this.typeRefs = typeRefs;
        const operationRefs = new Set();
        for (const target of this.meta.operations) {
            const operationRef = this.referenceType(target);
            operationRefs.add(operationRef);
        }
        this.operationRefs = operationRefs;
    }
    referenceType(target) {
        const meta = type_1.getTypeMeta(target);
        if (!meta)
            throw new Error('Failed to find meta for Type: ' + (target.name ? target.name : typeof target));
        let typeRef;
        try {
            typeRef = new meta.TypeRefClass(this, target, meta);
        }
        catch (err) {
            console.error(err);
            throw new Error('Failed to reference Type: ' + (target.name ? target.name : typeof target));
        }
        return typeRef;
    }
    parse() {
        if (!this.meta.schema)
            return null;
        const docNode = graphql_1.parse(this.meta.schema, { noLocation: true });
        const resolverMap = Object.assign({}, this.meta.resolvers);
        for (const def of docNode.definitions)
            if (def.kind === 'ObjectTypeDefinition') {
                const selector = def.name.value;
                if (operation_1.OPERATION_KINDS.indexOf(selector) >= 0) {
                    resolverMap[selector] = {};
                    for (const fieldDef of def.fields) {
                        let operationInstance;
                        let fieldRef;
                        let resolver;
                        for (const operationRef of this.operationRefs)
                            if (operationRef.fields.has(fieldDef.name.value)) {
                                operationInstance = operationRef.instance;
                                fieldRef = operationRef.fields.get(fieldDef.name.value);
                                break;
                            }
                        if (!fieldRef)
                            throw new Error('Missing fieldRef');
                        if (selector === 'Subscription')
                            resolverMap[selector][fieldDef.name.value] = {
                                subscribe: (source, args, context, info) => {
                                    return fieldRef.resolveSubscription(operationInstance, args, context, info);
                                },
                                unsubscribe: (e) => { console.log('unsubscribe', e); }
                            };
                        else
                            resolverMap[selector][fieldDef.name.value] = ((source, args, context, info) => {
                                return fieldRef.resolve(operationInstance, args, context, info);
                            });
                    }
                }
                else {
                    const typeRef = this.typeRefs.get(selector);
                    if (!typeRef)
                        throw new ReferenceError('Cannot find type with selector ' + selector);
                    resolverMap[selector] = {};
                    for (const fieldDef of def.fields) {
                        const fieldRef = typeRef.fields.get(fieldDef.name.value);
                        if (!fieldRef)
                            throw new Error('Cannot find field with this name: ' + fieldDef.name.value + ' for ' + typeRef.selector);
                        resolverMap[selector][fieldDef.name.value] = fieldRef.resolve.bind(fieldRef);
                    }
                }
            }
        return { docNode, resolverMap };
    }
}
exports.GrappRef = GrappRef;
//# sourceMappingURL=grapp_ref.js.map