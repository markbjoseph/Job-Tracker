const prisma = require("../thePrisma");

const getLists = async (req, res) => {

    const id = parseInt(req.query.boardId);

    const lists = await prisma.list.findMany({
        where: { boardId: id },
    });
    res.status(200).json(lists);

};

const createList = async (req, res) => {
    const { title, boardId } = req.body;
    const id = parseInt(boardId)

    const mostRecentList = await prisma.list.findFirst({
        where: {
            boardId: id
        },
        orderBy: {
            position: "desc"
        }
    });

    const newPosition = mostRecentList ? mostRecentList.position + 1: 1;

    const list = await prisma.list.create({
        data: {
            title: title, 
            boardId: id,
            position: newPosition
        }
    })
    res.status(201).json(list);
};

const updateList = async (req, res) => {

    const id = parseInt(req.params.id)
    const { title } = req.body;

    const list = await prisma.list.update({
        where: {id},
        data: {title}
    })

    res.status(200).json(list);

}



module.exports = { getLists, createList, updateList };