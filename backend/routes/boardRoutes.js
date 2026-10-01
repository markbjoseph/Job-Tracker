const express = require("express");
const router = express.Router();

const {getBoards, createBoard, updateBoard, getMembers, addMember, removeMember, deleteBoard} = require("../controllers/boardController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

// Get all boards
router.get("/boards", authToken, authMiddleware, getBoards);

// Create board
router.post("/boards", authToken, authMiddleware, createBoard);

// Update board
router.put("/boards/:id", authToken, authMiddleware, updateBoard);

// Board members
router.get("/boards/:id/members", authToken, authMiddleware, getMembers);

router.post("/boards/:id/members", authToken, authMiddleware, addMember);

router.delete("/boards/:id/members/:userId", authToken, authMiddleware, removeMember);

// Delete board
router.delete("/boards/:id", authToken, authMiddleware, deleteBoard);

module.exports = router;