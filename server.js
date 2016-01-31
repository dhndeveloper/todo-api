var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var PORT = process.env.PORT || 3000;
//https://suri-todo-api.herokuapp.com/

var todos =[];
//not secure until we start using a database
var todoNextId = 1;

app.use(bodyParser.json());

 app.get('/', function(req, res){
   res.send('Todo API Root')
 });

app.get('/todos',function(req,res){
  res.json(todos);
})

// GET all /todos  ... /todos?c=true&q=work
app.get('/todos/api', function(req, res){
  //queryParams returns {completed: 'true'}
  var queryParams = _.pick(req.query, 'c','q');
  var filteredTodos = todos;
  console.log(_.size(queryParams));

    //c = completed, q = description
      if(queryParams.hasOwnProperty('c') && queryParams.c === 'true' ) {
        filteredTodos = _.where(filteredTodos, {completed: true});
      } else if (queryParams.hasOwnProperty('c') && queryParams.c === 'false') {
        filteredTodos = _.where(filteredTodos, {completed: false});
      }

    if(queryParams.hasOwnProperty('q') && queryParams.q.length > 0){
      filteredTodos = _.filter(filteredTodos, function(todo){
      //._filter takes an array, then a call back function that returns true or false, filter returns an rray of all values that pass
      // `~` with `indexOf` means "contains"
      // `toLowerCase` to discard case of question string
      //indexOf returns position where text is found, if its not found then returns -1
      //STACKOVER FLOW SOLUTIONS
      // return ~todo.q.toLowerCase().indexOf(queryParams.q);
      //Tutorial SOLUTIONS
      //indexOf, toLowerCase is only available on strings, not objects
        return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1
      });
    }
      if(_.size(queryParams)  === 0 ){
         return res.status(404).send({"error":"cant find what you're looking for"});
      }

    res.json(filteredTodos);
});

// GET  /todos/:id before underscore

//app.get('/todos/:id', function(req, res){
//  var todoId = parseInt(req.params.id, 10);
//  var matchedTodo;
//
//  todos.forEach(function(todo){
//    if(todo.id === todoId){
//      matchedTodo = todo;
//    }
//  });
//
//for loop instead of forEach
//for(i = 0; i < todos.length; i++){
//  if (todos[i].id === todoId){
//    matchedTodo = todos[i];
//  }
//};
//
//  if(matchedTodo){
//      res.json(matchedTodo);
//  } else {
//      res.status(404).send();
//    };
//});

//GET by ID
app.get('/todos/:id', function(req, res){
  var todoId = parseInt(req.params.id, 10);

  db.todo.findById(todoId).then(function(todo){
    console.log(todo + 'this is the to do');
    //!! coerces the object to boolean
    // http://stackoverflow.com/questions/784929/what-is-the-not-not-operator-in-javascript
    if(!!todo){
      res.json(todo);
    } else {
      return res.status(404).send({"error": "cant find what you're looking for"});
    }
  }).catch(function(e){
    //500 something went wrong on server side
    return res.status(500).json(e);
  })

  // //underscore findwhere takes array and returns 1 match
  // var matchedTodo = _.findWhere(todos, {id:todoId});
  //
  //  if(matchedTodo){
  //     res.json(matchedTodo);
  // } else {
  //     res.status(404).send();
  //   };
});

//POST /todos .. add a new todo
app.post('/todos', function (req, res){
  var body = _.pick(req.body, 'description','completed');

    db.todo.create(body).then(function(todo){
      //todo object in sequelize isn't just an object, so have to use toJSON
      return res.json(todo.toJSON());
    }).catch(function(e){
      return res.status(400).json(e);
    });
      //BEFORE DB
          // isBool checking true/false, isString checks if string was provided, trim removes spaces and makes sure no one types a bunch of spaces
        //   if(!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0){
        //     //400 bad data being passed
        //     return res.status(400).send();
        //   } else {
        //     //set body.description to the trimmed value
        //   body.description = body.description.trim();
        //   body.id = todoNextId++;
        //
        //   todos.push(body);
        //   res.json(body);
        //   }
});

//DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
  var todoId = parseInt(req.params.id, 10);
  var matchedTodo = _.findWhere(todos, {id:todoId})
  if(!matchedTodo){
    res.status(404).send({"error":"no todo found"});
  } else {
    //without takes an array, then the full object to delete from matchedTodo
   todos = _.without(todos, matchedTodo);
    //closes request and sends 200 status
    res.json(matchedTodo);
  }
});

//PUT /todos/:id ...update
app.put('/todos/:id', function(req, res){
  //this is the body sent in the request, we only want to "pick" these 2 keys
  var body = _.pick(req.body, 'description','completed');
  //get the id we are looking for from route
  var todoId = parseInt(req.params.id, 10);
  //find where that id matches in the todo array
  var matchedTodo = _.findWhere(todos, {id:todoId});
  var validAttributes = {};

  //following validation to ensure that whats being updated is valid

  if(!matchedTodo){
    return res.status(404).send({"error":"no todo found"});
  }

  //hasOwnProperty checks if the body which is an array has the 'completed' prorperty and is a boolean
  if(body.hasOwnProperty('completed') && _.isBoolean(body.completed)){
     validAttributes.completed = body.completed;
     } else if(body.hasOwnProperty('completed')){
        return res.status(400).send({"error":"issue with completed"});
      }

   if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0){
     validAttributes.description = body.description;
     } else if(body.hasOwnProperty('description')){
        return res.status(400).send({"error":"issue with description"});
      }

  //if all IF statements pass then there's something to update
  // you dont have to set matchedTodo = ._extend since objects are passed by reference
  //_.extend takes an array then updates it with the new validAttributes

   _.extend(matchedTodo, validAttributes);
  res.send(matchedTodo);

});

//coming from imports object, this is the lowercase version
db.sequelize.sync(/*{force: true}*/).then(function(){
  app.listen(PORT, function(){
    console.log('Cap, Im listning on ' + PORT + '!');
  });
});
