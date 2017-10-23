"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = require("pluralize");
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
function pluralize(str) {
    return pluralize_1.plural(str);
}
exports.pluralize = pluralize;
function singularize(str) {
    return pluralize_1.singular(str);
}
exports.singularize = singularize;
//# sourceMappingURL=utils.js.map