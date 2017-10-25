"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const di_1 = require("./di");
const grapp_1 = require("./grapp");
const operation_1 = require("./operation");
class Root {
    constructor(target, params) {
        this.grappRefs = new Map();
        this.db = params.db;
        this.pubsub = params.pubsub || new graphql_subscriptions_1.PubSub();
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
        const opNodes = {};
        for (const opKind of operation_1.OPERATION_KINDS)
            opNodes[opKind] = {
                kind: 'ObjectTypeDefinition',
                name: { kind: 'Name', value: opKind },
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
                    else if (operation_1.OPERATION_KINDS.indexOf(def.name.value) >= 0)
                        opNodes[def.name.value].fields.push(...def.fields);
                    else
                        rootDocNode.definitions.push(def);
                }
                for (const selector in parsed.resolverMap) {
                    if (operation_1.OPERATION_KINDS.indexOf(selector) >= 0)
                        rootResolverMap[selector] = Object.assign({}, rootResolverMap[selector], parsed.resolverMap[selector]);
                    else
                        rootResolverMap[selector] = parsed.resolverMap[selector];
                }
            }
        }
        rootDocNode.definitions.push(...operation_1.OPERATION_KINDS.map(kind => opNodes[kind]));
        console.log(`rootResolverMap`, rootResolverMap);
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