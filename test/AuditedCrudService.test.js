const chai = require("chai"),
  chaiAsPromised = require("chai-as-promised"),
  GenericCrudService = require("../GenericCrudService"),
  AuditedCrudService = require("../AuditedCrudService"),
  { MongoClient } = require("mongodb"),
  uri = "mongodb://localhost:27017",
  data = require("./data"),
  databaseName = "test",
  collectionName = "cats",
  auditCollectionName = "cat-audits",
  clientOptions = {
    useNewUrlParser: true
  },
  client = new MongoClient(uri, clientOptions),
  validId = "5be1c07f21fd86540546eb53";
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
    it("should create a new object", async () => {
      const object = await service.create({
        name: "foo"
      });
      const audits = await auditService.list();
      const audit = audits[0];
      audit.operation.should.be.eql(service.CREATE);
      audit.new.should.be.eql(object);
    });
  });

  describe("Detail Services", () => {
    describe("update", () => {
      it("should create the appropiate audit", async () => {
        const originalObject = await service.get(validId);
        const object = await service.update(validId, {
          $unset: {
            name: ""
          }
        });
        const audits = await auditService.list();
        const audit = audits[0];
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("patch", () => {
      it("should set only one field of the object", async () => {
        const originalObject = await service.get(validId);
        const object = await service.patch(validId, {
          type: "ugly"
        });
        const audits = await auditService.list();
        const audit = audits[0];
        audit.operation.should.be.eql(service.UPDATE);
        audit.old.should.be.eql(originalObject);
        audit.new.should.be.eql(object);
      });
    });

    describe("remove", () => {
      it("should delete the document", async () => {
        const object = await service.remove(validId);
        const audits = await auditService.list();
        const audit = audits[0];
        audit.operation.should.be.eql(service.REMOVE);
        audit.old.should.be.eql(object);
        audit.should.not.haveOwnProperty("new");
      });
    });
  });
});
