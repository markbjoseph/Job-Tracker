const express = require("express");
const router = express.Router();

const {getBoards, createBoard, updateBoard, deleteBoard} = require("../controllers/boardController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

// Get all boards in a workspace (?workspaceId=)
router.get("/boards", authToken, authMiddleware, getBoards);

// Create board
router.post("/boards", authToken, authMiddleware, createBoard);

// Update board
router.put("/boards/:id", authToken, authMiddleware, updateBoard);

// Delete board
router.delete("/boards/:id", authToken, authMiddleware, deleteBoard);

module.exports = router;