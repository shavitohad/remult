---
title: Setup
sidebarDepth: 1
---

# Todo App with React

### Build a production-ready task list app with Remult using a React frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `React` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer Angular?
Check out the [Angular tutorial](../tutorial-angular).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `React`.

Before you begin, make sure you have [Node.js](https://nodejs.org) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial
This tutorial requires setting up a React project, an API server project, and a few lines of code to add Remult.

:::details TLDR: Follow these steps to skip the manual setup and dive straight into coding the app

1. Clone the [remult-react-todo](https://github.com/remult/remult-react-todo) repository and install its dependencies.

   ```sh
   md remult-react-todo
   cd remult-react-todo
   git init
   git pull https://github.com/remult/remult-react-todo.git
   npm i
   ```
2. Open your IDE.
3. Open a terminal and run the `dev-node` npm script to start the dev API server.

   ```sh
   npm run dev-node
   ```
4. Open another terminal and start the React app by running the `dev-react` script. **Don't stop the `dev-node` script. `dev-react` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-react
   ```

The default React app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to [start creating the task list app](#entities-and-crud-operations).
:::

### Create a React Project
Create the new React project.
```sh
npx create-react-app remult-react-todo --template typescript
```

### Adding Remult and Server Stuff
In this tutorial, we'll be using the root folder created by `React` as the root folder for our server project as well.
```sh
cd remult-react-todo
```

#### Installing required packages
We need [axios](https://axios-http.com/) to serve as an HTTP client, `Express` to serve our app's API, and, of course, `Remult`.
```sh
npm i axios express remult
npm i --save-dev @types/express
```
#### The API server project
The starter API server TypeScript project contains a single module that initializes `Express`, loads the Remult middleware `remultExpress`, and begins listening for API requests.

In our development environment, we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server.

1. Install `ts-node-dev`
   ```sh
   npm i ts-node-dev --save-dev
   ```

2. Open your IDE.

3. Create a `server` folder under the `src/` folder created by React.

4. Create an `index.ts` file in the `src/server/` folder with the following code:

   *src/server/index.ts*
   ```ts
   import express from 'express';
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
         "noEmit": false,
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
   
7. Add the `dist` folder to the `.gitignore` file
   *.gitignore*
   ```
   /dist
   ```
8. Start the dev API server.

   ```sh
   npm run dev-node
   ```
ַ
The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

### Finishing up the Starter Project

#### Proxy API requests from React DevServer to the API server and run the React app
The React app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the React app is served from the default `http://localhost:3000`. 

We'll use the [proxy](https://create-react-app.dev/docs/proxying-api-requests-in-development/) feature of webpack dev server to divert all calls for `http://localhost:3000/api` to our dev API server.

1. Configure the proxy by adding the following entry to the main section of the project's package.json file.

   *package.json*
   ```json
   "proxy": "http://localhost:3002"
   ```

2. Create an `npm` script `dev-react` to serve the React app, by adding the following entry to the `scripts` section of `package.json`.

   *package.json*
   ```json
   "dev-react": "react-scripts start"
   ```

   ::: warning Note
   The existing `start` and `build` npm scripts created by CRA will be modified in the [Deployment](#deployment) section of this tutorial to scripts that will `start` and `build` the full-stack app.
   :::

3. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.
   
   *tsconfig.json*
   ```json
   "experimentalDecorators": true
   ```

4. Start the React app in a new terminal. **Don't stop the `dev-node` script. `dev-react` and `dev-node` should be running concurrently.**

   ```sh
   npm run dev-react
   ```

The default React app main screen should be displayed.

::: tip
If you are using Visual Studio Code and would like to run both `dev-node` and `dev-react` scripts using a single Visual Studio Code `task`, create a `.vscode/tasks.json` file with the contents found [here](https://gist.github.com/noam-honig/a303635aded118169c4604fc7c5e988b) and run the `dev` task.
:::

#### Setting up a global Remult object for the React app
Our React starter project is almost ready. All that's left is to add a global `Remult` object which will be used to communicate with the API server via a `Promise`-based HTTP client (in this case - `Axios`).

Create an `common.ts` file in the `src/` folder with the following code:

*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```

### Setup completed
At this point, our starter project is up and running. We are now ready to start creating the task list app.

::: tip Bonus 
Setup [Swagger UI](../../docs/adding-swagger) and/or a [GraphQL backend](../../docs/adding-graphql) in seconds.
:::
