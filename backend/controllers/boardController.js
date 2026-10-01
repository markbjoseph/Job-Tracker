const prisma = require("../thePrisma");
const { canAccessBoard } = require("./boardAccess");


const getBoards = async (req, res) => {

    // boards the user owns or has been invited to
    const boards = await prisma.board.findMany({
        where: {
            OR: [
                { ownerId: req.user.userId },
                { members: { some: { userId: req.user.userId } } }
            ]
        },
    });

    res.status(200).json(boards);
};


const createBoard = async (req, res) => {
    const { title } = req.body;

    const board = await prisma.board.create({
        data: {
            title,
            ownerId: req.user.userId,
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

const getMembers = async (req, res) => {
    const id = parseInt(req.params.id);

    if (!(await canAccessBoard(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }

    const board = await prisma.board.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, username: true, email: true } },
            members: {
                include: { user: { select: { id: true, username: true, email: true } } }
            }
        }
    });

    res.status(200).json({
        owner: board.owner,
        members: board.members.map((member) => member.user)
    });
};

const addMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const { email } = req.body;

    const board = await prisma.board.findUnique({ where: { id } });

    // only the owner can invite people
    if (!board || board.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the board owner can invite members" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.id === board.ownerId) {
        return res.status(400).json({ message: "You already own this board" });
    }

    try {
        await prisma.boardMember.create({
            data: { boardId: id, userId: user.id }
        });
    } catch (error) {
        // P2002 = unique constraint failed, so they're already a member
        if (error.code === "P2002") {
            return res.status(409).json({ message: "User is already a member" });
        }
        throw error;
    }

    res.status(201).json({ id: user.id, username: user.username, email: user.email });
};

const removeMember = async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    const board = await prisma.board.findUnique({ where: { id } });

    // owner can remove anyone, members can only remove themselves (leave)
    const isOwner = board && board.ownerId === req.user.userId;
    const isSelf = userId === req.user.userId;

    if (!board || (!isOwner && !isSelf)) {
        return res.status(403).json({ message: "Not allowed to remove this member" });
    }

    await prisma.boardMember.deleteMany({
        where: { boardId: id, userId }
    });

    res.status(200).json({ message: "Member removed" });
};

const deleteBoard = async (req, res) => {
    const id = parseInt(req.params.id);

    const board = await prisma.board.findUnique({ where: { id } });

    // only the owner can delete a board
    if (!board || board.ownerId !== req.user.userId) {
        return res.status(403).json({ message: "Only the board owner can delete this board" });
    }

    // cards and lists aren't set to cascade, so delete them first
    // (BoardMember rows cascade automatically when the board is deleted)
    await prisma.$transaction([
        prisma.card.deleteMany({ where: { list: { boardId: id } } }),
        prisma.list.deleteMany({ where: { boardId: id } }),
        prisma.board.delete({ where: { id } })
    ]);

    res.status(200).json(board);
};

module.exports = { getBoards, createBoard, updateBoard, getMembers, addMember, removeMember, deleteBoard };
