const prisma = require("../thePrisma");
const { canAccessBoard, canEditBoard, canEditList } = require("./boardAccess");

const getLists = async (req, res) => {

    const id = parseInt(req.query.boardId);

    if (!(await canAccessBoard(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }


    const lists = await prisma.list.findMany({
        where: { boardId: id },

        orderBy: {
            position: "asc"
        }
    });
    res.status(200).json(lists);

};

const createList = async (req, res) => {
    const { title, boardId } = req.body;
    const id = parseInt(boardId)

    if (!(await canEditBoard(req.user.userId, id))) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }


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

    if (!(await canEditList(req.user.userId, id))) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }


    const list = await prisma.list.update({
        where: {id},
        data: {title}
    })

    res.status(200).json(list);

}

const updatePositions = async (req, res) => {

    const lists = req.body;

    for (const list of lists) {
        if (!(await canEditList(req.user.userId, list.id))) {
            return res.status(403).json({ message: "You only have view access to this board" });
        }
    }

    for (const list of lists) {
        await prisma.list.update({
            where: { id: list.id },
            data: { 
                position: list.position
             }
        })
    }

    res.status(200).json(lists);
}

const deleteList = async (req, res) => {

    const id = parseInt(req.params.id)

    if (!(await canEditList(req.user.userId, id))) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }


    await prisma.card.deleteMany({
        where: {
            listId: id
        }
    })

    const list = await prisma.list.delete({
        where: {
            id
        }
    })

    res.json(list);
}



module.exports = { getLists, createList, updateList, deleteList, updatePositions };