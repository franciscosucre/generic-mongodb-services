const { MongoClient, ObjectId } = require("mongodb"),
  assert = require("assert"),
  ClientNotConnected = require("./exceptions/ClientNotConnected");

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

  verifyId(_id) {
    if (!(_id instanceof ObjectId)) {
      _id = new ObjectId(_id);
    }
    return _id;
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
    const response = await this.collection.insertOne(
      Object.assign(document, {
        createdAt: new Date()
      })
    );
    return response.ops[0];
  }

  /**
   * Obtains the document with the given _id
   *
   * @param {String} _id: The MongoDB Id for the requested Quiz
   * @param {Object} projection: Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.
   */
  async get(_id, projection) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.collection.findOne(
      { _id: new ObjectId(_id) },
      { projection }
    );
  }

  /**
   * Generic update service for all MongoDB Operators.
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {Object} _id: The MongoDB Id of the object to be updated
   * @param {Object} update: MongoDB update operations
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   */
  async update(_id, update, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    if (update.$set) {
      update.$set = Object.assign(update.$set, {
        lastModifiedAt: new Date()
      });
    } else {
      update.$set = {
        lastModifiedAt: new Date()
      };
    }
    const response = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      update,
      Object.assign(
        {
          returnOriginal: false
        },
        options
      )
    );
    return response.value;
  }

  /**
   * Partially updates a document. It only sets the sent fields. Uses the $set operator
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {Object} _id: The MongoDB Id of the object to be updated
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   * @returns {Object}
   */
  async patch(_id, data, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    const response = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      {
        $set: Object.assign(data, {
          lastModifiedAt: new Date()
        })
      },
      Object.assign(
        {
          returnOriginal: false
        },
        options
      )
    );
    return response.value;
  }

  /**
   * Soft deletes a document
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async remove(_id, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    const response = await this.collection.findOneAndDelete(
      { _id },
      Object.assign({}, options)
    );
    return response.value;
  }
}

module.exports = GenericCrudService;
