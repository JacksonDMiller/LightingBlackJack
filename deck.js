/*jslint node: true */

module.exports = class deck {
    constructor(gameID, bet){
        this.deck = []
        this.dealerCards = []
        this.playerCards = []
        this.gameID = gameID
        this.bet = bet
        this.originalBet = bet
    }
    
    generateDeck() {
        let card = (suit, value) => {
        this.name = value  + suit
        this.suit = suit
        this.value = value
        return {name:this.name, suit:this.suit, value:this.value}
        }
        
        let values = ['A','2', '3','4','5','6','7','8','9','10','J','Q','K']
        let suits = ['C', 'S','D','H']
        
        for (let s = 0; s < suits.length; s++) {
            for (let v = 0; v < values.length; v++){
                this.deck.push(card(suits[s],values[v]))
            }
        }
    }


printDeck() { 
    
    if (this.deck.length == 0) {
        console.log('You messed up')}
    else {
        for (let c = 0; c < this.deck.length; c++){
        console.log(this.deck[c])
    }
        
    }
}

shuffleDeck() {
    let currentIndex = this.deck.length, tempVal, randIndex
    
    while(0 != currentIndex){
        randIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        tempVal = this.deck[currentIndex]
        this.deck[currentIndex] = this.deck[randIndex]
        this.deck[randIndex] = tempVal
    }
}

deal(){
    let playerHand = [];
    let dealtCard = this.deck.shift()
    this.dealerCards.push(dealtCard)
    dealtCard = this.deck.shift()
    playerHand.push(dealtCard)
    dealtCard = this.deck.shift()
    this.dealerCards.push(dealtCard)
    dealtCard = this.deck.shift()
    playerHand.push(dealtCard)
    this.playerCards.push(playerHand)
}

//    deal(){
//    let playerHand = [];
//    let dealtCard = this.deck.shift()
//    this.dealerCards.push(dealtCard)
//    dealtCard = this.deck.shift()
//    playerHand.push(dealtCard)
//    dealtCard = this.deck.shift()
//    this.dealerCards.push(dealtCard)
//    dealtCard = this.deck.shift()
//    playerHand.push(dealtCard)
//    this.playerCards.push([ { name: '10S', suit: 'S', value: '10' },
//  { name: '10s', suit: 'S', value: '10' } ])
//}
//    for messing about with the deal
    


score (hand){
    var i = 0
    var score = 0
    var ace = 0
    for(i = 0; i < hand.length; i++) {
        if (hand[i].value === 'J'||hand[i].value === 'Q'||hand[i].value === 'K'){
            hand[i].value = "10"
            score += 10}
        else if (hand[i].value === 'A'){
            ace += 1
            score += 11}
        else{   
        score += parseInt(hand[i].value)}}
    if (score > 21 && ace != 0){
        score -= 10
        ace -= 1
    }
    return score
   }

hit (hand){
    let dealtCard = this.deck.shift()
    hand.push(dealtCard)
}
dealerAction() {
    while (this.score(this.dealerCards)<17){
        this.hit(this.dealerCards);
    }

}
newGame(){
deck = new deck.constructor();
this.generateDeck(); 
this.shuffleDeck();
this.deal();
}
    
split(hand){
    let newHand = []
    newHand.push(hand.pop())
    let dealtCard = this.deck.shift()
    hand.push(dealtCard)
    dealtCard = this.deck.shift()
    newHand.push(dealtCard)
    this.playerCards.push(newHand)
    
}
    

}
