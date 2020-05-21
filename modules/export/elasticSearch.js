import {OrderedMap} from 'immutable'

/**
 * Converts a string representation of top_left and bottom_right cords to
 * a ES geo_point required for query
 *
 * @param {string} geoPointString - comma separated string of lat/lon coods
 * @returns {{top_left: {lon: number, lat: number}, bottom_right: {lon: number, lat: number}}} - ES geoPoint formatted object
 * @private
 */
function buildEsGeoPoint(geoPointString) {
  const coordsNumberArray = geoPointString.split(',').map(Number);
  return {
    top_left: {
      lat: coordsNumberArray[0],
      lon: coordsNumberArray[1],
    },
    bottom_right: {
      lat: coordsNumberArray[2],
      lon: coordsNumberArray[3],
    },
  };
}

/**
 * Converts a dateTime string from the query builder to a ES range formatted object
 *
 * @param {string} dateTime - dateTime formatted string
 * @param {string} operator - query builder operator type, see constants.js and query builder docs
 * @returns {{lt: string}|{lte: string}|{gte: string}|{gte: string, lte: string}|undefined} - ES range query parameter
 *
 * TODO: Need to account for Time Between two fields
 * @private
 */
function buildEsRange(dateTime, operator) {
  switch (operator) {
    case 'equal':
    case 'select_equals':
    case 'not_equal':
      return {
        gte: `${dateTime}||/d`,
        lte: `${dateTime}||+1d`,
      };
    case 'less_or_equal':
      return {
        lte: `${dateTime}`,
      };
    case 'greater_or_equal':
      return {
        gte: `${dateTime}`,
      };
    case 'less':
      return {
        lt: `${dateTime}`,
      };
    case 'greater':
      return {
        gte: `${dateTime}`,
      };
    default:
      return undefined;
  }
}

/**
 * Builds the DSL parameters for a Wildcard query
 *
 * @param {string} value - The match value
 * @returns {{value: string}} - The value = value parameter surrounded with * on each end
 * @private
 */
function buildEsWildcardParameters(value) {
  return {
    value: `*${value}*`,
  };
}

/**
 * Takes the match type string from awesome query builder like 'greater_or_equal' and
 * returns the ES occurrence required for bool queries
 *
 * @param {string} combinator - query group type or rule condition
 * @returns {string} - ES occurrence type. See constants.js
 * @private
 */
function determineOccurrence(combinator) {
  switch (combinator) {
    case 'AND':
    case 'like':
    case 'equal':
    case 'select_equals':
    case 'greater':
    case 'less':
    case 'greater_or_equal':
    case 'less_or_equal':
    case 'contains':
      return 'must'; // -- AND
    case 'OR':
      return 'should'; // -- OR
    case 'NOT':
    case 'not_equal':
    case 'not_like':
    case 'not_contains':
      return 'must_not'; // -- NOT AND
    default:
      return undefined;
  }
}

/**
 * This is were we define the rules for which fields get mapped to which type of ES query.
 * Sometimes the query type depends on the field and sometimes on the match type
 *
 * TODO : Add handling fo Greaxnumber
 * @param {string} type - The data type
 * @param {string} operator - query builder operator type, see constants.js and query builder docs
 * @returns {string} - ES query type, see constants.js
 * @private
 */
function determineQueryType(type, operator) {
  switch (type) {
    case 'geo_bounding_box':
      return 'geo_bounding_box';
    case 'date':
    case 'time':
      return 'range';
    case 'boolean':
      return 'term';
    case 'number':
      return 'match';
    case 'text':
      switch (operator) {
        case 'equal':
        case 'select_equals':
        case 'not_equal':
          return 'term';
        case 'contains':
        case 'not_contains':
          return 'wildcard';
        case 'like':
        case 'not_like':
          return 'match';
        default:
          return undefined;
      }
    default:
      console.error(
      `Can't determine query : unaccounted for data type ${type}`
      );
      return undefined;
  }
}

/**
 * Determines what field to query off of given the operator type
 *
 * @param {string} fieldDataType - The type of data
 * @param {string} fullFieldName - A '.' separated string containing the property lineage (including self)
 * @param {string} queryType - The query type
 * @returns {string|*} - will be either the fullFieldName or fullFieldName.keyword
 * @private
 */
function determineQueryField(fieldDataType, fullFieldName, queryType) {
  if(fieldDataType === 'boolean'){
    return fullFieldName;
  }
  switch (queryType) {
    case 'term':
    case 'wildcard':
      return `${fullFieldName}.keyword`;
    case 'geo_bounding_box':
    case 'range':
    case 'match':
      return fullFieldName;
    default:
      console.error(`Can't determine query field for query type ${queryType}`);
      return null;
  }
}

/**
 * Determines what we are actually asking for in our ES query
 *
 * @param {string} queryType - ES query type, see constants.js
 * @param {string} value - The content from the query builder
 * @param {string} operator - query builder operator type, see constants.js and query builder docs
 * @returns {{gte: string, lte: string} | {lte: string} | {gte: string} | {lt: string} |
 *         {top_left: {lon: *, lat: *}, bottom_right: {lon: *, lat: *}}|*} - ES formatted criteria based on type
 * @private
 */
function determineCriteria(queryType, value, operator) {
  switch (queryType) {
    case 'match':
    case 'term':
      return value;
    case 'geo_bounding_box':
      return buildEsGeoPoint(value);
    case 'range':
      return buildEsRange(value, operator);
    case 'wildcard':
      return buildEsWildcardParameters(value);
    default:
      return undefined;
  }
}

/**
 * Handles the building of the group portion of the DSL
 *
 * @param {string} fieldName - The name of the field you are building a rule for
 * @param {string} fieldDataType - The type of data this field holds
 * @param {string} value - The value of this rule
 * @param {string} operator - The condition on how the value is matched
 * @returns {object} - The ES rule
 * @private
 */
function buildEsRule(fieldName, fieldDataType, value, operator, config) {
  if(fieldName === 'time'){
    console.log("yup")
  }

  const occurrence = determineOccurrence(operator);
  const queryType = determineQueryType(fieldDataType, operator);
  const queryField = determineQueryField(fieldDataType, fieldName, queryType);
  const criteria = determineCriteria(queryType, value, operator);

  console.log("occurrence", occurrence);
  console.log("queryType", queryType);
  console.log("queryField", queryField);
  console.log("criteria", criteria);

  if(occurrence === 'must'){
    return {
      // bool: {
      //   [occurrence]: {
          [queryType]: {
            [queryField]: criteria,
          },
        // },
      // },
    };
  }

  return {
    bool: {
      [occurrence]: {
        [queryType]: {
          [queryField]: criteria,
        },
      },
    },
  };
}

/**
 * Handles the building of the group portion of the DSL
 *
 * @param {object} children - The contents of the group
 * @param {string} conjunction - The way the contents of the group are joined together i.e. AND OR
 * @param {Function} recursiveFxn - The recursive fxn to build the contents of the groups children
 * @private
 * @returns {object} - The ES group
 */
function buildEsGroup(children, conjunction, recursiveFxn, config) {
  const realChildren = children.valueSeq().toArray();
  const occurrence = determineOccurrence(conjunction);

  const thing = children.toJS();

  const result = realChildren.map(
    (c) => recursiveFxn(c, config)
  );

  return {
    bool: {
      [occurrence]: result,
    },
  };
}

/**
 * Converts the jsonTree representation of the
 * [react-awesome-query-builder]{@link https://github.com/ukrbublik/react-awesome-query-builder} into Elastic Search DSL
 *
 * @param {object} jsonTree - The tree you get from react-awesome-query-builder [Utils.getTree(tree)]{@link https://github.com/ukrbublik/react-awesome-query-builder#gettree-immutablevalue---object}
 * @returns {object} - The DSL formatted query
 * @public
 */
function awesomeQbToDSL(jsonTree) {
  const { type } = jsonTree;
  if (type === 'rule') {
    const { operator, field, value, valueType } = jsonTree.properties;
    return buildEsRule(field, valueType[0], value[0], operator);
  }
  if (type === 'group') {
    const {
      children1,
      properties: { conjunction },
    } = jsonTree;

    return buildEsGroup(children1, conjunction, awesomeQbToDSL);
  }

  return undefined;
}



export function elasticSearchFormat(tree, config){
  // -- format the es dsl here
  if(!tree) return undefined;
  const type = tree.get('type');
  const properties = tree.get('properties')
  const tk_properties = properties.toJS();
  if(type === 'rule' && properties.get('field')){ // -- field is null when a new blank rule is added

    const operator = properties.get('operator')
    const field = properties.get('field')
    const value = properties.get('value').get(0)
    const valueType = properties.get('valueType').get(0);

    const tk_list = properties.get('value').toJS();

    // -- TODO: Add handling for when a value has multiple values
    if(OrderedMap.isOrderedMap(value)){
      return undefined;
    }

    if(valueType === 'select'){
      console.log("select")
    }

    return buildEsRule(field, valueType, value, operator, config);
    // return buildEsRule()
  }
  if(type === 'group' || type === 'rule_group'){
    const thing = tree.toJS();
    const conjunction = tree.get('properties').get('conjunction');
    const children = tree.get('children1')

    return buildEsGroup(children, conjunction, elasticSearchFormat, config)
  }
  console.log("type", type);
}
