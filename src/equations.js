/**
 * @typedef {String} VariableName
 * @typedef {String} Equation
 * 
 * @typedef {Map<VariableName, Equation} Variables
 */
 

function parseEquation(equation, variables = undefined, dependencies = undefined){
    if(typeof variables == "undefined"){ variables = {}; }
    if(typeof dependencies == "undefined"){ dependencies = []; }
    
    let index = 0;
    let numberchars = "0123456789.";

    function parseValue(){
        if(index >= equation.length) return false;
        let value = parseParens();
        if(value !== false) return value;
        value = parseNegative();
        if(value !== false) return value;
        value = parseNumber();
        if(value !== false) return value;
        value = parseVariable();
        if(value !== false) return value;
        return false;
    }

    function parseParens(){
        if(equation[index] != "(") return false;
        index += 1;
        let value = parseValue();
        if(value === false) throw new Error(`Empty Parenthesis: ${equation}`);
        if(equation[index] != ")") throw new Error(`Unclosed Parenthesis: ${equation}`);
        index += 1;
        return value;
    }

    function parseNegative(){
        if(equation[index] != "-") return false;
        index += 1;
        let value = parseValue();
        if(value === false) throw new Error(`Failed to parse negative value: ${equation}`);
        return -value;
    }

    function parseNumber(){
        let number = "";
        while(index < equation.length && numberchars.includes(equation[index])){
            number += equation[index];
            index += 1;
        }
        if(number == "") return false;
        return parseFloat(number);
    }

    function parseVariable(){
        let variable = "";
        while(index < equation.length && equation[index] != " "){
            variable += equation[index];
            index += 1;
        }
        if(variable == "") return false;
        if(typeof variables[variable] == "undefined"){
            throw new Error(`Unknown Variable: ${variable}`);
        }
        if(dependencies.includes(variable)){
            throw new Error(`Circular Dependency: Variable ${variable} already in use`);
        }
        let childdependencies = dependencies.slice();
        childdependencies.push(variable);
        let value;
        if(typeof variables[variable] == "string"){
            value = parseEquation(variables[variable], variables, childdependencies);
            if(value === false) throw new Error(`Failed to parse variable: ${variable}`);
            variables[variable] = value;
        }else{
            value = variables[variable];
        }
        while(index < equation.length && equation[index] == " "){
            index += 1;
        }
        return value;
    }

    function parseMultDiv(){
        let ind = Math.max(index, equation.indexOf("*") || equation.indexOf("/"));
        if(ind == -1) return false;
        let [left, right] = [equation.slice(0, ind), equation.slice(ind + 1)];
        let leftvalue = parseEquation(left, variables, dependencies);
        if(leftvalue === false) throw new Error(`Failed to parse left value: ${equation}`);
        let rightvalue = parseEquation(right, variables, dependencies);
        if(rightvalue === false) throw new Error(`Failed to parse right value: ${equation}`);
        if(equation[ind] == "*") return leftvalue * rightvalue;
        return leftvalue / rightvalue;
    }

    function parsePlusMinus(){
        let ind = Math.max(index, equation.indexOf("+") || equation.indexOf("-"));
        if(ind == -1) return false;
        let [left, right] = [equation.slice(0, ind), equation.slice(ind + 1)];
        let leftvalue = parseEquation(left, variables, dependencies);
        if(leftvalue === false) throw new Error(`Failed to parse left value: ${equation}`);
        let rightvalue = parseEquation(right, variables, dependencies);
        if(rightvalue === false) throw new Error(`Failed to parse right value: ${equation}`);
        if(equation[ind] == "+") return leftvalue + rightvalue;
        return leftvalue - rightvalue;
    }

    let value = parseMultDiv();
    if(value !== false) return value;
    value = parsePlusMinus();
    if(value !== false) return value;
    value = parseValue();
    if(value !== false) return value;

    return false;
}