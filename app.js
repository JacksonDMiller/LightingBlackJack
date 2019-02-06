/*jslint node: true */
const express = require('express')
const app = express()
var deck = require('./deck.js');
var games = [];
var QRCode = require('qrcode')
var sessions = {};
var pending = [];
app.use(express.static(__dirname + '/public/'));


var fs = require('fs');
var grpc = require('grpc');

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

// Lnd admin macaroon is at ~/.lnd/data/chain/bitcoin/simnet/admin.macaroon on Linux and
// ~/Library/Application Support/Lnd/data/chain/bitcoin/simnet/admin.macaroon on Mac
var m = fs.readFileSync('admin.macaroon');
var macaroon = m.toString('hex');

// build meta data credentials
var metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// build ssl credentials using the cert the same as before
var lndCert = fs.readFileSync("tls.cert");
var sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
var credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Pass the crendentials when creating a channel
var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials);


var call = lightning.subscribeInvoices({});
call.on('data', function(invoice) {
    console.log(invoice);
    if (invoice.settled === true) {
        console.log('paid')
        console.log(invoice.amt_paid_sat)
        
        for(i=0; i < pending.length; i++){
            if (pending[i][0] === invoice.payment_request){
                        sessions[pending[i][1]].score = parseInt(invoice.amt_paid_sat) + parseInt(sessions[pending[i][1]].score)
                                 }
            else {
                console.log(pending[i][0])
                console.log(invoice.payment_request)
                 }
        }
        
    }
})
.on('end', function() {
  // The server has finished sending
})
.on('status', function(status) {
  // Process status
  console.log("Current status" + status);
});


app.get('/', function (req, res) {
  res.sendFile(__dirname+'/index.html')
    console.log(sessions)
})


app.get('/syncScore/:sessionID', function (req, res) {
    var found = false
    let keys = Object.keys(sessions)
      for (sessionID of keys){
         if (sessionID === req.params.sessionID){
             Sscore = sessions[sessionID].score
                 res.send(sessions[sessionID])
                found = true
             break;
         }
              }
    if (found === false){ 
        sessions[req.params.sessionID] = {}
        sessions[req.params.sessionID].score = 0
        sessions[req.params.sessionID].activeGame = false
    
              res.send(sessions[req.params.sessionID])
        }
      }

    )


app.get('/deposit/:sessionID/:dValue/', function (req, res) {
 
    lightning.addInvoice({value:req.params.dValue, memo:'BlackJack'}, function(err, response) {

    var x ={}
    QRCode.toDataURL(response.payment_request, function (err, url) {
        x.image = url
         x.text = response.payment_request
        y = [response.payment_request, req.params.sessionID]
        pending.push(y) 
        res.send(x);
})}
        )})

app.get('/withdraw/:sessionID/:wValue/', function (req, res) {
  
  lightning.DecodePayReq(req.params.wValue, function(err, response) {
      if(response === undefined){
          res.send('Please enter a Lightning payment request')
      }
      else if(sessions[req.params.sessionID].activeGame === true){
          res.send('Please finish the current game')
      }
    else if (response.num_satoshis <= sessions[req.params.sessionID].score){
        sessions[req.params.sessionID].score -= response.num_satoshis
          lightning.sendPaymentSync({payment_request: req.params.wValue}, function(err, response) {
                })
        }
      else{res.send('Not enough funds')}
     
})
    


})


app.get('/new/:bet/:sessionID', function(req, res){

    if (req.params.bet > sessions[req.params.sessionID].score){
        res.send("Not enough funds")
    }
    else if (sessions[req.params.sessionID].activeGame === true){
        res.send("Game already active")}
    else if (isNaN(req.params.bet) == true || req.params.bet < 1){
    
        res.send("Pleae enter an amount")
        
    }
    else {
        var betInt = parseInt(req.params.bet)
        gameID = Math.floor((Math.random()*100000) + 1)
        addGame(gameID, betInt)
        res.send(getGameState(gameID))
        sessions[req.params.sessionID].activeGame = true
        sessions[req.params.sessionID].score = sessions[req.params.sessionID].score - req.params.bet
         }
    
   
})

app.get('/gameState/:gameID/:sessionID', function (req, res) {
    
    if(sessions[req.params.sessionID].activeGame === true){
    let gameState = getGameState(req.params.gameID)
  res.send(gameState);
    }
})

app.get('/hit/:pHand/:gameID', function(req, res){
   let deck = findGame(req.params.gameID)
    if(deck.playerCards[req.params.pHand].score > 21)
        {return res.send(gameState)}
    deck.hit(deck.playerCards[req.params.pHand]);
    let gameState = getGameState(req.params.gameID)
    
    res.send(gameState)           
    })

app.get('/doubledown/:pHand/:gameID/:sessionID', function(req, res){
    let deck = findGame(req.params.gameID)
    if(deck.bet > sessions[req.params.sessionID].score){
     return res.send('Not enough funds')
    }
    else {
    sessions[req.params.sessionID].score -= deck.originalBet
    deck.hit(deck.playerCards[req.params.pHand]);
    deck.bet += deck.originalBet
        console.log('deck.bet',deck.bet)
    let gameState = getGameState(req.params.gameID)
    
    
    res.send(gameState)           
    }})

app.get('/hodl/:pHand/:gameID/:sessionID', function(req, res){
    if (sessions[req.params.sessionID].activeGame == false){
        return res.send('fuck off')
    }
    sessions[req.params.sessionID].activeGame = false
    let deck = findGame(req.params.gameID)
    deck.dealerAction();
    res.send(getEndGameState(req.params.gameID, req.params.sessionID))
    
                          })

    
app.get('/split/:pHand/:gameID/:sessionID', function(req, res){
    let deck = findGame(req.params.gameID)
    if(deck.bet > sessions[req.params.sessionID].score){
        res.send('Not enough funds')
        return
    }
    sessions[req.params.sessionID].score = sessions[req.params.sessionID].score - deck.originalBet
    deck.bet = deck.bet + deck.originalBet 
   deck.split(deck.playerCards[req.params.pHand])
    res.send(getGameState(gameID))
                        
                          })


app.get('/script.js', function (req, res) {
  res.sendFile(__dirname+'/script.js')
    
})


app.get('/card/:name', function (req, res) {
  res.sendFile(__dirname + '/cards/'+'blue_back.png')
    
})

app.listen(3000, () => console.log('App listening on port 3000!'))





deck = new deck();



function getGameState(gameID){
       let deck = findGame(gameID)
        var hiddenHand = deck.dealerCards.slice()
         hiddenHand[1] = {name: "blue_back", suit: "Blank", value: 0}

    x ={
        dealerHand: hiddenHand,
        dealerScore: deck.score(hiddenHand),
        playerHands: [],
        bet: deck.bet
    }
    for (i = 0; i < deck.playerCards.length; i++) {
        
        let handState = {
                Hand:deck.playerCards[i],
                Score: deck.score(deck.playerCards[i])
        }
        x.playerHands.push(handState);}
        x.gameID = gameID
    
    return x
            
}

function getEndGameState(gameID, sessionID){
    sessions[sessionID].activeGame = false
    let deck = findGame(gameID)
   
    
    x ={
        dealerHand: deck.dealerCards,
        dealerScore: deck.score(deck.dealerCards),
        playerHands: [],
        }
        
    for (i = 0; i < deck.playerCards.length; i++) { 
        let handState = {
                Hand:deck.playerCards[i],
                Score: deck.score(deck.playerCards[i]),
                result:''
        }
        if (handState.Score > 21){
            handState.result="lost"
        }
        else if(x.dealerScore > 21) {
            handState.result="win"
            sessions[sessionID].score += parseInt(deck.originalBet * 2);
        }
        else if (x.dealerScore === handState.Score){
            handState.result= "draw"
            sessions[sessionID].score += parseInt(deck.bet);
        }
        else if (x.dealerScore > handState.Score){
            handState.result = "lost"
        }
        else {
            handState.result= "win"
            sessions[sessionID].score += parseInt(deck.originalBet * 2);
        }
        x.gameID = gameID
        x.playerHands.push(handState);}
    
    
    return x
            
}

function addGame(gameID, bet){
let x = new deck.constructor(gameID, bet)
    x.generateDeck(); 
    x.shuffleDeck();
    x.deal();
    games.push(x)
    
    
}

function findGame(gameID) {
    for (i = 0; i < games.length; i++)
        {if (games[i].gameID == gameID){
            return games[i]
        } 
        }}

