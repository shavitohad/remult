# Todo App with Angular
### Build a production ready task list app with Remult using an Angular frontend

In this tutorial we are going to create a simple app to manage a task list. We'll use `Angular` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer React?
Check out the [React tutorial](./react/).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `Angular`.

Before you begin, make sure you have [Node.js](https://nodejs.org) installed. <!-- consider specifying Node minimum version with npm -->


## Setup for the Tutorial
This tutorial requires setting up an Angular project, an API server project and a few lines of code to add Remult.

:::details TLDR: Follow these steps to skip the manual setup and dive straight into coding the app

1. Clone the [remult-angular-todo](https://github.com/remult/remult-angular-todo) repository and install its dependencies.
   ```sh
   md remult-angular-todo
   cd remult-angular-todo
   git init
   git pull https://github.com/remult/remult-angular-todo.git
   npm i
   ```
2. Open your IDE.
3. Open a terminal and run the `dev-node` npm script to start the dev API server.

   ```sh
   npm run dev-node
   ```
4. Open another terminal and start the Angular app by running the `dev-ng` script. **Don't stop the `dev-node` script. `dev-ng` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-ng
   ```

The default Angular app main screen should be displayed.

At this point our starter project is up and running. We are now ready to [start creating the task list app](#entities-and-crud-operations).
:::

We'll start by creating an Angular project, so if Angular CLI is not already installed - then install it.
```sh
npm i -g @angular/cli
```
### Create an Angular Project
Create the new Angular project.
```sh
ng new remult-angular-todo
```
::: warning Note
The ng new command prompts you for information about features to include in the initial app project. Accept the defaults by pressing the Enter or Return key.
:::

### Adding Remult and Server Stuff
In this tutorial we'll be using the root folder created by `Angular` as the root folder for our server project as well.
```sh
cd remult-angular-todo
```

#### Installing required packages
We need `Express` to serve our app's API and, of course, `Remult`.
```sh
npm i express remult
npm i --save-dev @types/express
```
#### The API server project
The starter API server TypeScript project contains a single module which initializes `Express`, loads the Remult middleware `remultExpress`, and begins listening for API requests.

In our development environment we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server.

1. Install `ts-node-dev`
   ```sh
   npm i ts-node-dev --save-dev
   ```

2. Open your IDE.

3. Create a `server` folder under the `src/` folder created by Angular.

4. Create an `index.ts` file in the `src/server/` folder with the following code:

   *src/server/index.ts*
   ```ts
   import * as express from 'express';
   import { remultExpress } from 'remult/remult-express';

   const app = express();
   app.use(remultExpress());
   app.listen(3002, () => console.log("Server started"));
   ```

5. In the root folder, create a TypeScript config file `tsconfig.server.json` for the server project.

   *tsconfig.server.json*
   ```json
   {
      "extends": "./tsconfig.json",
      "compilerOptions": {
         "outDir": "./dist/server",
         "module": "commonjs",
         "emitDecoratorMetadata": true
      },
      "include": [
         "src/server/index.ts"
      ]
   }
   ```

6. Create an `npm` script `dev-node` to start the dev API server, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-node": "ts-node-dev --project tsconfig.server.json src/server/"
   ```
   
7. Start the dev API server.

   ```sh
   npm run dev-node
   ```
ַ
The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

### Finishing up the Starter Project

#### Proxy API requests from Angular DevServer to the API server and run the Angular app
The Angular app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the Angular app is served from the default `http://localhost:4200`. 

We'll use the [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) feature of webpack dev server to divert all calls for `http://localhost:4200/api` to our dev API server.

1. Create a file `proxy.conf.json` in the root folder, with the following contents:

   *proxy.conf.json*
   ```json
   {
      "/api": {
         "target": "http://localhost:3002",
         "secure": false
      }
   }
   ```

2. Create an `npm` script `dev-ng` to serve the Angular app with the `--proxy-config` option, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-ng": "ng serve --proxy-config proxy.conf.json --open"
   ```

   ::: warning Note
   The existing `start` and `build` npm scripts created by Angular CLI will be modified in the [Deployment](#deployment) section of this tutorial to scripts that will `start` and `build` the full-stack app.
   :::

3. Start the Angular app in a new terminal. **Don't stop the `dev-node` script. `dev-ng` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-ng
   ```

The default Angular app main screen should be displayed.

::: tip
If you are using Visual Studio Code and would like to run both `dev-node` and `dev-ng` scripts using a single Visual Studio Code `task`, create a `.vscode/tasks.json` file with the contents found [here](https://gist.github.com/noam-honig/623898a6cd539d86113263d3c63260f0) and run the `dev` task.
:::

#### Setting up an Angular DI Provider for Remult
Our Angular starter project is almost ready. All that's left is to add a dependency injection provider for the front-end `Remult` object. The `Remult` object provided will be used to communicate with the API server via a `Promise` based HTTP client (in this case - Angular's `HttpClient`).

This requires making the following changes to `app.module.ts`:
1. Import Angular's [HttpClientModule](https://angular.io/api/common/http/HttpClientModule)
2. Add an Angular `provider` for the `Remult` object, which depends on Angular's `HttpClient` object

::: warning Note
While we're editing the root Angular module, we can also import the `FormsModule` which we'll need later in order to use the [ngModel](https://angular.io/api/forms/NgModel) two-way binding directive.
:::

*src/app/app.module.ts*
```ts{5-7,15-16,19}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Remult } from 'remult';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: Remult, useClass: Remult, deps: [HttpClient] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Setup completed
At this point our starter project is up and running. We are now ready to start creating the task list app.

::: tip Bonus 
Setup [Swagger UI](../docs/adding-swagger) and/or a [GraphQL backend](../docs/adding-graphql) in seconds.
:::

## Entities and CRUD Operations

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints, API queries and database commands

The `Task` entity class we're creating will have an `id` field and a `title` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

1. Create a file `task.ts` in the `src/app/` folder, with the following code:

   *src/app/task.ts*
   ```ts
   import { Fields, Entity, IdEntity } from "remult";

   @Entity("tasks", {
      allowApiCrud: true
   })
   export class Task extends IdEntity {
       @Fields.string()
       title = '';
   }
   ```

2. Import the `task` module into the API server's `index` module:

   *src/server/index.ts*
   ```ts
   import '../app/task';
   ```

The [@Entity](../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an argument which implements the `EntityOptions` interface. We use an object literal to instantiate it, setting the [allowApiCrud](../docs/ref_entity.md#allowapicrud) property to `true`.

`IdEntity` is a base class for entity classes, which defines a unique string identifier field named `id`. <!-- consider linking to reference -->

The [@Fields.string](../docs/ref_field.md) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field related properties and operations, discussed in the next sections of this tutorial.

### Create new tasks

The first feature of our app is letting the user create a new task by typing a task title and clicking a button.

Let's implement this feature within the main `AppComponent` class.

1. Add the highlighted code lines to the `AppComponent` class file:

   *src/app/app.component.ts*
   ```ts{2-3,12-19}
   import { Component } from '@angular/core';
   import { Remult } from 'remult';
   import { Task } from './task';
   
   @Component({
     selector: 'app-root',
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.css']
   })
   export class AppComponent {
     title = 'remult-angular-todo';
     constructor(public remult: Remult) {
     }
     taskRepo = this.remult.repo(Task);
     newTask = this.taskRepo.create();
     async createTask() {
       await this.newTask.save();
       this.newTask = this.taskRepo.create();
     }
   }

   ```

   Here's a quick overview of the different parts of the code snippet:

   * The `remult` field of the `AppComponent` class will be instantiated by Angular's dependency injection. We've declared it as a `public` field so we can use it in the HTML template later on.

   * The `taskRepo` field contains a Remult [Repository](../docs/ref_repository.md) object used to fetch and create `Task` entity objects.

   * The `newTask` field contains a new, empty, instance of a `Task` entity object, instantiated using Remult. 
   
   * The `createTask` method stores the newly created `task` to the backend database (through an API `POST` endpoint handled by Remult), and the `newTask` field is replaced with a new `Task` object.

2. Replace the contents of `app.component.html` with the following HTML:

   *src/app/app.component.html*
   ```html
   <title>{{title}}</title>
   <div>
      <input [(ngModel)]="newTask.title" placeholder="Title">
      <button (click)="createTask()">Create new task</button>
   </div>
   ```

   Using the `ngModel` directive, we've bound the new task's `title` field to an `input` element.

### Run and create tasks
Using the browser, create a few new tasks. Then, navigate to the `tasks` API route at <http://localhost:4200/api/tasks> to see the tasks have been successfully stored on the server.

::: warning Wait, where is the backend database?
By default, `remult` stores entity data in a backend JSON database. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::


### Display the list of tasks
To display the list of existing tasks, we'll add a `Task` array field to the `AppComponent` class, load data from the server, and display it in an unordered list.

1. Add the following code to the `AppComponent` class:

   *src/app/app.component.ts*
   ```ts
   tasks: Task[] = [];
   async loadTasks() {
     this.tasks = await this.taskRepo.find();
   }
   ngOnInit() {
     this.loadTasks();
   }
   ```
   The `ngOnInit` hook method loads an array of tasks when the component is loaded.

2. Add the unordered list element to the `app.component.html` file.

   *src/app/app.component.html*
   ```html
   <ul>
      <li *ngFor="let task of tasks">
         {{task.title}}
      </li>
   </ul>
   ```

3. To refresh the list of tasks after a new task is created, add a `loadTasks` method call to the `createTask` method of the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts{4}
   async createTask() {
      await this.newTask.save();
      this.newTask = this.taskRepo.create();
      this.loadTasks();
   }
   ```

After the browser refreshes, the list of `tasks` appears. Create a new `task` and it's added to the list.

### Delete tasks
Let's add a *Delete* button next to each task on the list, which will delete that task in the backend database and refresh the list of tasks.

1. Add the following `deleteTask` method to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   async deleteTask(task: Task) {
     await task.delete();
     this.loadTasks();
   }
   ```

2. Add the *Delete* button to the task list item template element in `app.component.html`.

   *src/app/app.component.html*
   ```html{3}
   <li *ngFor="let task of tasks">
      {{task.title}}
      <button (click)="deleteTask(task)">Delete</button>
   </li>
   ```

After the browser refreshes, a *Delete* button appears next to each task in the list. Delete a task by clicking the button.

### Making the task titles editable
To make the titles of the tasks in the list editable, let's add an `input` for the titles, and a *Save* button to save the changes to the backend database. We'll use the `wasChanged` method of Remult's `EntityRef` object (accessed using the `_` member of the entity object) to disable the *Save* button while there are no changes to save.

Replace the task `title` template expression in `app.component.html` with the highlighted lines:

*src/app/app.component.html*
```html{2-3}
<li *ngFor="let task of tasks">
   <input [(ngModel)]="task.title">
   <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
   <button (click)="deleteTask(task)">Delete</button>
</li>
```

### Mark tasks as completed
Let's add a new feature - marking tasks in the todo list as completed using a `checkbox`. Titles of tasks marked as completed should have a `line-through` text decoration.

1. Add a `completed` field of type `boolean` to the `Task` entity class, and decorate it with the `@Fields.boolean` decorator.

   *src/app/task.ts*
   ```ts
    @Fields.boolean()
    completed = false;
   ```

2. Add a an `input` of type `checkbox` to the task list item element in `app.component.html`, and bind its `ngModel` to the task's `completed` field. 
   
   Set the `text-decoration` style attribute expression of the task `title` input element to evaluate to `line-through` when the value of `completed` is `true`.

   *src/app/app.component.html*
   ```html{2-4}
   <li *ngFor="let task of tasks">
     <input [(ngModel)]="task.completed" type="checkbox">
     <input [(ngModel)]="task.title" 
        [style.textDecoration]="task.completed?'line-through':''">
     <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
     <button (click)="deleteTask(task)">Delete</button>
   </li>
   ```

After the browser refreshes, a checkbox appears next to each task in the list. Mark a few tasks as completed using the checkboxes.

::: tip
To save the change of `task.completed` immediately when the user checks or unchecks the checkbox, simply add a `change` event handler to the checkbox element and call `task.save()`.
:::

### Code review
We've implemented the following features of the todo app:
* Creating new tasks
* Displaying the list of tasks
* Updating and deleting tasks
* Marking tasks as completed

Here are the code files we've modified to implement these features.

*src/app/task.ts*
```ts
import { Fields, Entity, IdEntity } from "remult";

@Entity("tasks", {
    allowApiCrud: true
})
export class Task extends IdEntity {
    @Fields.string()
    title = '';
    @Fields.boolean()
    completed = false;
}
```

*src/app/app.component.ts*
```ts
import { Component } from '@angular/core';
import { Remult } from 'remult';
import { Task } from './task';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'remult-angular-todo';
  constructor(public remult: Remult) {
  }
  taskRepo = this.remult.repo(Task);
  newTask = this.taskRepo.create();
  async createTask() {
    await this.newTask.save();
    this.newTask = this.taskRepo.create();
    this.loadTasks();
  }
  tasks: Task[] = [];
  async loadTasks() {
    this.tasks = await this.taskRepo.find();
  }
  ngOnInit() {
    this.loadTasks();
  }
  async deleteTask(task: Task) {
    await task.delete();
    this.loadTasks();
  }
}
```

*src/app/app.component.html*
```html
<title>{{title}}</title>
<div>
  <input [(ngModel)]="newTask.title" placeholder="Title">
  <button (click)="createTask()">Create new task</button>
</div>
<ul>
  <li *ngFor="let task of tasks">
    <input [(ngModel)]="task.completed" type="checkbox">
    <input [(ngModel)]="task.title" 
       [style.textDecoration]="task.completed?'line-through':''">
    <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
    <button (click)="deleteTask(task)">Delete</button>
 </li>
</ul>
```

## Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `loadTasks` method of the `AppComponent` class, add an object literal argument to the `find` method call and set its `orderBy` property to an arrow function which accepts a `task` argument and returns its `completed` field.

*src/app/app.component.ts*
```ts{2-4}
async loadTasks() {
  this.tasks = await this.taskRepo.find({
    orderBy: { completed: "asc" }
  });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::

### Hide completed tasks
Let's hide all completed tasks, using server side filtering.

1. In the `loadTasks` method of the `AppComponent` class, set the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter.

   *src/app/app.component.ts*
   ```ts{3}
   async loadTasks() {
     this.tasks = await this.taskRepo.find({
       where: { completed: false },
       orderBy: { completed: "asc" }
     });
   }
   ```

   ::: warning Note
   Because the `completed` field is of type `boolean`, the argument of its `isEqualTo` method is **compile-time checked to be of the `boolean` type.**
   :::

### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `AppComponent` class.

   *src/app/app.component.ts*
   ```ts
   hideCompleted = false;
   ```

2. In the `loadTasks` method of the `AppComponent` class, change the `where` property of the `options` argument of `find` to an arrow function which accepts an argument of the `Task` entity class and returns an `isEqualTo(false)` filter if the `hideCompleted` field is `true`.

   *src/app/app.component.ts*
   ```ts{3}
   async loadTasks() {
     this.tasks = await this.taskRepo.find({
       where: this.hideCompleted ? { completed: false } : {},
       orderBy: { completed: "asc" }
     });
   }
   ```


3. Add a `checkbox` input element immediately before the unordered list element in `app.component.html`, bind it to the `hideCompleted` field, and add a `change` handler which calls `loadTasks` when the value of the checkbox is changed.

   *src/app/app.component.html*
   ```html
   <p>
      <input type="checkbox" id="hideCompleted" [(ngModel)]="hideCompleted" (change)="loadTasks()">
      <label for="hideCompleted">Hide completed</label>
   </p>
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.

## Validation
Validating user entered data is usually required both on the client-side and on the server-side, often causing a violation of the [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) design principle. **With Remult, validation code can be placed within the entity class, and Remult will run the validation logic on both the frontend and the relevant API requests.**

### Validate the title field

Task titles are required. Let's add a validity check for this rule, and display an appropriate error message in the UI.

1. In the `Task` entity class, modify the `Field` decorator for the `title` field to include an argument which implements the `ColumnOptions` interface. Implement the interface using an anonymous object and set the object's `validate` property to `Validators.required`.

   *src/app/task.ts*
   ```ts{1-3}
    @Fields.string({
        validate: Validators.required
    })
    title = '';
   ```

2. In the `app.component.html` template, add a `div` element immediately after the `div` element containing the new task title `input`. Set an `ngIf` directive to display the new `div` only if `newTask.$.title.error` is not `undefined` and place the `error` text as its contents.

   *src/app/app.component.html*
   ```html
   <div *ngIf="newTask.$.title.error">
      {{newTask.$.title.error}}
   </div>
   ```

After the browser refreshes, try creating a new `task` without title - the "Should not be empty" error message is displayed.

Attempting to modify titles of existing tasks to invalid values will also fail, but the error message is not displayed because we haven't added the template element to display it.

### Implicit server-side validation
The validation code we've added is called by Remult on the server-side to validate any API calls attempting to modify the `title` field.

Try making the following `POST` http request to the `http://localhost:4200/api/tasks` API route, providing an invalid title.

```sh
curl -i -X POST http://localhost:4200/api/tasks -H "Content-Type: application/json" -d "{\"title\": \"\"}"
```

An http error is returned and the validation error text is included in the response body,


## Backend methods
When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

### Set all tasks as un/completed
Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAll` async function to the `AppComponent` class, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   *src/app/app.component.ts*
   ```ts
   async setAll(completed: boolean) {
     for await (const task of this.taskRepo.query()) {
        task.completed = completed;
        await task.save();
     }
     this.loadTasks();
   }
   ```

   The `query` method is an alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects. The `query` method doesn't return an array (as the `find` method) and instead returns an `iteratable` object which supports iterations using the JavaScript `for await` statement.


2. Add the two buttons to the `app.component.html` template, immediately before the unordered list element. Both of the buttons' `click` events will call the `setAll` function with the relevant value of the `completed` argument.

   *src/app/app.component.html*
   ```html
   <div>
      <button (click)="setAll(true)">Set all as completed</button> 
      <button (click)="setAll(false)">Set all as uncompleted</button>
   </div>
   ```

Make sure the buttons are working as expected before moving on to the next step.
### Refactoring `setAll` to have it run on the server
With the current state of the `setAll` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue.

A simple way to prevent this is to expose an API endpoint for `setAll` requests, and run the same logic on the server instead of the client.

1. Create a new `TasksService` class and refactor the `for await` loop from the `setAll` function of the `App` function into a new, `static`, `setAll` function in the `TasksService` class,  which will run on the server.

   *src/app/tasks.service.ts*
   ```ts
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./task";
   
   export class TasksService {
   
       @BackendMethod({ allowed: true })
       static async setAll(completed: boolean, remult?: Remult) {
           for await (const task of remult!.repo(Task).query()) {
               task.completed = completed;
               await task.save();
           }
       }
   }
   ```

2. Import the `Task` module into the API server's `index` module:

   *src/server/index.ts*
   ```ts
   import '../app/tasks.service';
   ```

3. Call the `setAll` method in the `TasksService`
   *src/app/app.component.ts*
   ```ts{2}
   async setAll(completed: boolean) {
      await TasksService.setAll(completed);
      this.loadTasks();
   }
   ```
   ::: danger Import TasksService
   Don't forget to import `TasksService`.
   :::

The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (the `allowed` property will be discussed later on in this tutorial). 

The optional `remult` argument of the static `setAll` function is omitted in the client-side calling code, and injected by Remult on the server-side with a server `Remult` object. **Unlike the client implementation of the Remult `Remult`, the server implementation interacts directly with the database.**

::: warning Note
With Remult backend methods, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the "Set all..." buttons function exactly the same, but they will do the work much faster.

## Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism which enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field level authorization code should be placed in entity classes**.

User authentication remains outside the scope of Remult. In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

### Tasks CRUD operations require sign in
This rule is implemented within the `Task` entity class constructor, by modifying the `allowApiCrud` property of the anonymous implementation of the argument sent to the `@Entity` decorator, from a `true` value to an arrow function which accepts a Remult `Remult` object and returns the result of the remult's `authenticated` method.

*src/app/task.ts*
```ts{2}
@Entity("tasks", {
    allowApiCrud: Allow.authenticated
})
```

After the browser refreshes, the list of tasks disappeared and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL
```sh
curl -i http://localhost:4200/api/tasks
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `TasksService`.

*src/app/task.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
:::

### Hide UI for non-authenticated users
*src/app/app.component.html*
```html{2,27}
<title>{{title}}</title>
<ng-container *ngIf="remult.authenticated()">
  <div>
    <input [(ngModel)]="newTask.title" placeholder="Title">
    <button (click)="createTask()">Create new task</button>
    <div *ngIf="newTask.$.title.error">
      {{newTask.$.title.error}}
   </div>
  </div>
  <p>
    <input type="checkbox" id="hideCompleted" [(ngModel)]="hideCompleted" (change)="loadTasks()">
    <label for="hideCompleted">Hide completed</label>
  </p>
  <div>
    <button (click)="setAll(true)">Set all as completed</button> 
    <button (click)="setAll(false)">Set all as uncompleted</button>
  </div>
  <ul>
    <li *ngFor="let task of tasks">
      <input [(ngModel)]="task.completed" type="checkbox">
      <input [(ngModel)]="task.title" 
         [style.textDecoration]="task.completed?'line-through':''">
      <button (click)="task.save()" [disabled]="!task._.wasChanged()">Save</button>
      <button (click)="deleteTask(task)">Delete</button>
    </li>
  </ul>
</ng-container>
```

*src/app/app.component.ts*
```ts{2}
async loadTasks() {
  if (this.remult.authenticated())
    this.tasks = await this.taskRepo.find({
      where: this.hideCompleted ? { completed: false } : {},
      orderBy: { completed: "asc" }
    });
}
```

### User authentication
Let's add a sign in area to the todo app, with an `input` for typing in a `username` and a sign in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign in, the sign in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [@auth0/angular-jwt](https://github.com/auth0/angular2-jwt) for client-side JWT decoding and passing HTTP `Authorization` headers to the API server
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server


1. Open a terminal and run the following command to install the required packages:
   ```sh
   npm i jsonwebtoken @auth0/angular-jwt express-jwt
   npm i --save-dev  @types/jsonwebtoken 
   ```
2. Create a file `src/app/user.ts` and place the following code in it:
   *src/app/user.ts*
   ```ts
   import * as jwt from 'jsonwebtoken';
   import { BackendMethod } from "remult";
   
   export class User {
       @BackendMethod({ allowed: true })
       static async signIn(username: string) {
           const validUsers = [
               { id: "1", name: "Jane", roles: [] },
               { id: "2", name: "Steve", roles: [] }
           ];
           const user = validUsers.find(user => user.name === username);
           if (!user)
               throw new Error("Invalid User");
           return jwt.sign(user, getJwtSigningKey());
       }
   }
   export function getJwtSigningKey() {
       if (process.env['NODE_ENV'] === "production")
           return process.env['TOKEN_SIGN_KEY']!;
       return "my secret key";
   }
   ```
   * Note that The (very) simplistic `signIn` function will accept a `username` argument, define a dictionary of valid users, check whether the argument value exists in the dictionary and return a JWT string signed with a secret key. 
   
   The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.

3. Exclude `jsonwebtoken` from browser builds by adding the following JSON to the main section of the project's `package.json` file.

   *package.json*
   ```json
   "browser": {
      "jsonwebtoken": false
   }
   ```

   ::: danger This step is not optional
   Angular CLI will fail to serve/build the app unless `jsonwebtoken` is excluded.

   **For this change to take effect, our Angular app's dev server must be restarted by terminating the `dev-ng` script and running it again.**
   :::

4. Create a file `src/app/auth.service.ts` and place the following code in it:
   *src/app/auth.service.ts*
   ```ts
   import { Injectable } from '@angular/core';
   import { JwtHelperService } from '@auth0/angular-jwt';
   import { Remult } from 'remult';
   import { User } from './user';
   
   @Injectable({
       providedIn: 'root'
   })
   export class AuthService {
   
       async signIn(username: string) {
           this.setAuthToken(await User.signIn(username));
       }
   
       setAuthToken(token: string) {
           this.remult.setUser(new JwtHelperService().decodeToken(token));
           sessionStorage.setItem(AUTH_TOKEN_KEY, token);
       }
   
       signOut() {
           this.remult.setUser(undefined!);
           sessionStorage.removeItem(AUTH_TOKEN_KEY);
       }
   
       static fromStorage(): string {
           return sessionStorage.getItem(AUTH_TOKEN_KEY)!;
       }
   
       constructor(private remult: Remult) {
           const token = AuthService.fromStorage();
           if (token) {
               this.setAuthToken(token);
           }
       }
   }
   
   const AUTH_TOKEN_KEY = "authToken";
   ```
   

5. Add `JwtModule` to the `imports` section of the `@NgModule` decorator of the `AppModule` class.

   *src/app/app.module.ts*
   ```ts
   JwtModule.forRoot({
      config:{
         tokenGetter: () => AuthService.fromStorage()
      }
   })
   ```
   ::: warning Imports
   This code requires imports for `AuthService` from `./auth.service` and `JwtModule` from `@auth0/angular-jwt`.
   :::
6. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{2-3,9-13}
   import * as express from 'express';
   import { expressjwt } from 'express-jwt';
   import { getJwtSigningKey } from '../app/user';
   import { remultExpress } from 'remult/remult-express';
   import '../app/task';
   import '../app/tasks.service';
   
   const app = express();
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress());
   app.listen(3002, () => console.log("Server started"));
   ```

   `credentialsRequired` is set to `false` to allow unauthenticated API requests (e.g. the request to `signIn`).

   The `algorithms` property must contain the algorithm used to sign the JWT (`HS256` is the default algorithm used by `jsonwebtoken`).

7. Add the following code to the `AppComponent` class, replacing the existing `constructor`.

   *src/app/app.component.ts*
   ```ts
   constructor(public remult: Remult, private auth: AuthService) {
   }
   username = '';
 
   async signIn() {
     await this.auth.signIn(this.username);
     this.loadTasks();
   }
 
   signOut() {
     this.auth.signOut();
     this.tasks = [];
   }
   ```

   ::: warning Imports
   This code requires imports for `AuthService` from `./auth.service`.
   :::

8. Add the following `HTML` after the `title` element of the `app.component.html` template, replacing the `<ng-container>` open tag.

   *src/app/app.component.html*
   ```html
   <ng-container *ngIf="!remult.authenticated()">
      <input [(ngModel)]="username"> 
      <button (click)="signIn()">Sign in</button>
   </ng-container>

   <ng-container *ngIf="remult.authenticated()">
      Hi {{remult.user.name}}
      <button (click)="signOut()">Sign out</button>
   ```


The todo app now supports signing in and out, with all access restricted to signed in users only.

### Role-based authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo list, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/app/` folder, with the following `Roles` class definition:

   *src/app/roles.ts*
   ```ts
   export const Roles = {
      admin: 'admin'
   }
   ```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

   *src/app/task.ts*
   ```ts{2,5-8,13}
import { Fields, Entity, IdEntity, Validators, Allow } from "remult";
   import { Roles } from "./roles";
   
   @Entity("tasks", {
       allowApiRead: Allow.authenticated,
       allowApiUpdate: Allow.authenticated,
       allowApiInsert: Roles.admin,
       allowApiDelete: Roles.admin
   })
   export class Task extends IdEntity {
       @Fields.string({
           validate: Validators.required,
           allowApiUpdate: Roles.admin
       })
       title = '';
       @Fields.boolean()
       completed = false;
   }
   ```
3. Modify the highlighted line in the `TasksService` class to reflect the authorization rule
   *src/app/tasks.service.ts*
   ```ts{3,7}
   import { BackendMethod, Remult } from "remult";
   import { Task } from "./task";
   import { Roles } from "./roles";
   
   export class TasksService {
   
       @BackendMethod({ allowed: Roles.admin })
       static async setAll(completed: boolean, remult?: Remult) {
           for await (const task of remult!.repo(Task).query()) {
               task.completed = completed;
               await task.save();
           }
       }
   }
   ```



4. Let's have the *"Jane"* belong to the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` server function.

   *src/app/user.ts*
   ```ts{4}
   @BackendMethod({ allowed: true })
   static async signIn(username: string) {
      const validUsers = [
      { id: "1", name: "Jane", roles: [ Roles.admin] },
      { id: "2", name: "Steve", roles: [] }
      ];
      const user = validUsers.find(user => user.name === username);
      if (!user)
        throw new Error("Invalid User");
      return jwt.sign(user, getJwtSigningKey());
   }
   ```


**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**



## Deployment

In this tutorial, we'll deploy both the Angular app files and the API server project to the same host, and redirect all non-API requests to return the Angular app's `index.html` page.

In addition, to follow a few basic production best practices, we'll use [compression](https://www.npmjs.com/package/compression) middleware to improve performance and [helmet](https://www.npmjs.com/package/helmet) middleware to improve security.

* note that if your project name is different than `remult-angular-todo`, you'll need to replace these values in the index.ts file
:::

1. Install `compression` and `helmet`.

   ```sh
   npm i compression helmet@4.6.0
   npm i @types/compression --save-dev
   ```

2. Add the highlighted code lines to `src/server/index.ts`, and modify the `app.listen` function's `port` argument to prefer a port number provided by the production host's `PORT` environment variable.

   *src/server/index.ts*
   ```ts{4-5,11-12,19-23}
   import * as express from 'express';
   import { expressjwt } from 'express-jwt';
   import { getJwtSigningKey } from '../app/user';
   import * as compression from 'compression';
   import * as helmet from 'helmet';
   import { remultExpress } from 'remult/remult-express';
   import '../app/task';
   import '../app/tasks.service';
   
   const app = express();
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(remultExpress());
   app.use(express.static('dist/remult-angular-todo'));
   app.use('/*', async (req, res) => {
      res.sendFile(process.cwd() + '/dist/remult-angular-todo/index.html');
   });
   app.listen(process.env['PORT'] || 3002, () => console.log("Server started"));
   ```

3. Modify the project's `build` npm script to also transpile the API server's TypeScript code to JavaScript (using `tsc`).

   *package.json*
   ```json
   "build": "ng build && tsc -p tsconfig.server.json"
   ```

4. Modify the project's `start` npm script to start the production Node server.

   *package.json*
   ```json
   "start": "node dist/server/server/"
   ```

The todo app is now ready for deployment to production.

#### Deploy to heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

For this tutorial, we will use `postgres` as a production database.

1. Install postgres `pg` and `heroku-ssl-redirect` (to enforce https)
   ```sh
   npm i pg heroku-ssl-redirect
   npm i --save-dev @types/pg
   ```

2. Add the highlighted code lines to `src/server/index.ts`.

   *src/server/index.ts*
   ```ts{5-6,21-27}
   import * as express from 'express';
   import * as compression from 'compression';
   import * as helmet from 'helmet';
   import { expressjwt } from 'express-jwt';
   import * as sslRedirect from 'heroku-ssl-redirect'
   import { createPostgresConnection } from 'remult/postgres';
   import { getJwtSigningKey } from '../app/user';
   import { remultExpress } from 'remult/remult-express';
   import '../app/task';
   import '../app/tasks.service';
   
   const app = express();
   app.use(sslRedirect());
   app.use(helmet({ contentSecurityPolicy: false }));
   app.use(compression());
   app.use(expressjwt({
       secret: getJwtSigningKey(),
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   const dataProvider = async () => {
       if (process.env['NODE_ENV'] === "production")
           return createPostgresConnection({ configuration: "heroku" })
       return undefined;
   }
   app.use(remultExpress({
       dataProvider
   }));
   app.use(express.static('dist/remult-angular-todo'));
   app.use('/*', async (req, res) => {
      res.sendFile(process.cwd() + '/dist/remult-angular-todo/index.html');
   });
   app.listen(process.env['PORT'] || 3002, () => console.log("Server started"));
   ```
2. Create a Heroku `app`:

   ```sh
   heroku create
   ```

3. Set the jwt authentication to something random - you can use an [Online UUID Generator](https://www.uuidgenerator.net/)
   ```sh
   heroku config:set TOKEN_SIGN_KEY=some-very-secret-key
   ```
3. Provision a dev postgres database on Heroku
   ```sh
   heroku addons:create heroku-postgresql:hobby-dev
   ```


4. Commit the changes to git and deploy to Heroku using `git push`:

   ```sh
   git add .
   git commit -m "todo app tutorial"
   git push heroku master
   ```

5. Run the production app using `heroku apps:open` command: 

   ```sh
   heroku apps:open
   ```

::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::


That's it - our application is deployed to production, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>

