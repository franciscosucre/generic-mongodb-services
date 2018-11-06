const { MongoClient } = require("mongodb"),
  assert = require("assert"),
  ClientNotConnected = require('./exceptions/ClientNotConnected');

/**
 * Implements basic Crud operations for a desired collection.
 *
 * NOTE: The desired collection must be defined in a overriden static get collection method.
 *
 * Example:
 *  static get collection() {
 *    return mongodb.database.collection(collectionName);
 *  }
 *
 */
class GenericCrudService {
  /**
   * Creates an instance of a GenericCrudService
   *
   * @param {MongoClient} client: A MongoClient instance from the NodeJS MongoDB driver. Can be
   * already connected or not when initializing, but it has to be connected when performing any
   * operations
   * @param {String} databaseName: The database name
   * @param {String} collectionName: The collection name
   */
  constructor(client, databaseName, collectionName) {
    assert(
      client instanceof MongoClient,
      "client MUST be an instance of MongoClient"
    );
    assert(typeof databaseName === "string", "databaseName MUST be a string");
    assert(
      typeof collectionName === "string",
      "collectionName MUST be a string"
    );
    this.client = client;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    if (this.client.isConnected()) {
      this.database = this.client.db(this.databaseName);
      this.collection = this.database.collection(this.collectionName);
    } else {
      this.database = null;
      this.collection = null;
    }
  }

  /**
   * Verifies if the client is connected, if it is, then it sets the
   * database and collection attributes
   */
  verifyConnection() {
    if (!this.client.isConnected()) {
      throw new ClientNotConnected(
        "This client is not connected, it cannot perform operations"
      );
    }
    if (!this.database) {
      this.database = this.client.db(this.databaseName);
      this.collection = this.database.collection(this.collectionName);
    }
  }

  /**
   * Returns the quizzes that satisfy a query
   *
   * @param {Object} query: MongoDB query.
   * @param {Number} limit: Used for pagination. Defines how many documents can fit in the result set.
   * @param {Number} skip: Used for pagination. Defines how many documents of the result query must be skipped before returing the objects.
   * @param {Object} sort: MongoDB sort options.
   * @param {Object} projection: Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.
   */
  async list(query, limit, skip, sort, projection) {
    this.verifyConnection();
    const cursor = await this.collection.find(query, {
      limit,
      skip,
      sort,
      projection
    });
    return cursor.toArray();
  }

  /**
   * Returns the count of documents that satisfy a query
   *
   * @param {Object} query: MongoDB query.
   */
  async count(query) {
    this.verifyConnection();
    return await this.collection.countDocuments(query);
  }

  /**
   * Creates a document and returns it
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async create(document) {
    this.verifyConnection();
    return await this.collection.insertOne(
      Object.assign(document, {
        createdAt: new Date()
      })
    );
  }

  /**
   * Obtains the document with the given _id
   *
   * @param {String} _id: The MongoDB Id for the requested Quiz
   * @param {Object} projection: Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.
   */
  async get(_id, projection) {
    this.verifyConnection();
    return await this.collection.findOne(
      { _id: new ObjectId(_id) },
      { projection }
    );
  }

  /**
   * Partially updates a document. It only sets the sent fields.
   *
   * @param {Object} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   * @returns {Object}
   */
  async patch(_id, data) {
    this.verifyConnection();
    return await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      {
        $set: Object.assign(data, {
          lastModifiedAt: new Date()
        })
      }
    );
  }

  /**
   * Fully updates a document. It only sets the sent fields.
   *
   * @param {Object} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   */
  async update(_id, data) {
    this.verifyConnection();
    return await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      Object.assign(data, {
        lastModifiedAt: new Date()
      })
    );
  }

  /**
   * Soft deletes a document
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async remove(_id) {
    this.verifyConnection();
    return await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id), active: true },
      { $set: { active: false } }
    );
  }
}

module.exports = GenericCrudService;
