const {MongoClient, ObjectId} = require('mongodb');
var {PokerDBService} = require('../db/Service/pokerDBService.js');
PokerDBService = new PokerDBService();
const uri =
  'mongodb+srv://wwq010197:Wwq010917@cluster0.zse03yf.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {useUnifiedTopology: true});
var NumberInt = require('mongodb').Int32;
const express = require('express');
const {PassThrough} = require('nodemailer/lib/xoauth2/index.js');
// recordRoutes is an instance of the express router.
const recordRoutes = express.Router();
// This will help us connect to the database
client.connect();
// This section will help you get a list of all the records.
class Room {
  constructor(number) {
    this.roomNumber = number;
    this.player = new Array();
    this.communityCards = new Array();
    this.playerCards = new Array();
    this.currentStatus = 'waiting';
    this.setPositions = false;
    this.startingMoney = 1000;
    this.button;
    this.currentPlayer;
    this.largestBet = 0;
    this.largestRaise = 0;
    this.pot = 0;
    this.gameTurn = 'Preflop';

    // [["S2", "S3"], ["H5", "HK"]]
  }
}
class playerStatus {
  constructor(hostName) {
    this.name = hostName;
    this.total = 0; // total money left for the player
    this.current = 0; //total bet in this current round
    this.pos = '';
    this.readyState = false;
    this.currentPlay = false; //the current decided play in this round
    this.currentRaise = 0; //the current total bet this turn
    this.loss = false; //when the player has 0 total money
  }
}

class card {
  constructor(number, suit) {
    this.number = number;
    this.suit = suit;
  }
}
recordRoutes.route('/hostGame').post(async function (req, res) {
  const hostName = req.body.hostName;
  //console.log(hostName);
  var duplicate = true;
  var roomNumber;
  var randomNumber = () => {
    roomNumber = Math.floor(1000 + Math.random() * 9000);
    return roomNumber;
  };
  while (duplicate) {
    duplicate = await PokerDBService.checkDuplicate(client, randomNumber());
  }
  console.log('Create a room:' + roomNumber);
  const room = new Room(roomNumber);
  const playerArray = new playerStatus(hostName);
  room.player.push(playerArray);
  await PokerDBService.hostGame(client, room);
  res.json(roomNumber);
});
recordRoutes.route('/JoinGame').post(async function (req, res) {
  const userName = req.body.userName;
  const roomNumber = req.body.roomNumber;
  //console.log(roomNumber);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    const playerArray = new playerStatus(userName);
    result.player.push(playerArray);
    //console.log(result);
    await PokerDBService.updateRoom(client, NumberInt(roomNumber), result);
    res.json(true);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/checkName').post(async function (req, res) {
  const userName = req.body.userName;
  const roomNumber = req.body.roomNumber;
  // console.log('roomNumber');
  // console.log(roomNumber);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  const playerArray = result.player;
  var bool = false;
  console.log(playerArray);
  for (var i = 0; i < playerArray.length; i++) {
    if (playerArray[i].name == userName) {
      bool = true;
    }
  }
  res.json(bool);
});
recordRoutes.route('/getPlayerList').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  //console.log(roomNumber);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    res.json(result.player);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/removePlayer').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const userName = req.body.userName;
  console.log(userName);
  console.log(roomNumber);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    const playerArray = result.player;
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].name == userName) {
        playerArray.splice(i, 1);
      }
    }
    result.player = playerArray;
    await PokerDBService.updateRoom(client, NumberInt(roomNumber), result);
    res.json(true);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/setReady').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const userName = req.body.userName;
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    const playerArray = result.player;
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].name == userName) {
        playerArray[i].readyState = true;
      }
    }
    result.player = playerArray;
    await PokerDBService.updateRoom(client, NumberInt(roomNumber), result);
    res.json(true);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/setUnready').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const userName = req.body.userName;
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    const playerArray = result.player;
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].name == userName) {
        playerArray[i].readyState = false;
      }
    }
    result.player = playerArray;
    await PokerDBService.updateRoom(client, NumberInt(roomNumber), result);
    res.json(true);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/checkOneReady').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const room = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  var oneIsReady = false;
  const players = room.player;
  for (let i = 0; i < players.length; i++) {
    if (players[i].readyState) {
      oneIsReady = true;
      break;
    }
  }
  console.log('--------------------');
  players.forEach(p => console.log(p.name + ' ' + p.readyState));
  res.json(oneIsReady);
});

recordRoutes.route('/checkAllready').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  var ready = true;
  if (result != false) {
    const playerArray = result.player;
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].readyState == false) {
        ready = false;
        break;
      }
    }
    res.json(ready);
  } else {
    res.json(false);
  }
});
async function getFlop(room) {
  const cards = [
    'SA',
    'S2',
    'S3',
    'S4',
    'S5',
    'S6',
    'S7',
    'S8',
    'S9',
    'S10',
    'SJ',
    'SQ',
    'SK',
    'DA',
    'D2',
    'D3',
    'D4',
    'D5',
    'D6',
    'D7',
    'D8',
    'D9',
    'D10',
    'DJ',
    'DQ',
    'DK',
    'HA',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'H7',
    'H8',
    'H9',
    'H10',
    'HJ',
    'HQ',
    'HK',
    'CA',
    'C2',
    'C3',
    'C4',
    'C5',
    'C6',
    'C7',
    'C8',
    'C9',
    'C10',
    'CJ',
    'CQ',
    'CK',
  ];
  //console.log(room.currentStatus);

  if (room.currentStatus == 'waiting') {
    for (i = 1; i <= room.player.length * 2; i++) {
      n = Math.floor(Math.random() * cards.length);
      var newCard;
      if (cards[n][0] == 'S') {
        newCard = new card(cards[n][1], 'Spade');
      } else if (cards[n][0] == 'C') {
        newCard = new card(cards[n][1], 'Club');
      } else if (cards[n][0] == 'D') {
        newCard = new card(cards[n][1], 'Diamond');
      } else if (cards[n][0] == 'H') {
        newCard = new card(cards[n][1], 'Heart');
      }
      room.playerCards.push(newCard);

      cards.splice(n, 1);
    }
    for (i = 0; i <= 4; i++) {
      n = Math.floor(Math.random() * cards.length);
      var newCard;
      if (cards[n][0] == 'S') {
        newCard = new card(cards[n][1], 'Spade');
      } else if (cards[n][0] == 'C') {
        newCard = new card(cards[n][1], 'Club');
      } else if (cards[n][0] == 'D') {
        newCard = new card(cards[n][1], 'Diamond');
      } else if (cards[n][0] == 'H') {
        newCard = new card(cards[n][1], 'Heart');
      }
      room.communityCards.push(newCard);
      cards.splice(n, 1);
    }
    console.log(room.communityCards);
    room.currentStatus = 'start';
    const result = await PokerDBService.updateRoom(
      client,
      NumberInt(room.roomNumber),
      room,
    );
    return room;
  }
}
recordRoutes.route('/startGame').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  console.log('my room number: ' + roomNumber);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    console.log('start Game');
    // generate a button

    if (!result.setPositions) {
      const playerArray = result.player;
      for (var i = 0; i < playerArray.length; i++) {
        playerArray[i].total = 1000;
      }
      var btn = Math.floor(Math.random() * playerArray.length);
      playerArray[btn].pos = 'BTN';

      if (playerArray.length == 2) {
        var sb = (btn + 1) % playerArray.length;
        playerArray[sb].pos = 'SB';
        playerArray[sb].current = 5;
        playerArray[sb].total = 1000 - 5;

        result.pot += 5;
        playerArray[btn].current = 10;
        playerArray[btn].total = 1000 - 10;
        result.largestRaise = 10;
        result.pot += 10;

        result.currentPlayer = playerArray[sb];
      } else {
        var sb = (btn + 1) % playerArray.length;
        var bb = (btn + 2) % playerArray.length;
        playerArray[sb].pos = 'SB';
        playerArray[sb].current = 5;
        playerArray[sb].total = 1000 - 5;
        result.pot += 5;
        playerArray[bb].pos = 'BB';
        playerArray[bb].current = 10;
        playerArray[bb].total = 1000 - 10;
        result.largestRaise = 10;

        result.pot += 10;
        var cur = (bb + 1) % playerArray.length;
        result.currentPlayer = playerArray[cur];
      }
      result.setPositions = true;
      result.player = playerArray;
      result.largestBet = 10;
      result.gameStage = 'Preflop';
      console.log(result.player);

      const updateRes = await PokerDBService.updateRoom(
        client,
        NumberInt(req.body.roomNumber),
        result,
      );
    }

    const roomInfo = await getFlop(result);
    res.json(roomInfo);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/checkRoomStatus').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    //console.log('start Game');
    //console.log(result);
    res.json(result);
  } else {
    res.json(false);
  }
});
recordRoutes.route('/getSelfInfo').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const userName = req.body.userName;
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result != false) {
    const playerArray = result.player;
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].name == userName) {
        player = playerArray[i];
      }
    }
    res.json(player);
  } else {
    res.json(false);
  }
});

recordRoutes.route('/getPlayerCards').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  //const userName = req.body.userName;
  console.log('getPlayerCards');
  const cardMap = new Map();
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));

  var cardIndex = 0;
  if (result != false) {
    for (var i = 0; i < result.player.length; i++) {
      if (cardIndex > result.playerCards.length) {
        break;
      }
      const cardArray = new Array();
      for (var k = 0; k < 2; k++) {
        cardArray.push(result.playerCards[cardIndex]);
        cardIndex++;
      }
      cardMap.set(result.player[i].name, cardArray);
    }
    const Obj = Object.fromEntries(cardMap);
    res.json(Obj);
  } else {
    res.json(false);
  }
});

recordRoutes.route('/endTurn').post(async function (req, res) {
  const roomNumber = req.body.roomNumber;
  const userName = req.body.userName;
  const currentPlay = req.body.currentPlay;
  const currentRaise = req.body.currentRaise;
  console.log('initiating endturn ' + userName);
  const result = await PokerDBService.getRoom(client, NumberInt(roomNumber));
  if (result) {
    const playerArray = result.player;
    //set player as the current player
    for (var i = 0; i < playerArray.length; i++) {
      if (playerArray[i].name == userName) {
        player = playerArray[i];
        playerIndex = i;
      }
    }
    //update info on this turn
    player.total -= Math.abs(currentRaise - player.current);
    result.pot += Math.abs(currentRaise - player.current);
    console.log('total money ' + player.total);
    player.currentPlay = currentPlay;
    player.current = currentRaise;
    result.largestBet = Math.max(result.largestBet, currentRaise);
    console.log('the current largest bet is ' + result.largestBet);
    result.largestRaise = Math.max(
      result.largestRaise,
      currentRaise - result.largestBet,
    );
    console.log('the current largest raise is ' + result.largestRaise);

    //check if game needs to end
    if (checkEndGame(result)) {
      endGame(result);
      const updateRes = await PokerDBService.updateRoom(
        client,
        NumberInt(req.body.roomNumber),
        result,
      );
      return true;
    }

    console.log('checking if round ending');
    //if yes then end round

    checkEndRound = true;
    console.log('Player Index is ' + playerIndex);
    //genereate a array containing a round of players after the current player
    rotateIndex = playerArray.length - playerIndex;
    console.log('rotate index is ' + rotateIndex);
    nextPlayers = [...Array(playerArray.length).keys()];
    console.log('generated list: ' + nextPlayers);
    rotate(nextPlayers, rotateIndex);
    console.log('rotated list ' + nextPlayers);
    nextPlayers.shift();
    console.log(playerArray);
    console.log(nextPlayers);
    console.log('The largest bet is ' + result.largestBet);
    for (var i of nextPlayers) {
      //if player i can make a turn, i.e. if they have not lost and they still need to call
      if (
        !playerArray[i].loss &&
        playerArray[i].currentPlay != 'Fold' &&
        playerArray[i].currentPlay != 'Allin' &&
        (!playerArray[i].currentPlay ||
          (playerArray[i].currentPlay == 'Call' &&
            playerArray[i].current < result.largestBet) ||
          (playerArray[i].currentPlay == 'Check' &&
            playerArray[i].current < result.largestBet))
      ) {
        checkEndRound = false;
        console.log('setting current player to ' + playerArray[i].name);
        result.currentPlayer = playerArray[i];
        break;
      }
    }
    if (checkEndRound) {
      console.log('The round is ending');
      switch (result.gameTurn) {
        case 'Preflop':
          console.log('starting flop');
          result.gameTurn = 'Flop';
          break;
        case 'Flop':
          console.log('starting turn');
          result.gameTurn = 'Turn';
          break;
        case 'Turn':
          console.log('starting river');
          result.gameTurn = 'River';
          break;
        case 'River':
          endGame(result);
          break;
        default:
      }

      //restart round
      var nextPlayerIndex;
      //select the next player, this is SB by default but if SB is out then get the next player
      for (var i = 0; i < playerArray.length; i++) {
        playerArray[i].current = 0;
        playerArray[i].currentPlay = false;
        playerArray[i].currentRaise = 0;
        if (playerArray[i].pos == 'SB') {
          nextPlayerIndex = i;
        }
      }

      for (var i = 0; i < playerArray.length; i++) {
        if (playerArray[i].pos == 'SB') {
          nextPlayerIndex = i;
          if (
            playerArray[i].loss ||
            playerArray[i].currentPlay == 'Fold' ||
            playerArray[i].currentPlay == 'Allin'
          ) {
            nextPlayerIndex == (nextPlayerIndex + 1) % playerArray.length;
            continue;
          }
          result.currentPlayer = playerArray[nextPlayerIndex];
        }
      }
      console.log('the next player is ' + playerArray[nextPlayerIndex].name);
      result.currentPlayer = playerArray[nextPlayerIndex];
      result.largestBet = 0;
      result.largestRaise = 0;
    }

    const updateRes = await PokerDBService.updateRoom(
      client,
      NumberInt(req.body.roomNumber),
      result,
    );

    res.json(true);
  } else {
    res.json(false);
  }
});

var rotate = function (nums, k) {
  k %= nums.length; // if k is greater than nums.length then one cycle is completed that means it will remain the same and we have to remainder shifts

  let reverse = function (i, j) {
    while (i < j) {
      let temp = nums[i];
      nums[i] = nums[j];
      nums[j] = temp;
      i++;
      j--;
    }
  }; // suppose  ----->--->
  reverse(0, nums.length - 1); // reverse   <--<------
  reverse(0, k - 1); // reverse first part ---><----
  reverse(k, nums.length - 1); // reverse second part --->----->
};

function checkEndGame(room) {
  console.log('checking Endgame');
  playerArray = room.player;
  activePlayers = 0;
  for (var i = 0; i < playerArray.length; i++) {
    if (
      playerArray[i].currentPlay != 'Fold' &&
      playerArray[i].currentPlay != 'Allin' &&
      playerArray[i].loss == false
    ) {
      activePlayers += 1;
    }
  }
  console.log('number of active players: ' + activePlayers);
  if (activePlayers < 1) {
    console.log('game ending');
    return true;
  }
  console.log('game not ending');
  return false;
}

function endGame(result) {
  result.gameTurn = 'Showdown';

  return result;
}

function checkEndRound(result) {
  //check if all players have called/folded/allin-ed
  checkEndRound = true;
  //genereate a array containing a round of players after the current player
  rotateIndex = playerArray.length - playerIndex;
  nextPlayers = [...Array(playerArray).keys()];
  rotate(nextPlayers, rotateIndex);
  nextPlayers.pop(0);

  for (var i of nextPlayers) {
    if (
      !playerArray[i].currentPlay ||
      (playerArray[i].currentPlay == 'Call' &&
        playerArray[i].current <= result.largestBet) ||
      playerArray[i].currentPlay == 'Check'
    ) {
      checkEndRound = false;
      result.currentPlayer = playerArray[i];
    }
  }
  return checkEndRound;
}

module.exports = recordRoutes;
