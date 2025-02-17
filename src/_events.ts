export const emitterEvents = [
  '*', // Triggered for all events, with an additional "event name" supplied as the first argument.
  'destroyed', // When the class instance is destroyed.
];
export const registryEvents = ['registered'];
export const routerEvents = [
  'navigate', // A new route was loaded
  'query', // The query parameter has changed
];
export const modelEvents = [
  'add', // When the model is added to a collection.
  'remove', // When the model is removed from a collection.
  'change', // When any model attribute is changed.
  'reset', // When all model attributes are reset to their default or undefined values.
  'selected', // When the model is selected or deselected.

  // 'save', // When the model record has successfully been saved to the server.
  // 'fetch', // When the model record has successfully been fetched from the server.
  // 'delete', // When the model record has successfully been deleted from the server.
];
// Additional generated events include [attribute_name]:change, [attribute_name]:set, and [attribute_name]:unset
export const collectionEvents = [
  'update', // When any models are added, removed, or changed.
  'sort', // When the collection is sorted.
  'filter', // When the collection has a filter applied.

  'model:change', // When any model attribute is changed.
  'model:reset', // When all model attributes are reset to their default or undefined values.
  'model:selected', // When the model is selected or deselected.

  // 'save', // When the collection of model records have been successfully been saved to the server.
  // 'fetch', // When the collection of model records have been successfully been fetched from the server.
  // 'delete', // When the collection of model records have been successfully been deleted from the server.
];
export const viewEvents = [
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
export const collectionViewEvents = [
  'collection:update', // When the collection is updated.
  'collection:filter', // When the collection is filtered.
  'collection:sort', // When the collection is sorted.
];
