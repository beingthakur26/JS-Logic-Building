const board = document.querySelector(".board");
const modal = document.querySelector(".modal");
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const startGame = document.querySelector(".startGame");
const gameOverSection = document.querySelector(".game-over");

const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

const blockWidth = 25;
const blockHeight = 25;

let highScore = localStorage.getItem("highScore") || 0;
let score = 0;
let time = `00-00`

highScoreElement.innerText = highScore;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

const blocks = []

let interval = null;
let timerInterval = null;

let direction = "right";
let snake = [
    {x: 1, y:3}
]
let food = {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols)
};

// Creating board or boxes
for (row = 0; row < rows; row++) {
    for (col = 0; col < cols; col++) {
        const block = document.createElement("div");
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
    }
}

// Render snake and food
function render(){

    // Clear previous snake position
    snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) { 
            block.classList.remove("fill");
        }
    });

    let head = null;

    blocks[`${food.x}-${food.y}`].classList.add("food");

    // Calculate new head position
    if(direction === "right"){
        head = {x: snake[0].x, y: snake[0].y + 1};
    } else if(direction === "left"){
        head = {x: snake[0].x, y: snake[0].y - 1};
    } else if(direction === "up"){
        head = {x: snake[0].x - 1, y: snake[0].y};
    } else if(direction === "down"){
        head = {x: snake[0].x + 1, y: snake[0].y};
    }

    // Add new head
    snake.unshift(head);

    // Remove tail (unless food was eaten, which is not handled here)
    snake.pop();

    // Check if snake has eaten food
    if(head.x === food.x && head.y === food.y){
        blocks[`${food.x}-${food.y}`].classList.remove("food");
        food = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
        blocks[`${food.x}-${food.y}`].classList.add("food");
        snake.push(snake[snake.length - 1]);
        
        score += 10;
        scoreElement.innerText = score;

        if(score > highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore.toString());
        }
    }

    // Render new snake position
    snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) { // Ensure the block exists before trying to modify it
            block.classList.add("fill");
        }
    });


    snake.forEach(segment => {
        if(segment.x < 0 || segment.x >= rows || segment.y < 0 || segment.y >= cols){
            clearInterval(interval);
            modal.style.display = "flex";
            startGame.style.display = "none";
            gameOverSection.style.display = "flex";
        } 
    })
}

addEventListener("keydown", (e) => {
    if(e.key === "ArrowRight"){
        direction = "right";
    } else if(e.key === "ArrowLeft"){
        direction = "left";
    } else if(e.key === "ArrowUp"){
        direction = "up";
    } else if(e.key === "ArrowDown"){
        direction = "down";
    }
})

startButton.addEventListener("click", () => {
    modal.style.display = "none";
    interval = setInterval(() => {
        render();
    }, 150);

    timerInterval = setInterval(() => {
        let [min, sec] = time.split("-").map(Number);
        if(sec === 59){
            min += 1;
            sec = 0;
        } else {
            sec += 1
        } 

        time = `${min}-${sec}`;
        timeElement.innerText = time;
    }, 1000);
})

restartButton.addEventListener("click", restartButtonHandler)

function restartButtonHandler() {

    clearInterval(interval);

    score = 0;
    time = `00-00`

    highScoreElement.innerText = highScore;
    scoreElement.innerText = score;
    timeElement.innerText = time;

    // Remove old food
    blocks[`${food.x}-${food.y}`]?.classList.remove("food");

    // Clear snake blocks
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`]?.classList.remove("fill");
    });

    // RESET GAME STATE
    snake = [
        { x: 1, y: 3 }
    ];

    direction = "right";

    // Generate new food
    food = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols)
    };

    blocks[`${food.x}-${food.y}`].classList.add("food");

    modal.style.display = "none";
    startGame.style.display = "none";
    gameOverSection.style.display = "none";

    // Restart game loop
    interval = setInterval(render, 150);
}