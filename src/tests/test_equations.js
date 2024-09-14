function test_variables(){

    let variables = {
        a: 1,
        b: 2,
        c: "a + b", // 3
        d: "c * 2", // 6
        e: "d + f", // Circular Dependency
        f: "e * 2",
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
       ["5 5", "error"]
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
        console.log(equation + ">>>" + result + ">>>" + target);
    }
}

test_variables()