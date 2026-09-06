const express = require("express");
const router = express.Router();

const {getCards, createCards} = require("../controllers/cardController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/cards", authToken, authMiddleware, getCards);

router.post("/cards", authToken, authMiddleware, createCards);

router.put("/cards/:id", authToken, authMiddleware, (req, res) => {
    res.send(`Update card ${req.params.id}`);
});

router.delete("/cards/:id", authToken, authMiddleware, (req, res) => {
    res.send(`Delete card ${req.params.id}`);
});

module.exports = router;