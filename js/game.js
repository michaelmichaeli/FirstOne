'use strict'
//VARIABLES:

const MINE = '💣';
const FLAG = '🚩';

var gBoard = [];
//////////////////////////////////////////
// EACH-CELL:   isMarked: false         //
//              minesAroundCount: 2,    //
//              isShown: true,          //
//              isMine: false,          //
//////////////////////////////////////////

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    firstClick: true,
    // hintsCount: 3,
    hintIsOn: false,
    lives: 3
}
var gLevel = {
    size: 4,
    mines: 2
};

var gInterval;
var gCurrentLevelSize;
var gUndoBoards = [];

//FUNCTIONS:
function initGame(size) {
    gCurrentLevelSize = size;

    var elHints = document.querySelector(".hints ul");
    if (elHints) elHints.remove();

    // var elUndo = document.querySelector(".undoClass");
    // if (elUndo) elUndo.remove();

    renderLives();
    renderUndoDiv();

    gUndoBoards = [];
    gGame.lives = 2;
    gGame.firstClick = true;
    updateLevel(size);
    gGame.isOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gBoard = buildBoard(gLevel.size);
    renderBoard(gBoard, ".msContainer");
    gGame.isOn = true;
    clearTimeout(gInterval);
    gInterval = null;
}

function undo() {
    if (gUndoBoards.length < 2) return
    gUndoBoards.pop();
    updateGboard();
    updateBoardToScreen();
}

function updateBoardToScreen(){
    // var elCell = document.querySeNum(text);
    logBoard(gBoard);
    
    if (gUndoBoards.length > 0){

    for (var i = 0 ; i < gBoard.length ; i++ ){
        for (var j = 0 ; j < gBoard.length ; j++){

            if (gBoard[i][j].isMine && gBoard[i][j].isShown){
                var elCell = document.querySelector("table").rows[i].cells[j];
                elCell.innerText = MINE;
                elCell.classList = [];
                elCell.classList.add("shown");
            }
            else if (gBoard[i][j].isMarked){
                var elCell = document.querySelector("table").rows[i].cells[j];
                elCell.innerText = FLAG;
            }
            else if (!gBoard[i][j].isShown){
                var elCell = document.querySelector("table").rows[i].cells[j];
                elCell.innerText = '';
                elCell.classList = [];
            }
            else if (gBoard[i][j].isShown && gBoard[i][j].minesAroundCount > 0){
                var elCell = document.querySelector("table").rows[i].cells[j];
                elCell.innerText = gBoard[i][j].minesAroundCount;
                elCell.style.color = getColorByNum(gBoard[i][j].minesAroundCount);
                elCell.classList = [];
                elCell.classList.add("shown");
            }
        }
    }
    }
    logBoard(gBoard);
}

function updateLevel(size) {
    if (size === 4) gLevel = { size: 4, mines: 2 };
    if (size === 8) gLevel = { size: 8, mines: 12 };
    if (size === 12) gLevel = { size: 12, mines: 30 };
}

function buildBoard(size) {
    var board = [];
    var cell = {};
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell;
        }
    }
    return board;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            gBoard[i][j].minesAroundCount = getNegCount(board, i, j);
        }
    }
}

function getNegCount(board, i, j) {
    var count = 0;
    // running on each cell to check for mined-negs
    for (var idx = i - 1; idx <= i + 1; idx++) {
        for (var jdx = j - 1; jdx <= j + 1; jdx++) {
            if (idx < 0 || idx >= board.length || jdx < 0 || jdx >= board.length) continue; // skipping when outside the board size
            if (idx === i && jdx === j) continue; // skipping the cell checking itself
            if (board[idx][jdx].isMine) count++;
        }
    }
    return count;
}

function cellMarked(ev, i, j) {
    // console.log(gGame.shownCount);

    if (gBoard[i][j].isShown) return;
    if (gBoard[i][j].isMarked) {
        gGame.markedCount--;
        unPaintShown(i, j);
        renderCell(i, j, ' ');
        gBoard[i][j].isMarked = false;
        return;
    }
    gGame.markedCount++;
    gBoard[i][j].isMarked = true;
    renderCell(i, j, FLAG);

    updateHistoryLog();
    logBoard(gBoard);

    checkGameStatus(i, j, true);
}

function renderBoard(board, selector) {
    var strHTML = '<table border="0" id="tb"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = 'cell cell' + i + '-' + j;
            var textInCell = ' ';
            if (board[i][j].isShown) {
                if (board[i][j].isMine) {
                    textInCell = MINE;
                }
                else {
                    textInCell = board[i][j].minesAroundCount ? board[i][j].minesAroundCount : "";
                }
            }
            strHTML += `<td class="${className}" oncontextmenu="cellMarked(event, ${i}, ${j})" onclick="cellClicked(event, ${i}, ${j})">${textInCell}</td>`;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    //rendering to the dom
    var elContain = document.querySelector(selector);
    elContain.innerHTML = strHTML;
    logBoard(gBoard);
}

function renderCell(i, j, text) {
    //dom
    var elCell = document.querySelector("table").rows[i].cells[j];
    elCell.innerText = text;
    elCell.style.color = getColorByNum(text);
    if (gGame.hintIsOn) return
    if (!gBoard[i][j].isMarked || gBoard[i][j].isMine) elCell.classList.add("shown");
}

function getColorByNum(numOfNegs) {
    var res;
    switch (numOfNegs) {
        case 1:
            res = "blue"
            break;
        case 2:
            res = "green"
            break;
        case 3:
            res = "red"
            break;
        case 4:
            res = "darkblue"
            break;
        case 5:
            res = "orange"
            break;
        default: res = ""
            break;
    }
    return res;
}

function logBoard(board) {
    //rendering to the log
    var logBoard = '';
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isShown) logBoard += 'X';
            else if (board[i][j].isMarked){
                logBoard += '>';
            }
            else logBoard += '0';
            logBoard += '\t';
        }
        logBoard += '\n';
    }
    console.log(logBoard);
}

function cellClicked(ev, i, j) {

    if (gGame.firstClick) {
        populateMines(i, j);
        renderHintsDiv();
        // renderUndo();
        secsPassed(".timer");
    }
    if (gGame.hintIsOn) {
        HintBlink(true);
        showHintCells(i, j);
        gGame.hintIsOn = false;
        return
    }

    if (gBoard[i][j].isShown) return;

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    renderCell(i, j, getCellContent(i, j));
    expandShown(i, j);
    
    updateHistoryLog();
    logBoard(gBoard);
    
    checkGameStatus(i, j, false)
return;
}
        
function updateHistoryLog(){
    var board = [];
    var cell = {};
    for (var i = 0; i < gBoard.length; i++) {
        board.push([]);
        for (var j = 0; j < gBoard.length; j++) {
            cell = {
                minesAroundCount: gBoard[i][j].minesAroundCount,
                isShown: gBoard[i][j].isShown,
                isMine: gBoard[i][j].isMine,
                isMarked: gBoard[i][j].isMarked
            }
            board[i][j] = cell;
        }
    }
    gUndoBoards.push(board);    
}

 function updateGboard(){
    if (gUndoBoards.length === 0) return;

    // gUndoBoards.pop();
    var cell = {};
    var gUndoBoard = gUndoBoards[gUndoBoards.length-1];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            cell = {
                minesAroundCount: gUndoBoard[i][j].minesAroundCount,
                isShown: gUndoBoard[i][j].isShown,
                isMine: gUndoBoard[i][j].isMine,
                isMarked: gUndoBoard[i][j].isMarked
            }
            gBoard[i][j] = cell;
        }
    }    
 }

function getNegs(i, j) {
    var negs = [];
    for (var idx = i - 1; idx <= i + 1; idx++) {
        for (var jdx = j - 1; jdx <= j + 1; jdx++) {
            if (idx < 0 || idx >= gBoard.length || jdx < 0 || jdx >= gBoard.length) continue;
            if (idx === i && j === jdx) continue;
            negs.push({ i: idx, j: jdx });
        }
    }
    return negs;
}

function expandShown(i, j) {
    if (gBoard[i][j].minesAroundCount > 0) {
        return;
    }
    var negs = getNegs(i, j);
    for (var index = 0; index < negs.length; index++) {
        var idx = negs[index].i;
        var jdx = negs[index].j;

        if (gBoard[idx][jdx].isShown) continue;
        if (gBoard[idx][jdx].isMine) continue;
        if (gBoard[idx][jdx].minesAroundCount > 0) {
            gBoard[idx][jdx].isShown = true;
            gGame.shownCount++;
            renderCell(idx, jdx, getCellContent(idx, jdx));
            continue;
        }

        gBoard[idx][jdx].isShown = true;
        gGame.shownCount++;
        renderCell(idx, jdx, getCellContent(idx, jdx));

        if (gBoard[idx][jdx].minesAroundCount === 0) expandShown(idx, jdx);
    }
}

function getCellContent(i, j) {
    if (gBoard[i][j].isMine) return MINE;
    if (gBoard[i][j].minesAroundCount > 0) return gBoard[i][j].minesAroundCount;
    if (gBoard[i][j].minesAroundCount === 0) return ' ';
}

function checkGameStatus(i, j, isRightClick) {
    if (gBoard[i][j].isMine && !isRightClick) {
        if (gGame.lives > 0) {
            if (gLevel.size ** 2 === getShownCount()) {
                revealBoard();
                gameWin();
            }
            gGame.lives--;
            var elLive = document.querySelector(".lives ul li");
            elLive.remove();
            return;
        }
        var elLive = document.querySelector(".lives ul li");
        elLive.remove();
        revealBoard();
        gameOver();
        return;
    }
    if (gLevel.size ** 2 === getNonMineShownCount() + getMarkedMinesCount() + getShownMinesCount()) {
        revealBoard();
        gameWin();
    }
    if (gLevel.mines === getMarkedMinesCount() + getShownMinesCount()
        && getNonMineShownCount() === getShownMinesCount()) {
        revealBoard();
        gameWin();
    }
    // console.log(gLevel.size ** 2, ' - ', getShownCount(), '=', gLevel.mines);
    if (gLevel.size ** 2 - getShownCount() === gLevel.mines) {
        revealBoard();
        gameWin();
    }
    if (getShownCount() === gLevel.size ** 2 && gGame.isOn) {
        revealBoard();
        gameWin();
    }
    if (getShownMinesCount === gLevel.mines) {
        revealBoard();
        gameWin();
    }
}

function getShownCount() {
    var count = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isShown) count++;
        }
    }
    return count;
}

function getShownMinesCount() {
    var count = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine && gBoard[i][j].isShown) count++;
        }
    }
    return count;
}

function getNonMineShownCount() {
    var count = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (!gBoard[i][j].isMine && gBoard[i][j].isShown) count++;
        }
    }
    return count;
}

function getMarkedMinesCount() {
    var count = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine && gBoard[i][j].isMarked) count++;
        }
    }
    return count;
}

function getShownMinesCount() {
    var count = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isShown && gBoard[i][j].isMine) {
                count++;
            }
        }
    }
    return count;
}

function gameWin() {
    if (!gGame.isOn) return;

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine) {
                setCellShown(i, j);
                renderCell(i, j, FLAG);
            }
        }
    }
    clearTimeout(gInterval);
    gGame.isOn = false;
    setTimeout(() => {
        victoryModal();
    }, 2000);
}

function gameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine){
                var elCell = document.querySelector("table").rows[i].cells[j];
                elCell.style.backgroundColor = "red";
            } 
        }
    }
    clearTimeout(gInterval);
    gGame.isOn = false;

    setTimeout(() => {
        gameOverModal();
    }, 2000);
}

function gameOverModal() {
    // Display the modal
    var elModal = document.querySelector("#gameOverModal");
    elModal.style.display = "block";
    // When the user clicks on Play again, close the modal and init game.
    var elBtn = document.querySelector(".modal-content button");
    elBtn.onclick = function () {
        elModal.style.display = "none";
        initGame(gCurrentLevelSize);
    }
}
function victoryModal() {
    // Display the modal
    var elModal = document.querySelector("#victoryModal");
    elModal.style.display = "block";
    // When the user clicks on Play again, close the modal and init game.
    var elBtn = document.querySelector("#victoryModal button");
    elBtn.onclick = function () {
        elModal.style.display = "none";
        initGame(gCurrentLevelSize);
    }
}

function revealBoard() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            gBoard[i][j].isShown = true;
        }
    }
    renderBoard(gBoard, ".msContainer");
}

function checkIfNeighbour(location, negs) {
    for (var i = 0; i < negs.length; i++) {
        if (location.idx === negs[i].i && location.jdx === negs[i].j) return true;
    }
    return false;
}

function generateRandomMines(board, sumOfMines, firstI, firstJ) {
    var negs = getNegs(firstI, firstJ);
    for (var i = 0; i < sumOfMines; i++) {
        var idx = getRandomInteger(0, board.length);
        var jdx = getRandomInteger(0, board.length);
        if (board[idx][jdx].isMine || idx === firstI && jdx === firstJ ||
            checkIfNeighbour({ idx, jdx }, negs)) { i-- }
        else {
            gBoard[idx][jdx].isMine = true;
        }

    }

}

function populateMines(firstI, firstJ) {
    generateRandomMines(gBoard, gLevel.mines, firstI, firstJ);
    setMinesNegsCount(gBoard);
    gGame.firstClick = false;
    renderBoard(gBoard, ".msContainer");
}

function setCellShown(idx, jdx) {
    document.querySelector("table").rows[idx].cells[jdx].classList.add("shown");
}

function unPaintShown(i, j) {
    document.querySelector("table").rows[i].cells[j].classList.remove("shown");
}

function getHint() {
    if (gGame.firstClick) {
        // alert('please make first move first');
        return;
    }
    HintBlink(true);
    // alert('please click on unrevealed cell');
    gGame.hintIsOn = true;
    // var elHint = document.querySelector(".hints ul li");
    // elHint.remove();
}

function showHintCells(i, j) {
    var negs = getNegs(i, j);
    negs.push({ i: i, j: j })
    for (var idx = 0; idx < negs.length; idx++) {
        gBoard[negs[idx].i][negs[idx].j].isShown = true;
        renderCell(negs[idx].i, negs[idx].j, getCellContent(negs[idx].i, negs[idx].j))
    }
    setTimeout(() => {
        hideCells(negs);
    }, 1000);
    HintBlink(false);
    var elHint = document.querySelector(".hints ul li");
    elHint.remove();
}

function HintBlink(start) {
    if (start === true) {
        document.querySelector(".hints").classList.add("blinking");
    }
    else {
        document.querySelector(".hints").classList.remove("blinking");
    }
}

function hideCells(cells) {
    for (var idx = 0; idx < cells.length; idx++) {
        gBoard[cells[idx].i][cells[idx].j].isShown = false;
        var elCell = document.querySelector("table").rows[cells[idx].i].cells[cells[idx].j];
        elCell.classList.remove("shown");
        elCell.innerText = ' ';
    }
}

function secsPassed(className) {
    var startTime = Date.now();
    gInterval = setInterval(() => {
        var diffrence = Date.now() - startTime;
        gGame.secsPassed = diffrence;
        var elSec = document.querySelector(className);
        elSec.innerText = Math.floor(diffrence / 1000);
    }, 1000);
}

function renderLives() {
    var strHTML = '<ul><li>&#128155;</li><li>&#128155;</li><li>&#128155;</li></ul>';
    document.querySelector(".lives").innerHTML = strHTML;
}

function renderHintsDiv() {
    var strHTML = '<ul><li onclick="getHint()">&#128161;</li><li onclick="getHint()">&#128161;</li><li onclick="getHint()">&#128161;</li></ul>';
    document.querySelector(".hints").innerHTML = strHTML;
}

function renderUndoDiv() {
    var strHTML = '<img src="img/undo.png" class="undoImg" onclick="undo()" height="42" width="42">';
    document.querySelector(".undoClass").innerHTML = strHTML;
}
