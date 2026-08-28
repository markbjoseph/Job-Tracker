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

                        <div className="list" key={list.id}>

                            <h3>{list.title}</h3>

                            <div className= "cards-container">
                                {list.cards.map(card => (

                                <button key={card.id} className="card" 
                                onClick={() => {
                                    setShowCardModal(true)
                                    setSelectedCard(card);
                                }
                                }>
                                    {card.title}
                                </button>

                            ))}</div>
                        
                            <button className="add-card">
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
                <h2>{selectedCard ? selectedCard.title : 'Card Details'}</h2>
                <p>{selectedCard ? selectedCard.description : 'Card information goes here.'}</p>
                <button onClick={() => setShowCardModal(false)}>Close</button>
            </div>
        </div>
    )}

        </div>

    );


}

    export default Board;



    // update code 

                //     {selectedBoard && (
                //     <div>
                //         <h2>Update Board</h2>

                //         <form onSubmit={updateBoard}>

                //             <input
                //                 type="text"
                //                 value={updateTitle}
                //                 onChange={(e) => setUpdateTitle(e.target.value)}
                //             />

                //             <button type="submit">
                //                 Update Board
                //             </button>

                //         </form>
                //     </div>
                // )}