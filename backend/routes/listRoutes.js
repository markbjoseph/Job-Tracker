const express = require("express");
const router = express.Router();

const {getLists, createList, updateList} = require("../controllers/listController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/lists", authToken, authMiddleware, getLists);

router.post("/lists", authToken, authMiddleware, createList);

router.put("/lists/:id", authToken, authMiddleware, updateList);

router.delete("/lists/:id", authToken, authMiddleware, (req, res) => {
    res.send(`Delete list ${req.params.id}`);
});

module.exports = router;