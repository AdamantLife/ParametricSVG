"use-strict";

import { evaluateEquation } from "../equations.js";

function test_variables(){

    let variables = {
        a: {value: 1},
        b: {value: 2},
        c: {value: "a + b"}, // 3
        d: {value: "c * 2"}, // 6
        e: {value: "d + f"}, // Circular Dependency
        f: {value: "e * 2"},
        g: {value: "c + a"}, // 4; Non-Circular Dependency
    };

    let test_equations = [
        ["+3", 3],
        ["-6", -6],
        ["5 + 5", 10],
        ["1 - 2 + 3", 2],
        ["2 - 1 - 3", -4],
       [ "a + 1", 2],
       [ "a + b", 3],
       [ "a + c", 4],
       [ " a - c ", -2],
       [ "d", 6],
       [ "a+d", 7],
       [ "-a+d", 5],
       [ "d/c*b", 4],
       [ "1^2", 1],
       [ "2^2", 4],
       [ "a^c", 3],
       [ "b^c", 8],
       [ "2^2^2", 16],
       [ "a+ b^2*4", 17],
       [ "a^2 + b^2", 5],
       [ "(a+ b)^2*4", 36],
       [ "(a^2 + b^2)^2/3", 8+1/3],
       [ "-3+(5/8^(3-2)*3)*2", 0.75],
       [ "3*(3+(3/4+1)+(1/2)*(1/2))", 15],
       ["5//3", "1"],
       ["5 5", "error"], // No operator
       ["1)", "error"], // More closing brackets
       ["(1", "error"], // More opening brackets
       ["(1 + (3 - 4)", "error"], // More opening brackets
       ["(3 + 4) -1)", "error"], // More closing brackets
       ["e", "error"], // Circular Dependency
       ["g", 4],
    ]
        

    for(let [equation, target] of test_equations){
        let result;
        console.log("-----------------------");
        console.log("Equation: " + equation);
        try{
            result = evaluateEquation(equation, variables);
        }catch(e){
            if(target !== "error"){
                console.log("Failed: " + equation);
                console.error(e);
                continue;
            }else{
                result = e.message;
            }
        }
        if(target == "error" && typeof result !== "string"){
            console.error(`Failed to raise Error: ${equation}`);
        }
        console.log(equation + ">>>" + result + ">>>" + target);
    }
}

test_variables()