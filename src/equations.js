/**
 * Module for parsing and evaluating equations
 * 
 * Restrictions:
 *  - Variable names must start with a letter or underscore and be composed of values [a-zA-Z0-9_]
 *  - Variable names must be unique within an execution of evaluateEquation
 *  - No circular dependencies
 *  - Decimal points must be preceded by a digit
 *  - Implicit multiplication is not allowed (e.g.- "2x" and "4(x+1)" are invalid and should instead be "2*x" and "4*(x+1)")
 * 
 * Variables are stored as objects in order to include metadata that may be useful.
 */

/**
 * @typedef {String} VariableName
 * @typedef {String} Equation
 * @typedef {Number} Result
 * 
 * @typedef {Object} Variable
 * @property {VariableName} name - The name of the variable
 * @property {Equation|Result} value - The value of the variable
 * @property {Boolean} disabled - Whether the variable is disabled
 * @property {String} comment - A comment for the variable
 * 
 * @typedef {Map<VariableName, Variable>} Variables
 */
 
// Set to undefined to disable debugging,
// otherwise should be an integer representing spacing per indent
var DEBUGTAB = undefined;
function log(...args){
    if(typeof DEBUGTAB == "undefined") return;
    console.log(" ".repeat(DEBUGTAB*2), ...args);
}
DEBUGDEC = ()=>{if (typeof DEBUGTAB != "undefined") DEBUGTAB--;}
DEBUGINC = ()=>{if (typeof DEBUGTAB != "undefined") DEBUGTAB++;}


/**
 * Parses and evaluates an equation.
 * @param {Equation} equation - The equation to evaluate
 * @param {Variables} variables - The variables to use
 * @param {VariableName[]} dependencies - Variables that are dependent on the equation (this is normally not supplied by the user)
 * @returns {Number} - The result of the equation
 */
function evaluateEquation(equation, variables = {}, dependencies = []){
    DEBUGINC();

    /**
     * Substitutes variables in the equation and then returns the result of resolveParentheses
     * @param {Equation} equation - The equation to substitute
     * @param {Variables} variables - The variables to use
     * @param {VariableName[]} dependencies - Variables that are dependent on the equation (this is normally not supplied by the user)
     * @returns {Number} - The result of resolveParentheses
     */
    function substituteVariables(equation, variables, dependencies){
        DEBUGINC();
        var VARIABLEREG = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        let variable
        while((variable = VARIABLEREG.exec(equation)) !== null){
            let variablename = variable[0];
            if(variables[variablename] == undefined || variables[variablename].value == undefined){
                DEBUGDEC();
                throw new Error("Failed to substitute variable: " + variable[0]);
            }
            if(variables[variablename].disabled){
                DEBUGDEC();
                throw new Error("Variable is disabled: " + variablename + " in " + equation);
            }
            if(dependencies.includes(variablename)){
                DEBUGDEC();
                throw new Error("Cyclical dependency: " + variablename + " in " + equation);
            }
            if(typeof variables[variablename].value == "string"){
                let depcopy = [...dependencies];
                variables[variablename].value = evaluateEquation(variables[variablename].value, variables, depcopy);
                dependencies.push(variablename);
            }
            let eq = equation;
            equation = equation.slice(0, variable.index) + variables[variablename].value + equation.slice(variable.index + variablename.length);
            if(eq == equation){
                DEBUGDEC();
                throw new Error("Failed to substitute variable: " + variable[0] + "in " + eq + " >>> result: " + equation);
            }
        }
        DEBUGDEC();
        return resolveParentheses(equation, variables, dependencies);
    }
    /**
     * Resolves all parentheses in the equation recursively and then returns the result of evaluateOperations
     * @param {Equation} equation - The equation to resolve
     * @param {Variables} variables - The variables to use (not used in this function)
     * @param {VariableName[]} dependencies - Variables that are dependent on the equation (this is normally not supplied by the user; not used in this function)
     * @returns {Number} - The result of evaluateOperations
     */
    function resolveParentheses(equation, variables, dependencies){
        DEBUGINC();
        
        let open = equation.indexOf("(");
        let close = equation.indexOf(")");
        if(open < 0 && close < 0){
            DEBUGDEC();
            return evaluateOperations(equation, variables, dependencies);
        }
        if(open >= 0 && close < 0){
            DEBUGDEC();
            throw new Error("Missing closing parenthesis: " + equation);
        }
        if(open < 0 || close < open){
            let value = resolveParentheses(equation.slice(0,close), variables, dependencies);
            return value + equation.slice(close+1);
        }
        let eq = equation;
        let value = resolveParentheses(equation.slice(open+1), variables, dependencies);
        equation = equation.slice(0, open)+ value;
        if(eq == equation){
            DEBUGDEC();
            throw new Error("Failed to resolve parentheses: " + eq + " >>> result: " + equation);
        }
        DEBUGDEC();
        return resolveParentheses(equation, variables, dependencies);        
    }

    /**
     * Evaluates operations in the equation and replaces them with their results, ultimately returning the result
     * @param {Equation} equation - The equation to evaluate
     * @param {Variables} variables - The variables to use (not used in this function)
     * @param {VariableName[]} dependencies - Variables that are dependent on the equation (this is normally not supplied by the user; not used in this function)
     * @returns {Number} - The result of the equation
     */
    function evaluateOperations(equation, variables, dependencies){
        DEBUGINC();
        var OPERATIONPRIORITY = [
            [
                ["^", (a,b)=>Math.pow(a,b)],
            ],
            [
                ["*", (a,b)=>a*b],
                ["/", (a,b)=>a/b],
                ["%", (a,b)=>a%b],
            ],
            [
                ["+", (a,b)=>a+b],
                ["-", (a,b)=>a-b],
            ],
        ];

        for(let operation of OPERATIONPRIORITY){
            let match, f;
            let regs = [];
            for (let [operator, func] of operation){
                regs.push(new RegExp("(?:^\\+)?(?<a>-?\\d+(?:\\.\\d+)?)\\"+operator+"(?<b>-?\\d+(?:\\.\\d+)?)", "g"));
            }

            for(let i = 0; i < regs.length; i++){
                let reg = regs[i];
                let func = operation[i][1];
                let m = reg.exec(equation);
                if(m == null) continue;
                if(!match || m.index < match.index){
                    match = m;
                    f = func;
                }
            }
            if(!match) continue;

            let a = parseValue(match.groups.a);
            let b = parseValue(match.groups.b);
            let eq = equation;

            // log(equation, a, f, b, match.index, match[0].length);

            equation = equation.slice(0, match.index) + f(a,b) + equation.slice(match.index + match[0].length);

            if(eq == equation){
                DEBUGDEC();
                throw new Error("Failed to evaluate operation: " + equation);
            }

            DEBUGDEC();
            return evaluateOperations(equation, variables, dependencies);
        }

        DEBUGDEC();
        return parseValue(equation, variables, dependencies);
    }

    /**
     * Parses the result of the equation
     * @param {Equation} equation - The equation to parse
     * @param {Variables} variables - The variables to use
     * @param {VariableName[]} dependencies - Variables that are dependent on the equation
     * @returns {Number} - The result of the equation
     */
    function parseValue(equation, variables, dependencies){
        DEBUGINC();
        let result = Number(equation);
        if(isNaN(result)){
            DEBUGDEC();
            throw new Error(`Failed to parse equation: ${equation}`);
        }
        DEBUGDEC();
        return result;
    }

    equation = equation+"";
    if(equation.startsWith("=")) equation = equation.slice(1);
    equation = substituteVariables(equation, variables, dependencies);
    DEBUGDEC();
    return equation;
}
