const prisma = require("../thePrisma");

const getLists = async (req, res) => {

    const id = parseInt(req.query.boardId);

    const lists = await prisma.list.findMany({
        where: { boardId: id },
    });
    res.status(200).json(lists);

};

module.exports = getLists;