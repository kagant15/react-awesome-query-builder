import {getWidgetForFieldOp} from '../utils/configUtils';

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
 * @private
 */
function buildEsRangeParameters(value, operator) {
  // -- if value is greater than 1 then we assume this is a between operator : BUG this is wrong, a selectable list can have multiple values
  if(value.length>1){
    return {
      gte: `${value[0]}`,
      lte: `${value[1]}`
    }
  }
  // -- if value is only one we assume this is a date time query for a specific day
  const dateTime = value[0];

  switch (operator) {
    case 'on_date':
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
      return 'must'; // -- AND
    case 'OR':
      return 'should'; // -- OR
    case 'NOT':
      return 'must_not'; // -- NOT AND
    default:
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

function buildRegexpParameters(value){
  return{
    value,
  }
}

function buildParameters(queryType, value, operator, fieldName, config){
  switch (queryType) {
    case 'filter':
      return {
        script : config.operators[operator].elasticSearchScript(fieldName, value)
      }
    case 'exists':
      return {
        field: fieldName
      }
    case 'match':
    case 'term':
      console.log("value from term ", value)
      return {
        [fieldName] :  value[0]
      }
    case 'geo_bounding_box':
      return {
        [fieldName] : buildEsGeoPoint(value[0])
      }
    case 'range':
      return {
        [fieldName] : buildEsRangeParameters(value, operator)
      }
    case 'wildcard':
      return {
        [fieldName] : buildEsWildcardParameters(value[0])
      }
    case 'regexp':
      return {
        [fieldName] : buildRegexpParameters(value[0])
      }
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
function buildEsRule(fieldName, value, operator, config, valueSrc) {
  // handle if value 0 has multiple values like a select in a array
  const widget = getWidgetForFieldOp(config, fieldName, operator, valueSrc);

  const occurrence = config.operators[operator].elasticSearchOccurrence;

  /** In most cases the queryType will be static however in some casese (like between) the query type will change
   * based on the data type. i.e. a between time will be different than between number, date, letters etc... */
  let queryType;
  if(typeof config.operators[operator].elasticSearchQueryType === 'function'){
    queryType = config.operators[operator].elasticSearchQueryType(widget);
  } else {
    queryType = config.operators[operator].elasticSearchQueryType;
  }

  /** If a widget has a rule on how to format that data then use that otherwise use default way of determineing search parameters
   * */
  let parameters
  if(typeof config.widgets[widget].elasticSearchFormatValue === 'function'){
    parameters = config.widgets[widget].elasticSearchFormatValue(queryType, value, operator, fieldName, config)
  } else {
    parameters = buildParameters(queryType, value, operator, fieldName, config);
  }


  if(occurrence === 'must'){
    return {
      // bool: {
      //   [occurrence]: {
          [queryType]: {
            ...parameters
          },
        // },
      // },
    };
  }

  return {
    bool: {
      [occurrence]: {
        [queryType]: {
          ...buildParameters(queryType, value, operator, fieldName, config)
        },
      },
    },
  };
}

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
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

  const result = realChildren.map(
    (c) => recursiveFxn(c, config)
  );

  return {
    bool: {
      [occurrence]: flatten(result)
    },
  };
}

export function elasticSearchFormat(tree, config){
  // -- format the es dsl here
  if(!tree) return undefined;
  const type = tree.get('type');
  const tk_dbug = tree.toJS();
  const properties = tree.get('properties')
  const tk_properties = properties.toJS();
  if(type === 'rule' && properties.get('field')){ // -- field is null when a new blank rule is added

    const operator = properties.get('operator')
    const field = properties.get('field')
    const value = properties.get('value').toJS();
    const valueType = properties.get('valueType').get(0);
    const valueSrc = properties.get('valueSrc').get(0)


    if(valueSrc === 'func'){ // -- elastic search doesn't support functions (that is post processing)
      return;
    }

    if(value && Array.isArray(value[0])){
      // -- TODO : Handle case where the value has multiple values such as in the case of a list
      return value[0].map((val)=>{ return buildEsRule(field, [val], operator, config, valueSrc) })
    } else{
      return buildEsRule(field, value, operator, config, valueSrc);
    }
  }
  if(type === 'group' || type === 'rule_group'){
    const thing = tree.toJS();
    const conjunction = tree.get('properties').get('conjunction');
    const children = tree.get('children1')

    return buildEsGroup(children, conjunction, elasticSearchFormat, config)
  }
}
