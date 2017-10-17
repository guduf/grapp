"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const type_1 = require("./type");
const type_ref_1 = require("./type_ref");
const grapp_1 = require("./grapp");
class GrappRef {
    constructor(target, root) {
        this.target = target;
        this.root = root;
        this.meta = grapp_1.getGrappMeta(target);
        if (typeof this.meta !== 'object')
            throw new ReferenceError('The target has not been decorated as Grapp: ' + (target.name || typeof target));
        this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
        const providers = [...this.meta.providers];
        this.injector = this.root.injector.resolveAndCreateChild(providers);
        const typeRefs = new Map();
        for (const grappRef of this.imports)
            for (const [key, typeRef] of grappRef.typeRefs)
                typeRefs.set(key, typeRef);
        for (const typeTarget of this.meta.types) {
            const meta = type_1.getTypeMeta(typeTarget);
            let typeRef;
            try {
                if (meta.TypeRefClass)
                    typeRef = new meta.TypeRefClass(this, typeTarget, meta);
                else
                    typeRef = new type_ref_1.TypeRef(this, typeTarget, meta);
            }
            catch (err) {
                console.error(err);
                throw new Error('Failed to reference Type: ' + (typeTarget.name ? typeTarget.name : typeof typeTarget));
            }
            typeRefs.set(typeRef.selector, typeRef);
        }
        this.typeRefs = typeRefs;
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
                        if (fieldDef.type.kind !== 'NonNullType')
                            throw new TypeError(def.name.value + ' fields must be NonNullType');
                        const selector = fieldDef.type.type.name.value;
                        const typeRef = this.typeRefs.get(selector);
                        if (!typeRef)
                            throw new ReferenceError('Cannot find type with selector ' + selector);
                        resolverMap[def.name.value][fieldDef.name.value] = () => typeRef.instanciate({});
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