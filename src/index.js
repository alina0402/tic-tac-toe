import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

function Square(props) {
      return (
        <button className = {props.highlighted ? "square highlighted" : "square"}
                onClick = {() => props.onClick()}
                >
        {props.value}
        </button>
      );
  }

function SortButton(props) {
    return (
      <button className="sort-btn"
              onClick = {() => props.onClick()}
              >
      { props.sortedAsc ?  'Sort Z-A' : 'Sort A-Z'}
      </button>
    );
}

class Board extends React.Component {
    renderSquare(i) {

      return (<Square
                key = {'square' + i}
                value = {this.props.squares[i]}
                highlighted = {this.props.winningCells && this.props.winningCells.includes(i) ? true : false}
                onClick = {() => this.props.onClick(i)}
              />
      );
    }

    render() {
      let rows = [];
      for(let i = 0; i < this.props.size; i++)
        rows.push(i);
      let cols = [];
      for(let i = 0; i < this.props.size; i++)
        cols.push(i);
      const boardRows = rows.map((row) =>
            <div key = {row} className = 'board-row'>{cols.map((col) => this.renderSquare(this.props.size*row+col))}</div>
      );

      return (
          <div>
              {boardRows}
          </div>)
    }
  }

  class Game extends React.Component {
    constructor(props){
      super(props);
      this.state = {
        history: [{
          squares: Array(props.size*props.size).fill(null),
          row: null,
          col: null,
        }],
        // size: props.size,
        stepNumber: 0,
        xIsNext: true,
        sortAsc: true,
      };
    }

    handleClick(i){
      const history = this.state.history.slice(0, this.state.stepNumber + 1);
      const current = history[history.length - 1];
      const squares = [...current.squares];


      if(calculateWinner(squares, this.props.needForWin).winner || squares[i])
        return;

      squares[i] = this.state.xIsNext ? 'X' : 'O';

      this.setState({
          history: history.concat([{
            squares: squares,
            row: Math.floor(i/this.props.size),
            col: i%this.props.size,
          }]),
          stepNumber: history.length,
          xIsNext: !this.state.xIsNext,
        });
    }

    jumpTo(step){
      this.setState({
        stepNumber: step,
        xIsNext: (step%2) === 0,
      })
    }

    renderMoves(history, asc){
      return asc ? history.map((step, move) => {
        const desc = move ? 'Go to move #' + move + ' (' + history[move].row + ', ' + history[move].col + ') ':
                    'Go to game start';
        return (
          <li key = {move}>
            <button onClick = {() => this.jumpTo(move)}>{desc}</button>
          </li>
        )
      }) :
      history.map((step, move) => {
        const desc = move ? 'Go to move #' + move + ' (' + history[move].row + ', ' + history[move].col + ') ':
                    'Go to game start';
        return (
          <li key = {move}>
            <button onClick = {() => this.jumpTo(move)}>{desc}</button>
          </li>
        )
      }).reverse();
    }

    handleSort(){
      this.setState({sortAsc: !this.state.sortAsc});
      this.renderMoves(this.state.history, this.state.sortAsc);
    }

    render() {
      const history = this.state.history.slice(0);
      const current = history[this.state.stepNumber];

      const winResult = calculateWinner(current.squares, this.props.needForWin);

      const moves = this.renderMoves(history, this.state.sortAsc);

      let lastStep = "Last step: ("  + current.row + ", " + current.col + "); ";
      lastStep = lastStep.concat("Next player: " + (this.state.xIsNext ? "X" : "O"));

      let status = winResult.winner ? "Winner: " + winResult.winner : lastStep;

      return (
        <div className="game">
          <div className="game-board">
            <Board squares = {current.squares}
                   size = {this.props.size}
                   winningCells = {winResult.winningCells}
                    onClick = {(i) => this.handleClick(i)} />
          </div>
          <div className="game-info">
            <SortButton sortedAsc = {this.state.sortAsc} onClick = {() => this.handleSort()}/>
            <div>{status}</div>
            <ul>{moves}</ul>
          </div>
        </div>
      );
    }
  }

  // ========================================

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
