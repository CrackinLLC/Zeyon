# HarnessUI

_NOTE:_ As of 10/2/24, this project is not ready for standalone use. It is the underlying architecture for another project currently being built, and is in the process of being abtracted for use across many other projects. If this note is still here, then the library is probably not yet ready for general use.

HarnessUI is a TypeScript-based front-end framework designed to streamline the development of dynamic, data-driven web applications. It provides a robust architecture centered around models, collections, and views, enabling developers to build scalable and maintainable applications with ease.

## Key Features

Strong Typing with TypeScript: Leverage TypeScript's static typing to catch errors early and enhance code reliability across models, collections, and views.
Model-View Architecture: Emphasizes a clear separation of concerns, facilitating organized code and easier maintenance.
Event-Driven Design: Built on an event-driven architecture using emitters, enabling reactive and responsive user interfaces.
Component-Based Development: Includes a rich set of customizable components like lists, carousels, and pickers.
Data Binding and Templates: Integrates with Handlebars templates for dynamic rendering and data binding.
Advanced Data Management: Features like filtered collection harnesses allow for sophisticated data manipulation and filtering within collections.
Extensibility: Designed to be modular, allowing developers to add or replace components and extend functionality as needed.

## Upcoming Modules

HarnessUI is designed to be extended with additional modules that enhance its capabilities:

### Interface

- _Notifications Package_: Implement real-time notifications within your application.
- _Tip Package_: Support for dynamically generated and responsive tips (commonly and tragically referred to as "tooltips").

### Server

- _HarnessAPI_: A server-side framework optimized to work seamlessly with HarnessUI, providing a PostgreSQL integration and API services.
- _SPA Package_: A more opinionated expansion of HarnessUI specifically to facilitate single-page applications, providing and expanded toolkit for routing and state management.
- _Login Package_: Full support for creating new user-accounts, along with session management using PassportJS.
- _Payments Package_: Allow for the transaction of payments through your platform in a clean an unobtrusive way. Integrates with multiple third-party payment gateways.

Names for all packages/modules beyond HarnessUI and HarnessAPI are subject to change.

## Installation

HarnessUI is available as an npm package:

`npm install harness-ui`

## Getting Started

pending...

### Contributing

Contributions are welcome! If you'd like to contribute to HarnessUI, please fork the repository and submit a pull request.

### License

HarnessUI is released under the MIT License.
