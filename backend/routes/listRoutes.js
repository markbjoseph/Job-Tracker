const express = require("express");
const router = express.Router();

const getLists = require("../controllers/listController");
const authToken = require("../middleware/authToken");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/lists", authToken, authMiddleware, getLists);


router.post("/lists", (req, res) => {
    res.send("List created");
});

router.put("/lists/:id", (req, res) => {
    res.send(`Update list ${req.params.id}`);
});

router.delete("/lists/:id", (req, res) => {
    res.send(`Delete list ${req.params.id}`);
});

module.exports = router;