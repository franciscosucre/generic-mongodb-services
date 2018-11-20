const chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  GenericCrudService = require("../GenericCrudService"),
  AuditedCrudService = require("../AuditedCrudService"),
  { MongoClient, ObjectId } = require("mongodb"),
  uri = "mongodb://localhost:27017",
  data = require("./data"),
  databaseName = "test",
  collectionName = "cats",
  auditCollectionName = "cat-audits",
  clientOptions = {
    useNewUrlParser: true
  },
  client = new MongoClient(uri, clientOptions),
  validId = new ObjectId("5be1c07f21fd86540546eb53"),
  validEmbbededField = "likes",
  validSubdocument = {
    name: "snakes"
  };
chai.should();

let database,
  collection,
  auditCollection,
  service = new AuditedCrudService(
    client,
    databaseName,
    collectionName,
    auditCollectionName
  ),
  auditService = new GenericCrudService(
    client,
    databaseName,
    auditCollectionName
  );

chai.use(chaiAsPromised);

before(async () => {
  await client.connect();
  database = client.db(databaseName);
  collection = database.collection(collectionName);
  auditCollection = database.collection(auditCollectionName);
  await collection.deleteMany({});
  await auditCollection.deleteMany({});
});

beforeEach(async () => {
  await collection.deleteMany({});
  await auditCollection.deleteMany({});
  await collection.insertMany(data);
});

after(async () => {
  await auditCollection.deleteMany({});
  await collection.deleteMany({});
});

//Our parent block
describe("AuditedCrudService.test", () => {
  describe("constructor", () => {
    it("should create a service with the default audit collection name", async () => {
      const newService = new AuditedCrudService(
        client,
        databaseName,
        collectionName
      );
      newService.verifyConnection();
      newService.auditCollectionName.should.be.eql(
        newService.DEFAULT_AUDIT_COLLECTION_NAME
      );
      newService.auditCollection.collectionName.should.be.eql(
        newService.DEFAULT_AUDIT_COLLECTION_NAME
      );
    });

    it("should create a service with the given audit collection name", async () => {
      const newService = new AuditedCrudService(
        client,
        databaseName,
        collectionName,
        auditCollectionName
      );
      newService.verifyConnection();
      newService.auditCollectionName.should.be.eql(auditCollectionName);
      newService.auditCollection.collectionName.should.be.eql(
        auditCollectionName
      );
    });
  });

  describe("create", () => {
    it("should create an CREATE audit", async () => {
      const object = await service.create({
          name: "foo"
        }),
        audits = await auditService.list(),
        [audit] = audits;
      audit.operation.should.be.eql(service.CREATE);
      audit.new.should.be.eql(object);
    });
  });

  describe("Detail Services", () => {
    describe("update", () => {
      it("should create an UPDATE audit", async () => {
        const originalObject = await service.getById(validId),
          object = await service.update(
            { _id: validId },
            {
              $unset: {
                name: ""
              }
            }
          ),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("updateById", () => {
      it("should create an UPDATE audit", async () => {
        const originalObject = await service.getById(validId),
          object = await service.updateById(validId, {
            $unset: {
              name: ""
            }
          }),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("patch", () => {
      it("should create an UPDATE audit", async () => {
        const originalObject = await service.getById(validId),
          object = await service.patch(
            { _id: validId },
            {
              type: "ugly"
            }
          ),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("patchById", () => {
      it("should create an UPDATE audit", async () => {
        const originalObject = await service.getById(validId),
          object = await service.patchById(validId, {
            type: "ugly"
          }),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("remove", () => {
      it("should create an REMOVE audit", async () => {
        const object = await service.remove({ _id: validId }),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.REMOVE);
        audit.old.should.be.eql(object);
        audit.should.not.haveOwnProperty("new");
      });
    });

    describe("removeById", () => {
      it("should create an REMOVE audit", async () => {
        const object = await service.removeById(validId),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.REMOVE);
        audit.old.should.be.eql(object);
        audit.should.not.haveOwnProperty("new");
      });
    });

    describe("addSubdocument", () => {
      it("should create an UPDATE audit", async () => {
        const object = await service.addSubdocument(
            validId,
            validEmbbededField,
            validSubdocument
          ),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length - 1
        );
        audit.new[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length
        );
      });
    });

    describe("patchSubdocument", () => {
      it("should create an UPDATE audit", async () => {
        const object = await service.patchSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            },
            {
              name: "trouble"
            }
          ),
          audits = await auditService.list(),
          [audit] = audits,
          findGames = v => v.name === "games",
          findTrouble = v => v.name === "trouble",
          oldList = audit.old[validEmbbededField],
          newList = audit.new[validEmbbededField],
          oldGameCount = oldList.filter(findGames).length,
          oldTroubleCount = oldList.filter(findTrouble).length,
          newGameCount = newList.filter(findGames).length,
          newTroubleCount = newList.filter(findTrouble).length;
        audit.operation.should.be.eql(service.UPDATE);
        newGameCount.should.be.eql(oldGameCount - 1);
        newTroubleCount.should.be.eql(oldTroubleCount + 1);
      });
    });

    describe("patchSubdocumentById", () => {
      it("should create an UPDATE audit", async () => {
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
          ),
          audits = await auditService.list(),
          [audit] = audits,
          findGames = v => v.name === "games",
          findTrouble = v => v.name === "trouble",
          oldList = audit.old[validEmbbededField],
          newList = audit.new[validEmbbededField],
          oldGameCount = oldList.filter(findGames).length,
          oldTroubleCount = oldList.filter(findTrouble).length,
          newGameCount = newList.filter(findGames).length,
          newTroubleCount = newList.filter(findTrouble).length;
        audit.operation.should.be.eql(service.UPDATE);
        newGameCount.should.be.eql(oldGameCount - 1);
        newTroubleCount.should.be.eql(oldTroubleCount + 1);
      });
    });

    describe("removeSubdocument", () => {
      it("should create an UPDATE audit", async () => {
        const object = await service.removeSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length + 1
        );
        audit.new[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length
        );
      });
    });

    describe("removeSubdocumentById", () => {
      it("should create an UPDATE audit", async () => {
        const subdocument = await service.getSubdocument(
            validId,
            validEmbbededField,
            {
              name: "games"
            }
          ),
          object = await service.removeSubdocumentById(
            validId,
            validEmbbededField,
            subdocument._id
          ),
          audits = await auditService.list(),
          [audit] = audits;
        audit.operation.should.be.eql(service.UPDATE);
        audit.old[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length + 1
        );
        audit.new[validEmbbededField].length.should.be.eql(
          object[validEmbbededField].length
        );
      });
    });
  });
});
