const prisma = require("../thePrisma");
const { canAccessBoard, canEditBoard, canEditList } = require("./boardAccess");
const { logActivity } = require("./activity");

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

    // the check gives back the board, used below for the activity log
    const board = await canEditBoard(req.user.userId, id);

    if (!board) {
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

    await logActivity(req.user.userId, board.workspaceId, "created", "list", list.title, `on board "${board.title}"`);

    res.status(201).json(list);
};

const updateList = async (req, res) => {

    const id = parseInt(req.params.id)
    const { title } = req.body;

    const board = await canEditList(req.user.userId, id);

    if (!board) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }

    // old title, so the log can say what it was renamed from
    const before = await prisma.list.findUnique({ where: { id } });

    const list = await prisma.list.update({
        where: {id},
        data: {title}
    })

    if (before.title !== list.title) {
        await logActivity(req.user.userId, board.workspaceId, "updated", "list", list.title, `renamed from "${before.title}" on board "${board.title}"`);
    }

    res.status(200).json(list);

}

const updatePositions = async (req, res) => {

    const lists = req.body;

    let board = null;

    for (const list of lists) {
        board = await canEditList(req.user.userId, list.id);

        if (!board) {
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

    // one entry for the whole drag, not one per list
    if (board) {
        await logActivity(req.user.userId, board.workspaceId, "moved", "list", "Lists", `reordered on board "${board.title}"`);
    }

    res.status(200).json(lists);
}

const deleteList = async (req, res) => {

    const id = parseInt(req.params.id)

    const board = await canEditList(req.user.userId, id);

    if (!board) {
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

    await logActivity(req.user.userId, board.workspaceId, "deleted", "list", list.title, `from board "${board.title}"`);

    res.json(list);
}



module.exports = { getLists, createList, updateList, deleteList, updatePositions };