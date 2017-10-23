"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const di_1 = require("./di");
const grapp_1 = require("./grapp");
class Root {
    constructor(target, params) {
        this.grappRefs = new Map();
        this.db = params.db;
        this.pubsub = params.pubsub;
        this.injector = di_1.Injector.resolveAndCreate([
            ...(params.providers || []),
            { provide: di_1.TYPER, useValue: this.typer.bind(this) }
        ]);
        this.registerGrappRef(target);
    }
    registerGrappRef(target) {
        if (this.grappRefs.has(target))
            return this.grappRefs.get(target);
        const grappMeta = grapp_1.getGrappMeta(target);
        const grappRef = new grappMeta.ctor(this, target, grappMeta);
        this.grappRefs.set(target, grappRef);
        return grappRef;
    }
    getTypeRef(selector) {
        for (const [, grappRef] of this.grappRefs)
            if (grappRef.typeRefs.has(selector))
                return grappRef.typeRefs.get(selector);
    }
    typer(selector, payload) {
        const typeRef = this.getTypeRef(selector);
        if (!typeRef)
            throw new Error('Cant find type with selector: ' + selector);
        return typeRef.instanciate(payload);
    }
    build() {
        const rootResolverMap = {
            Mutation: {},
            Query: {}
        };
        const rootDocNode = { kind: 'Document', definitions: [] };
        const rootQueryNode = {
            kind: 'ObjectTypeDefinition',
            name: { kind: 'Name', value: 'Query' },
            fields: []
        };
        const rootMutationNode = {
            kind: 'ObjectTypeDefinition',
            name: { kind: 'Name', value: 'Mutation' },
            fields: []
        };
        for (const [, grappRef] of this.grappRefs) {
            let parsed;
            try {
                parsed = grappRef.parse();
            }
            catch (err) {
                console.error(err);
                throw new Error('Failed to parse grappRef: ' + grappRef.target.name);
            }
            if (parsed) {
                for (const def of parsed.docNode.definitions) {
                    if (def.kind !== 'ObjectTypeDefinition')
                        rootDocNode.definitions.push(def);
                    else if (['Mutation', 'Query'].indexOf(def.name.value) < 0) {
                        rootDocNode.definitions.push(def);
                    }
                    else if (def.name.value === 'Mutation')
                        rootMutationNode.fields.push(...def.fields);
                    else if (def.name.value === 'Query')
                        rootQueryNode.fields.push(...def.fields);
                }
                for (const selector in parsed.resolverMap) {
                    if (['Mutation', 'Query'].indexOf(selector) >= 0)
                        rootResolverMap[selector] = Object.assign({}, rootResolverMap[selector], parsed.resolverMap[selector]);
                    else
                        rootResolverMap[selector] = parsed.resolverMap[selector];
                }
            }
        }
        rootDocNode.definitions.push(rootMutationNode, rootQueryNode);
        const schema = graphql_1.buildASTSchema(rootDocNode);
        graphql_tools_1.addResolveFunctionsToSchema(schema, rootResolverMap);
        return schema;
    }
}
exports.Root = Root;
function bootstrapGrapp(target, params) {
    const root = new Root(target, params);
    return root.build();
}
exports.bootstrapGrapp = bootstrapGrapp;
//# sourceMappingURL=root.js.map