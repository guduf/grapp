"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GrappRoot
 */
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const di_1 = require("./di");
const grapp_1 = require("./grapp");
/**
 * Represents a unique instance created during bootstrap to initialize the grapps.
 */
class GrappRoot {
    /**
     * Initializes a Grapp root.
     * @param target The grapp target.
     * @param params The Grapp root parameters.
     */
    constructor(target, params = {}) {
        /** The store of registred grapps. */
        this.grappRefs = new Map();
        if (!target)
            throw new TypeError('(target) is not a valid object');
        this.injector = di_1.Injector.resolveAndCreate([
            ...(params.providers || []),
            { provide: di_1.TYPER, useValue: this.typer.bind(this) }
        ]);
        this.registerGrappRef(target);
    }
    /**
     * Creates a grapp and registers it in the root store.
     * If the target has already been registred, it is directly returned.
     * @param target The grapp that will be initialize.
     * @returns The registred grapp reference.
     */
    registerGrappRef(target) {
        if (this.grappRefs.has(target))
            return this.grappRefs.get(target);
        const grappMeta = grapp_1.getGrappMeta(target);
        const grappRef = new grappMeta.ctor(this, grappMeta);
        this.grappRefs.set(target, grappRef);
        return grappRef;
    }
    /**
     * Retrieves a type reference by browsing the registred grapp references.
     * @param selector The selector of the expected type reference.
     * @returns The expected type reference.
     */
    getTypeRef(selector) {
        for (const [, grappRef] of this.grappRefs)
            if (grappRef.typeRefs.type.has(selector))
                return grappRef.typeRefs.type.get(selector);
    }
    /**
     * Finds a type reference using the selector to create a new type instance
     * @param selector The selector of the expected type
     * @param payload The payload to create the new type instance
     * @returns The new type instance.
     */
    typer(selector, payload = {}) {
        const typeRef = this.getTypeRef(selector);
        if (!typeRef)
            throw new Error('Cant find type with selector: ' + selector);
        return typeRef.instanciate(payload);
    }
    /**
     * Builds a new a graphQL schema using the registred grapps references.
     */
    build() {
        const rootResolverMap = {
            Mutation: {},
            Query: {}
        };
        const rootDocNode = { kind: 'Document', definitions: [] };
        const opNodes = {};
        // for (const opKind of OPERATION_KINDS) opNodes[opKind] = {
        //   kind: 'ObjectTypeDefinition',
        //   name: {kind: 'Name', value: opKind},
        //   fields: []
        // };
        const rootMutationNode = {
            kind: 'ObjectTypeDefinition',
            name: { kind: 'Name', value: 'Mutation' },
            fields: []
        };
        // for (const [, grappRef] of this.grappRefs) {
        //   let parsed: { docNode: DocumentNode, resolverMap: { [key: string]: any } }
        //   try {
        //     parsed = grappRef.parse();
        //   } catch (err) {
        //     console.error(err);
        //     throw new Error('Failed to parse grappRef: ' + grappRef.target.name);
        //   }
        //   if (parsed) {
        //     for (const def of parsed.docNode.definitions) {
        //       if (def.kind !== 'ObjectTypeDefinition') rootDocNode.definitions.push(def);
        //       else if (OPERATION_KINDS.indexOf(<OperationKind>def.name.value) >= 0)
        //         opNodes[def.name.value].fields.push(...def.fields);
        //       else rootDocNode.definitions.push(def);
        //     }
        //     for (const selector in parsed.resolverMap) {
        //       if (OPERATION_KINDS.indexOf(<OperationKind>selector) >= 0) rootResolverMap[selector] = {
        //         ...rootResolverMap[selector],
        //         ...parsed.resolverMap[selector]
        //       };
        //       else rootResolverMap[selector] = parsed.resolverMap[selector];
        //     }
        //   }
        // }
        // for (const kind of OPERATION_KINDS)
        //   if (opNodes[kind].fields.length) {
        //     rootDocNode.definitions.push(opNodes[kind]);
        //   } else if (kind === 'Query') {
        //     const err = new Error(`BuildError: No fields in Query definition`);
        //     console.error(err);
        //     throw err;
        //   }
        let schema;
        try {
            schema = graphql_1.buildASTSchema(rootDocNode);
        }
        catch (catched) {
            const err = new Error(`BuildError: ${catched.message || catched}`);
            console.error(`rootDocNode.definitions\n`, rootDocNode.definitions);
            console.error(err);
            throw err;
        }
        graphql_tools_1.addResolveFunctionsToSchema(schema, rootResolverMap);
        return schema;
    }
}
exports.GrappRoot = GrappRoot;
/**
 * Initialize a grapp or an array of grapps to build a GraphQL schema.
 * @param target A grapp or an array of grapps that Grapp will build
 * @param params The Grapp root parameters
 * @return The new graphQL schema
 */
function bootstrapGrapp(target, params = {}) {
    const root = new GrappRoot(target, params);
    return root.build();
}
exports.bootstrapGrapp = bootstrapGrapp;
//# sourceMappingURL=root.js.map