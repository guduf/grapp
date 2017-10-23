"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const type_1 = require("./type");
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
                if (['Mutation', 'Query'].indexOf(def.name.value) >= 0) {
                    resolverMap[def.name.value] = {};
                    for (const fieldDef of def.fields) {
                        let operationInstance;
                        let fieldRef;
                        for (const operationRef of this.operationRefs)
                            if (operationRef.fields.has(fieldDef.name.value)) {
                                operationInstance = operationRef.instanciate({});
                                fieldRef = operationRef.fields.get(fieldDef.name.value);
                                break;
                            }
                        if (fieldRef) {
                            resolverMap[def.name.value][fieldDef.name.value] = ((instance, args, context, info) => {
                                return fieldRef.resolve(operationInstance, args, context, info);
                            });
                        }
                        else {
                            if (fieldDef.type.kind !== 'NonNullType')
                                throw new TypeError(def.name.value + ' fields must be NonNullType');
                            const selector = fieldDef.type.type.name.value;
                            const typeRef = this.typeRefs.get(selector);
                            if (!typeRef)
                                throw new ReferenceError('Cannot find type with selector ' + selector);
                            resolverMap[def.name.value][fieldDef.name.value] = () => typeRef.instanciate({});
                        }
                    }
                }
                else {
                    const typeRef = this.typeRefs.get(def.name.value);
                    if (!typeRef)
                        throw new ReferenceError('Cannot find type with selector ' + def.name.value);
                    resolverMap[def.name.value] = {};
                    for (const fieldDef of def.fields) {
                        const fieldRef = typeRef.fields.get(fieldDef.name.value);
                        if (!fieldRef)
                            throw new Error('Cannot find field with this name: ' + fieldDef.name.value + ' for ' + typeRef.selector);
                        resolverMap[def.name.value][fieldDef.name.value] = fieldRef.resolve.bind(fieldRef);
                    }
                }
            }
        return { docNode, resolverMap };
    }
}
exports.GrappRef = GrappRef;
//# sourceMappingURL=grapp_ref.js.map