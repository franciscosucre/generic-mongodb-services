const GenericCrudService = require("../GenericCrudService"),
  { ObjectId } = require("mongodb");

/**
 * A subclass of the GenericCrudService that stores audit registers
 * in write operations (create, patch, update)
 *
 * @extends GenericCrudService
 */
class AuditedCrudService extends GenericCrudService {
  /**
   * Creates an instance of a AuditedCrudService
   *
   * @param {MongoClient} client: A MongoClient instance from the NodeJS MongoDB driver. Can be
   * already connected or not when initializing, but it has to be connected when performing any
   * operations
   * @param {String} databaseName: The database name
   * @param {String} collectionName: The collection name
   * @param {String} [auditCollectionName='audits']: The name of the collection where the audits will be stored
   */
  constructor(client, databaseName, collectionName, auditCollectionName) {
    super(client, databaseName, collectionName);
    this.auditCollectionName =
      auditCollectionName || this.DEFAULT_AUDIT_COLLECTION_NAME;
    this.auditCollection = null;
  }

  get DEFAULT_AUDIT_COLLECTION_NAME() {
    return "audits";
  }

  verifyConnection() {
    super.verifyConnection();
    if (!this.auditCollection) {
      this.auditCollection = this.database.collection(this.auditCollectionName);
    }
  }

  /**
   * Creates a document and returns it
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   * @param {*} [user=ANONYMOUS]
   */
  async create(document, user = this.ANONYMOUS) {
    await verifyConnection();
    const object = await super.create(document);
    await this.auditCollection.insertOne({
      collection: this.collection.collectionName,
      operation: this.CREATE,
      new: object,
      user: user
    });
    return object;
  }

  /**
   * Partially updates a document. It only sets the sent fields.
   *
   * @param {String} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   */
  async patch(_id, data, options = {}, user = this.ANONYMOUS) {
    await verifyConnection();
    const oldDoc = await this.collection.findOne({ _id: new ObjectId(_id) });
    if (!oldDoc) {
      return;
    }
    const newDoc = await super.patch(_id, data, options);
    await this.auditCollection.insertOne({
      collection: this.collection.collectionName,
      operation: this.UPDATE,
      old: oldDoc,
      new: newDoc,
      user
    });
    return newDoc;
  }

  /**
   * Fully updates a document. It only sets the sent fields.
   *
   * @param {String} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   */
  async update(_id, data, options = {}, user = this.ANONYMOUS) {
    await verifyConnection();
    const oldDoc = await this.collection.findOne({ _id: new ObjectId(_id) });
    if (!oldDoc) {
      return;
    }
    const newDoc = await super.update(_id, data, options);
    await this.auditCollection.insertOne({
      collection: this.collection.collectionName,
      operation: this.UPDATE,
      old: oldDoc,
      new: newDoc,
      user
    });
    return newDoc;
  }

  /**
   * Soft deletes a document
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async remove(_id, options = {}, user = this.ANONYMOUS) {
    await verifyConnection();
    const object = await super.remove(_id, options);
    await this.auditCollection.insertOne({
      collection: this.collection.collectionName,
      operation: this.REMOVE,
      old: object,
      user
    });
    return object;
  }
}

module.exports = AuditedCrudService;
