$(document).ready(function() {
    var socket = io.connect();
    
    var dealerCard = 0;
    var cardOne = 0;
    var cardTwo = 0;
    var clickable = true;
    
    $('#nawkerGame').hide();
    
    socket.on('clientCards', function(cards) {
        $('#actions').empty();
        $('#message').text("The game has begun!");
        $('#dealerCard').text(cards[0].name);
        dealerCard = cards[0].value;
        $('#dealerCardImage').attr('src', 'images/cards/' + cards[0].name.replace(/ /g, '_').toLowerCase() + '.png');
        $('#cardOne').text(cards[1].name);
        cardOne = cards[1].value;
        $('#cardOneImage').attr('src', 'images/cards/' + cards[1].name.replace(/ /g, '_').toLowerCase() + '.png');
        $('#cardTwo').text(cards[2].name);
        cardTwo = cards[2].value;
        $('#cardTwoImage').attr('src', 'images/cards/' + cards[2].name.replace(/ /g, '_').toLowerCase() + '.png');
    });
    
    socket.on('result', function(data) {
        clickable = true;
        $('#cardOneImage').css('cursor', 'pointer');
        $('#cardTwoImage').css('cursor', 'pointer');
        if(data == 'It was a draw!' || data == 'The game ended in a draw!') {
            $('#message').text(data);
        } else {
            if(data == socket.id) {
                $('#message').text('You won the round!');
            } else {
                $('#message').text('The winner of the round was ' + data + '.');
            }
        }
    });
    
    socket.on('offerNewRound', function() {
        $('#continueButton').removeClass('disabled');
        $('#cardOneImage').css('cursor', 'pointer');
        $('#cardTwoImage').css('cursor', 'pointer');
    });
    
    socket.on('gameWinner', function(message) {
        $('#message').text(message);
    });
    
    socket.on('action', function(message) {
        $('#actions').append('<p>' + message + '</p>');
    });
    
    $('#submitUsername').click(function(event) {
        event.preventDefault();
        $('#usernameForm').hide();
        $('#nawkerGame').show();
        socket.emit('username', $('#username').val());
    });
    
    $('#cardOneImage').click(function(event) {
        event.preventDefault();
        if(clickable) {
            console.log('Card one was clicked.');
            socket.emit('cardClicked', cardOne);
            $('#cardOneImage').css('cursor', 'default').attr('src', 'images/cards/joker.png');
            $('#cardTwoImage').css('cursor', 'default');
            clickable = false;
        }
    });
    
    $('#cardTwoImage').click(function(event) {
        event.preventDefault();
        if(clickable) {
            console.log('Card two was clicked.');
            socket.emit('cardClicked', cardTwo);
            $('#cardTwoImage').css('cursor', 'default').attr('src', 'images/cards/joker.png');
            $('#cardOneImage').css('cursor', 'default');
            clickable = false;
        }
    });
    
    $('#continueButton').click(function() {
        socket.emit('startNewRound');
        $('#continueButton').addClass('disabled');
    });
});