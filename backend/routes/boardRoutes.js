const express = require("express");
const router = express.Router();

const {getBoards, createBoard, updateBoard} = require("../controllers/boardController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

// Get all boards
router.get("/boards", authToken, authMiddleware, getBoards);

// Create board
router.post("/boards", authToken, authMiddleware, createBoard);

// Update board
router.put("/boards/:id", authToken, authMiddleware, updateBoard);

// Delete board
router.delete("/boards/:id", authToken, authMiddleware, (req, res) => {
    res.send(`Delete board ${req.params.id}`);
});

module.exports = router;