import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const CELLS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];  // possible number of cells in the grid to select by user
const WIN = [3, 4, 5, 6, 7];  // possible number of winning cells to select by user

const INIT_SIZE = 3;  // default number of cells
const INIT_NEEDFORWIN = 3;  // default number of winning cells

// ===================== simple Square component: ===================================================================
function Square(props) {  // Square element is the single cell of the board which can be empty or filled with 'X' or 'O'
      return (
        <button className = {props.highlighted ? "square highlighted" : "square"}
                onClick = {() => props.onClick()}
                >
        {props.value} 
        </button>
      );
  }

// ===================== simple SortButton component: ====================================================================
function SortButton(props) {  // Button to choose the way of sorting
    return (
      <button id="sort-btn"
              onClick = {() => props.onClick()}
              >
      { props.sortedAsc ?  'Sort Z-A' : 'Sort A-Z'}
      </button>
    );
}

// ===================== Board component: ====================================================================
class Board extends React.Component {  // The Board contains NxN Squares
    renderSquare(i) {  // renders Square #i
      return (<Square
                key = {'square' + i}
                value = {this.props.squares[i]}
                highlighted = {this.props.winningCells && this.props.winningCells.includes(i) ? true : false}
                onClick = {() => this.props.onClick(i)}
              />
      );
    }

    render() {
      // make array of rows ( [0, 1, 2, 3, ...]):
      let rows = [];
      for(let i = 0; i < this.props.size; i++)
        rows.push(i);
      // make aray of cols ( [0, 1, 2, 3, ...]):
      let cols = [];
      for(let i = 0; i < this.props.size; i++)
        cols.push(i);
      // map arrays into the Squares: <div key = '0' className = 'board-row'><Square key = 0 /><Square key = 1 ... /><Square key = 2 /><div>
      //                              <div key = '0' className = 'board-row'><Square key = 3 /><Square key = 4 ... /><Square key = 5 /><div>
      //                              <div key = '0' className = 'board-row'><Square key = 6 /><Square key = 7 ... /><Square key = 8 /><div>
      const boardRows = rows.map((row) =>
            <div key = {row} className = 'board-row'>{cols.map((col) => this.renderSquare(this.props.size*row+col))}</div>
      );

      return (
          <div>
              {boardRows}
          </div>)
    }
  }

// ===================== Board component: ====================================================================
class InitScreen extends React.Component{
  render(){
    const optionsSize = CELLS.map((item) => <option key = {'c'+item}>{item}</option>); // prepare <options> for <select> of size
    const optionsNeedForWin =WIN.map((item) => <option key = {'w'+item}>{item}</option>);  // prepare <options> for <select> of winning cells
    return(
      <form id = 'select-form' onSubmit = {() => this.props.onSubmit()}> 
        <h3>Choose parameters of game: </h3>
        <label htmlFor = 'select-size'>Size of board: </label>
        <select className = 'select-param' 
                id = 'select-size' 
                value = {this.props.size}
                onChange = {(e) => this.props.onSizeChange(e)}>
                {optionsSize}
        </select>
        <label htmlFor = 'select-needforwin'>Cells need to win: </label>
        <select className = 'select-param' 
                id = 'select-needforwin' 
                value = {this.props.needForWin}
                onChange = {(e) => this.props.onNeedForWinChange(e)}>
                {optionsNeedForWin}
          </select>         
          <button type = "submit">Submit</button>   
      </form>
    )
  }
}

// ===================== Game component: ====================================================================
  class Game extends React.Component {
    constructor(props){
      super(props);
      this.state = {
        history: [{  // history is the array of steps (moves) from the beginning of the game to the current point
          squares: Array(INIT_SIZE*INIT_SIZE).fill(null),  // in the beginning all squares are empty, no steps done (row and col == 0)
          row: null,  
          col: null,
       }],
        size: INIT_SIZE,  // the size of the board - user changes it choosing the initial parameters of the game
        needForWin: INIT_NEEDFORWIN, // number of sequential cells needed to be filled with 'X' or 'O' for the win
        stepNumber: 0,  // amount of steps done
        xIsNext: true,  // whose turn to make a move - X or O
        sortAsc: true,  // the order of sorting
        init: true,     // in the beginning the game is in the state of initiation: the user chooses the parameters of the game
      };
      this.handleInitSubmit = this.handleInitSubmit.bind(this);  // for these functions we use .bind method to pass them to components
    }
    
//-------------------- Functions: --------------------------------------------------
    handleClick(i){  // handles click on the board in the square #i
      // for this function we'll use an arrow function method: 'onClick = {(i) => this.handleClick(i)}'
      const history = this.state.history.slice(0, this.state.stepNumber + 1); 
      // const history = this.state.history would be wrong since we can't mutate data in the state
      const current = history[history.length - 1];  // current step
      const squares = [...current.squares];         // squares we see right now on the board

      if(calculateWinner(squares, this.state.needForWin).winner || squares[i])  // if winner is already defined or the clicked square is already filled
        return;

      squares[i] = this.state.xIsNext ? 'X' : 'O';  // fill the square with the proper meaning

      this.setState({  // change state parameters
          history: history.concat([{  // add next step to the history array with the following parameters:
            squares: squares,
            row: Math.floor(i/this.props.size),  // i.e. square #6 clicked on the board with size 3x3 will have row == 2 and col == 0 
            col: i%this.props.size,
          }]),
          stepNumber: history.length,  // increase the number of steps to 1
          xIsNext: !this.state.xIsNext, // change the next player
        });
    }
//---------------------------------------------------------------------------------------------------------------
    jumpTo(step){  // jump to the given step
      this.setState({  // I don't clean the rest of the history intentionally, until the next move made by user
        stepNumber: step,  // change the current step 
        xIsNext: (step%2) === 0,  // change the next player: 'X' starts the game and makes even steps, 'O' makes odd steps.
      })
    }
//---------------------------------------------------------------------------------------------------------------
    renderMoves(history, asc){  // moves are buttons showing steps of the game, sorted A-Z or Z-A
      // arguments: history of the game; asc - order of sorting
      const moveElems = history.map((step, move) => {  // item (step) is the object, we have to use index (move) to map
              const description = move ? 'Go to move #' + move + ' (' + history[move].row + ', ' + history[move].col + ') ':
                  'Go to game start';
              return (
                  <li key = {move} className = 'li-move'>
                    <button onClick = {() => this.jumpTo(move)}>{description}</button>
                  </li>
              )
            });
      return asc ? moveElems : moveElems.reverse();  // sort the array of steps
    }
//---------------------------------------------------------------------------------------------------------------
    handleInitSubmit(){  // function sets the initial meaning of history array and closes the init process
      console.log('inside submit!');
      this.setState(() => ({
        history: [{
          squares: Array(this.state.size * this.state.size).fill(null),
          row: null,
          col: null,
        }],
        init: false,  // from now it's not the init, it's the game
      }))
    }
//---------------------------------------------------------------------------------------------------------------
    handleSizeChange(event){  // function handles the change of board's size during the init process
      this.setState({
        size: event.target.value,
      })
    }
//---------------------------------------------------------------------------------------------------------------
    handleNeedForWinChange(event){  // function handles the change of the number of winning cells
      this.setState({
        needForWin: event.target.value,
      })
    }
//---------------------------------------------------------------------------------------------------------------
    handleSort(){  // changes the order of sorting (asc to desc and vice versa) 
                   // and calls the rendering function to re-draw steps in the right order
      this.setState((state) => ({sortAsc: !state.sortAsc}));
      this.renderMoves(this.state.history, this.state.sortAsc);
    }
//---------------------------------------------------------------------------------------------------------------
    renderGame(){  // renders the game screen
      const history = this.state.history.slice(0);  // get the history array, use slice to get a copy of the array and not to mutate state parameter 
      const current = history[this.state.stepNumber]; // get the current history element

      const winResult = calculateWinner(current.squares, this.state.needForWin);  // check if there's a winner

      const moves = this.renderMoves(history, this.state.sortAsc);  // render sorted steps buttons (buttons with info 'Go to move (N, M) ...')

      // define the row and column of the cell which was filled on the last step:
      let lastStep = (current.row !== null) ? 
                      "Last step: ("  + current.row + ", " + current.col + "); " :
                      "Start the game! ";
      lastStep = lastStep.concat("Next player: " + (this.state.xIsNext ? "X" : "O"));  // add the info about last player

      let status = winResult.winner ? "The winner is: " + winResult.winner + '!' : lastStep;  // set info status (has winner / still playing)
      let classStatus = winResult.winner ? 'highlighted' : '';  // if the winner is defined add the 'highlighted' class to the status line 

      return (
        <div className="game">
          <div className="game-board">
            <Board squares = {current.squares}
                   size = {this.state.size}
                   winningCells = {winResult.winningCells}
                    onClick = {(i) => this.handleClick(i)} />
          </div>
          <div className="game-info">
            <SortButton sortedAsc = {this.state.sortAsc} onClick = {() => this.handleSort()}/>
            <div id = "status" className = {classStatus}>{status}</div>
            <ul>{moves}</ul>
          </div>
        </div>
      );
    }
//---------------------------------------------------------------------------------------------------------------
    render() {
      console.log('init = ', this.state.init);
      if(this.state.init){  // if the game is in the process of initiating of parameters
        return(
          <InitScreen size = {this.state.size} 
                    needForWin = {this.state.needForWin}
                    onSubmit = {this.handleInitSubmit}
                    onSizeChange = {(e) => this.handleSizeChange(e)}
                    onNeedForWinChange = {(e) => this.handleNeedForWinChange(e)}
            />
        )
      }
      else{
        return this.renderGame();
      }
    }
  }
  // ============== the end of Game component ================================================

  ReactDOM.render(
    <Game size = {10} needForWin = {5} />,
    document.getElementById('root')
  );

  function calculateWinner(squares, needForWin) {
    const size = Math.sqrt(squares.length);

    // check rows:
    let patternX = 'X';
    let patternO = 'O';
    for(let i = 1; i < needForWin; i++){
      patternO += 'O';
      patternX += 'X';
    }

    const getIndex = function(str){
      let indexX = str.indexOf(patternX);
      let indexO = str.indexOf(patternO);
      if(indexX === -1 && indexO === -1)
        return -1;

      return Math.min(indexX === -1 ? Number.MAX_VALUE : indexX, indexO === -1 ? Number.MAX_VALUE : indexO);
   }

    const makeStr = function(start, finish, step, breakFlag){
      let str = '';
      for(let j = start; j < finish; j += step){
        str += squares[j] ? squares[j] : ' ';
        if(breakFlag)
          if(j%size === 0)
            break;
      }
      return str;
    }

    const makeWinnersArray = function(startIndex, i, start, finish, f){
      let winnersArr = [];
      for(let j = start; j < finish; j++)
        winnersArr.push(f(i, j, startIndex, size));
      return winnersArr;
    }

    // functions to eval values of winnersArray:
    const f1 = (i, j, index) => i + index + j;
    const f2 = (i, j, index) => i + j*size;
    const f3 = (i, j, index) => i + j*(size-1);
    const f4 = (i, j, index) => i + index*(size+1) + (size+1)*j;

    // check rows:
    for(let i = 0; i < squares.length; i += size){
      let str = squares.map(item => !item ? ' ' : item).slice(i, i + size).join('');
      let index = getIndex(str);
      if(index !== -1){
        return {winningCells: makeWinnersArray(index, i, 0, needForWin, f1), winner: squares[i+ index]};
      }
    }

    // check cols:
    for(let i = 0; i < size; i++){
      let str = makeStr(i, squares.length, size, false);
      let index = getIndex(str);
      if(index !== -1){
        return {winningCells: makeWinnersArray(index, i, index, index+needForWin, f2), winner: squares[i+ index*size]};
      }
    }

    let n = needForWin - 1;
    // 1 diagonals: ///
    for(let i = n; i < size; i++){ // main diagonal / is also here
      let str = makeStr(i, squares.length, size-1, true);
      let index = getIndex(str);
      if(index !== -1){
          return {winningCells: makeWinnersArray(index, i, index, index+needForWin, f3), winner: squares[i + index*(size-1)]};
      }
    }
    // 2 diagonals  : ///
    let start = squares.length - n*size - 1;
    for(let i = start; i > size; i -= size){
      let str = makeStr(i, squares.length, size-1, false);
      let index = getIndex(str);
      if(index !== -1){
        return {winningCells: makeWinnersArray(index, i, index, index+needForWin, f3), winner: squares[i + index*(size-1)]};
      }
    }

    // 3. diagonals \\\
    for(let i = 0; i < needForWin; i++){ // main diagonal \ is here
      let str = makeStr(i, squares.length - i+size, size + 1, false);
      let index = getIndex(str);
      if(index !== -1){
        return {winningCells: makeWinnersArray(index, i, 0, needForWin, f4), winner: squares[i + index*(size+1)]};
      }
    }
    let finish = squares.length - size*needForWin;
    for(let i = size; i <= finish; i++){
      let str = makeStr(i, squares.length, size + 1, false);
      let index = getIndex(str);
      if(index !== -1){
       return {winningCells: makeWinnersArray(index, i, 0, needForWin, f4), winner: squares[i + index*(size+1)]};
      }
    }

    if(!squares.includes(null))
      return {winningCells: null, winner: 'Draw'};
    else
      return {winningCells: null, winner: null};
  }
