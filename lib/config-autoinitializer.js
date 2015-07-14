/**
 * @fileoverview Auto-config initialization wizard.
 * @author Will Klein
 * @copyright 2015 Will Klein. All rights reserved.
 */

"use strict";

var CLIEngine = require("./cli-engine"),
    fs = require("fs"),
    inquirer = require("inquirer"),
    getRules = require("./rules").getAll,
    writeFile = require("./config-initializer").writeFile;

function getOptionsFromProperties(properties) {
    var options = [];

    return options;
}

function getOptionsFromSchema(schema) {
    var options = [];

    if (!schema.length) {
        return options;
    }

    // work off first element in schema for now
    // will iterate through all elements next
    if (schema[0].type === "object") {
        options = getOptionsFromProperties(schema.properties);
    } else if (schema[0].enum) {
        schema[0].enum.forEach(function(value) {
            options.push(value);
        });
    }

    return options;
}

function generateOptions(rules) {
    var options = {};

    Object.keys(rules || {}).forEach(function(name) {
        var schema = rules[name].schema;
        var ruleOptions = getOptionsFromSchema(schema);

        options[name] = ruleOptions.length ? ruleOptions : null;
    });

    return options;
}

function generateRuleConfigs(options) {
    var ruleConfigs = [];

    for (var i = 0; i < 2; i++) {
        var ruleConfig = {};

        for (var prop in options) {
            if (!options.hasOwnProperty(prop)) { continue; }

            if (options[prop] === null) {
                if (i === 0) {
                    ruleConfig[prop] = 2;
                } else {
                    ruleConfig[prop] = 0;
                }
            } else if (i < options[prop].length) {
                ruleConfig[prop] = [2, options[prop][i]];
            } else {
                ruleConfig[prop] = 0;
            }
        }

        ruleConfigs.push(ruleConfig);
    }

    return ruleConfigs;
}

function testRuleConfigs(config, ruleConfigs) {
    var results = [];

    for (var i = 0; i < 3; i++) {
        var engineConfig = {
            useEslintrc: false,
            rules: ruleConfigs[i],
            env: config.env
        };

        if (config.parser) {
            engineConfig.parser = config.parser;
        }

        console.log('Executing pass ' + (i + 1) + ' of 3...');

        var engine = new CLIEngine(engineConfig);
        var result = engine.executeOnFiles(['.']);

        results.push(result);
        console.log(result.errorCount);
    }

    return results;
}

function buildConfig(config, results) {
    return config;
}

function generateConfig(baseConfig) {
    var rules = getRules();
    var options = generateOptions(rules);
    var ruleConfigs = generateRuleConfigs(options);
    var results = testRuleConfigs(baseConfig, ruleConfigs);
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
