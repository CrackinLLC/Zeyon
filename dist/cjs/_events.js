"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionViewEvents = exports.viewEvents = exports.collectionEvents = exports.modelEvents = exports.routerEvents = exports.registryEvents = exports.emitterEvents = void 0;
exports.emitterEvents = [
    '*',
    'destroyed',
];
exports.registryEvents = ['registered'];
exports.routerEvents = [
    'navigate',
    'query',
];
exports.modelEvents = [
    'add',
    'remove',
    'change',
    'reset',
    'selected',
];
exports.collectionEvents = [
    'update',
    'sort',
    'filter',
    'model:change',
    'model:reset',
    'model:selected',
];
exports.viewEvents = [
    'beforeinput',
    'blur',
    'click',
    'contextmenu',
    'copy',
    'dblclick',
    'focus',
    'focusin',
    'focusout',
    'input',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'paste',
    'scroll',
];
exports.collectionViewEvents = [
    'collection:update',
    'collection:filter',
    'collection:sort',
];
//# sourceMappingURL=_events.js.map