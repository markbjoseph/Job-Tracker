const prisma = require("../thePrisma");


const getBoards = async (req, res) => {

    const boards = await prisma.board.findMany({
        where: { ownerId: req.user.userId },
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

    const board = await prisma.board.update({
        where: { id },
        data: { title },
    });

    res.status(200).json(board);
};

module.exports = { getBoards, createBoard, updateBoard };