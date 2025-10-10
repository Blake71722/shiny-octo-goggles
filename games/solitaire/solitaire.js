// Klondike Solitaire - fully playable JS version

const suits = ["♠", "♥", "♣", "♦"];
const suitNames = { "♠": "Spades", "♥": "Hearts", "♣": "Clubs", "♦": "Diamonds" };
const ranks = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ];
const colors = { "♠": "black", "♣": "black", "♥": "red", "♦": "red" };

let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let selected = null; // { pileType, pileIdx, cardIdx }
let statusMsg = "";

function createShuffledDeck() {
  let deck = [];
  for (let s = 0; s < 4; ++s) {
    for (let r = 0; r < 13; ++r) {
      deck.push({
        suit: suits[s],
        rank: ranks[r],
        color: colors[suits[s]],
        up: false
      });
    }
  }
  for (let i = deck.length - 1; i > 0; --i) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function setupGame() {
  stock = createShuffledDeck();
  waste = [];
  foundations = [[], [], [], []];
  tableau = [[], [], [], [], [], [], []];
  selected = null;
  statusMsg = "";
  // Deal to tableau
  for (let i = 0; i < 7; ++i) {
    for (let j = 0; j <= i; ++j) {
      let card = stock.pop();
      card.up = (j === i);
      tableau[i].push(card);
    }
  }
  drawBoard();
}

function drawBoard() {
  const board = document.getElementById("solitaire-board");
  board.innerHTML = "";

  // Top row: Stock, Waste, Foundations
  const topRow = document.createElement("div");
  topRow.className = "row";

  // Stock
  const stockDiv = document.createElement("div");
  stockDiv.className = "stock pile";
  stockDiv.style.position = "relative";
  stockDiv.style.overflow = "visible";
  if (stock.length > 0) {
    let back = document.createElement("div");
    back.className = "card back";
    back.style.position = "absolute";
    back.style.left = "0px";
    back.style.top = "0px";
    back.style.zIndex = 1;
    stockDiv.appendChild(back);
    stockDiv.title = 'Click to draw card';
    stockDiv.onclick = () => {
      if (stock.length > 0) {
        let card = stock.pop();
        card.up = true;
        waste.push(card);
        selected = null;
        drawBoard();
        setStatus('');
      }
    };
  } else {
    // If stock empty, click to recycle waste
    stockDiv.title = "Click to recycle waste";
    stockDiv.onclick = () => {
      if (stock.length === 0 && waste.length > 0) {
        while (waste.length > 0) {
          let card = waste.pop();
          card.up = false;
          stock.push(card);
        }
        selected = null;
        drawBoard();
        setStatus('Deck recycled.');
      }
    };
  }
  topRow.appendChild(stockDiv);

  // Waste
  const wasteDiv = document.createElement("div");
  wasteDiv.className = "waste pile";
  if (waste.length > 0) {
    let card = waste[waste.length - 1];
    let el = renderCard(card, { pileType: "waste", pileIdx: 0, cardIdx: waste.length - 1 });
    wasteDiv.appendChild(el);
  }
  topRow.appendChild(wasteDiv);

  // Foundations
  for (let i = 0; i < 4; ++i) {
    const fDiv = document.createElement("div");
    fDiv.className = "foundation pile";
    fDiv.title = suitNames[suits[i]];
    if (foundations[i].length > 0) {
      let card = foundations[i][foundations[i].length - 1];
      let el = renderCard(card, { pileType: "foundation", pileIdx: i, cardIdx: foundations[i].length - 1 });
      fDiv.appendChild(el);
    }
    fDiv.onclick = () => {
      if (selected && canMoveToFoundation(selected, i)) {
        moveToFoundation(selected, i);
        drawBoard();
        checkWin();
      }
    };
    topRow.appendChild(fDiv);
  }
  board.appendChild(topRow);

  // Tableau
  const tableauRow = document.createElement("div");
  tableauRow.className = "row";
  for (let i = 0; i < 7; ++i) {
    const pileDiv = document.createElement("div");
    pileDiv.className = "pile";
    pileDiv.style.position = "relative";
    pileDiv.style.overflow = "visible";
    for (let j = 0; j < tableau[i].length; ++j) {
      let card = tableau[i][j];
      let el = renderCard(card, { pileType: "tableau", pileIdx: i, cardIdx: j });
      el.style.top = (j * 22) + "px";
      pileDiv.appendChild(el);
    }
    // Allow dropping onto empty tableau piles
    pileDiv.onclick = (e) => {
      if (e.target !== pileDiv) return;
      if (selected && canMoveToTableau(selected, i)) {
        moveToTableau(selected, i);
        drawBoard();
      }
    };
    tableauRow.appendChild(pileDiv);
  }
  board.appendChild(tableauRow);

  // Status
  document.getElementById("status").textContent = statusMsg;
}

function renderCard(card, ref) {
  const el = document.createElement("div");
  el.className = "card";
  if (card.color === "red") el.classList.add("red");
  if (!card.up) {
    el.classList.add("back");
    el.innerHTML = "";
    el.onclick = (e) => {
      // Only turn over if it's the top face-down card in tableau
      if (ref && ref.pileType === "tableau" && ref.cardIdx === tableau[ref.pileIdx].length - 1) {
        card.up = true;
        selected = null;
        drawBoard();
      }
      e.stopPropagation();
    };
    return el;
  }
  el.innerHTML = `<div>${card.rank}</div><div style="align-self:flex-end">${card.suit}</div>`;
  el.style.zIndex = ref && ref.pileType === "tableau" ? ref.cardIdx + 1 : 1;
  if (selected &&
    selected.pileType === ref.pileType &&
    selected.pileIdx === ref.pileIdx &&
    selected.cardIdx === ref.cardIdx
  ) el.classList.add("selected");

  el.onclick = (e) => {
    e.stopPropagation();
    handleCardClick(ref);
  };
  return el;
}

// Click logic
function handleCardClick(ref) {
  // If nothing is selected, select the card if movable
  if (!selected) {
    if (ref.pileType === "waste" && waste.length > 0) {
      selected = { ...ref };
      setStatus("Selected waste card. Click destination.");
    }
    else if (ref.pileType === "tableau") {
      let pile = tableau[ref.pileIdx];
      if (pile[ref.cardIdx].up) {
        selected = { ...ref };
        setStatus("Selected tableau card(s). Click destination.");
      }
    }
    else if (ref.pileType === "foundation") {
      // Allow moving top card off foundation
      if (foundations[ref.pileIdx].length > 0) {
        selected = { ...ref };
        setStatus("Selected foundation card. Click destination.");
      }
    }
    drawBoard();
    return;
  }

  // If a card is already selected, try to move it to clicked card's pile
  if (ref.pileType === "foundation") {
    if (canMoveToFoundation(selected, ref.pileIdx)) {
      moveToFoundation(selected, ref.pileIdx);
      drawBoard();
      checkWin();
      return;
    }
  }
  if (ref.pileType === "tableau") {
    if (canMoveToTableau(selected, ref.pileIdx, ref.cardIdx)) {
      moveToTableau(selected, ref.pileIdx, ref.cardIdx);
      drawBoard();
      return;
    }
    // If clicking a tableau card, change selection
    let pile = tableau[ref.pileIdx];
    if (pile[ref.cardIdx].up) {
      selected = { ...ref };
      setStatus("Selected tableau card(s). Click destination.");
      drawBoard();
      return;
    }
  }
  // Clicking same card deselects
  if (selected &&
    selected.pileType === ref.pileType &&
    selected.pileIdx === ref.pileIdx &&
    selected.cardIdx === ref.cardIdx
  ) {
    selected = null;
    setStatus('');
    drawBoard();
  }
}

// Move logic
function canMoveToFoundation(sel, destIdx) {
  let card = getSelectedCard(sel);
  if (!card) return false;
  if (card.up === false) return false;
  let foundation = foundations[destIdx];
  // Only allow single card moves
  if (sel.pileType === "tableau" && sel.cardIdx !== tableau[sel.pileIdx].length - 1) return false;
  if (sel.pileType === "waste" && sel.cardIdx !== waste.length - 1) return false;
  if (sel.pileType === "foundation" && sel.cardIdx !== foundations[sel.pileIdx].length - 1) return false;
  if (foundation.length === 0) return card.rank === "A";
  let top = foundation[foundation.length - 1];
  return card.suit === top.suit && ranks.indexOf(card.rank) === ranks.indexOf(top.rank) + 1;
}
function moveToFoundation(sel, destIdx) {
  let card = removeSelectedCard(sel);
  foundations[destIdx].push(card);
  selected = null;
  setStatus(`Moved to foundation.`);
}

function canMoveToTableau(sel, destIdx, destCardIdx) {
  let cards = getSelectedCards(sel);
  if (!cards.length) return false;
  let destPile = tableau[destIdx];
  // Only allow drop onto top or empty pile
  if (typeof destCardIdx !== 'undefined' && destCardIdx !== destPile.length - 1) return false;
  if (destPile.length === 0) return cards[0].rank === "K";
  let destCard = destPile[destPile.length - 1];
  let movingCard = cards[0];
  return destCard.up &&
    colors[destCard.suit] !== colors[movingCard.suit] &&
    ranks.indexOf(destCard.rank) === ranks.indexOf(movingCard.rank) + 1;
}
function moveToTableau(sel, destIdx) {
  let cards = removeSelectedCards(sel);
  tableau[destIdx] = tableau[destIdx].concat(cards);
  selected = null;
  setStatus(`Moved to tableau.`);
}
function getSelectedCard(sel) {
  if (!sel) return null;
  if (sel.pileType === "waste") return waste[waste.length - 1];
  if (sel.pileType === "foundation") return foundations[sel.pileIdx][foundations[sel.pileIdx].length - 1];
  if (sel.pileType === "tableau") return tableau[sel.pileIdx][sel.cardIdx];
  return null;
}
function getSelectedCards(sel) {
  if (!sel) return [];
  if (sel.pileType === "tableau") {
    return tableau[sel.pileIdx].slice(sel.cardIdx);
  }
  let card = getSelectedCard(sel);
  return card ? [card] : [];
}
function removeSelectedCard(sel) {
  if (!sel) return null;
  if (sel.pileType === "waste") return waste.pop();
  if (sel.pileType === "foundation") return foundations[sel.pileIdx].pop();
  if (sel.pileType === "tableau") return tableau[sel.pileIdx].splice(sel.cardIdx, 1)[0];
  return null;
}
function removeSelectedCards(sel) {
  if (!sel) return [];
  if (sel.pileType === "tableau") {
    let removed = tableau[sel.pileIdx].splice(sel.cardIdx);
    // Flip next card if necessary
    let pile = tableau[sel.pileIdx];
    if (pile.length > 0 && !pile[pile.length - 1].up)
      pile[pile.length - 1].up = true;
    return removed;
  }
  let card = removeSelectedCard(sel);
  return card ? [card] : [];
}

// Status message
function setStatus(msg) {
  statusMsg = msg;
  document.getElementById("status").textContent = statusMsg;
}

// Win check
function checkWin() {
  if (foundations.every(f => f.length === 13)) {
    setStatus("Congratulations! You won!");
    selected = null;
  }
}

document.getElementById("new-game-btn").onclick = setupGame;
window.onload = setupGame;
