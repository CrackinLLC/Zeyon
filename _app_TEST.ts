import HarnessApp from './src/app';
import { RouteConfig } from './src/imports/router';

import NotFoundRoute from './_TEST/404';
import AboutRoute from './_TEST/about';
import CareersRoute from './_TEST/careers';
import HomeRoute from './_TEST/home';

interface CustomRouteProps {
  shortName?: string;
  showHeader?: boolean;
  hidden?: boolean;
}

const routes: RouteConfig<CustomRouteProps>[] = [
  {
    regId: 'homepage',
    name: 'My Homepage',
    urlFragment: '',
    custom: {
      shortName: 'Home',
      showHeader: true,
    },
  },
  {
    regId: 'aboutpage',
    name: 'About Us',
    urlFragment: 'about',
    custom: {
      shortName: 'About',
      showHeader: true,
    },
    childRoutes: [
      {
        regId: 'careerspage',
        name: 'Our Creers',
        urlFragment: 'careers/:id',
        custom: {
          showHeader: false,
        },
      },
    ],
  },
  {
    regId: '404',
    name: 'Page Not Found',
    urlFragment: '404',
    is404: true,
    custom: {
      shortName: 'Not Found',
      showHeader: false,
      hidden: true,
    },
  },
];

const myApp = new HarnessApp<CustomRouteProps>({
  name: 'MyTestApplication',
  el: document.getElementById('#HarnessApp')!,
  urlPrefix: 'prefixTest',
  routes,
  registryClassList: {
    homepage: HomeRoute,
    aboutpage: AboutRoute,
    careerspage: CareersRoute,
    '404': NotFoundRoute,
    component: HomeRoute,
  },
});

myApp.newInstance('component', {
  attachTo: document.getElementById('#HeaderTest')!,
});
