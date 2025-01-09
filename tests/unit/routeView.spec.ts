import { beforeEach, describe, expect, it } from 'vitest';
import RouteView from '../../src/routeView';
import { MockZeyonApp } from '../util/mockApp';

class TestRouteView extends RouteView {
  // Optionally override or define minimal template / methods if needed
}

describe('RouteView', () => {
  let app: MockZeyonApp;
  let routeView: TestRouteView;

  beforeEach(() => {
    app = new MockZeyonApp();
    routeView = new TestRouteView({}, app);
  });

  it('can instantiate a RouteView subclass', () => {
    expect(routeView).toBeInstanceOf(RouteView);
  });

  it('has static isRoute set to true', () => {
    // Access the static property on the class
    expect(TestRouteView.isRoute).toBe(true);
  });

  it('non-overridden beforeNavigate always returns true', async () => {
    // Test with a non-empty path
    let result = await routeView.beforeNavigate('/example');
    expect(result).toBe(true);

    // Test with empty path
    result = await routeView.beforeNavigate('');
    expect(result).toBe(true);
  });
});
