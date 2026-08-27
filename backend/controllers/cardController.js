const prisma = require("../thePrisma");

const getCards = async (req, res) => {

    const id = parseInt(req.query.listId);

    const cards = await prisma.card.findMany({
        where: { listId: id },
    });
    res.status(200).json(cards);

};

module.exports = getCards;