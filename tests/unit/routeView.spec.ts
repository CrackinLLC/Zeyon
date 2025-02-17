import { beforeEach, describe, expect, it } from 'vitest';
import RouteView from '../../dist/esm/routeView';
import { TestZeyonApp } from '../util/testApp';
import { TestRouteView } from '../util/testRouteView';

describe('RouteView', () => {
  let app: TestZeyonApp;
  let routeView: TestRouteView;

  beforeEach(() => {
    app = new TestZeyonApp();
    routeView = new TestRouteView({}, app);
  });

  it('can instantiate a RouteView subclass', () => {
    expect(routeView).toBeInstanceOf(RouteView);
  });

  it('has static isRoute set to true', () => {
    // Access the static property on the class
    expect(TestRouteView.isRoute).toBe(true);
  });

  it('non-overridden onBeforeNavigate always returns true', async () => {
    // Test with a non-empty path
    let result = await routeView.onBeforeNavigate('/example');
    expect(result).toBe(true);

    // Test with empty path
    result = await routeView.onBeforeNavigate('');
    expect(result).toBe(true);
  });
});
