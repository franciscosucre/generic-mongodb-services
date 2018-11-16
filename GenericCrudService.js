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
      client.constructor.name === "MongoClient",
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

  get creationDateField() {
    return "createdAt";
  }

  get modificationDateField() {
    return "lastModifiedAt";
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
   * Verifies if an object exists or not
   *
   * @param {Object} query: MongoDB query.
   */
  async exists(query) {
    this.verifyConnection();
    assert(typeof query === "object", "The query must be an non-empty object");
    assert(
      Object.keys(query).length > 0,
      "The query must be an non-empty object"
    );
    const object = await this.collection.findOne(query, { _id: 1 });
    if (object) {
      return true;
    }
    return false;
  }

  /**
   * Creates a document and returns it
   *
   * @param {Object} document: JSON document to be stored in MongoDB
   */
  async create(document) {
    this.verifyConnection();
    document[this.creationDateField] = new Date();
    const response = await this.collection.insertOne(document);
    return response.ops[0];
  }

  /**
   * Obtains the document with the given _id
   *
   * @param {Object} query: MongoDB query.
   * @param {Object} projection: Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.
   */
  async get(query, projection = {}) {
    this.verifyConnection();
    return await this.collection.findOne(query, { projection });
  }

  /**
   * Obtains the document with the given _id
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested object
   * @param {Object} projection: Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.
   */
  async getById(_id, projection = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.collection.findOne({ _id }, { projection });
  }

  /**
   * Generic update service for all MongoDB Operators.
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested object
   * @param {Object} update: MongoDB update operations
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   */
  async update(_id, update, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    if (!update.$set) {
      update.$set = {};
    }
    update.$set[this.modificationDateField] = new Date();
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
   * @param {ObjectId|String} _id: The MongoDB Id of the requested object
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   * @returns {Object}
   */
  async patch(_id, data, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    data[this.modificationDateField] = new Date();
    return await this.update(
      _id,
      {
        $set: data
      },
      Object.assign({}, options)
    );
  }

  /**
   * Deletes a document
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested object
   * @param {Object} [options={}]:
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

  /**
   * Obtains a single subdocument of a requested document. If many subdocuments
   * match the query, only the first one will be returned.
   *
   * It uses the $elemMatch operator
   *
   * https://docs.mongodb.com/manual/reference/operator/query/elemMatch/
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} query: The query used to search for the subdocument to be pulled
   * @param {Object} [projection={}]: MongoDB projection object
   */
  async getSubdocument(_id, embeddedField, query, projection = {}) {
    _id = this.verifyId(_id);
    const object = await this.get(
      {
        _id,
        [embeddedField]: {
          $elemMatch: query
        }
      },
      Object.assign(projection, {
        [embeddedField]: 1,
        [`${embeddedField}.$`]: 1
      })
    );
    return object && object[embeddedField].length > 0
      ? object[embeddedField][0]
      : null;
  }

  /**
   * Adds a new subdocument to an subdocument array field. It accepts both primitives and objects. If an object is passed, a _id parameter is added.
   *
   * Uses the $push operator.
   *
   * https://docs.mongodb.com/manual/reference/operator/update/push/
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} data: The subdocument to be added
   * @param {Object} [options={}]: update options
   */
  async addSubdocument(_id, embeddedField, data, options = {}) {
    assert(_id, "The '_id' parameter is required");
    assert(embeddedField, "The 'embeddedField' parameter is required");
    assert(data, "The 'data' parameter is required");
    if (data === Object(data)) {
      data["_id"] = new ObjectId();
    }
    return await this.update(
      _id,
      { $push: { [embeddedField]: data } },
      Object.assign({}, options)
    );
  }

  /**
   * Removes a subdocument from an array
   *
   * Uses the $pull operator.
   *
   * https://docs.mongodb.com/manual/reference/operator/update/pull/
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} query: The query used to search for the subdocument to be pulled
   * @param {Object} [options={}]: update options
   */
  async removeSubdocument(_id, embeddedField, query, options = {}) {
    assert(_id, "The '_id' parameter is required");
    assert(embeddedField, "The 'embeddedField' parameter is required");
    assert(query, "The 'query' parameter is required");
    return await this.update(
      _id,
      { $pull: { [embeddedField]: query } },
      Object.assign({}, options)
    );
  }
}

module.exports = GenericCrudService;
