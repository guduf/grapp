"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
exports.PAYLOAD = Symbol('PAYLOAD');
exports.Payload = core_1.Inject(exports.PAYLOAD);
exports.TYPER = Symbol('TYPER');
exports.Typer = core_1.Inject(exports.TYPER);
var core_2 = require("@angular/core");
exports.Inject = core_2.Inject;
exports.Injectable = core_2.Injectable;
exports.InjectionToken = core_2.InjectionToken;
exports.Injector = core_2.ReflectiveInjector;
//# sourceMappingURL=di.js.map