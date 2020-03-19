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

//FUNCTIONS:
function initGame(size) {
    var elHints = document.querySelector(".hints ul");
    if (elHints) elHints.remove();
    renderLives();
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
    if (gBoard[i][j].isShown) return;
    if (gBoard[i][j].isMarked) {
        gGame.markedCount--;
        unPaintShown(i, j);
        renderCell(i, j, '');
        gBoard[i][j].isMarked = false;
        return;
    }
    gGame.markedCount++;
    gBoard[i][j].isMarked = true;
    renderCell(i, j, FLAG);

    checkGameStatus(i, j, true);
}

function renderBoard(board, selector) {
    var strHTML = '<table border="0" id="tb"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = 'cell cell' + i + '-' + j;
            var textInCell = '';
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
    if (!gBoard[i][j].isMarked) elCell.classList.add("shown");
}

function getColorByNum(text) {
    // debugger
    var res;
    switch (text) {
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
            if (board[i][j].isMine) logBoard += '@';
            else logBoard += board[i][j].minesAroundCount;
            logBoard += '\t';
        }
        logBoard += '\n';
    }
    console.log(logBoard);
}

function cellClicked(ev, i, j) {
    if (gGame.firstClick) {
        populateMines(i, j);
        renderHints();
        secsPassed(".timer");
    }
    if (gGame.hintIsOn) {
        showHintCells(i, j);
        gGame.hintIsOn = false;
        return
    }

    if (gBoard[i][j].isShown) return;

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    renderCell(i, j, cellContent(i, j));
    expandShown(i, j);
    checkGameStatus(i, j, false)
    return;
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
            renderCell(idx, jdx, cellContent(idx, jdx));
            continue;
        }

        gBoard[idx][jdx].isShown = true;
        gGame.shownCount++;
        renderCell(idx, jdx, cellContent(idx, jdx));

        if (gBoard[idx][jdx].minesAroundCount === 0) expandShown(idx, jdx);
    }
}

function secondNegs(elCell, zeroes) {
    console.log(zeroes);
    while (zeroes.length > 0) {
        var zero = zeroes.pop();
        cellClicked(elCell, zero.i, zero.j);
    }
}

function cellContent(i, j) {
    if (gBoard[i][j].isMine) return MINE;
    if (gBoard[i][j].minesAroundCount > 0) return gBoard[i][j].minesAroundCount;
    if (gBoard[i][j].minesAroundCount === 0) return '';
}

function checkGameStatus(i, j, isRightClick) {
    if (gBoard[i][j].isMine && !isRightClick) {
        debugger
        if (gGame.lives > 0) {
            gGame.lives--;
            var elLive = document.querySelector(".lives ul li");
            elLive.remove();
            return;
        }
        var elLive = document.querySelector(".lives ul li");
        elLive.remove();
        revealBoard();
        setTimeout(gameOver, 1000);
    }
    if (gLevel.size ** 2 === getNonMineShownCount() + getMarkedMinesCount() + getShownMinesCount()
        && gGame.isOn) {
        revealBoard();
        setTimeout(gameWin, 1000);
    }
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
    clearTimeout(gInterval);
    victoryModal();
}

function gameOver() {
    clearTimeout(gInterval);
    gGame.isOn = false;
    gameOverModal();
}


function gameOverModal() {
    // Display the modal
    var elModal = document.querySelector("#gameOverModal");
    elModal.style.display = "block";
    // When the user clicks on Play again, close the modal and init game.
    var elBtn = document.querySelector(".modal-content button");
    elBtn.onclick = function () {
        elModal.style.display = "none";
        initGame(8);
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
        initGame(8);
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

function paintShown(idx, jdx) {
    document.querySelector("table").rows[idx].cells[jdx].classList.add("shown");
}

function unPaintShown(i, j) {
    document.querySelector("table").rows[i].cells[j].classList.add("fff");
    document.querySelector("table").rows[i].cells[j].classList.remove("shown");
}

function getHint() {
    if (gGame.firstClick) {
        alert('please make first move first');
        return;
    }
    alert('please click on unrevealed cell');
    gGame.hintIsOn = true;
    var elHint = document.querySelector(".hints ul li");
    elHint.remove();
}

function showHintCells(i, j) {
    var negs = getNegs(i, j);
    negs.push({ i: i, j: j })
    for (var idx = 0; idx < negs.length; idx++) {
        gBoard[negs[idx].i][negs[idx].j].isShown = true;
        renderCell(negs[idx].i, negs[idx].j, cellContent(negs[idx].i, negs[idx].j))
    }
    setTimeout(() => {
        hideCells(negs);
    }, 1000);
}

function hideCells(cells) {
    for (var idx = 0; idx < cells.length; idx++) {
        gBoard[cells[idx].i][cells[idx].j].isShown = false;
        var elCell = document.querySelector("table").rows[cells[idx].i].cells[cells[idx].j];
        elCell.classList.remove("shown");
        elCell.innerText = '';
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

function renderHints() {
    var strHTML = '<ul><li onclick="getHint()">&#128161;</li><li onclick="getHint()">&#128161;</li><li onclick="getHint()">&#128161;</li></ul>';
    document.querySelector(".hints").innerHTML = strHTML;
}

