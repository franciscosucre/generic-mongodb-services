const chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  GenericCrudService = require("../GenericCrudService"),
  { MongoClient, ObjectId } = require("mongodb"),
  uri = "mongodb://localhost:27017",
  data = require("./data"),
  databaseName = "test",
  collectionName = "cats",
  { AssertionError } = require("assert"),
  clientOptions = {
    useNewUrlParser: true
  },
  client = new MongoClient(uri, clientOptions),
  ClientNotConnected = require("../exceptions/ClientNotConnected"),
  validId = new ObjectId("5be1c07f21fd86540546eb53"),
  invalidId = "5be1c07f21fd86540546eb5f",
  validEmbbededField = "likes",
  validSubdocument = {
    name: "snakes"
  },
  expect = require("chai").expect;
chai.should();

let database,
  collection,
  service = new GenericCrudService(client, databaseName, collectionName);

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
      objects.should.be.eql(data);
    });

    describe("query", () => {
      it("should return only the objects that include the letter 'a'", async () => {
        const objects = await service.list({ name: /a/i });
        const withLetterA = data.filter(value => value.name.includes("a"));
        objects.should.be.eql(withLetterA);
      });
    });

    describe("limit", () => {
      it("should return the same number of documents as limit value", async () => {
        const objects = await service.list(null, 5);
        objects.length.should.be.eql(5);
      });
    });

    describe("skip", () => {
      it("should return from the 5 member onward", async () => {
        const objects = await service.list(null, null, 5);
        objects.length.should.be.eql(5);
        objects.should.be.eql(data.slice(5));
      });
    });

    describe("sort", () => {
      it("should return the list in alphabetical asc order", async () => {
        const objects = await service.list(null, null, null, { name: 1 });
        const orderedData = data.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
        objects.should.be.eql(orderedData);
      });

      it("should return the list in alphabetical desc order", async () => {
        const objects = await service.list(null, null, null, { name: -1 });
        const orderedData = data.sort((a, b) => {
          if (a.name > b.name) return -1;
          if (a.name < b.name) return 1;
          return 0;
        });
        objects.should.be.eql(orderedData);
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

    it("should return the count of all the objects", async () => {
      const count = await service.count();
      count.should.be.eql(data.length);
    });

    describe("query", () => {
      it("should return the count of only the objects that include the letter 'a'", async () => {
        const count = await service.count({ name: /a/i });
        const withLetterA = data.filter(value => value.name.includes("a"));
        count.should.be.eql(withLetterA.length);
      });
    });
  });

  describe("exists", () => {
    it("should throw an error if the client is not connected", async () => {
      const notConnectedClient = new MongoClient(uri, clientOptions);
      const service = new GenericCrudService(
        notConnectedClient,
        databaseName,
        collectionName
      );
      try {
        await service.exists();
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(ClientNotConnected);
      }
    });

    it("should throw an error if no query is passed", async () => {
      try {
        await service.exists();
        false.should.be.eql(true, "The function should NOT HAVE passed");
      } catch (error) {
        error.should.be.instanceof(AssertionError);
      }
    });

    it("should return true if the object exists", async () => {
      const exists = await service.exists({
        _id: validId
      });
      exists.should.be.eql(true);
    });

    it("should return false if the object does NOT exists", async () => {
      const exists = await service.exists({
        _id: invalidId
      });
      exists.should.be.eql(false);
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

    it("should create a new object", async () => {
      const oldCount = await service.count();
      const object = await service.create({
        name: "foo"
      });
      const newCount = await service.count();
      object.should.haveOwnProperty("_id");
      object.should.haveOwnProperty("name");
      object.should.haveOwnProperty(service.creationDateField);
      newCount.should.be.eql(oldCount + 1);
    });
  });

  describe("Detail Services", () => {
    describe("get", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.get({ _id: validId });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.get({ _id: invalidId });
        expect(object).to.be.null;
      });

      describe("projection", () => {
        it("should return the document without the _id", async () => {
          const object = await service.get({ _id: validId }, { _id: 0 });
          object.should.not.haveOwnProperty("_id");
          object.should.haveOwnProperty("name");
        });

        it("should return all documents only with the _id", async () => {
          const object = await service.get({ _id: validId }, { _id: 1 });
          object.should.haveOwnProperty("_id");
          object.should.not.haveOwnProperty("name");
        });
      });
    });

    describe("getById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.getById(validId);
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.getById(invalidId);
        expect(object).to.be.null;
      });

      describe("projection", () => {
        it("should return the document without the _id", async () => {
          const object = await service.getById(validId, { _id: 0 });
          object.should.not.haveOwnProperty("_id");
          object.should.haveOwnProperty("name");
        });

        it("should return all documents only with the _id", async () => {
          const object = await service.getById(validId, { _id: 1 });
          object.should.haveOwnProperty("_id");
          object.should.not.haveOwnProperty("name");
        });
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
          await service.update(
            { _id: validId },
            {
              name: "foo"
            }
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.update(
          { _id: invalidId },
          {
            $unset: {
              name: ""
            }
          }
        );
        expect(object).to.be.null;
      });

      it("should unset the name property", async () => {
        const originalObject = await service.get(validId);
        const object = await service.update(
          { _id: validId },
          {
            $unset: {
              name: ""
            }
          }
        );
        originalObject.should.haveOwnProperty("name");
        object.should.not.haveOwnProperty("name");
      });
    });

    describe("updateById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.updateById(validId, {
            name: "foo"
          });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.updateById(invalidId, {
          $unset: {
            name: ""
          }
        });
        expect(object).to.be.null;
      });

      it("should unset the name property", async () => {
        const originalObject = await service.get(validId);
        const object = await service.update(validId, {
          $unset: {
            name: ""
          }
        });
        originalObject.should.haveOwnProperty("name");
        object.should.not.haveOwnProperty("name");
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
          await service.patch(
            { _id: validId },
            {
              name: "foo"
            }
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.patch(
          { _id: invalidId },
          {
            type: "ugly"
          }
        );
        expect(object).to.be.null;
      });

      it("should set only one field of the object", async () => {
        const originalObject = await service.get(validId);
        originalObject.should.not.haveOwnProperty("type");
        const object = await service.patch(
          { _id: validId },
          {
            type: "ugly"
          }
        );
        object.should.haveOwnProperty("type");
        object.should.haveOwnProperty(service.modificationDateField);
        object._id.should.be.eql(originalObject._id);
        object.name.should.be.eql(originalObject.name);
      });
    });

    describe("patchById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.patchById(validId, {
            name: "foo"
          });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.patchById(invalidId, {
          type: "ugly"
        });
        expect(object).to.be.null;
      });

      it("should set only one field of the object", async () => {
        const originalObject = await service.get(validId);
        originalObject.should.not.haveOwnProperty("type");
        const object = await service.patchById(validId, {
          type: "ugly"
        });
        object.should.haveOwnProperty("type");
        object.should.haveOwnProperty(service.modificationDateField);
        object._id.should.be.eql(originalObject._id);
        object.name.should.be.eql(originalObject.name);
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
          await service.remove(
            { _id: validId },
            {
              name: "foo"
            }
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.remove({ _id: invalidId });
        expect(object).to.be.null;
      });

      it("should delete the document", async () => {
        const oldCount = await service.count();
        const object = await service.remove({ _id: validId });
        object.should.haveOwnProperty("_id");
        object.should.haveOwnProperty("name");
        const newCount = await service.count();
        newCount.should.be.eql(oldCount - 1);
      });
    });

    describe("removeById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.removeById(validId, {
            name: "foo"
          });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the object is not found", async () => {
        const object = await service.removeById(invalidId);
        expect(object).to.be.null;
      });

      it("should delete the document", async () => {
        const oldCount = await service.count();
        const object = await service.removeById(validId);
        object.should.haveOwnProperty("_id");
        object.should.haveOwnProperty("name");
        const newCount = await service.count();
        newCount.should.be.eql(oldCount - 1);
      });
    });

    describe("listSubdocuments", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.listSubdocuments(validId, validEmbbededField);
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const objects = await service.listSubdocuments(
          invalidId,
          validEmbbededField
        );
        expect(objects).to.be.null;
      });

      it("should get all the subdocuments", async () => {
        const objects = await service.listSubdocuments(
          validId,
          validEmbbededField
        );
        objects.length.should.be.eql(3);
      });

      it("should get some filtered subdocuments", async () => {
        const objects = await service.listSubdocuments(
          validId,
          validEmbbededField,
          "like",
          { $eq: ["$$like.name", "games"] }
        );
        objects.length.should.be.eql(1);
      });
    });

    describe("getSubdocument", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.getSubdocument(validId, validEmbbededField, {
            name: "games"
          });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const object = await service.getSubdocument(
          invalidId,
          validEmbbededField,
          {
            name: "games"
          }
        );
        expect(object).to.be.null;
      });

      it("should return null if the subdocument is not found", async () => {
        const object = await service.getSubdocument(
          validId,
          validEmbbededField,
          {
            name: "dfgfdfdg"
          }
        );
        expect(object).to.be.null;
      });

      it("should get the subdocument", async () => {
        const object = await service.getSubdocument(
          validId,
          validEmbbededField,
          {
            name: "games"
          }
        );
        object.should.haveOwnProperty("_id");
        object.should.haveOwnProperty("name");
        object.name.should.be.eql("games");
      });
    });

    describe("addSubdocument", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.addSubdocument(
            validId,
            validEmbbededField,
            validSubdocument
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const object = await service.addSubdocument(
          invalidId,
          validEmbbededField,
          validSubdocument
        );
        expect(object).to.be.null;
      });

      it("should create the subdocument", async () => {
        const oldObject = await service.getById(validId),
          oldCount = oldObject[validEmbbededField].length,
          object = await service.addSubdocument(
            validId,
            validEmbbededField,
            validSubdocument
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newCount = object[validEmbbededField].length;
        newCount.should.be.eql(oldCount + 1);
      });

      it("should accept primitives", async () => {
        const oldObject = await service.getById(validId),
          oldCount = oldObject[validEmbbededField].length,
          object = await service.addSubdocument(
            validId,
            validEmbbededField,
            "foo fighters is an awesome band"
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newCount = object[validEmbbededField].length;
        newCount.should.be.eql(oldCount + 1);
      });
    });

    describe("patchSubdocument", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.patchSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            },
            {
              name: "trouble"
            }
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const object = await service.patchSubdocument(
          invalidId,
          validEmbbededField,
          {
            name: "games"
          },
          {
            name: "trouble"
          }
        );
        expect(object).to.be.null;
      });

      it("should update the subdocument", async () => {
        const subdocument = await service.getSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          object = await service.patchSubdocument(
            validId,
            validEmbbededField,
            {
              _id: new ObjectId(subdocument._id)
            },
            {
              name: "trouble"
            }
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newList = object[validEmbbededField],
          newSubdoc = newList.find(
            value => value._id.toString() == subdocument._id.toString()
          );
        newSubdoc.name.should.be.eql("trouble");
      });
    });

    describe("patchSubdocumentById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.patchSubdocumentById(
            validId,
            validEmbbededField,
            invalidId,
            {
              name: "trouble"
            }
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const subdocument = await service.getSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          object = await service.patchSubdocumentById(
            invalidId,
            validEmbbededField,
            subdocument._id,
            {
              name: "trouble"
            }
          );
        expect(object).to.be.null;
      });

      it("should update the subdocument", async () => {
        const subdocument = await service.getSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          object = await service.patchSubdocumentById(
            validId,
            validEmbbededField,
            subdocument._id,
            {
              name: "trouble"
            }
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newList = object[validEmbbededField],
          newSubdoc = newList.find(
            value => value._id.toString() == subdocument._id.toString()
          );
        newSubdoc.name.should.be.eql("trouble");
      });
    });

    describe("removeSubdocument", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.removeSubdocument(validId, validEmbbededField, {
            name: "games"
          });
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const object = await service.removeSubdocument(
          invalidId,
          validEmbbededField,
          {
            name: "games"
          }
        );
        expect(object).to.be.null;
      });

      it("should remove the subdocument", async () => {
        const oldObject = await service.getById(validId),
          oldCount = oldObject[validEmbbededField].length,
          object = await service.removeSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newCount = object[validEmbbededField].length;
        newCount.should.be.eql(oldCount - 1);
      });
    });

    describe("removeSubdocumentById", () => {
      it("should throw an error if the client is not connected", async () => {
        const notConnectedClient = new MongoClient(uri, clientOptions);
        const service = new GenericCrudService(
          notConnectedClient,
          databaseName,
          collectionName
        );
        try {
          await service.removeSubdocumentById(
            validId,
            validEmbbededField,
            invalidId
          );
          false.should.be.eql(true, "The function should NOT HAVE passed");
        } catch (error) {
          error.should.be.instanceof(ClientNotConnected);
        }
      });

      it("should return null if the document is not found", async () => {
        const object = await service.removeSubdocumentById(
          invalidId,
          validEmbbededField,
          invalidId
        );
        expect(object).to.be.null;
      });

      it("should remove the subdocument", async () => {
        const oldObject = await service.getById(validId),
          subdocument = await service.getSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          oldCount = oldObject[validEmbbededField].length,
          object = await service.removeSubdocumentById(
            validId,
            validEmbbededField,
            subdocument._id
          );
        object.should.haveOwnProperty(validEmbbededField);
        const newCount = object[validEmbbededField].length;
        newCount.should.be.eql(oldCount - 1);
      });
    });
  });
});
