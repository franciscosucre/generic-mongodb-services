const { MongoClient, ObjectId } = require("mongodb"),
  assert = require("assert"),
  ClientNotConnected = require("./exceptions/ClientNotConnected");

/**
 * Implements basic Crud operations for a desired collection.
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
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
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
   * @param {ObjectId|String} query: MongoDB query.
   * @param {Object} update: MongoDB update operations
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   */
  async update(query, update, options = {}) {
    this.verifyConnection();
    if (!update.$set) {
      update.$set = {};
    }
    update.$set[this.modificationDateField] = new Date();
    const response = await this.collection.findOneAndUpdate(
      query,
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
   * Alias for update but with Id
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} update: MongoDB update operations
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   */
  async updateById(_id, update, options = {}) {
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
      )
    );
  }

  /**
   * Partially updates a document. It only sets the sent fields. Uses the $set operator
   *
   * Options: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @param {boolean} [options.returnOriginal=false]:
   * @returns {Object}
   */
  async patch(query, data, options = {}) {
    this.verifyConnection();
    /* As this is a patch, we clean undefined data */
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key] === undefined) {
          delete data[key];
        }
      }
    }
    data[this.modificationDateField] = new Date();
    const response = await this.collection.findOneAndUpdate(
      query,
      {
        $set: data
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
  async patchById(_id, data, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.patch({ _id }, data, options);
  }

  /**
   * Deletes documents
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} [options={}]:
   */
  async remove(query, options = {}) {
    this.verifyConnection();
    const response = await this.collection.findOneAndDelete(
      query,
      Object.assign({}, options)
    );
    return response.value;
  }

  /**
   * Alias for remove method with an _id lookup
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {Object} [options={}]:
   */
  async removeById(_id, options = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    return await this.remove({ _id }, options);
  }

  /**
   * Obtains a list of subdocuments. Can be filtered using the $filter aggregation pipeline.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/filter/
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {String} as: alias used by $filter for each element of the list, used to interpret the filter
   * @param {Object} query: Filters applied to the $filter aggregation
   */
  async listSubdocuments(_id, embeddedField, as = "item", query = {}) {
    this.verifyConnection();
    _id = this.verifyId(_id);
    const objects = await this.collection
      .aggregate([
        { $match: { _id } },
        {
          $project: {
            [embeddedField]: {
              $filter: {
                input: `$${embeddedField}`,
                as: as,
                cond: query
              }
            }
          }
        }
      ])
      .toArray();
    const [object] = objects;
    if (!objects) {
      return;
    }
    return object && object[embeddedField].length > 0
      ? object[embeddedField]
      : null;
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
    return await this.updateById(
      _id,
      { $push: { [embeddedField]: data } },
      Object.assign({}, options)
    );
  }

  /**
   * Partially updates a sub documenty
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} query: The query used to search for the subdocument to be pulled
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @returns {Object}
   */
  async patchSubdocument(_id, embeddedField, query, data, options = {}) {
    _id = this.verifyId(_id);

    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        if (!key.startsWith(`${embeddedField}.`)) {
          query[`${embeddedField}.${key}`] = query[key];
          delete query[key];
        }
      }
    }

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (!key.startsWith(`${embeddedField}.$.`)) {
          data[`${embeddedField}.$.${key}`] = data[key];
          delete data[key];
        }
      }
    }
    query["_id"] = _id;
    return await this.patch(query, data, options);
  }

  /**
   * Partially updates a sub documenty
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} embedId: The MongoDB Id of the requested subdocument
   * @param {Object} data: The data to be updated
   * @param {Object} [options={}]:
   * @returns {Object}
   */
  async patchSubdocumentById(_id, embeddedField, embedId, data, options = {}) {
    assert(embedId, "The 'embedId' parameter is required");
    embedId = this.verifyId(embedId);
    return await this.patchSubdocument(
      _id,
      embeddedField,
      { _id: embedId },
      data,
      options
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
    return await this.updateById(
      _id,
      { $pull: { [embeddedField]: query } },
      Object.assign({}, options)
    );
  }

  /**
   * Alias for the removeSubdocument method
   *
   * @param {ObjectId|String} _id: The MongoDB Id of the requested document
   * @param {String} embeddedField: The name of the subdocument array field
   * @param {Object} embedId: The MongoDB Id of the requested subdocument
   * @param {Object} [options={}]: update options
   */
  async removeSubdocumentById(_id, embeddedField, embedId, options = {}) {
    assert(embedId, "The 'embedId' parameter is required");
    embedId = this.verifyId(embedId);
    return await this.removeSubdocument(
      _id,
      embeddedField,
      { _id: embedId },
      options
    );
  }
}

module.exports = GenericCrudService;
