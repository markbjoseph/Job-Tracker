const prisma = require("../thePrisma");

// Returns the board if the user owns it or is a member of it, otherwise null
const canAccessBoard = async (userId, boardId) => {

    if (!boardId) return null;

    return prisma.board.findFirst({
        where: {
            id: boardId,
            OR: [
                { ownerId: userId },
                { members: { some: { userId } } }
            ]
        }
    });
};

// Looks up which board a list belongs to, then checks access
const canAccessList = async (userId, listId) => {

    const list = await prisma.list.findUnique({ where: { id: listId } });

    if (!list) return null;

    return canAccessBoard(userId, list.boardId);
};

// Looks up which list a card belongs to, then checks access
const canAccessCard = async (userId, cardId) => {

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card) return null;

    return canAccessList(userId, card.listId);
};

module.exports = { canAccessBoard, canAccessList, canAccessCard };
