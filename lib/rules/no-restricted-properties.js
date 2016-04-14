/**
 * @fileoverview Rule to disallow specified object methods
 * @author Will Klein
 * @copyright 2015 Will Klein. All rights reserved.
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {
    if (context.options.length === 0) {
        return {};
    }

    var restrictedProperties = context.options.reduce(function(restrictions, option) {
        var objectName = option.object;
        var propertyName = option.property;

        restrictions[objectName] = restrictions[objectName] || {};
        restrictions[objectName][propertyName] = true;/* {message: option.message};*/

        return restrictions;
    }, {});

    return {
        "MemberExpression": function(node) {
            var objectName = node.object && node.object.name;
            var propertyName = node.property && node.property.name;

            if (restrictedProperties[objectName] &&
                    restrictedProperties[objectName][propertyName]) {
                context.report(node, "'{{objectName}}.{{propertyName}}' is restricted from being used.", {
                    objectName: objectName,
                    propertyName: propertyName
                });// + restrictedProperties[objectName][propertyName].message ? " {{restrictedProperties[objectName][propertyName].message}}" : "");
            }
        }
    };
};

module.exports.schema = {
    "type": "array",
    "items": [
        {
            "enum": [0, 1, 2]
        }
    ],
    "additionalItems": {
        "type": "object",
        "properties": {
            "object": { "type": "string" },
            "property": { "type": "string" }
        },
    },
    "uniqueItems": true
};
