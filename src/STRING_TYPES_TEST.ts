// Provided by the framework
interface BaseViewOptions {
  nothing: string;
}

class BaseView {
  constructor(options?: BaseViewOptions) {
    console.log('Base class', options);
  }
}

// User's code
interface MyViewOptions extends BaseViewOptions {
  something: string;
}

class MyView extends BaseView {
  constructor(options?: MyViewOptions) {
    super(options);
    console.log('Created MyView', options);
  }
}

// Generated references:

// Map used for type checks
declare module './STRING_TYPES_TEST' {
  // To test, save code as a file and point this path to the current file name
  // In the actual code base all of these pieces are in seperate files.
  interface ViewType {
    'my-view': {
      classRef: typeof MyView;
      options: MyViewOptions;
    };
  }
}

// Map used for class instantiations at run-time
export const classReferences: Record<string, { classRef: typeof BaseView }> = {
  'my-view': {
    classRef: MyView,
  },
};

// Utility method in the framework
function newView<K extends string & keyof ViewType>(
  id: K,
  options?: ViewType[K]['options'],
): Promise<InstanceType<ViewType[K]['classRef']>> {
  return Promise.resolve(new classReferences[id].classRef(options)) as any;
}

(async () => {
  // Caller from user's code

  // Type of const here should be "MyView" rather than "BaseView"
  const myView = await newView('my-view', {
    nothing: 'test1',
    something: 'test2', // this property shouldn't throw an error
  });

  console.log(myView);
})();
