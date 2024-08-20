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
        "+3",
        "-6",
        "5 + 5",
        "1 - 2 + 3",
        "2 - 1 - 3",
        "a + 1",
        "a + b",
        "a + c",
        "d",
        "a+d",
        "-a+d",
        "d/c*b",
        "1^2",
        "2^2",
        "a^c",
        "b^c",
        "2^2^2",
        "a+ b^2*4",
        "a^2 + b^2",
        "(a+ b)^2*4",
        "(a^2 + b^2)^2/3",
        "-3+(5/8^(3-2)*3)*2",
        "3*(3+(3/4+1)+(1/2)*(1/2))"
    ]
        

    for(let equation of test_equations){
        let result;
        console.log("-----------------------");
        console.log("Equation: " + equation);
        try{
            result = evaluateEquation(equation, variables);
        }catch(e){
            console.log("Failed: " + equation);
            console.error(e);
        }
        console.log(equation,">>>", result);
    }
}

test_variables()