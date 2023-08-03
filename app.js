const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");


let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });
    } catch(e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
    return (requestQuery.priority !== undefined && requestQuery.status !== undefined);
};

const hasSearchProperty = (requestQuery) => {
    return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
    return (requestQuery.category !== undefined && requestQuery.status !== undefined);
};

const hasCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
    return (requestQuery.category !== undefined && requestQuery.priority !== undefined);
};

const convertTodoDBOjectToResponseObject = (dbObject) => {
    return {
        id: dbObject.id,
        todo: dbObject.todo,
        priority: dbObject.priority,
        status: dbObject.status,
        category: dbObject.category,
        dueDate: dbObject.due_date
    };
};

//Get Todos Status, Priority, Category, Due-Date API
app.get("/todos/", async (request, response) => {
    let getTodosQuery = "";
    let todosArray = null;
    const {search_q = "", priority, status, category} = request.query;
    switch (true) {
        case hasStatusProperty(request.query):
            if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                getTodosQuery = `
                SELECT
                  * 
                FROM
                  todo
                WHERE
                  status = '${status}';`;
                todosArray = await db.all(getTodosQuery);
                response.send(
                    todosArray.map((eachTodo) => 
                        convertTodoDBOjectToResponseObject(eachTodo)
                    )
                );
            } else {
                response.status(400);
                response.send("Invalid Todo Status");
            }
            break;
        case hasPriorityProperty(request.query):
            if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
                getTodosQuery = `
                SELECT
                  *
                FROM
                  todo
                WHERE
                  priority = '${priority}';`;
                todosArray = await db.all(getTodosQuery);
                response.send(
                    todosArray.map((eachTodo) => 
                        convertTodoDBOjectToResponseObject(eachTodo)
                    )
                );
            } else {
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            break;
        case hasPriorityAndStatusProperties(request.query):
            if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
                if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                    getTodosQuery = `
                    SELECT
                      * 
                    FROM
                      todo
                    WHERE
                      priority = '${priority}'
                      AND status = '${status}';`;
                    todosArray = await db.all(getTodosQuery);
                    response.send(
                        todosArray.map((eachTodo) => 
                            convertTodoDBOjectToResponseObject(eachTodo)
                        )
                    );
                } else {
                    response.status(400);
                    response.send("Invalid Todo Status");
                }
            } else {
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            break;
        case hasSearchProperty(request.query):
            getTodosQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE '%${search_q}%';`;
            todosArray = await db.all(getTodosQuery);
            response.send(
                todosArray.map((eachTodo) => 
                    convertTodoDBOjectToResponseObject(eachTodo)
                )
            );
            break;
        case hasCategoryAndStatusProperties(request.query):
            if (category === "WORK" || category === "HOME" || category === "LEARNING"){
                if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                    getTodosQuery = `
                    SELECT
                      * 
                    FROM
                      todo
                    WHERE
                      category = '${category}'
                      AND status = '${status}';`;
                    todosArray = await db.all(getTodosQuery);
                    response.send(
                        todosArray.map((eachTodo) => 
                            convertTodoDBOjectToResponseObject(eachTodo)
                        )
                    );
                } else {
                    response.status(400);
                    response.send("Invalid Todo Status");
                }
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case hasCategoryProperty(request.query):
            if (category === "WORK" || category === "HOME" || category === "LEARNING"){
                getTodosQuery = `
                SELECT
                  *
                FROM
                  todo
                WHERE
                  category = '${category}';`;
                todosArray = await db.all(getTodosQuery);
                response.send(
                    todosArray.map((eachTodo) => 
                        convertTodoDBOjectToResponseObject(eachTodo)
                    )
                );
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case hasCategoryAndPriorityProperties(request.query):
            if (category === "WORK" || category === "HOME" || category === "LEARNING"){
                if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
                    getTodosQuery = `
                    SELECT
                      *
                    FROM
                      todo
                    WHERE
                      category = '${category}'
                      AND priority = '${priority}';`;
                    todosArray = await db.all(getTodosQuery);
                    response.send(
                        todosArray.map((eachTodo) => 
                            convertTodoDBOjectToResponseObject(eachTodo)
                        )
                    );
                } else {
                    response.status(400);
                    response.send("Invalid Todo Priority");
                }
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        default:
            getTodosQuery = `
            SELECT
              *
            FROM
              todo;`;
            todosArray = await db.all(getTodosQuery);
            response.send(
                todosArray.map((eachTodo) => 
                    convertTodoDBOjectToResponseObject(eachTodo)
                )
            );
    }
});

//Get Todo API
app.get("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
    const todoDetails = await db.get(getTodoQuery);
    response.send(convertTodoDBOjectToResponseObject(todoDetails));
});

//Get Specific Due-Date Todos API
app.get("/agenda/", async (request, response) => {
    const {date} = request.query;
    if (isMatch(date,"yyyy-MM-dd")) {
        const newDate = format(new Date(date), "yyyy-MM-dd");
        const getAgendaQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          due_date = '${newDate}';`;
        const agendaArray = await db.all(getAgendaQuery);
        response.send(
            agendaArray.map((eachAgenda) => 
                convertTodoDBOjectToResponseObject(eachAgenda)
            )
        );
    } else {
        response.status(400);
        response.send("Invalid Due Date");
    }
});

//Add Todo API
app.post("/todos/", async (request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body;
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
            if (category === "WORK" || category === "HOME" || category === "LEARNING"){
                if (isMatch(dueDate, "yyyy-MM-dd")) {
                    const addNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
                    const addTodoQuery = `
                    INSERT INTO
                      todo (id, todo, priority, status, category, due_date)
                    VALUES (
                         ${id},
                        '${todo}',
                        '${priority}',
                        '${status}',
                        '${category}',
                        '${addNewDueDate}');`;
                    await db.run(addTodoQuery);
                    response.send("Todo Successfully Added");
                } else {
                    response.status(400);
                    response.send("Invalid Due Date");
                }
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
        } else {
            response.status(400);
            response.send("Invalid Todo Priority");
        }
    } else {
        response.status(400);
        response.send("Invalid Todo Status");
    }
});

//Update Status, Priority API
app.put("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const requestBody = request.body;

    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
    const previousTodoDetails = await db.get(previousTodoQuery);

    const {
        todo = previousTodoDetails.todo,
        priority = previousTodoDetails.priority,
        status = previousTodoDetails.status,
        category = previousTodoDetails.category,
        dueDate = previousTodoDetails.dueDate
    } = request.body;
    
    switch (true) {
        case requestBody.status !== undefined:
            if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
                const updateTodoQuery = `
                UPDATE
                    todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
                await db.run(updateTodoQuery);
                response.send("Status Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Status");
            }
            break;
        case requestBody.priority !== undefined:
            if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
                const updateTodoQuery = `
                UPDATE
                    todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
                await db.run(updateTodoQuery);
                response.send("Priority Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Priority");
            }
            break;
        case requestBody.todo !== undefined:
                const updateTodoQuery = `
                UPDATE
                    todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
                await db.run(updateTodoQuery);
                response.send("Todo Updated");
            break;
        case requestBody.category !== undefined:
            if (category === "WORK" || category === "HOME" || category === "LEARNING"){
                const updateTodoQuery = `
                UPDATE
                    todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId};`;
                await db.run(updateTodoQuery);
                response.send("Category Updated");
            } else {
                response.status(400);
                response.send("Invalid Todo Category");
            }
            break;
        case requestBody.dueDate !== undefined:
            if (isMatch(dueDate, "yyyy-MM-dd")) {
                    const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
                    const updateTodoQuery = `
                UPDATE
                    todo
                SET 
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${newDueDate}'
                WHERE
                    id = ${todoId};`;
                await db.run(updateTodoQuery);
                response.send("Due Date Updated");
                } else {
                    response.status(400);
                    response.send("Invalid Due Date");
                }
    }
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;