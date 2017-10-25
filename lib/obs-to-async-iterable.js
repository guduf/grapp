"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterall_1 = require("iterall");
function obsToAsyncIterator(obs) {
    const pullQueue = [];
    const pushQueue = [];
    let listening = true;
    const sub = obs.subscribe(value => pushValue(value), err => { }, () => (listening = false));
    const pushValue = value => {
        if (pullQueue.length !== 0)
            pullQueue.shift()({ value, done: false });
        else
            pushQueue.push(value);
    };
    const pullValue = () => {
        return new Promise(resolve => {
            if (pushQueue.length !== 0)
                resolve({ value: pushQueue.shift(), done: false });
            else
                pullQueue.push(resolve);
        });
    };
    const emptyQueue = () => {
        if (listening) {
            listening = false;
            sub.unsubscribe();
            pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
            pullQueue.length = 0;
            pushQueue.length = 0;
        }
    };
    return {
        next() {
            return listening ? pullValue() : this.return();
        },
        return() {
            emptyQueue();
            return Promise.resolve({ value: undefined, done: true });
        },
        throw(error) {
            emptyQueue();
            return Promise.reject(error);
        },
        [iterall_1.$$asyncIterator]() {
            return this;
        },
    };
}
exports.obsToAsyncIterator = obsToAsyncIterator;
//# sourceMappingURL=obs-to-async-iterable.js.map