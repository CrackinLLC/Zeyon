import "../util/polyfill";

import type { ScreenMap } from "./_imports/router";
import ApplicationCore from "./app";
import Router from "./router";
import { BinaryClassDefinition } from "./util/types";

const screenMap: ScreenMap = {
  // root: {
  //   config: {
  //     id: "root",
  //     name: "Global Screens",
  //     icon: IconType.X,
  //     showHeader: false,
  //     hidden: true,
  //   },
  //   screens: [
  //     {
  //       id: "login",
  //       name: "Login",
  //       view: Login,
  //       url: "/",
  //       hidden: true,
  //     },
  //     {
  //       id: "not-found",
  //       name: "Not Found",
  //       view: NotFound,
  //       url: "/404/",
  //       hidden: true,
  //     },
  //   ],
  // },
};

if (!window.APP) {
  window.APP = new ApplicationCore({
    name: "RentalGuru",
    user: window.dataOnLoad.sessionuser,
    router: new Router({
      screenMap,
      window,
    }),
    classMap: new Map<string, BinaryClassDefinition>([
      // ["class-identifier", ClassDefinition],
    ]),
  });

  window.onload = () => window.APP.initialize();
}
