let chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  GenericCrudService = require("../index"),
  { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017",
  data = require("./data"),
  databaseName = "test",
  collectionName = "cats",
  clientOptions = {
    useNewUrlParser: true
  },
  client = new MongoClient(uri, clientOptions),
  ClientNotConnected = require("../exceptions/ClientNotConnected"),
  validId = "5be1c07f21fd86540546eb53",
  service = new GenericCrudService(client, databaseName, collectionName);
chai.should();
let database;
let collection;

chai.use(chaiAsPromised);

before(async () => {
  await client.connect();
  database = client.db(databaseName);
  collection = database.collection(collectionName);
  await collection.deleteMany({});
});

beforeEach(async () => {
  await collection.deleteMany({});
  await collection.insertMany(data);
});

after(async () => {
  await collection.deleteMany({});
});

//Our parent block
describe("GenericCrudService", () => {
  describe("constructor", () => {});

  describe("list", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.list();
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });

    it("should return all documents by default", async () => {
      const objects = await service.list();
      objects.length.should.be.eql(data.length);
    });

    describe("limit", () => {
      it("should return the same number of documents as limit value", async () => {
        const objects = await service.list(null, 5);
        objects.length.should.be.eql(5);
      });
    });

    describe("projection", () => {
      it("should return all documents without the _id", async () => {
        const objects = await service.list(null, null, null, null, { _id: 0 });
        const withoutId = objects.filter(value => !value._id);
        const withId = objects.filter(value => value._id);
        withoutId.length.should.be.eql(data.length);
        withId.length.should.be.eql(0);
      });

      it("should return all documents only with the _id", async () => {
        const objects = await service.list(null, null, null, null, { _id: 1 });
        const withId = objects.filter(value => value._id && !value.name);
        withId.length.should.be.eql(data.length);
      });
    });
  });

  describe("count", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.count();
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });
  });

  describe("create", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.create({
          name: "foo"
        });
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });
  });

  describe("patch", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.patch(validId, {
          name: "foo"
        });
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });
  });

  describe("update", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.update(validId, {
          name: "foo"
        });
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });
  });

  describe("remove", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.remove(validId, {
          name: "foo"
        });
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });
  });
});
