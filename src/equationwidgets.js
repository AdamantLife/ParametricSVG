/** NOTE- EquationRE supports equation names starting with numbers so that work
 *        won't be lost when the input mode is toggled. evaluateEquation does not
 *        support equation names starting with numbers.
 */
const EQUATIONRE = /^(?<disabled>\/\/)?\s*(?<name>\w+)\s*=\s*(?<equation>[^;]*)/i;

class EquationWidgets {
    /**
     * Constructs a new manager for Equation Widgets
     * @param {ParametricSVG} psvg - The associated ParametricSVG instance
     * @param {Element} parent - The parent element to populate with widgets
     */
    constructor(psvg, parent){
        this.psvg = psvg;
        this.parent = parent;
        this.equationscallback = this.setEquations.bind(this);
        this.psvg.addEquationCallback(this.equationscallback);
        this.updatecallback = this.setFeedback.bind(this);
        this.psvg.addUpdateCallback(this.updatecallback);
        this.parser = new DOMParser();
        this.equationcontainer;
        this.eid = 0;
        this.setupParent();
    }

    async setupParent(){
        this.parent.innerHTML = "";
        this.parent.classList.add("defintions");
        let r = await fetch("src/widgets/equationwidgetparent.html");
        let html = await r.text();
        let doc = this.parser.parseFromString(html, "text/html");
        this.parent.append(...doc.body.children);
        this.equationcontainer = document.getElementById("equations");
        this.parent.querySelector("#equationwidgets #addequation").addEventListener("click", e=>this.addEquation());
        this.parent.querySelector("#changeinput").addEventListener("click", this.changeInputType.bind(this));
    }

    clearAll(){
        this.equationcontainer.innerHTML = "";
    }

    /**
     * @type {PSVGUpdate}
     */
    setFeedback(type, {category, name, info}){
        if(category!=="equation") return;
        if (name == "Loading") return;
        if(type == "clear"){
            if(name == "all"){
                this.equationcontainer.querySelectorAll("div.equation").forEach(
                    equation=>equation.querySelectorAll(".button.error").forEach(
                        e => e.remove())
                    );
            }else{
                this.equationcontainer.querySelector(`div.equation[data-type=equation][data-id="${name}"]`).querySelectorAll(".button.error").forEach(e => e.remove());
            }
            return;
        }
        let element = this.equationcontainer.querySelector(`div.equation[data-type=equation][data-id="${name}"]`);
        if(!element){
            for(let equation of this.equationcontainer.querySelectorAll("div.equation[data-type=equation]")){
                if(equation.querySelector("#name").value == name){
                    element = equation;
                    break;
                }
            }
        }
        if(!element) return;
        let button = document.createElement("span");
        button.id = "error";
        button.classList.add("button", "error");
        button.ariaLabel = "Error";
        if(info.type == "duplicatename"){
            button.title = "Duplicate name";
        }else if(info.type == "noname"){
            button.title = "No name";
        }else if(info.type == "syntaxerror"){
            button.title = "Equation Syntax error";
        }else if(info.type == "numericname"){
            button.title = "Name starts with number";
        }
        else{
            console.log("Unknown error type", info.type);
        }
        element.querySelector(".controls").insertAdjacentElement("afterBegin", button);
    }

    /**
     * Callback to populate equations during psvg.updateEquations
     * @param {Variables} equations 
     */
    setEquations(equations){
        for(let equation of document.querySelectorAll("div.equation[data-type=equation]")){
            if(equation.getAttribute("disabled")) continue;
            let name = equation.querySelector("#name").value;
            let eid = equation.getAttribute("data-id");
            let equationstring = equation.querySelector("#equation").value;
            if(!name && !equationstring) continue
            if(equationstring.length && !name){
                this.psvg.setErrorState({category: "equation", name:eid, info:{type: "noname"}});
                console.error(`Equation with no name`);
                continue;
            }
            if(equations[name] !== undefined){
                this.psvg.setErrorState({category: "equation", name: eid, info:{type:"duplicatename"}});
                console.error(`Equation with name "${name}" already exists`);
                continue;
            }
            equations[name] = equationstring;
            this.psvg.clearErrorState({category: "equation", name: eid});
        }
    }
    
    async addEquation(container){
        let result = await fetch(`src/widgets/equation.html`);
        let ele = await result.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.equation");
        elem.setAttribute("data-id", this.eid++);
        this.setupEquation(elem);
        container = container || this.equationcontainer;
        container.append(elem);
        elem.querySelector("#name").focus();
        return elem;
    }

    setupEquation(elem){
        elem.querySelector("#remove").addEventListener("click", e => {elem.remove(); this.psvg.updateEquations();});
        for(let inputele of [elem.querySelector("#name"), elem.querySelector("#equation")]){
            EquationWidgets.setValueReset(inputele, this.psvg.updateEquations.bind(this.psvg));
        }
        elem.querySelector("#equation").addEventListener("keyup", e=>{
            if(e.key == "Enter"){
                this.psvg.updateEquations();
                this.addEquation();
            }
        });
        elem.querySelector("#equation").addEventListener("keydown",e =>{
            if(e.key == "Tab"){
                if(e.shiftKey) return;
                if(e.target !== this.parent.querySelector("div.equation:last-child #equation")) return;
                e.preventDefault();
                e.stopPropagation();
                this.psvg.updateEquations();
                this.addEquation();
                return false;
            }
        });
        elem.querySelector("#disable").addEventListener("change", e=> {
            let parent = e.target.parentElement;
            while(parent.dataset.type !== "equation" && parent.parentElement){
                parent = parent.parentElement;
            }
            if(parent.dataset.type !== "equation"){
                throw new Error(`Could not find parent equation element: ${e.target}`);
            }
            let name = parent.querySelector("#name");
            let equation = parent.querySelector("#equation");
            if(e.target.checked){
                name.setAttribute("disabled", true);
                parent.setAttribute("disabled", true);
                equation.setAttribute("disabled", true);
            } else {
                name.removeAttribute("disabled");
                parent.removeAttribute("disabled");
                equation.removeAttribute("disabled");
            }
        });
    }

    static handleInputKeyPress(e){
        if(e.key == "Enter"){
            e.preventDefault();
            e.stopPropagation();
            e.target.blur();
            return false;
        }
        if(e.key == "Escape"){
            e.preventDefault();
            e.stopPropagation();
            e.target.value = e.target.dataset.originalvalue;
            delete e.target.dataset.originalvalue;
            e.target.blur();
            return false;
        }
    }


    static setValueReset(input, valueChangeHandler){
        input.addEventListener("keyup", EquationWidgets.handleInputKeyPress)
        input.addEventListener("focus", e=> {e.target.dataset.originalvalue = e.target.value});
        input.addEventListener("blur", e=> {delete e.target.dataset.originalvalue; valueChangeHandler();});
    }

    async changeInputType(e){
        let button = this.parent.querySelector("button#changeinput");
        if(button.classList.contains("showinput")){
            button.classList.remove("showinput");
            let input = this.parent.querySelector("#equationtextinput").value;
            input = input.split("\n");
            this.equationcontainer.innerHTML = "";
            for(let line of input){
                let result = EQUATIONRE.exec(line);
                console.log(line, "=>", result);
                if(!result) continue;
                let elem = await this.addEquation();
                console.log("?", elem)
                elem.querySelector("#name").value = result.groups["name"];
                elem.querySelector("#equation").value = result.groups["equation"];
                elem.querySelector("#disable").checked = Boolean(result.groups["disable"]);
            }
            return;
        }
        button.classList.add("showinput");
        let inputs = [];
        for(let input of this.equationcontainer.querySelectorAll("div.equation")){
            let name = input.querySelector("#name").value;
            let equation = input.querySelector("#equation").value;
            let disable = input.querySelector("#disable").checked;
            if(!name && !equation) continue;
            inputs.push(`${disable ? "//" : ""}${name} = ${equation};`);
        }
        this.parent.querySelector("#equationtextinput").value = inputs.join("\n");
    }

    /**
     * Serializes the current state of the EquationWidgets
     * @returns {Variables} - A Serialized version of the EquationWidgets state
     */
    serialize(){
        return this.serializeEquations();
    }

    /**
     * Serializes the current state of the Equations
     * @returns {Variables} - A Serialized version of the Equations
     */
    serializeEquations(){
        let out = {};
        for(let equation of this.equationcontainer.querySelectorAll(".equation")){
            let name = equation.querySelector("#name").value;
            let value = equation.querySelector("#equation").value;
            out[name] = value;
        }
        return out;
    }

    async loadFromJSON(json){
        this.psvg.setErrorState({category: "equation", name: "Loading", info: null});
        this.clearAll();
        for(let [name, equation] of Object.entries(json.equations)){
            let element = await this.addEquation();
            element.querySelector("#name").value = name;
            element.querySelector("#equation").value = equation;
        }

        this.psvg.clearErrorState({category: "equation", name: "Loading"});
    }
}