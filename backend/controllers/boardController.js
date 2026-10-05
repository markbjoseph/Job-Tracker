const prisma = require("../thePrisma");
const { canAccessWorkspace, canAccessBoard } = require("./boardAccess");


const getBoards = async (req, res) => {

    // GET /boards?workspaceId=3 → the boards inside that workspace
    const workspaceId = parseInt(req.query.workspaceId);

    if (!(await canAccessWorkspace(req.user.userId, workspaceId))) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const boards = await prisma.board.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
    });

    res.status(200).json(boards);
};


const createBoard = async (req, res) => {
    const { title } = req.body;
    const workspaceId = parseInt(req.body.workspaceId);

    // anyone in the workspace can add boards to it
    if (!(await canAccessWorkspace(req.user.userId, workspaceId))) {
        return res.status(403).json({ message: "No access to this workspace" });
    }

    const board = await prisma.board.create({
        data: {
            title,
            ownerId: req.user.userId,
            workspaceId,
        },
    });
    res.status(201).json(board);
};

const updateBoard = async (req, res) => {
    const { title } = req.body;
    const  id  = parseInt(req.params.id);

    if (!(await canAccessBoard(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }

    const board = await prisma.board.update({
        where: { id },
        data: { title },
    });

    res.status(200).json(board);
};

const deleteBoard = async (req, res) => {
    const id = parseInt(req.params.id);

    const board = await prisma.board.findUnique({
        where: { id },
        include: { workspace: true },
    });

    // the person who made the board or the workspace owner can delete it
    const isBoardCreator = board && board.ownerId === req.user.userId;
    const isWorkspaceOwner = board && board.workspace.ownerId === req.user.userId;

    if (!board || (!isBoardCreator && !isWorkspaceOwner)) {
        return res.status(403).json({ message: "Only the board creator or workspace owner can delete this board" });
    }

    // cards and lists aren't set to cascade, so delete them first
    await prisma.$transaction([
        prisma.card.deleteMany({ where: { list: { boardId: id } } }),
        prisma.list.deleteMany({ where: { boardId: id } }),
        prisma.board.delete({ where: { id } })
    ]);

    res.status(200).json(board);
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
