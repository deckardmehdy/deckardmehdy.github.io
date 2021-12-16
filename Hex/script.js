/*
	Hex game:
	-> Allows for a user to battle a "robot" on a MxN Hex board
	-> Creates a "robot" response using AI algorithm
	-> AI algorithm works by creating and traversing a min-max tree
	-> At each leaf node in the tree, Monte Carlo (random) simulation is done

	Author: Deckard Mehdy
	Last Edit: Dec. 14th, 2021
*/

/* ---- Declarations & Preamble---- */

// Variables
var totalRows = 7;
var totalCols = 7;
var speed = 1;
var playerUser = null;
var playerRobot = null;
var p1objective = "Connect a tile from the left of the board to the right.";
var p2objective = "Connect a tile from the top of the board to the bottom.";
var frozen = false;
var difficulty = null;

// HTML Hexagons
var emptyHexagon = "<i class='bi bi-hexagon empty' style='font-size: 1.5em;'></i>";
var filledHexagon = "<i class='bi bi-hexagon-fill hover' style='font-size: 1.5em;'></i>";
var highlightedHexagon = "<i class='bi bi-hexagon-fill selected'  style='font-size: 1.5em;'></i>";
var winningHexagon = "<i class='bi bi-hexagon-fill winning'  style='font-size: 1.5em;'></i>";
var p1Hexagon = "<i class='bi bi-hexagon-fill playerOne'  style='font-size: 1.5em;'></i>";
var p2Hexagon = "<i class='bi bi-hexagon-fill playerTwo'  style='font-size: 1.5em;'></i>";
var p1HexagonNavBar = "<i class='bi bi-hexagon-fill playerOneNavBar me-2' ></i>";
var p2HexagonNavBar = "<i class='bi bi-hexagon-fill playerTwoNavBar me-2' ></i>";
var selectedHexagon = null;

// HTML & Javascript Hex board
var myGrid = "";
var rowOffset = "<td></td>";
var hexBoard = [];
var hexBoardPtrs = [];

// Outcome Modal
var userWonTitle = "Congrats! You won!"
var userWonGIF = "<img id='winnerGIF' src='images/happy_robot.gif'></img>";
var robotWonTitle = "Oh no! You lost. Try again.";
var robotWonGIF = "<img id='winnerGIF' src='images/sad_robot.gif'></img>";

// Tutorial Modal
var showTutorial = true;

/* ----FIFO Queue---- */

function Queue() {
	this.elements = [];
}

Queue.prototype.enqueue = function (e) {
	this.elements.push(e);
};

Queue.prototype.dequeue = function () {
    return this.elements.shift();
};

Queue.prototype.isEmpty = function () {
    return this.elements.length == 0;
};

Queue.prototype.peek = function () {
    return !this.isEmpty() ? this.elements[0] : undefined;
};

/* ----Min-Max Tree---- */

class minMaxTree {

	constructor() {
		this.MAX_TRIALS = 100;
		this.MAX_DEPTH = this.getDepth();
		this.nextMove = [];
		this.probOfWinning = 0;
		this.board = this.createBoard();
		this.visited = this.createVisited();
	}

	getDepth (){ return difficulty == "normal" ? 2 : 3; }

	getNextMove ( player ) {
		this.traverseTree( -1, -1, true, player, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY );
		return this.nextMove;
	}

	createVisited (){
		let newVisited = new Array(0);
		for ( let m = 0; m < totalRows; m++ ){
			let row = [];
			for ( let n = 0; n < totalCols; n++ ){
				if ( this.board[m][n] == 0 ){
					row.push(false);
				} else {
					row.push(true);
				}
			}
			newVisited.push(row);
		}
		return newVisited;
	}

	createBoard (){
		let newBoard = [];
		for ( let x = 0; x < totalRows; x++ ){
			let row = [];
			for ( let y = 0; y < totalCols; y++ ){
				row.push( hexBoard[x][y] );
			}
			newBoard.push( row );
		}
		return newBoard;
	}

	traverseTree ( row, col, maximizingPlayer, player, depth, alpha, beta ) {
		if ( depth == this.MAX_DEPTH ){
			return this.monteCarlo( player );
		} 
		let val;
		let exit = false;
		if ( maximizingPlayer ){
			val = -1;
			for ( var i = 0; i < totalRows && !exit; i++ ){
				for ( var j = 0; j < totalCols && !exit; j++ ){
					if ( !this.visited[i][j] ){
						this.makeMove( i, j, player );
						var newVal = this.traverseTree( i, j, false, player, depth + 1, alpha, beta );
						if ( val < newVal ){
							val = newVal;
							// Root node:
							if ( depth == 0 ){ 
								this.nextMove = [i, j];
								this.probOfWinning = val;
							} 
						}
						alpha = Math.max( alpha, val );
						if ( val >= beta ){ exit = true; }
						this.releaseMove( i, j );
					}
				}
			}
		} else {
			val = 2;
			for ( var i = 0; i < totalRows && !exit; i++ ){
				for ( var j = 0; j < totalCols && !exit; j++ ){
					if ( !this.visited[i][j] ){
						this.makeMove( i, j, this.swapPlayer(player) );
						val = Math.min( val, this.traverseTree( i, j, true, player, depth + 1, alpha, beta ) );
						beta = Math.min( beta, val );
						if ( val <= alpha ){ exit = true; }
						this.releaseMove( i, j );
					}
				}
			}
		}
		return val;
	}

	makeMove ( i, j, player ){
		this.visited[i][j] = true;
		this.board[i][j] = player;
	}

	releaseMove ( i, j ){
		this.visited[i][j] = false; 
		this.board[i][j] = 0;
	}

	swapPlayer ( player ){ return player == 1 ? 2 : 1; }

	nextMoves (){
		var moves = [];
		for ( var i = 0; i < totalRows; i++ ){
			for ( var j = 0; j < totalCols; j++ ){
				if ( !this.visited[i][j] ){ moves.push( [i, j] ); }
			}
		}
		return moves;
	}

	monteCarlo ( player ) {
		var wins = 0;
		var moves = this.nextMoves(); 
		for ( var i = 0; i < this.MAX_TRIALS; i++ ){
			this.shuffle( moves );
			var currPlayer = player;
			for ( var j = 0; j < moves.length; j++ ){
				this.makeMove( moves[j][0], moves[j][1], currPlayer );
				currPlayer = this.swapPlayer(currPlayer);
			}
			var winner = this.checkForWinner( 1 ) ? 1 : 2;
			if (winner == player){ wins++;}
		}
		for ( var j = 0; j < moves.length; j++ ){
			this.releaseMove( moves[j][0], moves[j][1] );
		}
		var prob = wins / this.MAX_TRIALS;
		return prob;
	}

	checkForWinner ( player ){
		/* Create visited matrix */
		let visited = [];
		for (var i = 0; i < totalRows; i++){
			var rowV = []; // row visited
			for (var j = 0; j < totalCols; j++){
				rowV.push( false );
			}
			visited.push( rowV );
		}
	
		/* Queue first row/col */
		let myQueue = new Queue();
		if ( player == 1 ){
			for ( var i = 0; i < totalRows; i++ ){
				if ( this.board[i][0] == player ){ myQueue.enqueue( [i, 0] );}
			}
		} else {
			for (var j = 0; j < totalCols; j++){
				if ( this.board[0][j] == player ){ myQueue.enqueue( [0, j] );}
			}
		}
	
		/* Iterate until queue is empty or winner found (Dijkstra) */
		while ( !myQueue.isEmpty() ){ 
			var [ row, col ] = myQueue.dequeue();
			if ( !visited[row][col] ){
				visited[row][col] = true;
				var neighbors = getNeighbors( row, col );
				for ( var i = 0; i < neighbors.length; i++ ){
					var [ neighborR, neighborC ] = neighbors[ i ];
					if ( this.board[ neighborR ][ neighborC ] == player && !visited[neighborR][neighborC] ){
						myQueue.enqueue( neighbors[ i ] );
						let winnerFound = ( (player == 1) && (neighborC == totalCols - 1) ) || ( (player == 2) && (neighborR == totalRows - 1) );
						if ( winnerFound ){ return true; }
					}
				}
			}
		}
		return false;
	}

	shuffle ( arr ){
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = arr[i];
			arr[i] = arr[j];
			arr[j] = temp;
		}
		return arr;
	}
}

/* ----Mouse Functions---- */

function mouseFunctions(){
	$( ".hex" ).hover(function() {
		var [row, col] = getCoords( this );
		if (( this != selectedHexagon) && isEmpty( row, col ) && !frozen ){
			$( this ).empty();
			$( this ).append( filledHexagon );
		}
	}, function() {
		var [row, col] = getCoords( this );
		if (( this != selectedHexagon) && isEmpty( row, col ) && !frozen ){
			$( this ).empty();
			$( this ).append( emptyHexagon );
		}
	});
	
	$( ".hex" ).click(function() {
		// Continue if cell is valid
		var [row, col] = getCoords( this );
		if (!isEmpty( row, col ) || frozen ){
			return;
		}

		// Remove previously selected hexagon
		if ( selectedHexagon != null ){
			$( selectedHexagon ).empty();
			$( selectedHexagon ).append( emptyHexagon );
			$( "#selectedRow" ).empty();
			$( "#selectedCol" ).empty();
		}
	
		$( this ).empty();
		$( this ).append( highlightedHexagon );

		$( "#selectedRow" ).append( row + 1);
		$( "#selectedCol" ).append( col + 1);
		selectedHexagon = this;
		$( "#playMove" ).show("fast");
	});
}

/* ----Grid Functions---- */

/* Create HTML <table> element with hex board */
function generateGrid( rows, cols ) {
    var grid = "<table>";
    for ( var row = 0; row < rows; row++ ) {
		// Hexagon row
        grid += "<tr>";
		for (var offset = 0; offset < row; offset++){
			grid += rowOffset; 
		}
        for ( var col = 0; col < cols; col++ ) {      
            grid += "<td class='hex'>" + emptyHexagon + "</td>";
			if ( col != cols - 1){ 
				grid += "<td><i class='bi bi-dash-lg' style='font-size: 25px'></i></td>"; // '--' character
			} 
        }
		grid += "</tr>"; 

		// Filler row
		if (row != rows - 1){
			grid += "<tr>";
			for (var offset = 0; offset < row + 1; offset++){
				grid += rowOffset; 
			}
			for ( var col = 0; col < cols; col++ ) {      
				grid += "<td>&#92</td>";  // '\' character
				if ( col != cols - 1){
					grid += "<td>/</td>"; // '/' character
				}
        	}
        	grid += "</tr>"; 
		}
    }
    grid += "</table>"
    return grid;
}

function resetGame (){
	$( "ul" ).css( "display", "none" );
	$( "#tutorial" ).css( "display", "none" );
	$( "#reset" ).css( "display", "none" );
	$( "#playMove" ).css( "display", "none" );
	$( ".key" ).css( "display", "none" );
	$( "#keyContainer" ).css( "display", "none" );
	$( "#difficultyMessage" ).css( "display", "none" );
	$( "#startGame" ).css( "display", "none" );
	$( "#sideNavbar" ).css( "padding", "0rem" );

	$( "#welcomeMessage" ).show("slow");

	$( "#tableContainer" ).empty();
	$( "#playerNum" ).empty();
	$( "#playerHex" ).empty();
	$( "#playerObjective" ).empty();
	$( "#selectedRow" ).empty();
	$( "#selectedCol" ).empty();

	playerUser = null;
	if (speed != "slow"){ speed = "slow"; }
}

function firstTimeTutorial(){
	if ( showTutorial == true ){
		$( "#tutorialModal" ).modal( 'show' );
		showTutorial = false;
	}
}

function startGame(){
	myGrid = generateGrid( totalRows, totalCols );
	$( "#tableContainer" ).append( myGrid );
	mouseFunctions();

	$( "#playerNum" ).append( playerUser );
	$( "#playerHex" ).append( playerUser == 1 ? p1HexagonNavBar : p2HexagonNavBar );

	$( "ul" ).show(speed);
	$( "#tutorial" ).show(speed);
	$( "#reset" ).show(speed);
	$( ".key" ).show("fast");
	$( "#sideNavbar" ).css( "padding", "1rem" );

	unfreezeBoard();
	generateBoard();
	generateBoardPtrs();
	resetProgressBar();
	

	if ( playerUser == 2 ){
		// Robot goes first
		waitingModal( 'show' );
		setTimeout(function(){ 
			makeRobotMove(); 
			waitingModal( 'hide' );
			firstTimeTutorial();
		}, 1000);
	} else {
		firstTimeTutorial();
	}
}

function generateBoard (){
	hexBoard = [];
	for ( let x = 0; x < totalRows; x++ ){
		var row = [];
		for ( let y = 0; y < totalCols; y++ ){
			row.push( 0 );
		}
		hexBoard.push( row );
	}
}

function freezeBoard (){ frozen = true; }

function unfreezeBoard(){ frozen = false; }

function generateBoardPtrs(){
	var cells = $(".hex");
	hexBoardPtrs = [];
	for (var i = 0; i < totalRows; i++) { 
		let row = [];
		for (var j = 0; j < totalCols; j++){
			let num = (i * totalCols) + j;
			row.push( cells[num] );
		}
		hexBoardPtrs.push( row );
	}
}

function getCoords( cellPtr ){
	var row   = $( cellPtr ).closest('tr').index() / 2;
	var col   = ($( cellPtr ).parent().children().index( cellPtr ) - row) / 2;
	return [row, col]; 
}

function isEmpty( row, col ){ return hexBoard[row][col] == 0 ? true : false; }

function winnerFound( player ){
	/* Create visited, cost, and prev matrices */
	var visited = [];
	var prev = [];
	var cost = [];
	for (var i = 0; i < totalRows; i++){
		var rowV = []; // row visited
		var rowP = []; // row prev
		var rowC = []; // row cost
		for (var j = 0; j < totalCols; j++){
			rowV.push( false );
			rowP.push( -1 );
			rowC.push( totalRows * totalCols );
		}
		visited.push( rowV );
		prev.push( rowP );
		cost.push( rowC );
	}

	/* Queue first row/col */
	let myQueue = new Queue();
	if (player == 1){
		for (var i = 0; i < totalRows; i++){
			if ( hexBoard[i][0] == player ){
				myQueue.enqueue( [i, 0] );
				cost[i][0] = 0;
			}
		}
	} else {
		for (var j = 0; j < totalCols; j++){
			if ( hexBoard[0][j] == player ){
				myQueue.enqueue( [0, j] );
				cost[0][j] = 0;
			}
		}
	}

	/* Iterate until queue is empty or winner found (Dijkstra) */
	while ( !myQueue.isEmpty() ){
		var [ row, col ] = myQueue.dequeue();
		if ( !visited[row][col] ){
			visited[row][col] = true;
			var neighbors = getNeighbors( row, col );
			for (var i = 0; i < neighbors.length; i++){
				var [ neighborR, neighborC ] = neighbors[i];
				if ( hexBoard[ neighborR ][ neighborC ] == player && !visited[neighborR][neighborC]){
					myQueue.enqueue( neighbors[i] );
					if ( cost[row][col] + 1 < cost[neighborR][neighborC] ){
						prev[ neighborR ][ neighborC ] = [ row, col ];
						cost[ neighborR ][ neighborC ] = cost[row][col] + 1;
					}
					winner = ( (player == 1) && (neighborC == totalCols - 1) ) || ( (player == 2) && (neighborR == totalRows - 1) );
					/* If winner found, illuminate winning path */
					if ( winner ){ 
						showWinningPath( neighborR, neighborC, prev ); 
						return true;
					}
				}
			}
		}
	}
	return false;
}

function showWinningPath( i, j, prev ){
	var cellPtr = hexBoardPtrs[i][j];
	$( cellPtr ).empty();
	$( cellPtr ).append( winningHexagon );
	$( cellPtr ).animate({opacity: "1"}, "fast", "linear", function(){
		if ( prev[i][j] == -1 ){ return; }
		showWinningPath( prev[i][j][0], prev[i][j][1], prev );
	});

}

function winningMessage( winner ){
	$("#outcomeTitle").empty();
	$("#outcomeGIF").empty();
	if ( winner == "user" ){
		$("#outcomeTitle").append( userWonTitle );
		$("#outcomeGIF").append( userWonGIF );
	} else if ( winner == "robot" ){
		$("#outcomeTitle").append( robotWonTitle );
		$("#outcomeGIF").append( robotWonGIF );
	}
	$("#outcomeModal").modal('show');
}

function getNeighbors (i, j){
	var neighbors = [];
	if ( j < (totalCols - 1) ){ 			neighbors.push( [i, j + 1] ); }                    	// right
    if ( j > 0 ){ 							neighbors.push( [i, j - 1] ); }                    	// left
    if ( i > 0 ){ 							neighbors.push( [i - 1, j] ); }                    	// upper left
    if ( i > 0 && j < (totalCols - 1) ){ 	neighbors.push( [i - 1, j + 1] ); }       			// upper right
    if ( i < (totalRows - 1) && j > 0 ){ 	neighbors.push( [i + 1, j - 1] ); }       			// lower left
    if ( i < (totalRows - 1) ){ 			neighbors.push( [i + 1, j] ); }            			// lower right
	return neighbors;
}

function updateProgressBar( probOfRobotWinning ){
	let probOfUserWinning = Math.round((1 - probOfRobotWinning) * 100) + "%";
	probOfRobotWinning = Math.round(100 * probOfRobotWinning) + "%";
	if ( playerUser == 1 ){
		$("#playerOneBar").empty();
		$("#playerOneBar").append( probOfUserWinning );
		$("#playerTwoBar").empty();
		$("#playerTwoBar").append( probOfRobotWinning );
	} else {
		$("#playerOneBar").empty();
		$("#playerOneBar").append( probOfRobotWinning );
		$("#playerTwoBar").empty();
		$("#playerTwoBar").append( probOfUserWinning );
	}
}

function resetProgressBar(){
	$("#playerOneBar").empty();
	$("#playerOneBar").append( "50%" );
	$("#playerTwoBar").empty();
	$("#playerTwoBar").append( "50%" );
}

function waitingModal(action ){ $( "#waitingModal" ).modal( action ); }

/* Makes the robot's next move */
function makeRobotMove(){
	let myTree = new minMaxTree();
	var [ x, y ] = myTree.getNextMove( playerRobot ); 
	updateProgressBar( myTree.probOfWinning );
	playMove( x, y, hexBoardPtrs[x][y], playerRobot );
}

/* Play a move on the hex board */
function playMove( i, j, ptr, player ){
	hexBoard[ i ][ j ] = player;
	$( ptr ).empty();
	if ( player == 1 ){
		$( ptr ).append( p1Hexagon );
	} else {
		$( ptr ).append( p2Hexagon );
	}
}

/*----Button Functions----*/

$( "#p1btn" ).click(function(){
	playerUser = 1;
	playerRobot = 2;
	$( "#playerObjective" ).append( p1objective );
	$( "#welcomeMessage" ).hide("slow", function() {
		$( "#difficultyMessage" ).show("slow", function() {});
	});
});

$( "#p2btn" ).click(function(){
	playerUser = 2;
	playerRobot = 1;
	$( "#playerObjective" ).append( p2objective );
	$( "#welcomeMessage" ).hide("slow", function() {
		$( "#difficultyMessage" ).show("slow", function() {});
	});
});

$( "#normalBtn" ).click(function(){
	difficulty = "normal";
	$( "#difficultyMessage" ).hide("slow", function() {
		startGame();
	});
});

$( "#hardBtn" ).click(function(){
	difficulty = "hard";
	$( "#difficultyMessage" ).hide("slow", function() {
		startGame();
	});
});

$( "#reset" ).click(function(){ resetGame(); });

$( "#playMove" ).click( async function(){
	if ( frozen ){ return; }
	var [row, col] = getCoords( selectedHexagon );
	if( isEmpty(row, col) ){
		playMove( row, col, selectedHexagon, playerUser );
		selectedHexagon = null;
		$( "#selectedRow" ).empty();
		$( "#selectedCol" ).empty();
		// See if user won
		if ( !winnerFound( playerUser ) ){
			waitingModal( 'show' );
			setTimeout(function(){
				// See if robot won
				makeRobotMove();
				if ( winnerFound( playerRobot ) ){
					winningMessage( "robot" );
					freezeBoard();
				}
				waitingModal( 'hide' );
			}, 1000);
		} else {
			winningMessage( "user" );
			freezeBoard();
		}
	}
});

$( "#closeModal" ).click(function(){ $("#outcomeModal").modal('hide'); });

$( "#tutorial" ).click(function(){ $("#tutorialModal").modal('show'); });

/* global bootstrap: false */
(function () {
	'use strict'
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	tooltipTriggerList.forEach(function (tooltipTriggerEl) {
	  new bootstrap.Tooltip(tooltipTriggerEl)
	})
})()


/* !start! */
resetGame();