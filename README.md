# EchoTS

_NOTE:_ As of 10/2/24, this project is not ready for standalone use. It is the underlying architecture for another project currently being built, and is in the process of being abtracted for use across many other projects. If this note is still here, then the library is probably not yet ready for general use.

EchoTS is a TypeScript-based framework designed to streamline the development of dynamic, data-driven web applications. It provides a robust and type-safe MVC architecture, enabling developers to build scalable and maintainable applications in Typescript, with ease.

## Key Features

Strong Typing with TypeScript: Leverage TypeScript's static typing to catch errors early and enhance code reliability across models, collections, and views.
Model-View Architecture: Emphasizes a clear separation of concerns, facilitating organized code and easier maintenance.
Event-Driven Design: Built on an event-driven architecture using emitters, enabling reactive and responsive user interfaces.
Component-Based Development: Includes a rich set of customizable components like lists, carousels, and pickers.
Data Binding and Templates: Integrates with Handlebars templates for dynamic rendering and data binding.
Advanced Data Management: Features like filtered collection harnesses allow for sophisticated data manipulation and filtering within collections.
Extensibility: Designed to be modular, allowing developers to add or replace components and extend functionality as needed.

## Upcoming Modules

EchoTS is designed to be extended with additional modules that enhance its capabilities:

### Client-side

- _UI Components_: A set of commonly used components such as a buttons, text inputs, toggle switchs, and dialog popups.
- _Notifications_: Implement real-time notifications within your application.
- _Tips_: Support for dynamically generated and responsive tips (commonly and tragically referred to as "tooltips").
- _Caching_: Automatic client-side caching of all state related data, as well as automatic rehydration on refresh.
- _Dynamic Module Loading_: a server-side component for dynamic module loading and currently requires a node environment running on the server.

### Server-side

- _HarnessAPI_: A server-side library optimized to work seamlessly with EchoTS, providing a PostgreSQL integration and API services. HarnessAPI is currently dependant on Express.js.
- _Login/Session Management_: Full support for creating new user-accounts, along with session management using PassportJS.
- _Logging_: Comprehensive application logging that includes an administrative panel to review logs
- _Payments Portal_: Allow for the payments through your platform in a clean an unobtrusive way. Integrates with multiple third-party gateways.

## Installation

EchoTS is available as an npm package:

`npm install harness-ui`

## Getting Started

pending...

### Contributing

Contributions are welcome! If you'd like to contribute to EchoTS, please fork the repository and submit a pull request.

### License

EchoTS is released under the MIT License.
