const express = require("express");
const router = express.Router();

const {getLists, createList, updateList, deleteList, updatePositions} = require("../controllers/listController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/lists", authToken, authMiddleware, getLists);

router.post("/lists", authToken, authMiddleware, createList);

router.put("/lists/reorder", authToken, authMiddleware, updatePositions);

router.put("/lists/:id", authToken, authMiddleware, updateList);

router.delete("/lists/:id", authToken, authMiddleware, deleteList);

module.exports = router;