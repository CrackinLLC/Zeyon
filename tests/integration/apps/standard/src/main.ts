import ZeyonApp from 'zeyon/new';

// Define route props
interface CustomRouteProps {
  displayName?: string;
}

// @ts-ignore
window.ZAPP = await ZeyonApp.create({
  el: document.getElementById('ZeyonApp')!,
  name: 'MyTestApplication',
  routes: ZeyonApp.defineRoutes<CustomRouteProps>([
    {
      registrationId: 'route-home',
      urlFragment: '',
      custom: {
        displayName: 'My Homepage',
      },
    },
    {
      registrationId: 'route-about',
      urlFragment: 'about',
      custom: {
        displayName: 'About Us',
      },
      childRoutes: [
        {
          registrationId: 'route-careers',
          urlFragment: 'career/:id',
          custom: {
            displayName: 'Crackin Careers',
          },
        },
      ],
    },
    {
      registrationId: 'route-notfound',
      is404: true,
      urlFragment: '404',
      custom: {
        displayName: 'Page Not Found',
      },
    },
  ]),
})
  .renderNewView('component-header', {
    attachTo: '#Header',
  })
  .then((app) => app.start());
