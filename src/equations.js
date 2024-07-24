/**
 * @typedef {String} VariableName
 * @typedef {String} Equation
 * 
 * @typedef {Map<VariableName, Equation} Variables
 */
 
var DEBUGTAB = 0;
function log(...args){
    if(typeof DEBUGTAB == "undefined") return;
    console.log(" ".repeat(DEBUGTAB*2), ...args);
}

function parseEquation(equation, variables = undefined, dependencies = undefined){
    if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
    if(typeof variables == "undefined"){ variables = {}; }
    if(typeof dependencies == "undefined"){ dependencies = []; }
    let wordchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
    let numberchars = "0123456789.-";
    let index = 0;

    function iterWhitespace(reverse = false){
        if(index >= equation.length || index < 0){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Index out of bounds: ${index}`);
        }
        if(reverse){
            while(equation[index] == " " && index >= 0){
                index-=1;
            }
            return;
        }
        while(equation[index] == " " && index < equation.length){
            index+=1;
        }
    }

    function parseNumber(reverse = false){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        let number = "";
        log("~~~", index, equation.length, equation[index], reverse);
        iterWhitespace(reverse);
        if(index >= equation.length || index < 0){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Index out of bounds: ${index}`);
        }
        if(numberchars.indexOf(equation[index]) == -1){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return NaN;
        }
        if(reverse){
            while(index >= 0 && numberchars.indexOf(equation[index]) != -1){
                number += equation[index];
                index-=1;
            }
            // Need to set index to the last character added to number
            index+=1;
            number = number.split("").reverse().join("");
        }else{
            while(index < equation.length && numberchars.indexOf(equation[index]) != -1){
                log("???", equation[index]);
                number += equation[index];
                index+=1;
            }
            // Do not need to set index to the last character added to number
            // because parsing will continue from the next character
        }
        log("!!!", number);
        if(!number.length){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return NaN;
        }
        if(number.split(".").length > 2){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Invalid Number: ${number}`);
        }
        if(number.split("-").length > 2){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Invalid Number: ${number}`);
        }
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return Number(number);
    }

    function parseOperation(operations){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        equation = equation.trim();
        if(equation.indexOf("+") == 0){
            equation = equation.slice(1);
            if(index > 0) index-=1;
        }
        if(index >= equation.length || index < 0){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Index out of bounds: ${index}`);
        }
        let operators = Object.keys(operations);
        let found = null;
        for(let op of operators){
            log(`"${equation}"`, op, equation.indexOf(op, 1));
            let ind = equation.indexOf(op, 1);
            if(ind == -1) continue;
            if(found === null) found = op;
            else if(ind < equation.indexOf(found, 1)) found = op;
        }
        if(found === null){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return false;
        }
        index = equation.indexOf(found, 1)-1;
        let a = parseNumber(true);
        let startindex = index;
        log(">>>>>> a", a, index);
        if(isNaN(a)){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Invalid Equation: ${equation}`);
        }
        index = equation.indexOf(found,1)+found.length;
        if(index >= equation.length){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return a;
        }
        let b = parseNumber();
        log(">>>>>> b", b, index);
        if(isNaN(b)){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Invalid Equation: ${equation}`);
        }

        let value = operations[found](a, b);
        log(value);
        log(startindex, index, equation.length);
        log(equation.slice(0, startindex), value, equation.slice(index, equation.length));
        equation = equation.slice(0, startindex) + value + equation.slice(index, equation.length);
        log("After Operation", found,":", equation);
        index = 0;
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return true;
    }

    function parseVariables(){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;

        function parseVariable(){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
            iterWhitespace();
            if(index >= equation.length){
                if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
                return false;
            }
            if(wordchars.indexOf(equation[index]) == -1){
                if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
                return false;
            }
            let variable = "";
            while(index < equation.length && wordchars.indexOf(equation[index]) != -1){
                variable += equation[index];
                index+=1;
            }
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return variable;
        }

        index = 0;
        while(index < equation.length){
            let originalindex = index;
            log(index, equation.length);
            let variable = parseVariable();
            log("Variable Found:", variable);
            if(variable === false){
                index+=1;
                continue;
            };
            let value = variables[variable];
            if(value === undefined){
                if(typeof DEBUGTAB != "undefined") DEBUGTAB = 0;
                throw new Error(`Unknown Variable: ${variable}`);
            }
            if(typeof value == "string"){
                if(dependencies.includes(variable)){
                    if(typeof DEBUGTAB != "undefined") DEBUGTAB = 0;
                    throw new Error(`Circular Dependency: Variable ${variable} already in use`);
                }
                dependencies.push(variable);
                log(">>> Resolving Dependency: " + variable + " = " + value);
                let depcopy = [...dependencies];
                log("       Dependencies: ", depcopy);
                log("       Index:", index);
                value = parseEquation(value, variables, depcopy);
                log("<<< Value", value);
                log("<<< Index:", index);
                variables[variable] = value;
            }
            log("Variable: " + variable + " = " + value);
            log(originalindex, index, equation.length);
            log(equation.slice(0, originalindex), value, equation.slice(index, equation.length));
            equation = equation.slice(0, originalindex) + value + equation.slice(index, equation.length);
            index = originalindex + (""+value).length;
            log(">>>", index, equation.length);
        }
        index = 0;
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
    }

    function parseParens(){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        log("P>P>", equation, index);
        popen = equation.indexOf("(", index);
        pclose = equation.indexOf(")", index);
        log("?P?", popen, pclose);
        if(pclose!= -1){
            if(popen == -1 || pclose < popen){
                if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
                return pclose;
            }
        }
        if(popen == -1){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return false;
        }
        if(pclose == -1){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Parenthesis Mismatch: ${equation}`)
        };
        index = popen+1;
        let idx = parseParens();
        log("<P<P<", equation, index, idx);
        if(idx === false){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
            throw new Error(`Parenthesis Mismatch: ${equation}`);
        }
        log(equation.slice(index, idx));
        let value = parseEquation(equation.slice(index, idx), variables, dependencies);
        log(equation, popen, index);
        equation = equation.slice(0, index-1) + value + equation.slice(idx+1, equation.length);
        index = popen;
        log("<P<P<P<", equation, index);
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return parseParens();
    }

    function parseExp(){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        let result = parseOperation({'^': (a,b)=>Math.pow(a,b)});
        if(!result){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return parseMultDiv();
        }
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return parseExp();
    }

    function parseMultDiv(){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        let result = parseOperation({'*': (a,b)=>a*b, '/':(a,b)=>a/b});
        if(!result){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return parsePlusMinus();
        }
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return parseMultDiv();
    }

    function parsePlusMinus(){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB++;
        let result = parseOperation({'+': (a,b)=>a+b, '-':(a,b)=>a-b});
        if(!result){
            if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
            return parseValue(equation);
        }
        if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
        return parsePlusMinus();
    }

    function parseValue(equation){
        return Number(equation);
    }

    console.log(DEBUGTAB)
    log("In:", equation);
    parseVariables();
    log("After Variables:", equation);
    parseParens();
    index = 0;
    log("After Parens:", equation);
    let value = parseExp();
    log("Value:", value);
    if(isNaN(value)){
        if(typeof DEBUGTAB != "undefined") DEBUGTAB=0;
        throw new Error(`Failed to Parse Equation: ${equation}`);
    }
    if(typeof DEBUGTAB != "undefined") DEBUGTAB--;
    return value;
}