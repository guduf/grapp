"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const type_1 = require("./type");
const type_ref_1 = require("./type_ref");
const utils_1 = require("./utils");
/** Represents a unique instance of grapp reference created during bootstrap. */
class GrappRef {
    /**
     * Initialize a grapp reference.
     * @param root The grapp root.
     * @param meta The meta of the grapp.
     */
    constructor(root, meta) {
        this.root = root;
        this.imports = meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
        this.injector = this.root.injector.resolveAndCreateChild([...meta.providers]);
        const { metaMap, sources } = parseGrappMeta(meta);
        const { definitions, nodes } = parseSchemaSource(...sources);
        this.typeRefs = this._mapTypeDefinitions(definitions, metaMap);
    }
    /**
     * Maps a object of maps with type kind as key by combining definition and meta
     * @param definitions Type definiton maps by type kind
     * @param metaMap A selector map with type meta as v
     * @returns A object references maps by type kind
     */
    _mapTypeDefinitions(definitions, metaMap) {
        const references = {};
        for (const typeKind of Object.keys(definitions)) {
            references[typeKind] = new Map();
            for (const [selector, definition] of definitions[typeKind]) {
                const meta = metaMap.get(selector);
                if (!meta)
                    throw new ReferenceError(`Failed to get type meta for type selector: '${selector}'`);
                let typeRef;
                try {
                    typeRef = new meta.TypeRefClass(this, meta, definition);
                }
                catch (catched) {
                    console.error(catched);
                    throw new Error(`Failed to instanciate type ref '${selector}': ${catched.message}`);
                }
                if (!(typeRef instanceof type_ref_1.TypeRef))
                    throw new TypeError(`Type reference with selector '${selector}' is not a instance of TypeRef`);
                references[typeKind].set(selector, typeRef);
            }
        }
        return references;
    }
}
exports.GrappRef = GrappRef;
/**
 * Parses a grapp meta to a map with selector as key and type meta as value,
 * and schema sources.
 */
function parseGrappMeta(meta) {
    const metaMap = new Map();
    const sources = [];
    if (meta.source)
        sources.push(meta.source);
    for (const typeTarget of meta.types) {
        const meta = type_1.getTypeMeta(typeTarget);
        if (!(meta instanceof type_1.TypeMeta))
            throw new ReferenceError(`Failed to get type meta for type target: ${typeTarget.name || typeTarget}`);
        if (metaMap.has(meta.selector))
            throw new ReferenceError(`Duplicate meta type selector: '${meta.selector}'`);
        metaMap.set(meta.selector, meta);
        if (meta.source)
            sources.push(meta.source);
    }
    return { metaMap, sources };
}
exports.parseGrappMeta = parseGrappMeta;
/**
 * Parses schema sources to maps by type kind of definition
 * and a array of the others nodes.
 */
function parseSchemaSource(...sources) {
    const definitions = {};
    const nodes = [];
    for (const source of sources) {
        let document;
        try {
            document = graphql_1.parse(source);
        }
        catch (catched) {
            console.error(catched);
            throw new Error(`Failed to parse source '${source.name}': ${catched.message}`);
        }
        for (const definition of document.definitions) {
            if (definition.kind !== 'ObjectTypeDefinition')
                nodes.push(definition);
            else {
                const name = definition.name.value;
                const OPERATIONS_TYPES = ['query', 'mutation', 'subscription', 'type'];
                for (const operationType of OPERATIONS_TYPES) {
                    if (operationType === 'type')
                        if (definitions['type'].has(name))
                            throw new ReferenceError(name);
                        else
                            definitions['type'].set(name, definition);
                    if (name.match(new RegExp(`/\w+${utils_1.capitalize(operationType)}$/`))) {
                        if (!definitions[operationType])
                            (definitions[operationType] = new Map());
                        if (!definitions[operationType].has(name))
                            throw new ReferenceError(name);
                        definitions[operationType].set(name, definition);
                        break;
                    }
                }
            }
        }
    }
    return { definitions, nodes };
}
exports.parseSchemaSource = parseSchemaSource;
//# sourceMappingURL=grapp_ref.js.map