var format = require("date-fns/format");

const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}'
                AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE
                todo LIKE '%${search_q}%'`;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT * FROM todo WHERE id = '${todoId}';`;

  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3

app.get("/agenda", async (request, response) => {
  let { date } = request.query;
  date = format(new Date(date), "yyyy-MM-dd");
  //   date = date.toString();
  //   console.log(date);
  const getTodoOfDateQuery = `
    SELECT * FROM todo WHERE due_date = '${date}';`;

  const dateTodo = await db.get(getTodoOfDateQuery);
  response.send(dateTodo);
});

//API 4

app.post("/todos", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const postTodoQuery = `
    INSERT INTO 
        todo(id, todo, priority, status, category, due_date)
    VALUES
        (
            '${id}',
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        );`;

  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
  UPDATE
    todo
  SET 
    todo = '${todo}',
    priority = '${priority},
    status = '${status},
    category = '${category},
    due_date = '${dueDate}'
  WHERE 
    id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
