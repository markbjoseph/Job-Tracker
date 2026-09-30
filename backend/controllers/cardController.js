const prisma = require("../thePrisma");
const { canAccessList, canAccessCard } = require("./boardAccess");

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

    if (!(await canAccessList(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
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

    res.status(201).json(cards);

};

const updateCards = async (req, res) => {

    const { title, description } = req.body;
    const id = parseInt(req.params.id);

    if (!(await canAccessCard(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }


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

    res.status(200).json(cards);

};

const deleteCards = async (req, res) => {

    const id = parseInt(req.params.id);

    if (!(await canAccessCard(req.user.userId, id))) {
        return res.status(403).json({ message: "No access to this board" });
    }


    const cards = await prisma.card.delete({
        where: {
            id
        }
    })

    res.status(200).json(cards);
}

const updateCardPositions = async (req, res) => {

    const lists = req.body

    for (const list of lists) {
        if (!(await canAccessList(req.user.userId, list.id))) {
            return res.status(403).json({ message: "No access to this board" });
        }
        for (const card of list.cards) {
            if (!(await canAccessCard(req.user.userId, card.id))) {
                return res.status(403).json({ message: "No access to this board" });
            }
        }
    }
    
    for (const list of lists) {
        for(const card of list.cards) {
            await prisma.card.update({
                where: {id: card.id},
                data: {
                    position: card.position,
                    listId: list.id
                }
            })
        }
    }

    res.status(200).json(lists);
}



module.exports = {getCards, createCards, updateCards, deleteCards, updateCardPositions};