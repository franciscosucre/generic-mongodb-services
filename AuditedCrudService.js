const GenericCrudService = require("./GenericCrudService");

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

  get CREATE() {
    return "CREATE";
  }

  get UPDATE() {
    return "UPDATE";
  }

  get REMOVE() {
    return "REMOVE";
  }

  get ANONYMOUS() {
    return "Anonymous";
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
    await this.verifyConnection();
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
  async patch(query, data, options = {}, user = this.ANONYMOUS) {
    await this.verifyConnection();
    const oldDoc = await this.collection.findOne(query);
    if (!oldDoc) {
      return;
    }
    const newDoc = await super.patch(query, data, options);
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
   * Alias for patch but with id
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   * @returns {Object}
   */
  async patchById(_id, data, options = {}, user = this.ANONYMOUS) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.patch({ _id }, data, options, user);
  }

  /**
   * Fully updates a document. It only sets the sent fields.
   *
   * @param {String} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   */
  async update(query, data, options = {}, user = this.ANONYMOUS) {
    await this.verifyConnection();
    const oldDoc = await this.collection.findOne(query);
    if (!oldDoc) {
      return;
    }
    const newDoc = await super.update(query, data, options);
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
   * Alias for update but with Id
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} update: MongoDB update operations
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   */
  async updateById(_id, update, options = {}, user = this.ANONYMOUS) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.update(
      { _id },
      update,
      Object.assign(
        {
          returnOriginal: false
        },
        options
      ),
      user
    );
  }

  /**
   * Soft deletes a document
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async remove(query, options = {}, user = this.ANONYMOUS) {
    await this.verifyConnection();
    const object = await super.remove(query, options);
    await this.auditCollection.insertOne({
      collection: this.collection.collectionName,
      operation: this.REMOVE,
      old: object,
      user
    });
    return object;
  }

  /**
   * Alias for remove method with an _id lookup
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} [options={}]:
   */
  async removeById(_id, options = {}, user = this.ANONYMOUS) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.remove({ _id }, options, user);
  }
}

module.exports = AuditedCrudService;
