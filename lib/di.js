"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
exports.PAYLOAD = Symbol('PAYLOAD');
exports.Payload = core_1.Inject(exports.PAYLOAD);
exports.COLLECTION = Symbol('COLLECTION');
exports.Collection = core_1.Inject(exports.COLLECTION);
exports.CREATE_DOC = Symbol('CREATE_DOC');
exports.CreateDoc = core_1.Inject(exports.CREATE_DOC);
exports.UPDATE_DOC = Symbol('UPDATE_DOC');
exports.UpdateDoc = core_1.Inject(exports.UPDATE_DOC);
exports.REMOVE_DOC = Symbol('REMOVE_DOC');
exports.RemoveDoc = core_1.Inject(exports.REMOVE_DOC);
exports.TYPER = Symbol('TYPER');
exports.Typer = core_1.Inject(exports.TYPER);
var core_2 = require("@angular/core");
exports.Inject = core_2.Inject;
exports.Injectable = core_2.Injectable;
exports.InjectionToken = core_2.InjectionToken;
exports.Injector = core_2.ReflectiveInjector;
//# sourceMappingURL=di.js.map