export class DifficultySystem {

   constructor(game) {
     this.game = game;
     this.tier = 1;
   }

   increaseDifficulty() {

     this.tier++;

     console.log("Difficulty increased!");

     // Example:
     // Add new tile type
     this.game.board.sweets?.push("🔥");
   }

}