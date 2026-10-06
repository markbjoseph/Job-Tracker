const prisma = require("../thePrisma");
const { canAccessList, canEditList, canEditCard } = require("./boardAccess");
const { logActivity } = require("./activity");

const getCards = async (req, res) => {

    const id = parseInt(req.query.listId);

    if (!(await canAccessList(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }


    const cards = await prisma.card.findMany({
        where: { listId: id },
    });
    res.status(200).json(cards);

};

const createCards = async (req, res) => {
    
    const { title, description, listId } = req.body;
    const id = parseInt(listId)

    // the check gives back the board, used below for the activity log
    const board = await canEditList(req.user.userId, id);

    if (!board) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }


    const mostRecentCard = await prisma.card.findFirst({
        where: {
            listId: listId
        },
        orderBy: {
            position: "desc"
        }
    })

    const newPosition = mostRecentCard ? mostRecentCard.position + 1 : 1;

    const cards = await prisma.card.create({
        data: {
            title: title,
            description: description,
            position: newPosition,
            listId: id
        }
    })

    await logActivity(req.user.userId, board.workspaceId, "created", "card", cards.title, `on board "${board.title}"`);

    res.status(201).json(cards);

};

const updateCards = async (req, res) => {

    const { title, description } = req.body;
    const id = parseInt(req.params.id);

    const board = await canEditCard(req.user.userId, id);

    if (!board) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }

    // what it was before, so the log can say what changed
    const before = await prisma.card.findUnique({ where: { id } });


    const data = {};

    if(title !== undefined) {
        data.title = title;
    }

    if(description !== undefined) {
        data.description = description;
    }

    const cards = await prisma.card.update({
        where: {id},
        data: data
    });

    if (title !== undefined && before.title !== cards.title) {
        await logActivity(req.user.userId, board.workspaceId, "updated", "card", cards.title, `renamed from "${before.title}" on board "${board.title}"`);
    }

    if (description !== undefined && (before.description || "") !== (cards.description || "")) {
        await logActivity(req.user.userId, board.workspaceId, "updated", "card", cards.title, `changed the description on board "${board.title}"`);
    }

    res.status(200).json(cards);

};

const deleteCards = async (req, res) => {

    const id = parseInt(req.params.id);

    const board = await canEditCard(req.user.userId, id);

    if (!board) {
        return res.status(403).json({ message: "You only have view access to this board" });
    }


    const cards = await prisma.card.delete({
        where: {
            id
        }
    })

    await logActivity(req.user.userId, board.workspaceId, "deleted", "card", cards.title, `from board "${board.title}"`);

    res.status(200).json(cards);
}

const updateCardPositions = async (req, res) => {

    const lists = req.body

    let board = null;

    for (const list of lists) {
        board = await canEditList(req.user.userId, list.id);

        if (!board) {
            return res.status(403).json({ message: "You only have view access to this board" });
        }
        for (const card of list.cards) {
            if (!(await canEditCard(req.user.userId, card.id))) {
                return res.status(403).json({ message: "You only have view access to this board" });
            }
        }
    }
    
    // where every card was before the drag, to spot cards that changed list
    const cardIds = lists.flatMap((list) => list.cards.map((card) => card.id));
    const before = await prisma.card.findMany({ where: { id: { in: cardIds } } });
    const oldListOf = Object.fromEntries(before.map((card) => [card.id, card.listId]));
    const listNames = Object.fromEntries(lists.map((list) => [list.id, list.title]));

    for (const list of lists) {
        for(const card of list.cards) {
            await prisma.card.update({
                where: {id: card.id},
                data: {
                    position: card.position,
                    listId: list.id
                }
            })

            // only log cards that went to a different list, not every reshuffle
            const oldListId = oldListOf[card.id];

            if (board && oldListId !== undefined && oldListId !== list.id) {
                await logActivity(
                    req.user.userId,
                    board.workspaceId,
                    "moved",
                    "card",
                    card.title,
                    `from "${listNames[oldListId] || "another list"}" to "${list.title}" on board "${board.title}"`
                );
            }
        }
    }

    res.status(200).json(lists);
}



module.exports = {getCards, createCards, updateCards, deleteCards, updateCardPositions};