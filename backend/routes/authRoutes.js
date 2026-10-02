const express = require("express");

//router is an object that stores routes
//like a table of instructions
//  method | path | function
const router = express.Router();

//goes to the authController.js file and imports the register and login functions
const { register, login, getMe, updateMe, updatePassword, getDevices } = require("../controllers/authController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

// Register

//compares from initial request POST http://localhost:3000/register

// with the body

// {
//     "name": "Mark",
//     "email": "mark@email.com",
//     "password": "password123"
// }

//so this would be the HTTP requeest

// Method: POST
// Path: /register
// Headers: ...
// Body:
// {
//     "name": "Mark",
//     "email": "mark@email.com",
//     "password": "password123"
// }

//express looks at incoming request which is POST and confirm that it is the same as router.post(...)
//express looks at the incoming request which is /register which matches "/register"


router.post("/register", register);
//register has no parentheses so it is not being called, it instead passes the function itself so express stores it

//so express remembers 
// Method	Path	Function
// POST	/register	register

//the router remembers if someone sends a POST request to /register then call this function

// Login
router.post("/login", login);

// Get the logged in user's username and email
router.get("/me", authToken, authMiddleware, getMe);

// Update the logged in user's username and email
router.put("/me", authToken, authMiddleware, updateMe);

// Change the logged in user's password
router.put("/me/password", authToken, authMiddleware, updatePassword);

// The logged in user's recent logins (browser, IP, time)
router.get("/me/devices", authToken, authMiddleware, getDevices);

module.exports = router;