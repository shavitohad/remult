# Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

### Show uncompleted tasks first
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `useEffect` hook `App` function component, add an object literal argument to the `find` method call and set its `orderBy` with an object that contains the fields you want to order by.
Use "asc" and "desc" to determine the sort order.

*src/App.tsx*
```ts{3}
useEffect(() => {
   taskRepo.find({
   orderBy: { completed: "asc" }
   }).then(setTasks);
}, []);
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
### Hide completed tasks
Let's hide all completed tasks, using server side filtering.

1. In the `useEffect` hook of the `App` function component, set the `where` property of the `options` argument of `find` to `{ completed: false }`}.

   *src/App.tsx*
   ```ts{4}
   useEffect(() => {
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: false }
     }).then(setTasks);
   }, []);
   ```
   ::: warning Note
   Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type.**
   :::

   * To see many more filtering options, see [EntityFilter](https://remult.dev/docs/entityFilter.html)
### Optionally hide completed tasks
Let's add the option to toggle the display of completed tasks using a checkbox at the top of the task list.

1. Add a `hideCompleted` boolean field to the `App` function component.

   *src/App.tsx*
   ```ts
   const [hideCompleted, setHideCompleted] = useState(false);
   ```

2. In the `useEffect` hook of the `App` function component, change the `where` property of the `options` argument of `find`. Also register the `hideCompleted` in the array that is sent as the second parameter to `useEffect`.

   *src/App.tsx*
   ```ts{3,6}
   useEffect(() => {
     taskRepo.find({
       orderBy: { completed: "asc" },
       where: { completed: hideCompleted ? false : undefined }
     }).then(setTasks);
   }, [hideCompleted]);
   ```
   * Note that settings the `completed` filter options to `undefined` removes that condition.

3. Add a `checkbox` input element immediately before the `tasks` map in `App.tsx`, bind it to the `hideCompleted` field, and add a `change` handler which sets the `setHideCompleted` when the value of the checkbox is changed.

   *src/App.tsx*
   ```tsx{3-7}
   return (
     <div >
       <input
         type="checkbox"
         checked={hideCompleted}
         onChange={e => setHideCompleted(e.target.checked)} /> Hide Completed
       <hr />
       {tasks.map(task => (
         <div key={task.id}>
           <input type="checkbox" checked={task.completed} />
           {task.title}
         </div>
       ))}
     </div>
   );
   ```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
