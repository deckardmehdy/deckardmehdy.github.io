/* to do list:
	- put tutorial in -> make it show winning combination for each player
	- have spinning icon while tree produces next move - make game frozen
		- have progress bar in popup modal that appears
		- static backdrop modal
		- include reset button just in case it gets frozen
	- do documentation for each object, set of classes, and overal document
*/


/* ---- Declarations & Preamble---- */

// Variables
var totalRows = 7;
var totalCols = 7;
var speed = 1;
var playerUser = null;
var playerRobot = null;
var p1objective = "Connect a tile from column 1 to a tile in column " + totalCols + ".";
var p2objective = "Connect a tile from row 1 to a tile in row  " + totalRows + ".";
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

	/* Test variables */

	var showMonteCarlo = true;
	var showCheckForWinner = true; 

class minMaxTree {

	constructor() {
		this.MAX_TRIALS = 100;
		this.MAX_DEPTH = this.getDepth();
		this.nextMove = [];
		this.probOfWinning = 0;
		//console.log("Hex board in constructor:");
		//console.log(hexBoard.slice(0));

		this.board = this.createBoard();
		//console.log(" Board created from hex board: ");
		//console.log( this.deepCopy( this.board ) );

		this.visited = this.createVisited();
		//console.log(" Visited: ");
		//console.log( this.deepCopy( this.visited ) );
	}

	getDepth (){
		if ( difficulty == "normal" ){
			return 2;
		} else if ( difficulty == "hard" ){
			return 3;
		} else {
			return 4;
		}
	}

	getNextMove ( player ) {
		this.traverseTree( -1, -1, true, player, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY );
		return this.nextMove;
	}

	createVisited (){
		let newVisited = new Array(0);
		//console.log("Visited array at time of creation: ");
		//console.log( newVisited.slice(0) );
		for ( let m = 0; m < totalRows; m++ ){
			let row = [];
			for ( let n = 0; n < totalCols; n++ ){
				if ( this.board[m][n] == 0 ){
					row.push(false);
					//console.log("Entering false");
				} else {
					row.push(true);
					//console.log("Entering true");
				}
				//console.log( row.slice(0) );
			}
			newVisited.push(row);
			//console.log("Visited array: ");
			//console.log( newVisited.slice(0) );
		}
		return newVisited;
	}

	createBoard (){
		//console.log("Hex board in create board method:");
		//console.log( hexBoard );
		let newBoard = [];
		//console.log("Tree board after creating it:");
		//console.log( newBoard.slice(0) );
		for ( let x = 0; x < totalRows; x++ ){
			let row = [];
			for ( let y = 0; y < totalCols; y++ ){
				//console.log("[ " + x + ", " + y + " ] = " + hexBoard[x][y] );
				row.push( hexBoard[x][y] );
				//console.log( row.slice(0) );
			}
			newBoard.push( row );
			//console.log( newBoard.slice(0) );
		}
		return newBoard;
	}

	/* Returns a deep copy of 2-D arrays */
	deepCopy ( arr ){
		let deepCopy = [];
		for ( let i = 0; i < arr.length; i++ ){
			let row = [];
			for ( let j = 0; j < arr[0].length; j++ ){
				let val = arr[i][j];
				row.push( val );
			}
			deepCopy.push( row );
		}
		return deepCopy;
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
						//console.log( "-------------" );
						//console.log( "Child being visited = [ " + i + ", " + j + " ] will play as player " + player + ": ");
						this.makeMove( i, j, player );
						var newVal = this.traverseTree( i, j, false, player, depth + 1, alpha, beta );
						if ( val < newVal ){
							val = newVal;
							// root node
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
						//console.log( "-------------" );
						//console.log( "Child being visited = [ " + i + ", " + j + " ] will play as player " + player + ": ");
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

	swapPlayer ( player ){
		return player == 1 ? 2 : 1;
	}

	/* TEST = OK! */
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
		if ( showMonteCarlo ){
			//console.log( "Original moves are:" ); 
			//console.log( moves.slice(0) );
		}
		for ( var i = 0; i < this.MAX_TRIALS; i++ ){
			this.shuffle( moves );
			if ( showMonteCarlo  && i < 2){
				//console.log( "Shuffled moves are:" ); 
				//console.log( moves.slice(0) );
			}
			var currPlayer = player;
			for ( var j = 0; j < moves.length; j++ ){
				this.makeMove( moves[j][0], moves[j][1], currPlayer );
				currPlayer = this.swapPlayer(currPlayer);
				if ( showMonteCarlo  && i < 2){
					//console.log( "Move played on board at [" + moves[j][0] + "," + moves[j][1] + "] for player " + player + ":" ); 
					//console.log( this.deepCopy( this.board ) );
				}
			}
			if ( showMonteCarlo  && i < 2){
				//console.log( "Finished hex game:" );
				//console.log( this.deepCopy( this.board ) ); 
			}
			var winner = this.checkForWinner( 1 ) ? 1 : 2;
			if ( showMonteCarlo  && i < 2){
				//console.log( "Winner = " + winner);
			}
			if (winner == player){ wins++;}
		}
		for ( var j = 0; j < moves.length; j++ ){
			this.releaseMove( moves[j][0], moves[j][1] );
		}
		if ( showMonteCarlo ){
			//console.log( "Moves have been erased from the board: " );
			//console.log( this.deepCopy( this.board ) ); 
		}
		var prob = wins / this.MAX_TRIALS;
		if ( showMonteCarlo  ){
			//console.log( "Probability of player " + player + " winning = " + prob );
			//console.log( this.deepCopy( this.board ) ); 
			showMonteCarlo  = false;
		}
		return prob;
	}

	checkForWinner ( player ){
		if ( showCheckForWinner ){
			//console.log("---------------------------------------------------------");
			//console.log("Checking to see if player " + player + " is the winner...");
		}
		/* Create visited, cost, and prev matrices */
		let visited = [];
		for (var i = 0; i < totalRows; i++){
			var rowV = []; // row visited
			for (var j = 0; j < totalCols; j++){
				rowV.push( false );
			}
			visited.push( rowV );
		}
		if ( showCheckForWinner ){
			//console.log( "Visited:" );
			//console.log( this.deepCopy( visited ) );
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
			if ( showCheckForWinner ){
				//console.log("---------------------------------------------------------");
				//console.log( "[ " + row + ", " + col + " ] was taken out of the queue." );
			}
			if ( !visited[row][col] ){
				visited[row][col] = true;
				if ( showCheckForWinner ){
					//console.log( "Node is being visited!" );
				}
				var neighbors = getNeighbors( row, col );
				for ( var i = 0; i < neighbors.length; i++ ){
					var [ neighborR, neighborC ] = neighbors[ i ];
					if ( this.board[ neighborR ][ neighborC ] == player && !visited[neighborR][neighborC] ){
						if ( showCheckForWinner ){
							//console.log( "Adding [ " + neighborR + ", " + neighborC + " ] to queue." );
						}
						myQueue.enqueue( neighbors[ i ] );
						let winnerFound = ( (player == 1) && (neighborC == totalCols - 1) ) || ( (player == 2) && (neighborR == totalRows - 1) );
						if ( winnerFound ){ //console.log( "Winner was found! Player " + player + " wins!" ); 
							return true; 
						}
					}
				}
			}
		}
		showCheckForWinner = false;
		return false;
	}

	/* TEST -- OK! */
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
	}
	);
	
	$( ".hex" ).click(function() {
		// Proceed if cell is valid
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
	}
	);
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

	unfreezeBoard();
	generateBoard();
	generateBoardPtrs();
	resetProgressBar();

	if ( playerUser == 2 ){
		//makeRobotMove();
		setTimeout(function(){ makeRobotMove(); }, 1000); // robot goes first
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

function freezeBoard (){
	frozen = true;
}

function unfreezeBoard(){
	frozen = false;
}

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
	return [row, col]; // 0-index
}

function isEmpty( row, col ){
	return hexBoard[row][col] == 0 ? true : false;
}

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
	//console.log( "Probability of user winning: " + probOfUserWinning );
	//console.log( "Probability of robot winning: " + probOfRobotWinning );
}

function resetProgressBar(){
	$("#playerOneBar").empty();
	$("#playerOneBar").append( "50%" );
	$("#playerTwoBar").empty();
	$("#playerTwoBar").append( "50%" );
}

function waitingModal(action ){
	//console.log( action + " the modal");
	$( "#waitingModal" ).modal( action );
}

/* Makes the robot's next move */
function makeRobotMove(){
	//console.log("-----------------"); 
	waitingModal( 'show' );

	setTimeout(function(){
		let myTree = new minMaxTree();
		var [ x, y ] = myTree.getNextMove( playerRobot ); 
		//console.log("Move selected -> [ "+x+" ,"+y+" ]");
		//console.log("Probability of winning -> " + myTree.probOfWinning );
		updateProgressBar( myTree.probOfWinning );
		playMove( x, y, hexBoardPtrs[x][y], playerRobot );
		waitingModal( 'hide' );
	}, 1000);
	return;
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

$( "#evilBtn" ).click(function(){
	difficulty = "evil";

	$( "#difficultyMessage" ).hide("slow", function() {
		startGame();
	});
});

$( "#reset" ).click(function(){
	resetGame();
}
);

$( "#playMove" ).click(function(){
	if ( frozen ){ return; }
	var [row, col] = getCoords( selectedHexagon );
	if( isEmpty(row, col) ){
		playMove( row, col, selectedHexagon, playerUser );
		selectedHexagon = null;
		$( "#selectedRow" ).empty();
		$( "#selectedCol" ).empty();

		// See if user won
		if ( !winnerFound( playerUser ) ){
			makeRobotMove();
			// See if robot won
			let robotWon = winnerFound( playerRobot );
			if ( robotWon ){
				winningMessage( "robot" );
				freezeBoard();
			}
		} else {
			winningMessage( "user" );
			freezeBoard();
		}
	}
}
);

$( "#closeModal" ).click(function(){
	$("#outcomeModal").modal('hide');
}
);

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