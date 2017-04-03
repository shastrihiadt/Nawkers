/*
    Author: Shastri Harrinanan
            N00147655
    Title:  Nawkers
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
server.listen(3000);

var nawkerRooms = new Array();
var cardRoom = "";
var roomCounter = 1;
var currentConnectedPlayers = 0;
var createNewRoom = true;
var decks = new Array();
decks[0] = null;
var playedCards = new Array();

var cardSuits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
var cardValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// Create the array to hold the base set of cards
var deck = new Array(52);

// Build the base set of cards by building the deck suit by suit
for(var i = 0; i < cardSuits.length; i++) {
    // For each suit, add a card for each value (2 through Ace)
    for(var j = 0; j < cardValues.length; j++) {
        var namedValue = '';
        switch(cardValues[j]) {
            case 11:
                namedValue = 'Jack';
                break;
            case 12:
                namedValue = 'Queen';
                break;
            case 13:
                namedValue = 'King';
                break;
            case 14:
                namedValue = 'Ace';
                break;
            default:
                // If the card isn't a face card or an Ace, then leave the value unchanged 
                namedValue = cardValues[j];
                break;
        }
        // Create the card object using the values in the loops
        deck.push(new card(cardValues[j], cardSuits[i], namedValue + " of " + cardSuits[i]));
    }
}



var selectedHouse, selectedValue;

// Handle connections with clients
io.on('connection', function(client) {
    console.log('Client connected to socket.');
    currentConnectedPlayers++;
    // If a room is unavailable, then create one
    if(createNewRoom) {
        cardRoom = "";
        // Create the room name by using an counter
        cardRoom = cardRoom.concat("cardRoom").concat(roomCounter);
        roomCounter++;
        // Add the name for later use
        client.room = cardRoom;
        // Create a room object for each room
        nawkerRooms[cardRoom] = {name: cardRoom, turns: 0, winner: '', dealer: 0, scores: new Array()};
        // Create an array to hold the cards users selected
        playedCards[cardRoom] = new Array();
        // Reset the flag
        createNewRoom = false;
    }
    // Add each new player to a room
    if(currentConnectedPlayers <= 4) {
        client.room = cardRoom;
        client.join(cardRoom);
        nawkerRooms[cardRoom].scores.push({id: client.id, name: '', score: 0});
        console.log('Client joined room ' + cardRoom + '.');
    }
    // Once there are enough players, start the game
    if(currentConnectedPlayers == 4) {
        // Flip the flag to allow the next connecting client to join a game
        createNewRoom = true;
        currentConnectedPlayers = 0;
        console.log("Starting game.");
        startGame(cardRoom);
    }
    // When a client provides a custom name, add that to the data recorded for the clients in each room
    client.on('username', function(username) {
        client.username = username;
        console.log("Client " + client.id + " wants to be called " + client.username + ".");
        nawkerRooms[client.room].scores.forEach(function(player) {
            if(player.id == client.id) {
                player.name = client.username;
            }
        });
    })
    // Handle a user's selection of a card
    client.on('cardClicked', function(clickedCard) {
        var clientID = client.id;
        var username = client.username;
        var room = client.room;
        var action = username + " selected a card with a value of " + clickedCard + ".";
        console.log("(" + room + ") " + action);
        // Let the other 3 players in the game know what the user did
        client.broadcast.emit('action', action);
        // Record the details of the action
        var receivedCard = {clientID, username, clickedCard};
        // Store the record
        playedCards[room].push(receivedCard);
        // Grab a temporary reference to the scoresheet for the game
        var scoreSheet = nawkerRooms[room].scores;
        // If the user's card outranks the dealer's, give them a point
        if(clickedCard > nawkerRooms[room].dealer.value) {
            for(var i = 0; i < scoreSheet.length; i++) {
                if(scoreSheet[i].id == client.id) {
                    scoreSheet[i].score += 1;
                    console.log(client.id + ' now has a score of ' + scoreSheet[i].score);
                }
            }
        }
        // Attempt to determine a winner for the round when each player has selected a card
        if(playedCards[room].length == 4) {
            console.log('Time to compare!');
            // Set the winner to the first selection recorded by default...
            var max = playedCards[room][0].clickedCard;
            nawkerRooms[room].winner = playedCards[room][0].username;
            var matches = 0;
            // Then go through each subsequent selection to determine which card had the highest value
            for(var i = 1; i < playedCards[room].length; i++) {
                var card = playedCards[room][i];
                var cardValue = card.clickedCard;
                if(cardValue > max) {
                    nawkerRooms[room].winner = card.username;
                    max = cardValue;
                    if(matches > 0) {
                        matches = 0;
                    }
                } else if(cardValue == max) {
                    // If any subsequent selection was of a card of equal value, then record this
                    matches++;
                }
            }
            // If no matches were identified, then one card had a higher value than all the others,
            // so announce the winner
            if(matches == 0) {
                console.log('Round winner found! The winner is: ' + nawkerRooms[room].winner);
                nawkerRooms[room].scores.forEach(function(player) {
                    if(player.name == nawkerRooms[room].winner) {
                        // Reward the winner of the round with 3 points
                        player.score += 3;
                        console.log(player.name + ' now has a score of: ' + player.score + '.');
                    }
                });
                // Let all players in the room know of who won
                io.in(room).emit('result', nawkerRooms[room].winner);
            } else if(matches >= 1) {
                // If at least 1 card matched the highest ranked card, then award no points
                console.log('It was a draw!');
                io.in(room).emit('result', 'It was a draw!');
            }
            // Increment the number of turns so the server knows when the 2 rounds have passed
            nawkerRooms[room].turns++;
            console.log('There have now been ' + nawkerRooms[room].turns + ' turns for ' + room + '.');
            // Reset the set of selected cards in preparation of a new round
            playedCards[room] = new Array();
        }
        // If each player has played each of their two cards, and there are at least 9 cards remaining in the deck,
        // (meaning there are enough cards left for the server to deal to all players), then offer players a new round
        if(nawkerRooms[room].turns == 2 && decks[room].length >= 9) {
            io.in(room).emit('offerNewRound');
        }
        // If the deck has insufficient cards, then set the flag to start scoring the match
        if(decks[room].length < 9){
            nawkerRooms[room].score = true;
        }
    });
    
    // Handle a user's request to start a new round
    client.on('startNewRound', function() {
        // If there are enough cards...
        if(decks[cardRoom].length >= 9) {
           console.log('Starting a new round.');
            emitRoundCards(cardRoom);
            console.log("Deck length in room " + cardRoom + " is now " + decks[cardRoom].length);
        } else {
            // If the deck has run out of cards, the game is over, so tally the scores
            tally(cardRoom);
        }
    });
});

function startGame(cardRoom) {
    console.log("Creating deck for room " + cardRoom + ".");
    
    // Create a shuffled deck from the ordered deck of cards for the room
    var shuffledDeck = new Array(52);
    decks[cardRoom] = null;
    decks[cardRoom] = shuffledDeck;
    var inserted = false;
    var randomNumber = 0;
    
    for(var i = 0; i < deck.length; i++) {
        // While the card has yet to be inserted into the shuffled deck...
        while(!inserted) {
        // Generate a random place to attempt to insert the card into the shuffled deck array
        randomNumber = Math.floor(Math.random() * 52);
            // If a card does not already exist in that slot...
            if(shuffledDeck[randomNumber] == null) {
                // Place the card into the shuffled deck
                shuffledDeck[randomNumber] = deck[i];
                // Set the card to have been inserted into the deck
                inserted = true;
            }
        }
        // If the card had been placed, reset the flag to allow the next card to be placed
        inserted = false;
    }
    
    console.log("Preparing cards for transmission...");
    emitRoundCards(cardRoom);
    console.log("Awaiting player responses.");
}

// Define the card object
function card(value, suit, name) {
    this.suit = suit;
    this.value = value;
    this.name = name;
}

// Code to remove a card from a room's deck
function drawCard() {
    var selectedCardIndex = null;
    var selectedCard = null;
    var selected = false;
    // Set the range of the random number to ensure it does not exceed
    // the length of the deck for the room which shrinks after each card is drawn
    var deckSize = decks[cardRoom].length;
    while(!selected) {
        // Randomly identify a card
        selectedCardIndex = Math.floor(Math.random() * deckSize + 1);
        // Select it
        selectedCard = decks[cardRoom][selectedCardIndex];
        // Remove it from the room's deck
        decks[cardRoom].splice(selectedCardIndex, 1);
        selected = true;
    }
    return selectedCard;
}

function roundDraw() {
    console.log("Drawing cards for the round.");
    // Create an array to hold the 9 cards required for each round
    var roundDeck = new Array(9);
    for(var i = 0; i < roundDeck.length; i++) {
        roundDeck[i] = drawCard();
    }
    return roundDeck;
}

function emitRoundCards(cardRoom) {
    // Draw the 9 cards for the round (1 for the dealer and 2 for each of the 4 players)
    var roundDeck = roundDraw();
    // Set the dealer's card to the first card drawn
    nawkerRooms[cardRoom].dealer = roundDeck[0];
    
    // Grab the client data for the specified room
    var clients = io.sockets.adapter.rooms[cardRoom].sockets;
    // Store the IDs for all of the clients
    var clientSockets = new Array(4);
    var clientIndex = 0;
    for(var clientID in clients) {
        clientSockets[clientIndex] = clientID;
        clientIndex++;
    }
    // Use a counter to automatically track which of the 9 cards drawn for the round
    // should be given to the client
    var roundDeckIndex = 1;
    console.log("Sending drawn cards to players.");
    for(var i  = 0; i < clientSockets.length; i++) {
        // Create an array to store the 3 cards to be sent to the client
        var playerDraw = new Array(3);
        // Always set the first card to the same card drawn for the round
        // to ensure each player gets the same card for the dealer
        playerDraw[0] = roundDeck[0];
        // Then select the next avaiable card from the 9 drawn for the round
        // to send to the client
        playerDraw[1] = roundDeck[roundDeckIndex];
        roundDeckIndex++;
        playerDraw[2] = roundDeck[roundDeckIndex];
        roundDeckIndex++;
        // Send only the cards the player should see
        io.to(clientSockets[i]).emit('clientCards', playerDraw);
    }
}

// Tally the points for the game and present a winner if there is one
function tally(room) {
    var scores = nawkerRooms[room].scores;
    // Set the winner to the first client by default
    var max = scores[0].score;
    var winner = scores[0].name;
    var matches = 0;
    console.log('Tallying the results of the game...');
    console.log('****************************************');
    console.log(scores[0]);
    // Then go through each of the other players' score
    for(var i = 1; i < scores.length; i++) {
        console.log(scores[i]);
        // If their score was higher, set them as the winner...
        if(max < scores[i].score) {
            console.log(max, scores[i].score)
            max = scores[i].score;
            winner = scores[i].name;
            // Reset the number of matches if a new winner is found
            // to ensure any previous matches, which are now irrelevant,
            // do not prevent the winner from being identified
            matches = 0;
        } else if(max == scores[i].score) {
            // Or record if there was a match
            matches++;
        }
    }
    if(matches == 0) {
        console.log("The winner of the game is: " + winner + ".");
        io.in(room).emit('gameWinner', 'The winner of the game is: ' + winner + '.');
    } else {
        console.log('The game ended in a draw!');
        io.in(room).emit('result', 'The game ended in a draw!');
    }
    console.log('****************************************');
}


// Resources
// Required code
app.use(express.static(__dirname + '/node_modules'));
// Make the entire directory available
app.use(express.static(__dirname + '/public'));