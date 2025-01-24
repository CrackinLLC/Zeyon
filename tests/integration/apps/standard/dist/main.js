System.register(["zeyon"], function (exports_1, context_1) {
    "use strict";
    var zeyon_1, myApp;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (zeyon_1_1) {
                zeyon_1 = zeyon_1_1;
            }
        ],
        execute: function () {
            myApp = zeyon_1.default.create({
                el: document.getElementById('ZeyonApp'),
                name: 'MyTestApplication',
                urlPrefix: 'prefix-test',
                routes: zeyon_1.default.defineRoutes([
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
                .renderGlobalView({
                registrationId: 'component-header',
                selector: '#Header',
            })
                .start();
        }
    };
});
//# sourceMappingURL=main.js.map