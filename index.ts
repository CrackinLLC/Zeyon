import ApplicationCore from "./src/app";
import type { ScreenMap } from "./src/imports/router";
import Router from "./src/router";
import { BinaryClassDefinition } from "./src/util/type";

const screenMap: ScreenMap = {
  //
};

if (!window.APP) {
  window.APP = new ApplicationCore({
    name: "RentalGuru",
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
