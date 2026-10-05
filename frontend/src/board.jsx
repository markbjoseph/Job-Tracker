    import React, { useEffect, useState } from "react";
    import "./board.css";
    import AccountMenu from "./AccountMenu";
    import ShareWorkspaceModal from "./ShareWorkspaceModal";
    import "./modal.css";
    import { useNavigate, useParams } from "react-router-dom";

    function Board() {

    // ----------------------------------------------------------------------------

    //variables
    const [title, setTitle] = useState("");

    //stores the list of boards, lists, and cards retrieved from the backend
    const [boards, setBoards] = useState([]);
    const [lists, setLists] = useState([]);
    

    //stores the board the user chooses
    const [selectedBoard, setSelectedBoard] = useState(null);

    const [showCardModal, setShowCardModal] = useState(false);

    const [selectedCard, setSelectedCard] = useState(null);

    const [showTextList, setShowTextList] = useState(false);

    const [selectedList, setSelectedList] = useState(false);


    // id of the list currently showing the temporary "new card"
    const [addingCardListId, setAddingCardListId] = useState(null);







    const [showListMenu, setShowListMenu] = useState(false);

    const [showCardMenu, setShowCardMenu] = useState(false);

    const [draggedList, setDraggedList] = useState(null);

    const [draggedCard, setDraggedCard] = useState(null);

    const [dropPosition, setDropPosition] = useState(null);

    const [emptyListDrop, setEmptyListDrop] = useState(null);

    const [dropListPosition, setDropListPosition] = useState(null);

    const [selectedButton, setSelectedButton] = useState("Boards")

    const [sideBarOpen, setSideBarOpen] = useState(true);



    const [boardMenuId, setBoardMenuId] = useState(null);

    // true while the temporary "new board" row is showing in the sidebar
    const [addingBoard, setAddingBoard] = useState(false);


    const navigate = useNavigate();

    // the workspace being viewed comes from the URL: /workspaces/:workspaceId
    const { workspaceId } = useParams();

    const [workspace, setWorkspace] = useState(null);

    const [showMembersModal, setShowMembersModal] = useState(false);






    // ----------------------------------------------------------------------------

    const getBoards = async () => {

        //sends a GET request to the backend for this workspace's boards
        const response = await fetch(`http://localhost:3000/boards?workspaceId=${workspaceId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        // no access (or it was deleted), go back to the list of workspaces
        if (!response.ok) {
            navigate("/workspaces");
            return;
        }

        const data = await response.json();

        setBoards(data);

        console.log(data);

    };


    // workspace name for the sidebar
    const getWorkspace = async () => {

        const response = await fetch(`http://localhost:3000/workspaces/${workspaceId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            return;
        }

        setWorkspace(await response.json());
    };

    // reload when switching to a different workspace
    useEffect(() => {
        setSelectedBoard(null);
        setLists([]);
        getWorkspace();
        getBoards();
    }, [workspaceId]);

    const createBoard = async (e) => {

        const newBoardTitle = e.target.innerText.trim();

        // hide the temporary row either way
        setAddingBoard(false);

        // left empty, nothing to save
        if (!newBoardTitle) {
            return;
        }

        //sends a POST request to the backend
        const response = await fetch("http://localhost:3000/boards", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: newBoardTitle, workspaceId })

        });

        const data = await response.json();
        
        console.log(data);

        await getBoards();

        // open the board that was just made
        setSelectedBoard(data);
        getList(data);
    };




    const deleteBoard = async (board) => {

        if (!window.confirm(`Delete "${board.title}" and all of its lists and cards?`)) {
            return;
        }

        const response = await fetch(`http://localhost:3000/boards/${board.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        setBoards((currentBoards) => currentBoards.filter((b) => b.id !== board.id));

        // close the board if it was the one open
        if (selectedBoard?.id === board.id) {
            setSelectedBoard(null);
            setLists([]);
        }
    };



    const createCard = async (listId, e) => {

        const newCardTitle = e.target.innerText.trim();

        // hide the temporary card either way
        setAddingCardListId(null);

        // left empty, nothing to save
        if (!newCardTitle) {
            return;
        }

        const response = await fetch("http://localhost:3000/cards", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json" 
            }, 
            body: JSON.stringify({title: newCardTitle, description: "", listId})
        });

        const data = await response.json();
        console.log(data);

        await getList(selectedBoard);
    }

    const updateBoard = async (e) => {

        const boardTitle = e.target.innerText.trim();

        // nothing changed (or left empty), put the old title back and skip saving
        if (!boardTitle || boardTitle === selectedBoard.title) {
            e.target.innerText = selectedBoard.title;
            return;
        }

        //sends a PUT request to the backend
        const response = await fetch(`http://localhost:3000/boards/${selectedBoard.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: boardTitle })

        });

        const data = await response.json();
        
        console.log(data);

        if (!response.ok) {
            e.target.innerText = selectedBoard.title;
            return;
        }

        // update the open board and its name in the sidebar
        setSelectedBoard(data);

        setBoards((currentBoards) =>
            currentBoards.map((board) =>
                board.id === data.id ? data : board
            )
        );
    };

    const updateList = async (list, e) => {

        const listTitle = e.target.innerText.trim();

        // nothing changed (or left empty), put the old title back and skip saving
        if (!listTitle || listTitle === list.title) {
            e.target.innerText = list.title;
            return;
        }

        const response = await fetch(`http://localhost:3000/lists/${list.id}`, {
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
            currentLists.map((currentList) =>
                currentList.id === list.id
                    ? { ...currentList, title: listTitle }
                    : currentList
            )
        );
    }

    // replace the edited card on screen with the updated one from the server
    const replaceCard = (updatedCard) => {
        setSelectedCard(updatedCard);

        setLists((currentLists) =>
            currentLists.map((list) => ({
                ...list,
                cards: list.cards?.map((card) =>
                    card.id === updatedCard.id ? updatedCard : card
                )
            }))
        );
    };

    const updateCardTitle = async (e) => {

        const cardTitle = e.target.innerText.trim();

        // nothing changed (or left empty), put the old title back and skip saving
        if (!cardTitle || cardTitle === selectedCard.title) {
            e.target.innerText = selectedCard.title;
            return;
        }


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

        replaceCard(data);
    };

    const updateCardDescription = async (e) => {

        const cardDescription = e.target.innerText.trim();

        if (cardDescription === (selectedCard.description || "")) {
            return;
        }


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

        replaceCard(data);
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

    const updateCardPositions = async (newLists) => {

        const response = await fetch(`http://localhost:3000/cards/reorder`, {
            method: "PUT",
            headers: {
                Authorization:`Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
              }, 
            body: JSON.stringify(
                newLists.map((list, index) => ({
                    ...list, 
                    cards: list.cards.map((card, index) => ({
                        ...card, 
                        position: index + 1
                    }))
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

        setTitle("");
        setShowTextList(false);

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

            {/* account icon, top right */}
            <AccountMenu />

            {/* share this workspace, next to the account icon */}
            <button
            type="button"
            className="top-share"
            onClick={() => setShowMembersModal(true)}
            >
                Share Workspace
            </button>
                                        
                    {/* sidebar */}

                
                    <div className={`sidebar ${sideBarOpen ? "sidebar-open" : "sidebar-closed"}`}>

                        <div className="header">

                        {/* open/close icon, three horizontal lines */}
                        <svg
                        className="sidebar-toggle"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        role="button"
                        aria-label="Toggle sidebar"
                        onClick={() => setSideBarOpen(!sideBarOpen)}
                        >
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>

                        {/* back to the list of all workspaces */}
                        {sideBarOpen && (
                            <button
                            type="button"
                            className="sidebar-icon-button"
                            aria-label="Workspaces"
                            title="Workspaces"
                            onClick={() => navigate("/workspaces")}
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                </svg>
                            </button>
                        )}

                        </div>

                        {/* everything below the open/close icon */}
                        <div className="sidebar-content">

                        {/* which workspace these boards belong to */}
                        {sideBarOpen && (
                            <div className="sidebar-workspace">
                                <div className="sidebar-workspace-row">
                                    <span className="sidebar-workspace-name">{workspace?.name}</span>
                                </div>
                            </div>
                        )}

                        {/* section title */}
                        {sideBarOpen && <h2 className="sidebar-subheading">Boards</h2>}

                        {sideBarOpen && (
                            <div className="sidebar-board-list">
                            {boards.map((board) => (
                        
                            <div
                            key={board.id}
                            className={`sidebar-item ${boardMenuId === board.id ? "menu-open" : ""}`}
                            >

                                <button
                                type="button"
                                className={`sidebar-button ${selectedBoard?.id === board.id ? "selected" : ""}`}
                                onClick={() => {
                                    setSelectedBoard(board);
                                    getList(board);
                                }}
                                >

                                {board.title}

                                </button>

                                {/* three dots, only visible on hover */}
                                <div className="board-menu-container"
                                tabIndex={0}
                                onBlur={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) {
                                        setBoardMenuId(null);
                                    }
                                }}
                                >

                                    <button className="board-menu-button" type="button"
                                    onClick={() => setBoardMenuId(boardMenuId === board.id ? null : board.id)}
                                    >⋮
                                    </button>

                                    {boardMenuId === board.id && (
                                        <div className="board-menu">
                                            <button className="danger" onClick={() => {
                                                setBoardMenuId(null);
                                                deleteBoard(board);
                                            }}>
                                                Delete board
                                            </button>
                                        </div>
                                    )}

                                </div>

                            </div>

                            ))}

                        {/* temporary board row, type the name straight into it */}
                        {addingBoard && (
                            <div className="sidebar-item">
                                <div
                                className="sidebar-button new-board editable"
                                contentEditable
                                suppressContentEditableWarning
                                data-placeholder="Enter a board name..."
                                ref={(el) => el && el.focus()}
                                onBlur={createBoard}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.target.blur();
                                    }

                                    // escape cancels without saving
                                    if (e.key === "Escape") {
                                        e.target.innerText = "";
                                        e.target.blur();
                                    }
                                }}
                                />
                            </div>
                        )}

                        {!addingBoard && (
                            <button
                            type="button"
                            className="sidebar-button add-board"
                            onClick={() => setAddingBoard(true)}
                            >
                                Add a Board +
                            </button>
                        )}

                            </div>
                        )}

                        </div>

                        

                    </div>  
                    


        {/* to display the lists and cards  */}
        {selectedBoard && (
            <div className={`main-content ${sideBarOpen ? "sidebar-open" : "sidebar-closed"}`}>
                
                <div className="board-header">

                    {/* edit the board title in place, saves when clicking away */}
                    <h2
                    key={`board-title-${selectedBoard.id}-${selectedBoard.title}`}
                    className="editable"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={updateBoard}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.target.blur();
                        }
                    }}
                    >
                        {selectedBoard.title}
                    </h2>

                </div>
                
                <div className="lists-container">

                    {lists.map((list) => (

                        <React.Fragment key={list.id}>
                        
                        {/* is the current list used the target and is it on the left side */}
                        {dropListPosition?.listId === list.id &&
                            dropListPosition?.position === "left" && (
                                <div className="list-drop-indicator"
                                
                                onDragOver={(e) => {
                                    e.preventDefault();
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();

                                    if(!draggedList) {
                                        return;
                                    }

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
                                    setDropListPosition(null);
                                    }}
                                >

                                </div>
                            )}


                        <div className="list" 
                        draggable

                        //ondragstart runs when the user starts dragging a list
                        //remembers that the user is dragging a particular list 
                        onDragStart={() => {
                            setDraggedList(list);
                        }}
                        
                        onDragEnd={() => {
                            setDraggedList(null);
                            setDropListPosition(null);
                        }}
                        
                        //ondragover runs when the user drags a list over another list
                        onDragOver={(e) => {
                            //dont use the default behaviour, allow this list to be a drop target 
                            e.preventDefault();

                            if(draggedList) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const mouseX = e.clientX;
                                const middleX = rect.left + rect.width /2;

                                if(mouseX < middleX) {
                                    setDropListPosition({
                                        listId: list.id,
                                        position: "left"
                                    });
                                } else {
                                    setDropListPosition({
                                        listId: list.id,
                                        position: "right" 
                                    });
                                }
   
                            }

                            if(draggedCard && list.cards.length === 0) {
                                setDropPosition(null);
                                setEmptyListDrop(list.id);
                            }

                            
                        }}

                        //ondrop runs when the mouse is released over a particular list
                        onDrop={() => {

                            if(draggedCard) {
                                
                                const newLists = lists.map(list => ({
                                    ...list,
                                    cards: [...list.cards]
                                }));

                                //find the list the card came from
                                const sourceList = newLists.find(
                                    item => item.cards.some(card => card.id === draggedCard.id)
                                );

                                if (!sourceList) {
                                    return;
                                }

                                //find the card's position in the source list
                                const draggedIndex = sourceList.cards.findIndex(
                                    card => card.id === draggedCard.id
                                );

                                //remove card from source list
                                sourceList.cards.splice(draggedIndex, 1);

                                //the current list is the list being dropped onto
                                const targetList = newLists.find(
                                    item => item.id === list.id
                                );

                                if (!targetList) {
                                    return;
                                }

                                // Add card to the target list
                                targetList.cards.push(draggedCard);

                                setLists(newLists);

                                updateCardPositions(newLists);

                                setDraggedCard(null);
                                setDropPosition(null);
                                setEmptyListDrop(null);

                                return;

                            }

                        }}
                    
                        >
                        
                            <div className="list-header">

                                {/* edit the list title in place, saves when clicking away */}
                                <h3
                                key={`list-title-${list.title}`}
                                className="editable"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateList(list, e)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.target.blur();
                                    }
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
                                                    <button onClick={deleteList}>Delete List</button>
                                                </div>
                                            )}
                                        </div>

                            </div>

                            <div className= "cards-container">
                                {list.cards.map(card => (

                                    <div key={card.id}

                                    //want the whole area around the card to participate in drag and drop
                                    //wraps for each card
                                    //card wrapper contains drop indicator and card button
                                    className="card-wrapper" 

                                            draggable

                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                setDraggedCard(card);
                                            }}
                                            

                                            //function runs repeatedly while the user is dragging something over this wrapper
                                            onDragOver={(e) => {

                                                if(!draggedCard) {
                                                    return
                                                }

                                                e.preventDefault();

                                                setEmptyListDrop(null);

                                                //the element that this event handler is attached to 
                                                //where is the element on the screen

                                                const rect = e.currentTarget.getBoundingClientRect();

                                                //mouse vertical position
                                                const mouseY = e.clientY;

                                                //middle of the wrapper
                                                const middleY = rect.top + rect.height / 2;
                                                
                                                //is the mouse above the middle of the card
                                                if(mouseY < middleY) {

                                                    //stores cardId and the position
                                                    setDropPosition({
                                                        cardId: card.id,
                                                        position: "top"
                                                    });
                                                } else {
                                                    setDropPosition({
                                                            cardId: card.id,
                                                            position: "bottom"
                                                        });
                                                }
                                            }}

                                            onDrop={(e) => {

                                                e.preventDefault();
                                                e.stopPropagation();

                                                if(!draggedCard || !dropPosition) {
                                                    return;
                                                }

                                                if(draggedCard.id === dropPosition.cardId) {
                                                    setDraggedCard(null);
                                                    setDropPosition(null);
                                                    return;
                                                }

                                                const newLists = lists.map(list => ({
                                                    ...list,
                                                    cards: [...list.cards]
                                                }));

                                                //find the list that the dragged card is from
                                                //searches through each of the lists and inside that list will find the card that matches the draggedcardId
                                                //if there is a match in .some() then it returns true
                                                //.find() will see that .some returns true and returns which list it was iterating on 
                                                const sourceList = newLists.find(i => i.cards.some(card => card.id === draggedCard.id));
                                                //const numberList = numbers.find(number => | number === 2);
                                                //                                          |

                                                if (!sourceList) {
                                                    return;
                                                }

                                                //get the index of the dragged card in the source list's cards array 
                                                const draggedIndex = sourceList.cards.findIndex(card => card.id === draggedCard.id);
                                                
                                                //remove the dragged card from the list being modified specifically in the list it is in
                                                sourceList.cards.splice(draggedIndex, 1);

                                                //find the list that the dragged card is being dropped on
                                                const targetList = newLists.find(i => i.id === list.id);

                                                if(!targetList) {
                                                    return;
                                                }

                                                const targetIndex = targetList.cards.findIndex(i => i.id === dropPosition.cardId)

                                                if(targetIndex === -1) {
                                                    return;
                                                }

                                                let insertIndex;

                                                if (dropPosition.position === "top") {
                                                    insertIndex = targetIndex;
                                                } else {
                                                    insertIndex = targetIndex + 1;
                                                }

                                                targetList.cards.splice(insertIndex, 0, draggedCard)

                                                setLists(newLists);

                                                updateCardPositions(newLists);

                                                setDraggedCard(null);

                                                setDropPosition(null);

                                            }}
                                            > 



                                            
                                            {/* only render the indicator if the current card is the target card and the position is top */}
                                            {dropPosition?.cardId === card.id &&
                                                dropPosition?.position === "top" && (
                                                    <div className="drop-indicator"></div>
                                                )}

                                            {/* the card the user sees */}
                                            <button 
                                            className="card" 

                                            onClick={() => {
                                                setShowCardModal(true)
                                                setSelectedCard(card);
                                            }
                                            }
                                        >
                                            {card.title}
                                            </button>

                                        {dropPosition?.cardId === card.id &&
                                            dropPosition?.position === "bottom" && (
                                                <div className="drop-indicator"></div>
                                            )}

                                    </div>

                            ))}

                                {/* temporary card, type the title straight into it */}
                                {addingCardListId === list.id && (
                                    <div
                                    className="card new-card editable"
                                    contentEditable
                                    suppressContentEditableWarning
                                    data-placeholder="Enter a title for this card..."
                                    ref={(el) => el && el.focus()}
                                    onBlur={(e) => createCard(list.id, e)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.target.blur();
                                        }

                                        // escape cancels without saving
                                        if (e.key === "Escape") {
                                            e.target.innerText = "";
                                            e.target.blur();
                                        }
                                    }}
                                    />
                                )}

                            </div>

                                {draggedCard && list.cards.length === 0 && emptyListDrop === list.id && (
                                    <div className="drop-indicator"></div>
                                    )}
                        
                            {addingCardListId !== list.id && (
                                <button 
                                className="add-card"
                                onClick={() => setAddingCardListId(list.id)}
                                >
                                    Add a Card + 
                                </button>
                            )}

    

                        </div>

                        {dropListPosition?.listId === list.id &&
                            dropListPosition?.position === "right" && (
                                <div className="list-drop-indicator"
                                
                                onDragOver={(e) => {
                                    e.preventDefault();
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();

                                    if(!draggedList) {
                                        return;
                                    }

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
                                    newLists.splice(targetIndex + 1, 0, draggedList); 

                                    //replace old list with new order
                                    setLists(newLists);

                                    updatePositions(newLists);

                                    //reset dragged list
                                    setDraggedList(null);
                                    setDropListPosition(null);
                                    }}
                                >

                                </div>
                            )}

                    </React.Fragment>
                    ))}

                    {/* add a list, sits after the last list */}
                    <div className="add-list">

                        {!showTextList ? (
                            <button
                            type="button"
                            className="add-list-button"
                            onClick={() => setShowTextList(true)}
                            >
                                + Add another list
                            </button>
                        ) : (
                            <form onSubmit={createList}>

                                <input
                                type="text"
                                placeholder="Enter list title"
                                onChange={(e) => setTitle(e.target.value)}
                                value={title}
                                autoFocus
                                required
                                />

                                <div className="add-list-actions">
                                    <button type="submit">
                                        Add List
                                    </button>

                                    <button type="button" onClick={() => {
                                        setShowTextList(false);
                                        setTitle("");
                                    }}>
                                        Cancel
                                    </button>
                                </div>

                            </form>
                        )}

                    </div>
                </div>

            </div>
        )}

    {showCardModal && (
        <div className="modal-overlay">

            <div className="modal">

                <div className="card-header">

                    {/* edit the title in place, saves when clicking away */}
                    <h2
                    key={`title-${selectedCard.title}`}
                    className="card-title editable"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={updateCardTitle}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.target.blur();
                        }
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
                                <button onClick={deleteCard}>Delete Card</button>
                            </div>
                        )}

                    </div>
                </div>

                {/* edit the description in place, saves when clicking away */}
                <p
                key={`description-${selectedCard.description}`}
                className="editable"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Add a description..."
                onBlur={updateCardDescription}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.target.blur();
                    }
                }}
                >
                    {selectedCard.description}
                </p>

                <button onClick={() => setShowCardModal(false)}>Close</button>

            </div>

        </div>
    )}

    {showMembersModal && (
        <ShareWorkspaceModal
        workspaceId={workspaceId}
        onClose={() => setShowMembersModal(false)}
        />
    )}

        </div>

    );


}

    export default Board;