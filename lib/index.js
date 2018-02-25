"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var di_1 = require("./di");
exports.Inject = di_1.Inject;
exports.Payload = di_1.Payload;
exports.Typer = di_1.Typer;
var grapp_1 = require("./grapp");
exports.Grapp = grapp_1.decorateGrapp;
var type_1 = require("./type");
exports.Type = type_1.decorateType;
var root_1 = require("./root");
exports.bootstrapGrapp = root_1.bootstrapGrapp;
//# sourceMappingURL=index.js.map