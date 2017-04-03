# Nawkers
Networks &amp; Distributed Systems - CA 3

# Project Description

Nawkers is a simple card game with the objective of beating all other played cards to earn points. The player with the most points at the end of the game wins.
The value of the cards is set from 2 through 14 corresponding to the cards ranging from 2 through to Ace.

****************************************************************************************************

The gameplay is described below:


After a player sets their name for the game, they are shown the game screen.

Each player will be dealt 2 cards along with the card the dealer drew. All are initially face down.

The game begins when 4 players connect to the server, at which point the cards are flipped.

Each player must then select one of their 2 cards to play. The objective is to beat the dealer's card by playing a card of greater value to get a point while also keeping in mind the cards the other players might play as those must also be beaten in order to win more points.

Each round consists of 2 turns in which players must play one card for each turn.

The game continues until the dealer runs out of cards to deal to all of the players. At this point, the points are tallied and a winner announced.

****************************************************************************************************

# Project Files

The file which contains the code providing all of the server functionality is "server.js". This file must be run from the Node.js command prompt in order for the server to run.

The public folder contains all of the files needed by the client, including the HTML page "index.html" which houses the game and the JavaScript file "socket.io.js" which contains all of the code necessary to interact with the server, including establishing a socket based connection as well as code to send data to and receive data from the server.

The project also includes all of the PNG card images displayed to the user as well as the CSS files (including Bootstrap files providing minor additional styling) and supporting JavaScript libraries (jQuery and Bootstrap).

****************************************************************************************************

# Running the Project

In order to run the project, the following steps can be taken:

1. Install Node if it is not already installed.
2. Open the Node.js command prompt and then navigate to the directory containing the server.js file.
3. Run the server.js file by entering "node server.js" and hitting enter.
4. Open a browser tab and enter "localhost:3000" in the address bar and hit enter.
5. Either have 3 other people access the server via your computer's LAN IP address (e.g. 192.168.1.1:3000), or simple access the server in the same way in 3 other tabs.
