declare module 'zeyon/src/_maps' {
  interface ClassMapTypeView {
    'component-header': {
      classRef: typeof import('../src/components/headerView').HeaderView;
      options: unknown;
    };
  }
  interface ClassMapTypeRouteView {
    'route-about': {
      classRef: typeof import('../src/routes/aboutRoute').AboutRoute;
      options: unknown;
    };
    'route-home': {
      classRef: typeof import('../src/routes/homeRoute').HomeRoute;
      options: unknown;
    };
  }
}
