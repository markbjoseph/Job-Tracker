require("dotenv").config();

const express = require("express");
const cors = require("cors");


const app = express();

app.use(cors());
app.use(express.json()); //initalises req.body to be a JavaScript object instead of a string

// Import routes
const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const listRoutes = require("./routes/listRoutes");
const cardRoutes = require("./routes/cardRoutes");

// Check routes
app.use(authRoutes);
app.use(boardRoutes);
app.use(listRoutes);
app.use(cardRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

//1. Client sends a request
//user visits /boards
//frontend sends GET /boards
//express (server.js) forwards it to routes/boardRoutes.js

//2. Routes decide what function to run
//if someone requests GET /boards call getBoards()

//3. Controller does the work
//where the actual logic of the request happens


//flow

// Frontend
//     │
//     │ GET /boards
//     ▼
// server.js
//     │
//     ▼
// boardRoutes.js
//     │
//     │ router.get("/")
//     ▼
// boardController.getBoards()
//     │
//     ▼
// Database (Prisma)
//     │
//     ▼
// Returns boards
//     │
//     ▼
// Controller sends JSON
//     │
//     ▼
// Frontend receives data

//how to connect database to backend


//PROPER STEP BY STEP

//1.
//send a request 

//method - POST

//URL
//http://localhost:3000/register

//body: {"username": "john", "password": "password123"}
//this data is sent as the request body

//2.
//server.js receives the request

//app.use(express.json()); - converts the JSON into a JavaScript object and attaches it to req.body

// req.body = {
//     username: "john",
//     password: "password123"
// }

//Express done looks at the routes
// app.use(authRoutes);

//since the URL is POST /register sends the request to:
// router.post("/register", register);

//3. router.post("/register", register); - if someone makes a POST request to /register, call the register function
//express calls register(req, res)

//4. const register = async (req, res) => {
// req.body contains:
//  {
//     username: "john",
//     password: "password123"
// }


//test the routes
//do the rest of the routes and see how to use documentation efficiently