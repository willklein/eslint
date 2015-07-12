/**
 * @fileoverview Auto-config initialization wizard.
 * @author Will Klein
 * @copyright 2015 Will Klein. All rights reserved.
 */

"use strict";

var fs = require("fs"),
    inquirer = require("inquirer"),
    writeFile = require("./config-initializer").writeFile;

function readSchemas() {
    return [];
}

function generateOptions(ruleSchemas) {
    return [];
}

function testConfigs(config, options) {
    return {};
}

function buildConfig(config, results) {
    return config;
}

function generateConfig(baseConfig) {
    var schemas = readSchemas();
    var options = generateOptions(schemas);
    var results = testConfigs(baseConfig, options);
    var config = buildConfig(baseConfig, results);
    return config;
}

/**
 * process user's answers and create config object
 * @param {object} answers answers received from inquirer
 * @returns {object} config object
 */
function processAnswers(answers) {
    var config = {rules: {}, env: {}};

    if (answers.babel) {
        config.parser = "babel-eslint";
    } else {
        if (answers.es6) {
            config.env.es6 = true;
        }

        if (answers.jsx) {
            config.ecmaFeatures = {jsx: true};
        }
    }

    answers.env.forEach(function(env) {
        config.env[env] = true;
    });

    if (answers.react) {
        config.plugins = ["react"];
    }

    return config;
}

/* istanbul ignore next: no need to test inquirer*/
/**
 * Ask use a few questions on command prompt
 * @param {function} callback callback function when file has been written
 * @returns {void}
 */
function promptUser(callback) {
    inquirer.prompt([
        {
            type: "confirm",
            name: "es6",
            message: "Are you using ECMAScript 6 features?",
            default: false
        },
        {
            type: "confirm",
            name: "babel",
            message: "Do you require Babel?",
            default: false
        },
        {
            type: "checkbox",
            name: "env",
            message: "Where will your code run?",
            default: ["browser"],
            choices: [{name: "Node", value: "node"}, {name: "Browser", value: "browser"}]
        },
        {
            type: "confirm",
            name: "jsx",
            message: "Do you use JSX?",
            default: false
        },
        {
            type: "confirm",
            name: "react",
            message: "Do you use React",
            default: false,
            when: function (answers) {
                return answers.jsx;
            }
        },
        {
            type: "list",
            name: "format",
            message: "What format do you want your config file to be in?",
            default: "JSON",
            choices: ["JSON", "YAML"]
        },
        {
            type: "number",
            name: "threshold",
            message: "Below what threshold should a rule be set to warn?",
            default: "5"
        }
        
    ], function(answers) {
        var baseConfig = processAnswers(answers);
        var config = generateConfig(baseConfig);

        writeFile(config, answers.format === "JSON", callback);
    });
}

var init = {
    initializeConfig: /* istanbul ignore next */ function(callback) {
        promptUser(callback);
    }
};

module.exports = init;
