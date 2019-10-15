var colors, pickColor;
var numOfSquares = 6;
var squares = document.querySelectorAll(".square");
var colorDisplay = document.getElementById("colorDisplay");
var messageDisplay = document.querySelector("#message");
var h1 = document.querySelector("h1");
var buttons = document.querySelectorAll(".mode");

init();

function init() {
	setupButtonListeners();
	playNewGame();
}

function playNewGame(){
	reset.textContent = "New Colors";
	messageDisplay.textContent = "";
	h1.style.backgroundColor = "steelblue";
	colors = generateRandomColors();
	pickedColor = pickColor();
	colorDisplay.textContent = pickedColor;
	setupSquares();
}

function setupButtonListeners(){
	for (var i = 0; i < buttons.length; i++){
		buttons[i].addEventListener("click", function(){
			buttons[0].classList.remove("selected");
			buttons[1].classList.remove("selected");
			this.classList.add("selected");
			this.textContent === "Easy" ? numOfSquares = 3: numOfSquares = 6;
			playNewGame();
		});
	}
	var reset = document.getElementById("reset");
	reset.addEventListener("click", function(){
		playNewGame();
	});
}

function setupSquares(){
	for (var i = 0; i < numOfSquares; i++){
		squares[i].style.backgroundColor = colors[i];
		squares[i].style.display = "block";
		squares[i].addEventListener("click", function(){
			squareColor = this.style.backgroundColor;
			if (squareColor === pickedColor){
				reset.textContent = "Play Again?";
				messageDisplay.textContent = "Correct!";
				changeColors(squares);
				h1.style.background = pickedColor;
			} else {
				messageDisplay.textContent = "Try again";
				this.style.backgroundColor = "#232323";
			}
		});
	}
	for (var j = numOfSquares; j < 6; j++){
		squares[j].style.display = "none";
	}
}

function changeColors(squares){
	for (var i = 0; i < numOfSquares; i++){
		squares[i].style.backgroundColor = pickedColor;
	}
}

function pickColor(){
	var random = Math.floor(Math.random() * colors.length);
	return colors[random];
}

function generateRandomColors(){
	var colors = [];
	for(var i = 0; i < numOfSquares; i++){
		var r = Math.floor(Math.random() * 256);
		var g = Math.floor(Math.random() * 256);
		var b = Math.floor(Math.random() * 256);
		colors.push("rgb(" + r + ", " + g + ", " + b + ")");
	}
	return colors;
}
