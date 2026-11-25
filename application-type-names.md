# Application Type Names

## Goal

**Every application is called by its product and its type, `<product>-<type>`, with the type taken from one fixed catalogue, and it carries that name everywhere it appears.**

An application here is what the [C4 model](https://c4model.com/abstractions/container) calls a *container*: something that must be running for the system to work, inside its own runtime boundary — a process on a server, a page in a browser, an app on a phone. It is the same meaning [Integration Logic](integration-logic.md) uses. This standard says *application* rather than *container* because the word clashes with Docker's, and never says *component* for it, because in C4 a component is a part *inside* an application: a module, a group of related code behind an interface.

An application is not a bounded context either: the two are orthogonal. A bounded context is a boundary of model and language, not of runtime: one application can hold several, as a modular monolith does, and one context can span several applications — a web service, the worker that runs its monthly jobs and the iOS application that shows its data can all speak the same model. This standard names applications by what runs; bounded contexts are named by the domain, and neither name is derived from the other.

The name is the first thing a person or an agent reads about an application, in a repository list, a deploy log, a stack trace or an architecture diagram. When one team writes `payments-api`, another `billing-backend` and a third `invoicing-server` for the same kind of thing, every reader must open each one to find out what it is. A fixed catalogue lets the name answer that question by itself.

## What Counts as In Scope

- Naming or renaming an application anywhere its name is an identifier: its repository, its container image, its service in a compose file or an orchestrator, its deployment or service on a hosting platform, its monitoring project, its folder when a repository holds several applications, and a part inside one application named after a type, such as a `web-service/` folder in a full-stack web application.
- Naming a resource that belongs to one application: its database, its queue, its bucket, an environment of it (`-local`, `-staging`).
- Writing or changing documentation that describes which applications a system has and how they relate: an architecture section, a diagram, a README's overview, a task that creates or splits an application.
- Choosing the type of a new application, and adding a type to the catalogue.

Out of scope:

- Libraries and packages published for other code to import (`pharos-react`, `pharos-tokens`): they do not run on their own, and their names follow the conventions of the registry they are published to.
- Modules and folders inside an application, C4 components, including the folders that hold its share of each bounded context; see [Bounded Context Layout](bounded-context-layout.md). The exception is a folder or part named after a type of the catalogue, which rule 7 governs.
- Domain names, URLs and marketing names of a product.

## The Catalogue

| Type | Slug | What it is |
|---|---|---|
| web application | `web-application` | An interface a person operates in a web browser, together with the server-side rendering that produces it. |
| website | `website` | Pages a person reads in a browser, with no operations of their own beyond navigation and forms that only send a message: a marketing site, documentation. |
| web service | `web-service` | A server-side program that offers operations to other programs over the network — HTTP, gRPC, WebSocket — and has no interface for people. |
| android application | `android-application` | An app for Android only. |
| iOS application | `ios-application` | An app for iOS or iPadOS only. |
| windows application | `windows-application` | A desktop app for Windows only. |
| macOS application | `macos-application` | A desktop app for macOS only. |
| linux application | `linux-application` | A desktop app for Linux only. |
| command-line application | `command-line-application` | A program a person runs from a terminal. |
| worker | `worker` | A server-side program that does work from a queue or a schedule and offers no operations over the network. |
| *technology* application | `<technology>-application` | One codebase that produces the app for several platforms, named after the cross-platform technology that builds it: `react-native-application`, `flutter-application`, `electron-application`, `tauri-application`. |

The last row is a family, not one type: a cross-platform technology joins it the first time an application is built with it, added to the row's examples in its own change. Every other type that is missing is added here first, in its own change, with its slug and its definition. It is never invented in a repository: a name that uses a type the catalogue does not have breaks this standard even if it reads well.

## The Rules

1. **The name is `<product>-<type-slug>`, in lowercase kebab-case, product first.** `identity-web-service`, `video-editor-web-application`, `recruitment-platform-web-service`. Not `web-service-identity`, not `identityWebService`, not `identity-ws`.

2. **The type comes from what the application is, not from its technology or its framework — except for cross-platform applications.** A Next.js project that serves pages a person operates is a web application, even though it also has API routes. A Go binary that answers HTTP requests from other programs is a web service, whatever its framework calls it. `nextjs`, `react`, `node`, `go` and `api` are never part of the name. The one exception is rule 5.

3. **One name, the same everywhere.** The repository, the image, the compose service, the hosting service and the monitoring project of an application carry the same name. What tells them apart is appended after it, never inserted into it or put in place of the type: `identity-web-service-local`, `identity-web-service-local-database`, `alexandria-web-application-staging`.

4. **The product name is the same for every application of the product.** `video-editor-web-application` and `video-editor-web-service`, never `video-editor-web-application` and `clipper-web-service`. An application that serves several products, such as identity or realtime notices, is a product of its own and is named by what it does, not after its first consumer.

5. **One codebase for several platforms is named after its technology; one platform takes its own type.** A React Native app for Android and iOS is a `react-native-application`; an Electron app for Windows and macOS is an `electron-application`. A Swift app for iOS only is an `ios-application`. Cross-platform apps are the ones rewritten whole in another technology, and while the rewrite is built both must run side by side, published and deployed under names that do not collide: `scheduler-react-native-application` keeps shipping while `scheduler-flutter-application` replaces it. When a product has both kinds, each carries its own type: `scheduler-react-native-application` and `scheduler-ios-application` for a widget only iOS has.

6. **An application is a runtime boundary, not a folder or a layer.** Code that runs in the same process as other code belongs to the same application, however it is organized. In a full-stack framework such as Next.js, the server actions, route handlers and business logic run in the same server process as the server-side rendering: together with the code that runs in the browser, they are one web application, not a web application and a web service. Its server-side layer is a set of C4 components, and it becomes a web service only when it runs as its own process with its own deploy, offering operations to other programs. When one repository holds several applications that do run apart, each is named by its own type, and the repository by the one its users operate.

7. **A part of one application may carry a type's name when it is built as that application would be: a co-located part.** A full-stack framework lets an interface and the server-side code behind it share one runtime, and keeping them apart in the code still pays: dependencies point one way, and the server-side part can later move to a process of its own without being redesigned. The part may then be named after the type it would have on its own — a `web-service/` folder inside a web application, as Alexandria does — only when all of this holds:

   - **It is a part, said so.** The application, its repository and everything it is deployed as are named by the type of the whole — `alexandria-web-application` — never by the part's. Diagrams draw one C4 container with the part inside it as components, never two containers, and documentation that names the part says it runs in the same process: «the co-located web service».
   - **Its boundary is the one a process boundary would impose.** The rest of the application reaches it only through its entry points — server actions, route handlers, the handlers they call — and never imports its domain, its repositories or its adapters. The part imports nothing from the interface. Code both use lives in a neutral place, such as `libraries/`, that depends on neither.
   - **What crosses the boundary could cross a network.** Its entry points take and return what [Serialization Boundaries](serialization-boundaries.md) would accept, so extracting the part changes how it is called and deployed, not what it offers.
   - **It offers no contract of its own to other programs.** Endpoints whose contract another platform dictates — an OAuth callback, a webhook, the data-deletion request a platform requires — are [integration logic](integration-logic.md) at the application's edge, and are allowed. Once an application designs operations for other programs to call — another application of the organization, a customer's integration — it has a contract of its own to keep: the part is extracted into its own `<product>-web-service`, or that contract is designed and named as the application's own API.

   A part that breaks any of these is a layer, not a co-located part, and takes a name that is not a type: `server/`, `server-side/`, or no folder of its own, its code living directly in the folders of the bounded contexts it serves.

8. **Prose uses the catalogue's words.** Documentation, diagrams and tasks that describe applications say *web application*, *web service*, *React Native application*, and so on, in lowercase except for the names of platforms and technologies. The words below are not types and are not used to name an application:

   | Instead of | Write |
   |---|---|
   | frontend, client, SPA, web app, portal | web application |
   | API, server, microservice, BFF | web service |
   | app (on a phone), mobile app | android application, iOS application, or the cross-platform technology's type |
   | app (on a computer), desktop app | the operating system's type, or the cross-platform technology's type |
   | CLI, script, tool | command-line application |
   | job runner, consumer, daemon | worker |
   | landing, site | website |

   *Backend* is not used at all, in names or in prose, and has no row above because it has no single replacement: it can mean everything a person does not see — web services, workers, databases, queues, a provider's infrastructure — which is far wider than one application. Say which application, or *server-side code* for the part of one that runs on a server.

   *API* still names an application's contract — «the web service's API» — never the application itself.

9. **A name that breaks these rules is changed on purpose, not in passing.** Renaming a repository, an image or a hosting service breaks whatever refers to it: deploy pipelines, environment variables, other applications' configuration, links. A new application is named by this standard from its first commit. An existing one that is not is reported, and renamed in a task of its own that lists everything that refers to the old name.

## Detection Workflow

1. List the applications the change names, renames or describes: repositories, images, compose services, hosting services, folders holding a whole application, architecture text.
2. For each one, decide its type from what it does at runtime, using the catalogue's definitions — who operates it, a person or another program; where it runs; on which platforms.
3. Check that its name is `<product>-<type-slug>`, that the product part matches the product's other applications, and that every place it appears carries the same name with qualifiers appended after it.
4. For each folder or part inside an application that carries a type's name, check rule 7's four conditions: named and drawn as a part, a boundary a process would impose, entry points that could cross a network, no contract of its own for other programs.
5. Check that the prose around it uses the catalogue's words, not the synonyms in rule 8.

## Review Questions

- Does every application in this change have a type from the catalogue, chosen by what it does rather than by its framework, unless it is a cross-platform application named after its technology?
- Is its name `<product>-<type-slug>`, and is it the same name in the repository, the image, the compose file and the hosting platform?
- Does the product part match the product's other applications?
- Does a part inside one application carry a type's name? If it does, is it a co-located part by all four conditions of rule 7, and does the documentation draw it as one container?
- Does the change rename something that already existed? If it does, is it its own task, with everything that refers to the old name listed?
- Does the text describe applications with the catalogue's words?

## Report the Outcome

When finishing the task:

- state each application named or described, with its type and its name;
- state any type added to the catalogue, and why none of the existing ones fit;
- state any existing name found breaking this standard, and that it was reported rather than renamed in passing.
