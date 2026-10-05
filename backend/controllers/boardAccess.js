const prisma = require("../thePrisma");

// "the user owns this workspace or it has been shared with them"
const workspaceAccess = (userId) => ({
    OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
    ]
});

// Returns the workspace if the user owns it or is a member of it, otherwise null
const canAccessWorkspace = async (userId, workspaceId) => {

    if (!workspaceId) return null;

    return prisma.workspace.findFirst({
        where: { id: workspaceId, ...workspaceAccess(userId) }
    });
};

// Returns the board if the user can access the workspace it's in, otherwise null
const canAccessBoard = async (userId, boardId) => {

    if (!boardId) return null;

    return prisma.board.findFirst({
        where: {
            id: boardId,
            workspace: workspaceAccess(userId)
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

module.exports = { workspaceAccess, canAccessWorkspace, canAccessBoard, canAccessList, canAccessCard };
