const prisma = require("../thePrisma");
const { canAccessWorkspace, canEditWorkspace, canEditBoard, getWorkspaceRole } = require("./boardAccess");
const { logActivity } = require("./activity");


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

    // owners, admins and members can add boards (not viewers)
    if (!(await canEditWorkspace(req.user.userId, workspaceId))) {
        return res.status(403).json({ message: "You only have view access to this workspace" });
    }

    const board = await prisma.board.create({
        data: {
            title,
            ownerId: req.user.userId,
            workspaceId,
        },
    });

    await logActivity(req.user.userId, workspaceId, "created", "board", board.title);

    res.status(201).json(board);
};

const updateBoard = async (req, res) => {
    const { title } = req.body;
    const  id  = parseInt(req.params.id);

    // the check gives back the board as it was, so the log can say what it was renamed from
    const before = await canEditBoard(req.user.userId, id);

    if (!before) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }

    const board = await prisma.board.update({
        where: { id },
        data: { title },
    });

    if (before.title !== board.title) {
        await logActivity(req.user.userId, board.workspaceId, "updated", "board", board.title, `renamed from "${before.title}"`);
    }

    res.status(200).json(board);
};

const deleteBoard = async (req, res) => {
    const id = parseInt(req.params.id);

    const board = await prisma.board.findUnique({ where: { id } });

    const role = board && await getWorkspaceRole(req.user.userId, board.workspaceId);

    // the workspace owner and admins can delete any board,
    // members can delete boards they made, viewers can't delete anything
    const canDelete =
        role === "owner" ||
        role === "admin" ||
        (role === "member" && board.ownerId === req.user.userId);

    if (!canDelete) {
        return res.status(403).json({ message: "You don't have permission to delete this board" });
    }

    // cards and lists aren't set to cascade, so delete them first
    await prisma.$transaction([
        prisma.card.deleteMany({ where: { list: { boardId: id } } }),
        prisma.list.deleteMany({ where: { boardId: id } }),
        prisma.board.delete({ where: { id } })
    ]);

    await logActivity(req.user.userId, board.workspaceId, "deleted", "board", board.title);

    res.status(200).json(board);
};

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
