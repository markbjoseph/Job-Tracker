const express = require("express");
const router = express.Router();

const {getCards, createCards, updateCards, deleteCards} = require("../controllers/cardController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/cards", authToken, authMiddleware, getCards);

router.post("/cards", authToken, authMiddleware, createCards);

router.put("/cards/:id", authToken, authMiddleware, updateCards);


router.delete("/cards/:id", authToken, authMiddleware, deleteCards);

module.exports = router;