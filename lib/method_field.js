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
class MethodFieldRef {
    constructor(typeRef, key, _method) {
        this.typeRef = typeRef;
        this.key = key;
        this._method = _method;
    }
    resolve(instance, args, context, infos) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._method.call(instance, args, context, infos);
        });
    }
}
exports.MethodFieldRef = MethodFieldRef;
//# sourceMappingURL=method_field.js.map