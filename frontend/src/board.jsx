    import { useState } from "react";
    import "./board.css";

    function Board() {

    // ----------------------------------------------------------------------------

    //variables
    const [title, setTitle] = useState("");
    const [updateTitle, setUpdateTitle] = useState("");

    //stores the list of boards, lists, and cards retrieved from the backend
    const [boards, setBoards] = useState([]);
    const [lists, setLists] = useState([]);
    //controls whether the modal is visible or not 
    const [showBoards, setShowBoards] = useState(false);

    //stores the board the user chooses
    const [selectedBoard, setSelectedBoard] = useState(null);

    const [showCardModal, setShowCardModal] = useState(false);

    const [selectedCard, setSelectedCard] = useState(null);

    const [showTextList, setShowTextList] = useState(false);

    const [editingList, setEditingList] = useState(false);
    const [selectedList, setSelectedList] = useState(false);

    const [listTitle, setListTitle] = useState(false);

    const [addCardModal, setAddCardModal] = useState(false);

    const [newCardTitle, setNewCardTitle] = useState(false);

    const [newCardDescription, setNewCardDescription] = useState(false);

    const [editingCardTitle, setEditingCardTitle] = useState(false);

    const [cardTitle, setCardTitle] = useState(false);

    const [editingCardDescription, setEditingCardDescription] = useState(false);

    const [cardDescription, setCardDescription] = useState(false);

    const [showListMenu, setShowListMenu] = useState(false);

    const [showCardMenu, setShowCardMenu] = useState(false);

    const [draggedList, setDraggedList] = useState(null);

    const [draggedCard, setDraggedCard] = useState(null);


    // ----------------------------------------------------------------------------

    const userBoards = async (e) => {
        e.preventDefault();

        //sends a GET request to the backend
        const response = await fetch("http://localhost:3000/boards", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        setBoards(data);
        setShowBoards(true);

        console.log(data);

    };

    const createBoard = async (e) => {
        e.preventDefault();

        //sends a POST request to the backend
        const response = await fetch("http://localhost:3000/boards", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title })

        });

        const data = await response.json();
        
        console.log(data);
    };

    const createCard = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:3000/cards", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json" 
            }, 
            body: JSON.stringify({title: newCardTitle, description: newCardDescription, listId: selectedList})
        });

        const data = await response.json();
        console.log(data);

        setAddCardModal(false);

        await getList(selectedBoard);

        
    }

    const updateBoard = async (e) => {
        e.preventDefault();

        //sends a PUT request to the backend
        const response = await fetch(`http://localhost:3000/boards/${selectedBoard.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title:updateTitle })

        });

        const data = await response.json();
        
        console.log(data);
    };

    const updateList = async (e) => {

        const response = await fetch(`http://localhost:3000/lists/${editingList}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({title: listTitle})
        });

        const data = await response.json();
        console.log(data);

            setLists((currentLists) =>
                currentLists.map((list) =>
                    list.id === editingList
            ? { ...list, title: listTitle }
            : list
        )
    );

    setEditingList(null);
        
    }

    const updateCardTitle = async (e) => {

        const response = await fetch(`http://localhost:3000/cards/${selectedCard.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`, 
                "Content-Type": "application/json"
            },
            body:JSON.stringify({title: cardTitle})
        });

        const data = await response.json();
        console.log(data);
    };

    const updateCardDescription = async (e) => {

        const response = await fetch(`http://localhost:3000/cards/${selectedCard.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({description: cardDescription})
        });

        const data = await response.json();
        console.log(data);
    }

    const updatePositions = async (newLists) => {

        const response = await fetch(`http://localhost:3000/lists/reorder`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                newLists.map((list, index) => ({
                    id: list.id,
                    position: index + 1
                }))
            )
        })

        
        const data = await response.json();
        console.log(data);
    }

    const getList = async (board) => {
        
        //gets the lists for the selected board
        //sends a GET request to the backend
        const response = await fetch(`http://localhost:3000/lists?boardId=${board.id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();
        console.log(data);

        //gets the cards for each list
        const listsWithCards = await Promise.all(

            data.map(async (list) => {
                const response = await fetch(`http://localhost:3000/cards?listId=${list.id}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const cards = await response.json();
                return { ...list, cards };
            }))
        
        setLists(listsWithCards);
        console.log(listsWithCards);

    };

    const createList = async (e) => {
        e.preventDefault();

        //sends a POST request to the backend
        const response = await fetch("http://localhost:3000/lists", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({title: title,
                boardId: selectedBoard.id
             })

        });

        const data = await response.json();
        
        console.log(data);

        await getList(selectedBoard)
    };

    const deleteList = async () => {

        //sends a DELETE request to the backend
        const response = await fetch(`http://localhost:3000/lists/${selectedList.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },

        });

        const data = await response.json();
        
        console.log(data);

        setLists(currentLists => currentLists.filter(list => list.id !== selectedList.id));
        setShowListMenu(false);
        setSelectedList(null);
    };

        const deleteCard = async () => {

        //sends a DELETE request to the backend
        const response = await fetch(`http://localhost:3000/cards/${selectedCard.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },

        });

        const data = await response.json();
        
        console.log(data);

        setLists(currentLists => currentLists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== selectedCard.id)
        })))

        setShowCardMenu(false);
        setSelectedCard(null);
        setShowCardModal(false);
    };
    
    

    return (
        <div>

            {!selectedBoard && (
                <div>
                                        
                    {/* boards button */}
                    <div className="sidebar">

                        <form onSubmit={userBoards}>

                            <button type="submit">
                                Profile
                            </button>

                        </form>

                        <form onSubmit={userBoards}>

                            <button type="submit">
                               Settings
                            </button>

                        </form>

                        <form onSubmit={userBoards}>

                            <button type="submit">
                               Boards
                            </button>

                        </form>

                        <form onSubmit={userBoards}>

                            <button type="submit">
                               Members
                            </button>

                        </form>
                        

                    </div> 


                    {/* board options when board button is opened  */}
                    <div className="main-content">
                        <div>
                            {/* if show boards is true render everything inside */}
                            {showBoards && (
                                <div className="board-overlay">

                                    <div className="board-modal">
                                        <h1>Boards</h1>


                                        {/* takes your boards array and goes through each board */}
                                        {boards.map((board) => (

                                            // each board becomes a button
                                            <button
                                                key={board.id}

                                                // runs when the user clicks a particular board button
                                                onClick={() => {

                                                    //stores the selected board
                                                    setSelectedBoard(board);

                                                    getList(board);

                                                    //sets the update title to the title of the selected board (defaults to the name which can be changed later)
                                                    // setUpdateTitle(board.title);

                                                    //closes the modal
                                                    setShowBoards(false);
                                            }}
                                        >
                                                {board.title}
                                            </button>
                                        ))}
                                        
                                        <button onClick={() => setShowBoards(false)}>
                                            Close
                                        </button>
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>

                    {/* create board button */}
                    <div>
                        <h2>Create a New Board</h2>
                    
                        <form onSubmit={createBoard}>

                            <div>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter board title"
                                />
                            </div>

                            <button type="submit">
                                Create Board
                            </button>

                        </form>
                    </div>

                </div>
            )}

        {/* to display the lists and cards  */}
        {selectedBoard && (
            <div>
                
                <h2>{selectedBoard.title}</h2>
                
                <div className="lists-container">

                    {lists.map((list) => (

                        <div className="list" 
                        key={list.id} 
                        draggable

                        //ondragstart runs when the user starts dragging a list
                        //remembers that the user is dragging a particular list 
                        onDragStart={() => {
                            setDraggedList(list);
                        }}
                        
                        //ondragover runs when the user drags a list over another list
                        onDragOver={(e) => {
                            //dont use the default behaviour, allow this list to be a drop target 
                            e.preventDefault();
                        }}

                        //ondrop runs when the mouse is released over a particular list
                        onDrop={() => {

                            //make a copy of the lists array so it can be modified
                            const newLists = [...lists];

                            //finds the index of the dragged list originally
                            const draggedIndex = newLists.findIndex(item => item.id === draggedList.id);

                            //find the index of where the list that is taking the spot's index is
                            //when releasing the dragged list to the list that is occupying the spot, onDrop belonging to the list that is occupying the spot's <div> runs
                            const targetIndex = newLists.findIndex(item => item.id === list.id);
                            
                            //starting at index 1, remove 1 item so the list that was index 1 is removed from the list
                            newLists.splice(draggedIndex, 1);

                            //starting at target index, remove 0 items and add the dragged list
                            newLists.splice(targetIndex, 0, draggedList); 

                            //replace old list with new order
                            setLists(newLists);

                            updatePositions(newLists);

                            //reset dragged list
                            setDraggedList(null);
                        }}
                    
                        >


                            {editingList === list.id ? (
                                <input
                                    type="text"
                                    value={listTitle}
                                    onChange={(e) => setListTitle(e.target.value)}
                                    onBlur={updateList}
                                    autoFocus
                                />

                            ) : (
                                <div className="list-header">
                                    <h3
                                        onClick={() => {
                                            setEditingList(list.id);
                                            setListTitle(list.title);
                                        }}
                                        >
                                            {list.title}
                                        </h3>

                                        <div className="menu-container"
                                        tabIndex={0}
                                        onBlur={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                                setShowListMenu(false);
                                            }
                                        }}
                                        >
                                        
                                            <button className="list-menu"
                                            onClick={() => {
                                                setShowListMenu(true)
                                                setSelectedList(list)
                                            }}>⋮
                                            </button>

                                            {showListMenu && selectedList?.id === list.id && (
                                                <div className="list-menu-dropdown">
                                                    <button>Edit List</button>
                                                    <button onClick={deleteList}>Delete List</button>
                                                </div>
                                            )}
                                        </div>
                                </div>

                            )}

                            <div className= "cards-container">
                                {list.cards.map(card => (

                                <button 
                                key={card.id} 
                                className="card" 

                                onClick={() => {
                                    setShowCardModal(true)
                                    setSelectedCard(card);
                                }
                                }
                                draggable

                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggedCard(card);
                                }}

                                onDragOver={(e) => {
                                    e.preventDefault();
                                }}

                                onDrop={(e) => {

                                    e.stopPropagation();
                                    
                                    const newLists = [...lists];

                                    //find the list that the dragged card is from
                                    //searches through each of the lists and inside that list will find the card that matches the draggedcardId
                                    //if there is a match in .some() then it returns true
                                    //.find() will see that .some returns true and returns which list it was iterating on 
                                    const sourceList = newLists.find(i => i.cards.some(card => card.id === draggedCard.id));
                                    //const numberList = numbers.find(number => | number === 2);
                                    //                                          |


                                    //get the index of the dragged card in the source list's cards array 
                                    const draggedIndex = sourceList.cards.findIndex(card => card.id === draggedCard.id);
                                    
                                    //remove the dragged card from the list being modified specifically in the list it is in
                                    newLists.forEach(i => {
                                        if (i.id === sourceList.id) {
                                            i.cards.splice(draggedIndex, 1);
                                        }
                                    });

                                    //find the list that the dragged card is being dropped on
                                    const targetList = newLists.find(i => i.id === list.id);



                                    newLists.forEach( i => {
                                        if(i.id === targetList.id) {
                                            i.cards.splice(targetList.cards.length, 0, draggedCard);
                                        }
                                    })

                                    setLists(newLists);

                                    setDraggedCard(null);

                                }}
                                >
                                    {card.title}
                                </button>

                            ))}</div>
                        
                            <button 
                            className="add-card"
                            onClick={() => {
                                setAddCardModal(true)
                                setSelectedList(list.id)
                            }}>
                                Add a Card + 
                            </button>

    

                        </div>

                    ))}
                </div>

                {!showTextList && (
                    <button onClick={() => setShowTextList(true)}>
                        Add Another List
                    </button>
                )}
                
                {showTextList && (
                <div>
                    
                    <input type="text" 
                    placeholder="Enter list title"
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                     />

                    <form onSubmit={createList}>
                        <button type="submit">
                            Add List
                        </button>
                    </form>
                </div>
                )}

            </div>
        )}

    {showCardModal && (
        <div className="modal-overlay">

            <div className="modal">

                {editingCardTitle ? (
                    <input 
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    onBlur={updateCardTitle}
                    />

                ) : (

                <div className="card-header">   
                 
                    <h2
                    className="card-title" 
                    onClick={() => {
                        setEditingCardTitle(true)
                        setCardTitle(selectedCard.title)
                        }}
                    >

                        {selectedCard.title}

                    </h2>
                    
                    <div className="menu-container">

                        <button className="card-menu"
                        onClick={() => {
                            setShowCardMenu(true)
                            }}>⋮
                        </button>
                        
                        {showCardMenu && (
                            <div className="list-menu-dropdown">
                                <button>Edit List</button>
                                <button onClick={deleteCard}>Delete Card</button>
                            </div>
                        )}

                    </div>
                </div>
                )}

                {editingCardDescription ? (
                    <input 
                    type="text"
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    onBlur={updateCardDescription}
                    />

                ) : (
                    <p onClick={() => {
                        setEditingCardDescription(true)
                        setCardDescription(selectedCard.description)
                    }}>
                        {selectedCard.description}
                    </p>
                )}

                <button onClick={() => setShowCardModal(false)}>Close</button>

            </div>

        </div>
    )}

    {addCardModal && (
        <div className="modal-overlay">
            <div className="modal">

                <form onSubmit={createCard}>
                
                    <input 
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Enter a Title"
                    />          

                    <input 
                    type="text"
                    value={newCardDescription}
                    onChange={(e) => setNewCardDescription(e.target.value)}
                    placeholder="Enter a Description"
                    />  

                    <button type="submit">
                        Add
                    </button>

                </form>      
            </div>
        </div>
    )}

        </div>

    );


}

    export default Board;