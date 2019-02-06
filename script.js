var gameID = 0;
var sessionID = 0;
var hold = [];
var funds = 0;
var bet = 0;

document.onload = checkForActiveGame();

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}}

function syncScore() {
    $.get("/syncScore/"+sessionID, function(data, status){
    $('#funds').html(data.score)
    funds = data.score;
     
    
    })
}



function deposit(){
    var bla = $('#dValue').val();
    parseInt(bla);
    if (bla == "" || bla < 0 || bla > 1000000 || isNaN(bla) == true){
        serverMessage('Please enter an amount');
    }        
else {
    $.get("/deposit/"+sessionID+"/"+bla, function(data, status){
        $('#depositImg').html('<img src="'+data.image+'" >')
        $('#depositText').html(data.text)
    
    })}
    
    myLoop()
function myLoop(){
    var i = 1;
    var y = funds
    
   setTimeout(function () {
      syncScore(function(){
          
      });         
      i++;
      if (y != funds)
          {
              $('#depositImg').html('')
                $('#depositText').html('')
                $('#dValue').val("")
               serverMessage('Deposit received');
              return
          }
             if (i < 60) {            
         myLoop();            
      }                        
   }, 3000)
}
    
}




function withdraw(){
    var bla = $('#wValue').val();
    if (bla == ""){
        serverMessage('Please enter a Lightning payment request');
    }
   else {
       $.get("/withdraw/"+sessionID+'/'+bla+"/", function(data, status){
   serverMessage(data);    
    })
}
}
function newGame(){
    
     bet = $('#bValue').val()
   if (isNaN(bet) == true || bet.length == false || bet == 0){
       serverMessage('Please enter a bet')
        return false;
   }

    $.get("/new/"+bet+"/"+sessionID, function(data, status){
        if (data == "Not enough funds" || data == "Game already active"){
            serverMessage(data);
            return false;
        }
    
        funds -= bet
        $('#funds').html(funds)
        $("#playerHands").html("")
        hold = [0]
        writeHold(hold)
        
        gameID = data.gameID
        document.cookie = 'gameID' + "=" + gameID + ";"

        if (data.playerHands[0].Score == 21){
            hodl(0)
    
        }
       show(data)   
})}


function hit(num){
$.get("hit/"+num+"/"+gameID, function(data, status){

            $("#doubleDown"+num).remove()
            $("#split"+num).remove()
if(data.playerHands[num].Score > 20){
    hodl(num)  
}    
    show(data)

})}

function hodl(num){
    
   for (i=0; i < hold.length; i++){
       if (hold[i] == num){
           hold.splice(i,1)
           $(".button"+num).remove()
          
       }
   } 
    writeHold(hold)
    if (hold.length == 0){
   $.get("hodl/"+num+"/"+gameID+"/"+sessionID, function(data, status){ 
       syncScore();
       show(data)
     
})}
}

function doubleDown (num){
    if (funds < bet){
       serverMessage('Not enough funds');
        return false
    }
    $(".button"+num).remove()
    $.get("doubledown/"+num+"/"+gameID+"/"+sessionID, function(data, status){
         if (data === "Not enough funds"){
            serverMessage(data);
            return false
         }
            hodl(num)
            show(data)
            syncScore();            
    })}




function split(num){
    if(funds < bet){
        serverMessage('Not enough funds')
    }
    $.get("split/"+num+"/"+gameID+"/"+sessionID, function(data, status){
        if(data == 'Not enough funds'){
        serverMessage('Not enough funds')
            
            return
            
        }


        funds = funds-bet

        $('#funds').html(funds)
        hold.push(data.playerHands.length - 1)
        writeHold(hold)
        $("#doubleDown"+num).remove()
            $("#split"+num).remove()
    show(data)
       
})}



function show(gameState){
    for (c=0; c < gameState.playerHands.length; c++){
        console.log('length',gameState.playerHands.length)
        console.log('score of hand'+c, gameState.playerHands[c].Score)

        if (gameState.playerHands[c].Score == 21){
            hodl(c)
        }
    }

    $("#dealerHand").html('')
    for (var x = 0; x<100; x++){
        if (gameState.dealerHand[x] === undefined) {
            break
        }

        $("#dealerHand").append("<img class='card' src='/cards/"+gameState.dealerHand[x].name+".png'>")
 }
        $("#dealerHand").append("<p class='score'>"+gameState.dealerScore+"</p>")              
    if($("#dummyCards").length){
        $("#dummyCards").remove()
    }
    for(var x = 0; x<100; x++){
        if(gameState.playerHands[x] === undefined){
            break
        }
        if($("#playerHand"+x).length == false){
            $("#playerHands").append("<div class='phand' id='playerHand"+x+"'></div>")
        }
        else{
            $("#playerHand"+x).html('')
        }
        for(a=0; a<100; a++){
            
            if(gameState.playerHands[x].Hand[a] === undefined){
            break
        }
               
        $("#playerHand"+x).append("<img class='card' src='/cards/"+gameState.playerHands[x].Hand[a].name+".png'>")
        
        }
        for (i=0; i < hold.length; i++){
       if (hold[i] == x){
        
        $("#playerHand"+x).append("<div id='phbuttons"+x+"'></div>")
        $("#phbuttons"+x).append('<button class="link_button1 button'+x+'" onclick="hit('+x+')">Hit</button>').append('<button class="link_button1 button'+x+'" onclick="hodl('+x+')">Hodl</button>')
        if (gameState.playerHands[x].Hand.length === 2){
                $("#phbuttons"+x).append('<button class="link_button1 button'+x+'" id="doubleDown'+x+'" onclick="doubleDown('+x+')">Double Down</button>')
            }
        if ((gameState.playerHands[x].Hand[0].value === gameState.playerHands[x].Hand[1].value) || (gameState.playerHands[x].Hand[0].value === 'A' && gameState.playerHands[x].Hand[1].value === 'A')
                ){
        $("#phbuttons"+x).append('<button id="split'+x+'" class="link_button1 button'+x+'" onclick="split('+x+')">Split</button>')
            }
    }
            
             
        }
    $("#playerHand"+x).append('<p id="score'+x+'" class="score">'+gameState.playerHands[x].Score+'</p>')
        if(gameState.playerHands[x].result){
            $("#playerHand"+x).append('<p id="result'+x+'" class="result">'+gameState.playerHands[x].result+'</p>')
            
        
                
            }
    }}


function writeHold(array){
    document.cookie = 'hold ='+JSON.stringify(hold)+';'
}

function checkForActiveGame(){
   if (readCookie('sessionID') == undefined){
        x = Math.floor((Math.random()*100000) + 1)
    document.cookie = 'sessionID' + "=" + x + ";"
   }
    if (readCookie('hold') != 0 && readCookie('hold') != undefined){
        hold = JSON.parse(readCookie('hold'))
    }
    sessionID = readCookie('sessionID')
    gameID = readCookie('gameID')
    syncScore();
    if (gameID != undefined){
    $.get('/gameState/'+gameID+'/'+sessionID, function(data, status){
       show(data)
        }
)}

         
         }

function serverMessage(message){
    $("#serverMessage").stop(true)
    $("#serverMessage").html(message).fadeIn(400).fadeOut(1600)
    
}