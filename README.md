# **generic-mongodb-services**

Implements basic Crud services for a collection using the native mongodb server.

## **Motivation**

The idea behind this module is to avoid code repetition in the service layer of a NodeJS API. It is pretty common to separate all interaction with the DB behind a service layer, but it usually results in copy/pasting Crud operations from one service file from another. The package was develop to standarize this Crud operations and save development/maintance time.

## **How to install**

```shell
npm install --save generic-mongodb-services
```

## **GenericCrudService**

Main implementation class.

**Parameters**:

- **{MongoClient} client:** A MongoClient instance from the NodeJS MongoDB driver. Can be already connected or not when initializing, but it has to be connected when performing any operations.
- **{String} databaseName:** The database name
- **{String} collectionName:** The collection name

## **Methods**

### **list(query, limit, skip, sort, projection)**

---

Returns the quizzes that satisfy a query.

#### Params:

- **{Object} query:** MongoDB query.
- **{Number} limit:** Used for pagination. Defines how many documents can fit in the result set.
- **{Number} skip:** Used for pagination. Defines how many documents of the result query must be skipped before returing the objects.
- **{Object} sort:** MongoDB sort options.
- **{Object} projection:** Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.

#### Example:

```javascript
const objects = await service.list(
  { name: /a/i },
  5,
  5,
  { name: 1 },
  { _id: 1 }
);
```

### **count(query)**

---

Returns the count of documents that satisfy a query.

#### Params:

- **{Object} query:** MongoDB query.

#### Example:

```javascript
const count = await service.count({ name: /a/i });
```

### **exists(query)**

---

Verifies if an object exists or not.

#### Params:

- **{Object} query:** MongoDB query.

#### Example:

```javascript
const exists = await service.exists({ name: /a/i });
```

### **create(query)**

---

Creates a document and returns it.

#### Params:

- **{Object} document:** JSON document to be stored in MongoDB.

#### Example:

```javascript
const object = await service.create({
  name: "foo"
});
```

### **get(query)**

---

Obtains the document with the given \_id.

#### Params:

- **{Object} query:** MongoDB query.
- **{Object} projection:** Used for projection. Defines which fields of the objects must be returned. Useful for optimizing queries.

#### Example:

```javascript
const object = await service.get({ validId }, { _id: 0 });
```

### **update(\query, update, options = {})**

---

Generic update service for all MongoDB Operators.

#### Params:

- **{Object} query:** MongoDB query.
- **{Object} update:** MongoDB update operations objects. Useful for optimizing queries.
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate)

#### Example:

```javascript
const object = await service.update({ _id: validId },, {
  $unset: {
    name: ""
  }
});
const object1 = await service.updateById(validId,
  $unset: {
    name: ""
  });
```

### **patch(\query, update, options = {})**

---

Partially updates a document. It only sets the sent fields. Uses the [\$set](https://docs.mongodb.com/manual/reference/operator/update/set/) operator.

#### Params:

- **{Object} query:** MongoDB query.
- **{Object} data:** The data to be updated.
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate)

#### Example:

```javascript
const object = await service.patch(
  { _id: validId },
  {
    type: "ugly"
  }
);
const object1 = await service.patchById(validId, {
  type: "ugly"
});
```

### **remove(\_id, options = {})**

---

Deletes a document.

#### Params:

- **{Object} query:** MongoDB query.
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndDelete)

#### Example:

```javascript
const object = await service.remove({ _id: validId });
const object1 = await service.removeById(validId);
```

### **listSubdocuments(\_id, embeddedField, as = "item", query = {})**

---

Obtains a list of subdocuments. Can be filtered using the [\$filter aggregation pipeline](https://docs.mongodb.com/manual/reference/operator/aggregation/filter/).

#### Params:

- **{ObjectId|String} \_id:** The MongoDB Id of the requested document
- **{String} embeddedField:** The name of the subdocument array field
- **{String} as:** alias used by \$filter for each element of the list, used to interpret the filter
- **{Object} query:** Filters applied to the \$filter aggregation

#### Example:

```javascript
const objects = await service.listSubdocuments(
  validId,
  validEmbbededField,
  "like",
  { $eq: ["$$like.name", "games"] }
);
```

### **getSubdocument(\_id, embeddedField, query, projection = {})**

---

Obtains a single subdocument of a requested document. If many subdocuments match the query, only the first one will be returned. It uses the [\$elemMatch](https://docs.mongodb.com/manual/reference/operator/query/elemMatch/) operator

#### Params:

- **{ObjectId|String} \_id:** The MongoDB Id of the requested document
- **{String} embeddedField:** The name of the subdocument array field
- **{Object} query:** The query used to search for the subdocument to be pulled
- **{Object} [projection={}]:** MongoDB projection object

#### Example:

```javascript
const object = await service.getSubdocument(validId, validEmbbededField, {
  name: "games"
});
```

### **addSubdocument(\_id, embeddedField, data, options = {})**

---

Partially updates a sub document.

#### Params:

- **{ObjectId|String} \_id:** The MongoDB Id of the requested document
- **{String} embeddedField:** The name of the subdocument array field
- **{Object} query:** The query used to search for the subdocument to be pulled
- **{Object} data:** The data to be updated
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate)

#### Example:

```javascript
const subdocument = await service.getSubdocument(validId, validEmbbededField, {
    name: "games"
  }),
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
```

### **patchSubdocument(\_id, embeddedField, query, data, options = {})**

---

Adds a new subdocument to a subdocument array field. It accepts both primitives and objects. If an object is passed, a \_id parameter is added. Uses the [\$push](https://docs.mongodb.com/manual/reference/operator/update/push/) operator.

#### Params:

- **{ObjectId|String} \_id:** The MongoDB Id of the requested document
- **{String} embeddedField:** The name of the subdocument array field
- **{Object} data:** The data to be added to the subdocument array field
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate)

#### Example:

```javascript
const object = await service.addSubdocument(
  validId,
  validEmbbededField,
  validSubdocument
);
```

### **removeSubdocument(\_id, embeddedField, data, options = {})**

---

Removes a subdocument from a subdocument array field. Uses the [\$pull](https://docs.mongodb.com/manual/reference/operator/update/pull/) operator.

#### Params:

- **{ObjectId|String} \_id:** The MongoDB Id of the requested document
- **{String} embeddedField:** The name of the subdocument array field
- **{Object} query:** The query used to search for the desired document
- **{Object} [options={}]:** [MongoDB Options](http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#findOneAndUpdate)

#### Example:

```javascript
const object = await service.removeSubdocument(validId, validEmbbededField, {
  name: "games"
});
```

## **Usage**

cats.service.js

```javascript
const { database, collections } = require("../config/mongodb"),
  mongodb = require("../utils/mongodb"),
  { GenericCrudService } = require("generic-mongodb-services");

module.exports = new GenericCrudService(mongodb.client, database, "cats");
```

cats.routes.js

```javascript
const catService = require("./cats.service");

async function method(query, limit, skip, sort, projection) {
  return await catService.list(query, limit, skip, sort, projection);
}
```

## **AuditedCrud**

---

A subclass of the GenericCrudService that stores audit registers in write operations (create, patch, update). Takes the same parameters a GenericCrudService and an additional one. Also, all operations recieve a optional user parameters that will be stored in the database

**Parameters**:

- **{String} [auditCollectionName='audits']:** The name of the collection where the audits will be stored

## **¿Need to add operations? ¡No problem!**

Just subclass one the desired classes and add more operations to the class

```javascript
const { database, collections } = require("../config/mongodb"),
  mongodb = require("../utils/mongodb"),
  { GenericCrudService } = require("generic-mongodb-services");

class CustomCatService extends GenericCrudService {
  customMethod() {}
}

module.exports = new CustomCatService(mongodb.client, database, "cats");
```
