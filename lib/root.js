"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const di_1 = require("./di");
const grapp_ref_1 = require("./grapp_ref");
class GrappRoot {
    constructor(_target, _params) {
        this._target = _target;
        this._params = _params;
        this.grappRefs = new Map();
        this.injector = di_1.Injector.resolveAndCreate([
            ...(_params.providers || []),
            { provide: di_1.TYPER, useValue: this.typer.bind(this) }
        ]);
        this.registerGrappRef(_target);
    }
    get db() { return this._params.db; }
    registerGrappRef(target) {
        if (this.grappRefs.has(target))
            return this.grappRefs.get(target);
        const grappRef = new grapp_ref_1.GrappRef(target, this);
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
exports.GrappRoot = GrappRoot;
function bootstrapGrapp(target, params) {
    return __awaiter(this, void 0, void 0, function* () {
        let grappRef;
        const root = new GrappRoot(target, params);
        return root.build();
    });
}
exports.bootstrapGrapp = bootstrapGrapp;
//# sourceMappingURL=root.js.map