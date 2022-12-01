const {Int32} = require('mongodb');

class PokerDBService {
  constructor() {}
  async hostGame(client, newListing) {
    const result = await client
      .db('Poker')
      .collection('gameSession')
      .insertOne(newListing);
    //console.log(newListing.roomNumber);
  }
  async checkDuplicate(client, number) {
    const result = await client
      .db('Poker')
      .collection('gameSession')
      .findOne({roomNumber: number});
    if (result) {
      console.log(`Found room '${result.roomNumber}':`);
      return true;
    } else {
      return false;
    }
  }
  async getRoom(client, number) {
    //console.log("room Number is " + number);
    const result = await client
      .db('Poker')
      .collection('gameSession')
      .findOne({roomNumber: number});
    if (result) {
      //console.log(`Found room '${result.roomNumber}':`);
      return result;
    } else {
      return false;
    }
  }
  async updateRoom(client, number, updatedListing) {
    const result = await client
      .db('Poker')
      .collection('gameSession')
      .updateOne({roomNumber: number}, {$set: updatedListing});
    console.log(
      `${result.matchedCount} document(s) matched the query criteria.`,
    );
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
  }

  async get(client, number, updatedListing) {}
}
exports.PokerDBService = PokerDBService;
