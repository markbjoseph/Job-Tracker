const prisma = require("../thePrisma");

const getCards = async (req, res) => {

    const id = parseInt(req.query.listId);

    const cards = await prisma.card.findMany({
        where: { listId: id },
    });
    res.status(200).json(cards);

};

const createCards = async (req, res) => {
    
    const { title, description, listId } = req.body;
    const id = parseInt(listId)

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

    const cards = await prisma.card.update({
        where: {id},
        data: {title, description}
    })

    res.status(200).json(cards);

};



module.exports = {getCards, createCards, updateCards};