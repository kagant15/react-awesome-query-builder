export default 
{
  "type": "group",
  "id": "9a99988a-0123-4456-b89a-b1607f326fd8",
  "children1": {
    "a98ab9b9-cdef-4012-b456-71607f326fd9": {
      "type": "rule",
      "properties": {
        "field": "user.firstName",
        "operator": "equal",
        "value": [
          {
            "func": "LOWER",
            "args": {}
          }
        ],
        "valueSrc": [
          "func"
        ],
        "valueType": [
          "text"
        ]
      }
    },
    "a98ab9b9-cdef-4012-b456-71607f326ge0": {
      "type": "rule",
      "properties": {
        "field": "num",
        "operator": "equal",
        "value": [
          3
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "number"
        ]
      }
    },
    "a98ab9b9-cdef-4012-b456-71607f326hf1": {
      "type": "rule",
      "properties": {
        "field": "date",
        "operator": "equal",
        "value": [
          "2020-05-20"
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "date"
        ]
      }
    },
    "aabbab8a-cdef-4012-b456-716e85c65a1b": {
      "type": "rule",
      "properties": {
        "field": "time",
        "operator": "between",
        "value": [
          "14:48:00",
          "16:00:00"
        ],
        "valueSrc": [
          "value",
          "value"
        ],
        "valueType": [
          "time",
          "time"
        ]
      }
    },
    "aabbab8a-cdef-4012-b456-716e85c65efg": {
      "type": "rule",
      "properties": {
        "field": "datetime",
        "operator": "equal",
        "value": [
          "2020-05-27 11:41:55"
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "datetime"
        ]
      }
    },
    "00c8a8a8-89ab-4cde-b012-31702cd5078b": {
      "type": "rule",
      "properties": {
        "field": "results.product",
        "operator": "select_equals",
        "value": [
          "abc"
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "select"
        ]
      }
    },
    "a98ab9b9-cdef-5122-b456-71607f326hf1": {
      "type": "rule",
      "properties": {
        "field": "multicolor",
        "operator": "multiselect_equals",
        "value": [
          [
            "green",
            "yellow"
          ]
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "multiselect"
        ]
      }
    },
    "aabbab8a-cdef-4012-c566-716e85c65e9c": {
      "type": "rule",
      "properties": {
        "field": "selecttree",
        "operator": "select_equals",
        "value": [
          "3"
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "treeselect"
        ]
      }
    },
    "aaab8999-cdef-4012-b456-71702cd50111": {
      "type": "rule",
      "properties": {
        "field": "multiselecttree",
        "operator": "multiselect_equals",
        "value": [
          [
            "8"
          ]
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "treemultiselect"
        ]
      }
    },
    "98a8a9ba-0123-4456-b89a-b16e721c8cd0": {
      "type": "rule",
      "properties": {
        "field": "stock",
        "operator": "equal",
        "value": [
          false
        ],
        "valueSrc": [
          "value"
        ],
        "valueType": [
          "boolean"
        ]
      }
    },
    "aaab8999-cdef-4012-b456-71702cd50090": {
      "type": "rule_group",
      "properties": {
        "conjunction": "AND",
        "field": "results"
      },
      "children1": {
        "99b8a8a8-89ab-4cde-b012-31702cd5078b": {
          "type": "rule",
          "properties": {
            "field": "results.product",
            "operator": "select_equals",
            "value": [
              "abc"
            ],
            "valueSrc": [
              "value"
            ],
            "valueType": [
              "select"
            ]
          }
        },
        "88b9bb89-4567-489a-bcde-f1702cd53266": {
          "type": "rule",
          "properties": {
            "field": "results.score",
            "operator": "greater",
            "value": [
              8
            ],
            "valueSrc": [
              "value"
            ],
            "valueType": [
              "number"
            ]
          }
        }
      }
    }
  },
  "properties": {
    "conjunction": "AND",
    "not": false
  }
}
