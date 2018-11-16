const { ObjectId } = require("mongodb");

const games = () => {
  return {
    _id: new ObjectId(),
    name: "games"
  };
};

const music = () => {
  return {
    _id: new ObjectId(),
    name: "music"
  };
};

const tickles = () => {
  return {
    _id: new ObjectId(),
    name: "tickles"
  };
};

module.exports = [
  {
    _id: new ObjectId("5be1c07f21fd86540546eb53"),
    name: "Blacky",
    likes: [games(), music(), tickles()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb54"),
    name: "Petri",
    likes: [music()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb55"),
    name: "Motts",
    likes: [tickles()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb56"),
    name: "Neko",
    likes: [games(), tickles()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb57"),
    name: "Whiskers",
    likes: [games()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb58"),
    name: "Sarah",
    likes: [games()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb59"),
    name: "Niña",
    likes: [games(), music(), tickles()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb5a"),
    name: "Cindy",
    likes: [music()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb5b"),
    name: "Lucky",
    likes: [music(), tickles()]
  },

  {
    _id: new ObjectId("5be1c07f21fd86540546eb5c"),
    name: "Katy",
    likes: [games(), music(), tickles()]
  }
];
