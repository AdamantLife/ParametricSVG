const XMLNS = "http://www.w3.org/2000/svg";

class ParametricSVG {
    constructor(svgcontainer, equationcontainer){
        this.svgcontainer = svgcontainer;
        this.equationcontainer = equationcontainer;
        /** @type {Variables} */
        this.equations = {};
        this.updatecallback = null;
        this.svg = document.createElementNS(XMLNS, "svg");
        this.parser = new DOMParser();
        this.errors = [];
        this.errorcallback = this.setFeedback.bind(this);
    }

    clearAll(){
        this.svg.innerHTML = "";
        this.svgcontainer.innerHTML = "";
        this.equationcontainer.innerHTML = "";
        this.errors = [];
        this.equations = {};
        this.updateEquations();
    }

    setErrorState(element, errorType){
        let elementerrors = this.errors.filter(e => e[0] === element);
        for(let [element, preverrorType] of elementerrors){
            if(errorType == preverrorType) return;
        }
        this.errors.push([element, errorType]);
        if(this.errorcallback) this.errorcallback(element, errorType);
    }

    getErrorState(){
        return Boolean(this.errors.length);
    }

    clearErrorState(element, errorType){
        if(errorType === undefined){
            this.errors = this.errors.filter(e => e[0] !== element);
        }else{
            this.errors = this.errors.filter(e => e[0] !== element || e[1] !== errorType);
        }
        if(element === null) return;
        element.classList.remove("error");
        element.querySelector("#error")?.remove();
    }

    setFeedback(element, errorType){
        if(element===null) return;
        let button = document.createElement("span");
        button.id = "error";
        button.classList.add("button", "error");
        button.ariaLabel = "Error";
        if(errorType == "duplicatename"){
            button.title = "Duplicate name";
        }else if(errorType == "noname"){
            button.title = "No name";
        }else if(errorType == "syntaxerror"){
            button.title = "Equation Syntax error";
        }
        element.querySelector(".controls").insertAdjacentElement("afterBegin", button);
    }

    setUpdateCallback(updatecallback){
        this.updatecallback = updatecallback;
        this.updateEquations();
    }

    updateEquations(){
        this.equations = {};
        if(this.updatecallback){
            this.updatecallback("equation",this.equations);
        }
        let elementLookup = {};
        for(let equation of document.querySelectorAll("div.equation[data-type=equation]")){
            if(equation.getAttribute("disabled")) continue;
            let name = equation.querySelector("#name").value;
            let equationstring = equation.querySelector("#equation").value;
            if(equationstring.length && !name){
                this.setErrorState(equation, "noname");
                console.error(`Equation with no name`);
                continue;
            }
            if(this.equations[name] !== undefined){
                this.setErrorState(equation, "duplicatename");
                console.error(`Equation with name ${name} already exists`);
                continue;
            }
            this.equations[name] = equationstring;
            elementLookup[name] = equation;
            this.clearErrorState(equation);
        }
        for(let [name, equation] of Object.entries(this.equations)){
            if(!equation) continue;
            if(!name){
                this.setErrorState(elementLookup[name], "noname");
            }
            try{
                evaluateEquation(""+equation, this.equations);
                if(elementLookup[name]) this.clearErrorState(elementLookup[name]);
            }catch(e){
                console.error(e);
                if(elementLookup[name]) this.setErrorState(elementLookup[name], "syntaxerror");
            }
        }
        this.updateSVG();
    }

    /**
     * Runs evaluateEquation on each value of a given object
     * @param {Object} obj - The Object to evaluate
     * @returns {void} - The object is mutated in place
     */
    updateObjectEquations(obj){
        for(let [key, value] of Object.entries(obj)){
            try{
                obj[key] = evaluateEquation(value, this.equations);
            }catch(e){}
        }
    }

    updateSVG(){
        this.svg.innerHTML = "";
        if(this.updatecallback){
            this.updatecallback("svg",this.svg);
        }
        if(this.getErrorState()) return;

        for(let svgcomponent of this.svgcontainer.querySelectorAll("div.svgcomponent")){
            let type = svgcomponent.dataset.type;
            let element;
            switch(type){
                case "circle":
                    element = this.parseCirle(svgcomponent);
                    break;
                case "ellipse":
                    element = this.parseEllipse(svgcomponent);
                    break;
                case "line":
                    element = this.parseLine(svgcomponent);
                    break;
                case "path":
                    element = this.parsePath(svgcomponent);
                    break;
                case "polygon":
                    element = this.parsePolygon(svgcomponent);
                    break;
                case "polyline":
                    element = this.parsePolyline(svgcomponent);
                    break;
                case "rect":
                    element = this.parseRectangle(svgcomponent);
                    break;
                default:
                    console.error(`Invalid type ${type}`);
                    break;
            }
            if(element){
                // console.log(element);
                this.svg.append(element);
            }
        }
    }

    async addSVG(type, container){
        if(!["circle", "ellipse", "line", "path", "polygon", "polyline", "rect"].includes(type)) throw new Error(`Invalid type ${type}`);
        let component = await fetch(`src/elements/svgcomponent.html`);
        let comp = await component.text();
        let doc = this.parser.parseFromString(comp, "text/html");
        let elem = doc.querySelector("div.svgcomponent");

        component = await fetch(`src/elements/${type}.html`);
        comp = await component.text();
        doc = this.parser.parseFromString(comp, "text/html");
        let content = doc.querySelector("div");
        elem.dataset.type=type;
        elem.querySelector("#name").textContent = type.toUpperCase();
        elem.querySelector("#content").append(content);

        this.setupSVGElement(type, elem);
        container = container || this.svgcontainer;
        container.append(elem);
        return elem;
    }
    
    setupSVGElement(type, elem){
        elem.setAttribute("data-type", type);
        if(type == "path"){
            let span = document.createElement("span");
            span.id = "addCommand";
            span.classList.add("button", "addCommand");
            span.ariaLabel = "Add Path Command";
            span.title = "Add Path Command";
            elem.querySelector(".controls").insertAdjacentElement("afterBegin", span);
            span.addEventListener("click", e=> this.addSVGCommand("path", elem) );
        }else if(type == "polygon" || type == "polyline"){
            let span = document.createElement("span");
            span.id = "addPoint";
            span.classList.add("button", "addCommand");
            span.ariaLabel = "Add Point";
            span.title = "Add Point";
            elem.querySelector(".controls").insertAdjacentElement("afterBegin", span);
            span.addEventListener("click", e=> this.addSVGCommand(type, elem) );
        }
        elem.querySelector("#remove").addEventListener("click", e => {elem.remove(); this.updateSVG();});
        elem.querySelector("#addAttribute").addEventListener("click", this.addSVGAttribute.bind(this) );
        for(let input of elem.querySelectorAll("input")){
            ParametricSVG.setValueReset(input, this.updateSVG.bind(this));
        }
        elem.querySelector("hr").addEventListener("click", e=> e.target.classList.toggle("show"))
    }
    
    async addEquation(container){
        let result = await fetch(`src/elements/equation.html`);
        let ele = await result.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.equation");
        this.setupEquation(elem);
        container = container || this.equationcontainer;
        container.append(elem);
        elem.querySelector("#name").focus();
        return elem;
    }

    setupEquation(elem){
        elem.querySelector("#remove").addEventListener("click", e => {elem.remove(); this.updateEquations();});
        for(let inputele of [elem.querySelector("#name"), elem.querySelector("#equation")]){
            ParametricSVG.setValueReset(inputele, this.updateEquations.bind(this));
        }
        elem.querySelector("#equation").addEventListener("keyup", e=>{
            if(e.key == "Enter"){
                this.updateEquations();
                this.addEquation();
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
            this.updateEquations();
        });
    }

    async addSVGAttribute(e){
        let parent = e.target.parentElement;
        while(!parent.classList.contains("svgcomponent") && parent.parentElement){
            parent = parent.parentElement;
        }
        if(!parent.classList.contains("svgcomponent")){
            throw new Error(`Could not find parent SVG element: ${e.target.outerHTML}`);
        }
        let attribute = await fetch(`src/elements/attribute.html`);
        let ele = await attribute.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.attribute");
        let nameinput = elem.querySelector("#attributename");
        let input = elem.querySelector("#attributevalue");
        ParametricSVG.setValueReset(nameinput, this.updateSVG.bind(this));
        ParametricSVG.setValueReset(input, this.updateSVG.bind(this));
        elem.querySelector("#remove").addEventListener("click", e => {elem.remove(); this.updateSVG();});
        parent.querySelector("#attributes").append(elem);
        nameinput.focus();
        let hr = parent.querySelector("hr");
        if(!hr.classList.contains("show")) hr.click();
        return elem;
    }

    async addSVGCommand(type, elem){
        let container, point;
        if(type == "path"){
            container = elem.querySelector("#path");
            let resp = await fetch(`src/elements/pathpoints.html`);
            let ele = await resp.text();
            let doc = this.parser.parseFromString(ele, "text/html");
            point = doc.querySelector("div.point");
            container.append(point);
            ParametricSVG.setupPathPoints(point, this.updateSVG.bind(this));
        }else{
            container = elem.querySelector("#points");
            let resp = await fetch(`src/elements/polypoints.html`);
            let ele = await resp.text();
            let doc = this.parser.parseFromString(ele, "text/html");
            point = doc.querySelector("div.point");
            container.append(point);
            ParametricSVG.setValueReset(point.querySelector("#x"), this.updateSVG.bind(this));
            ParametricSVG.setValueReset(point.querySelector("#y"), this.updateSVG.bind(this));
        }

        point.querySelector("#remove").addEventListener("click", e => {container.remove(); this.updateSVG();});

        let hr = elem.querySelector("hr");
        if(!hr.classList.contains("show")) hr.click();
        return point;
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
        input.addEventListener("keyup", ParametricSVG.handleInputKeyPress)
        input.addEventListener("focus", e=> {e.target.dataset.originalvalue = e.target.value});
        input.addEventListener("blur", e=> {delete e.target.dataset.originalvalue; valueChangeHandler();});
    }

    static setupPathPoints(point, valueChangeHandler){
        for(let selector of [
            "#default #x", "#default #y",
            "#cubic #x1", "#cubic #y1", "#cubic #x2", "#cubic #y2", "#cubic #x", "#cubic #y",
            "#quadratic #x1", "#quadratic #y1", "#quadratic #x", "#quadratic #y",
            "#arc #rx", "#arc #ry", "#arc #x", "#arc #y", "#arc #xRotation", "#arc #largeArcFlag", "#arc #sweepFlag",
        ]){
            ParametricSVG.setValueReset(point.querySelector(selector), valueChangeHandler);
        }
        function updateSelection(){
            for(let container of point.querySelectorAll(".args")){
                container.style.display = "none";
            }
            for(let label of point.querySelectorAll("label:has(input.coordinate)")){
                label.querySelector("input.coordinate").value = 0;
                label.style.display = "revert-layer";
            }
            point.querySelector("label:has(#relative)").style.display = "revert-layer";
            for(let input of point.querySelectorAll("input[type=checkbox]")){
                input.checked = false;                
            }
            let selection = point.querySelector(`#type`).value;
            switch(selection){
                case "close":
                    break;
                case "move":
                case "line":
                case "horizontal":
                case "vertical":
                    point.querySelector(`#default`).style.display = "revert-layer";
                    break;
                case "cubic":
                case "shortcubic":
                    point.querySelector("#cubic").style.display = "revert-layer";
                    break;
                case "quadratic":
                case "shortquadratic":
                    point.querySelector("#quadratic").style.display = "revert-layer";
                    break;
                case "arc":
                    point.querySelector("#arc").style.display = "revert-layer";
                    break;                    
                default:
                    point.querySelector(`#${selection}`).style.display = "revert-layer";
                    break;
            }
            let child;
            switch(selection){
                case "close":
                    point.querySelector("label:has(#relative)").style.display = "none";
                    break;
                case "horizontal":
                    point.querySelector("#default label:has(#y)").style.display = "none";
                    break;
                case "vertical":
                    point.querySelector("#default label:has(#x)").style.display = "none";
                    break;
                case "shortcubic":
                    child = point.querySelector("#cubic");
                    child.querySelector("label:has(#x1)").style.display = "none";
                    child.querySelector("label:has(#y1)").style.display = "none";
                    break;
                case "shortquadratic":
                    child = point.querySelector("#quadratic")
                    child.querySelector("label:has(#x1)").style.display = "none";
                    child.querySelector("label:has(#y1)").style.display = "none";
                    break;
                default:
                    break;
            }
            valueChangeHandler();
        }
        point.querySelector("#type").addEventListener("change", updateSelection);
        updateSelection();
    }

    /**
     * Returns the attributes of an SVG builder Element
     * @param {Element} element 
     * @returns {Object[string, string]}}
     */
    parseAttributes(element){
        let attributes = {};
        for(let attr of element.querySelectorAll(".attribute")){
            attributes[attr.querySelector("#attributename").value] = attr.querySelector("#attributevalue").value;
        }
        return attributes;
    }

    parseCirle(element){
        let attributes = this.parseAttributes(element);
        attributes.cx =element.querySelector("#cx").value;
        attributes.cy =element.querySelector("#cy").value;
        attributes.r =element.querySelector("#r").value;
        this.updateObjectEquations(attributes);
        let svg = document.createElementNS(XMLNS, "circle");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null, attr, val);
        }
        return svg;
    }

    parseLine(element){
        let attributes = this.parseAttributes(element);
        attributes.x1 =element.querySelector("#x1").value;
        attributes.y1 =element.querySelector("#y1").value;
        attributes.x2 =element.querySelector("#x2").value;
        attributes.y2 =element.querySelector("#y2").value;
        this.updateObjectEquations(attributes);
        let svg = document.createElementNS(XMLNS, "line");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null, attr, val);
        }
        return svg;
    }

    parseRectangle(element){
        let attributes = this.parseAttributes(element);
        attributes.x =element.querySelector("#x").value;
        attributes.y =element.querySelector("#y").value;
        attributes.width =element.querySelector("#width").value;
        attributes.height =element.querySelector("#height").value;
        attributes.rx =element.querySelector("#rx").value;
        attributes.ry =element.querySelector("#ry").value;
        this.updateObjectEquations(attributes);
        let svg = document.createElementNS(XMLNS, "rect");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null, attr, val);
        }
        return svg;
    }

    parsePolygon(element){
        let attributes = this.parseAttributes(element);
        attributes.points = "";
        for(let point of element.querySelectorAll(".point")){
            attributes.points += `${evaluateEquation(point.querySelector("#x").value, this.equations)},${evaluateEquation(point.querySelector("#y").value, this.equations)} `;
        }
        let svg = document.createElementNS(XMLNS, "polygon");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null, attr, val);
        }
        return svg;
    }

    parsePolyline(element){
        let attributes = this.parseAttributes(element);
        attributes.points = "";
        for(let point of element.querySelectorAll(".point")){
            attributes.points += `${evaluateEquation(point.querySelector("#x").value, this.equations)},${evaluateEquation(point.querySelector("#y").value, this.equations)} `;
        }
        let svg = document.createElementNS(XMLNS, "polyline");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null, attr, val);
        }
        return svg;
    }

    parseEllipse(element){
        let attributes = this.parseAttributes(element);
        attributes.cx =element.querySelector("#cx").value;
        attributes.cy =element.querySelector("#cy").value;
        attributes.rx =element.querySelector("#rx").value;
        attributes.ry =element.querySelector("#ry").value;
        this.updateObjectEquations(attributes);
        let svg = document.createElementNS(XMLNS,"ellipse");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null,attr, val);
        }
        return svg;
    }

    parsePath(element){
        function parseDefault(type, point){
            if(type == "close") return "Z";
            let ele = point.querySelector("#default");
            let x = evaluateEquation(ele.querySelector("#x").value, this.equations);
            let y = evaluateEquation(ele.querySelector("#y").value, this.equations);
            if(type == "move"){
                return `M${x} ${y}`;
            }else if(type == "line"){
                return `L${x} ${y}`;
            }else if(type == "horizontal"){
                return `H${x}`;
            }else if(type == "vertical"){
                return `V${y}`;
            }
            throw new Error(`Unkown type: ${type}`);
        }
        function parseCubic(type, point){
            let ele = point.querySelector("#cubic");
            let x1 = evaluateEquation(ele.querySelector("#x1").value, this.equations);
            let y1 = evaluateEquation(ele.querySelector("#y1").value, this.equations);
            let x2 = evaluateEquation(ele.querySelector("#x2").value, this.equations);
            let y2 = evaluateEquation(ele.querySelector("#y2").value, this.equations);
            let x = evaluateEquation(ele.querySelector("#x").value, this.equations);
            let y = evaluateEquation(ele.querySelector("#y").value, this.equations);
            if(type == "cubic"){
                return `C${x1} ${y1},${x2} ${y2},${x} ${y}`;
            }else if (type == "shortcubic"){
                return `S${x2} ${y2},${x} ${y}`
            }
            throw new Error(`Unkown type: ${type}`);
        }
        function parseQuadratic(type, point){
            let ele = point.querySelector("#quadratic");
            let x1 = evaluateEquation(ele.querySelector("#x1").value, this.equations);
            let y1 = evaluateEquation(ele.querySelector("#y1").value, this.equations);
            let x = evaluateEquation(ele.querySelector("#x").value, this.equations);
            let y = evaluateEquation(ele.querySelector("#y").value, this.equations);
            if(type == "quadratic"){
                return `Q${x1} ${y1},${x} ${y}`;
            }else if (type == "shortquadratic"){
                return `T${x} ${y}`
            }
            throw new Error(`Unkown type: ${type}`);
            
        }
        function parseArc(type, point){
            let ele = point.querySelector("#arc");
            let x = evaluateEquation(ele.querySelector("#x").value, this.equations);
            let y = evaluateEquation(ele.querySelector("#y").value, this.equations);
            let rx = evaluateEquation(ele.querySelector("#rx").value, this.equations);
            let ry = evaluateEquation(ele.querySelector("#ry").value, this.equations);
            let xrotation = evaluateEquation(ele.querySelector("#xRotation").value, this.equations);
            let largeArcFlag = ele.querySelector("#largeArcFlag").checked;
            let sweepFlag = ele.querySelector("#sweepFlag").checked;
            if(type == "arc"){
                return `A${rx} ${ry},${xrotation},${largeArcFlag},${sweepFlag}, ${x} ${y}`;
            }
            throw new Error(`Unkown type: ${type}`);
        }

        let attributes = this.parseAttributes(element);
        attributes.d = "";
        for(let point of element.querySelectorAll(".point")){
            let callback;
            let type = point.querySelector("#type").value;
            switch(type){
                case "move":
                case "line":
                case "horizontal":
                case "vertical":
                case "close":
                    callback = parseDefault;
                case "cubic":
                case "shortcubic":
                    callback = parseCubic;
                    break;
                case "quadratic":
                case "shortquadratic":
                    callback = parseQuadratic;
                    break;
                case "arc":
                    callback = parseArc;
                    break;
                default:
                    throw new Error("Unknown path command");
            }
            let relative = point.querySelector("#relative").checked;
            let pointval = callback(type, point);
            if(relative){
                pointval = pointval.toLowerCase();
            }
            d+=pointval;
        }

        let svg = document.createElementNS(XMLNS, "path");
        for(let [attr, val] of Object.entries(attributes)){
            svg.setAttributeNS(null,attr, val);
        }
        return svg;
    }

    /**
     * Serializes the current state of the ParametricSVG
     * @returns {Object} - A Serialized version of the ParametricSVG state
     */
    serialize(){
        return {equations: this.serializeEquations(), svgcomponents: this.serializeSVG(), viewBox: this.svg.getAttribute("viewBox")};
    }

    /**
     * Serializes the current state of the Equations
     * @returns {Object} - A Serialized version of the Equations
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

    /**
     * Serializes the current state of the SVG
     * @returns {Object[]} - An array of Serialized SVG components
     */
    serializeSVG(){
        let out = [];
        for(let element of this.svgcontainer.querySelectorAll(".svgcomponent")){
            let type = element.dataset.type;
            switch(type){
                case "circle":
                    out.push(this.serializeCircle(element));
                    break;
                case "ellipse":
                    out.push(this.serializeEllipse(element));
                    break;
                case "rect":
                    out.push(this.serializeRect(element));
                    break;
                case "line":
                    out.push(this.serializeLine(element));
                    break;
                case "path":
                    out.push(this.serializePath(element));
                    break;
                case "polygon":
                    out.push(this.serializePolygon(element));
                    break;
                case "polyline":
                    out.push(this.serializePolyline(element));
                    break;
            }
        }
        return out;
    }
    serializeAttributes(element){
        let out = {}
        for(let attribute of element.querySelectorAll(".attribute")){
            let name = attribute.querySelector("#attributename").value;
            let value = attribute.querySelector("#attributevalue").value;
            if(!value) continue;
            out[name] = value;
        }
        return out;
    }
    serializeCircle(element){
        let out = {type: "circle"};
        out.attributes = this.serializeAttributes(element);
        out.cx = element.querySelector("#cx").value;
        out.cy = element.querySelector("#cy").value;
        out.r = element.querySelector("#r").value;
        return out;
    }
    serializeEllipse(element){
        let out  = {type: "ellipse"};
        out.attributes = this.serializeAttributes(element);
        out.cx = element.querySelector("#cx").value;
        out.cy = element.querySelector("#cy").value;
        out.rx = element.querySelector("#rx").value;
        out.ry = element.querySelector("#ry").value;
        return out;
    }
    serializeRect(element){
        let out = {type: "rect"};
        out.attributes = this.serializeAttributes(element);
        out.x = element.querySelector("#x").value;
        out.y = element.querySelector("#y").value;
        out.width = element.querySelector("#width").value;
        out.height = element.querySelector("#height").value;
        out.rx = element.querySelector("#rx").value;
        out.ry = element.querySelector("#ry").value;
        return out;
    }
    serializeLine(element){
        let out = {type: "line"};
        out.attributes = this.serializeAttributes(element);
        out.x1 = element.querySelector("#x1").value;
        out.y1 = element.querySelector("#y1").value;
        out.x2 = element.querySelector("#x2").value;
        out.y2 = element.querySelector("#y2").value;
        return out;
    }
    serializePolygon(element){
        let out = {type: "polygon"};
        out.attributes = this.serializeAttributes(element);
        out.points = [];
        for(let point of element.querySelectorAll(".point")){
            out.points.push([
                point.querySelector("#x").value,
                point.querySelector("#y").value]);
            }
            return out;
    }
    serializePolyline(element){
        let out = {type: "polyline"};
        out.attributes = this.serializeAttributes(element);
        out.points = [];
        for(let point of element.querySelectorAll(".point")){
            out.points.push([
                point.querySelector("#x").value,
                point.querySelector("#y").value]);
            }
        return out;
    }
    serializePath(element){
        let out = {type: "path"};
        out.attributes = this.serializeAttributes(element);
        out.path = [];
        for(let point of element.querySelectorAll(".point")){
            let type = point.querySelector("#type").value;
            if(type == "close"){
                out.path.push({type});
                continue;
            }
            let relative = point.querySelector("#relative").checked;
            if(type == "move"){
                out.path.push({
                    type,
                    relative,
                    x: point.querySelector("#default #x").value,
                    y: point.querySelector("#default #y").value
                });
            }else if(type == "line"){
                out.path.push({
                    type,
                    relative,
                    x: point.querySelector("#default #x").value,
                    y: point.querySelector("#default #y").value
                });
            }
            else if(type == "horizontal"){
                out.path.push({
                    type,
                    relative,
                    x: point.querySelector("#default #x").value
                });
            } else if(type == "vertical"){
                out.path.push({
                    type,
                    relative,
                    y: point.querySelector("#default #y").value
                });
            } else if(type == "cubic" || type == "shortcubic"){
                let ele = {
                    type,
                    relative,
                    x2: point.querySelector("#cubic #x2").value,
                    y2: point.querySelector("#cubic #y2").value,
                    x: point.querySelector("#cubic #x").value,
                    y: point.querySelector("#cubic #y").value
                };
                if (type == "cubic"){
                    ele.x1 = point.querySelector("#cubic #x1").value;
                    ele.y1 = point.querySelector("#cubic #y1").value;
                }
                out.path.push(ele);
            } else if (type == "quadratic" || type == "shortquadratic"){
                let ele = {
                    type,
                    relative,
                    x: point.querySelector("#quadratic #x").value,
                    y: point.querySelector("#quadratic #y").value
                };
                if (type == "quadratic"){
                    ele.x1 = point.querySelector("#quadratic #x1").value;
                    ele.y1 = point.querySelector("#quadratic #y1").value;
                }
                out.path.push(ele);
            } else if (type == "arc"){
                out.path.push({
                    type,
                    relative,
                    rx: point.querySelector("#arc #rx").value,
                    ry: point.querySelector("#arc #ry").value,
                    x: point.querySelector("#arc #x").value,
                    y: point.querySelector("#arc #y").value,
                    xRotation: point.querySelector("#arc #xRotation").value,
                    largeArcFlag: point.querySelector("#arc #largeArcFlag").checked,
                    sweepFlag: point.querySelector("#arc #sweepFlag").checked
                });
            }
        }
        return out;
    }

    async loadFromJSON(json){
        this.clearAll();
        this.setErrorState(null,"Loading");
        this.svg.setAttribute("viewBox", json.viewBox);
        for(let [name, equation] of Object.entries(json.equations)){
            let element = await this.addEquation();
            element.querySelector("#name").value = name;
            element.querySelector("#equation").value = equation;
        }
        for(let svgcomponent of json.svgcomponents){
            let element = await this.addSVG(svgcomponent.type);
            if(svgcomponent.type == "circle"){
                element.querySelector("#cx").value = svgcomponent.cx;
                element.querySelector("#cy").value = svgcomponent.cy;
                element.querySelector("#r").value = svgcomponent.r;
            } else if(svgcomponent.type == "ellipse"){
                element.querySelector("#cx").value = svgcomponent.cx;
                element.querySelector("#cy").value = svgcomponent.cy;
                element.querySelector("#rx").value = svgcomponent.rx;
                element.querySelector("#ry").value = svgcomponent.ry;
            } else if(svgcomponent.type == "line"){
                element.querySelector("#x1").value = svgcomponent.x1;
                element.querySelector("#y1").value = svgcomponent.y1;
                element.querySelector("#x2").value = svgcomponent.x2;
                element.querySelector("#y2").value = svgcomponent.y2;
            } else if(svgcomponent.type == "rect"){
                element.querySelector("#x").value = svgcomponent.x;
                element.querySelector("#y").value = svgcomponent.y;
                element.querySelector("#width").value = svgcomponent.width;
                element.querySelector("#height").value = svgcomponent.height;
                element.querySelector("#rx").value = svgcomponent.rx;
                element.querySelector("#ry").value = svgcomponent.ry;
            } else if(svgcomponent.type == "polygon" || svgcomponent.type == "polyline"){
                for(let point of svgcomponent.points){
                    let pointElement = await this.addSVGCommand(svgcomponent.type, element);
                    pointElement.querySelector("#x").value = point.x;
                    pointElement.querySelector("#y").value = point.y;
                }
            } else if(svgcomponent.type == "path"){
                for(let point of svgcomponent.points){
                    let pointElement = await this.addSVGCommand(svgcomponent.type, element);
                    pointElement.querySelector("#type").value = point.type;
                    pointElement.querySelector("#relative").checked = point.relative;
                    if(point.type == "close") continue;
                    if(point.type == "horizontal"){
                        pointElement.querySelector("#default #x").value = point.x;
                    } else if(point.type == "vertical"){
                        pointElement.querySelector("#default #y").value = point.y;
                    } else if(point.type =="move" || point.type == "line" || point.type == "cubic" || point.type == "shortcubic" || point.type == "quadratic" || point.type == "shortquadratic" || point.type == "arc"){
                        pointElement.querySelector("#default #x").value = point.x;
                        pointElement.querySelector("#default #y").value = point.y;
                    }else if(point.type == "cubic" || point.type == "shortcubic"){
                        pointElement.querySelector("#cubic #x2").value = point.x2;
                        pointElement.querySelector("#cubic #y2").value = point.y2;
                        pointElement.querySelector("#cubic #x").value = point.x;
                        pointElement.querySelector("#cubic #y").value = point.y;
                        if(point.type == "cubic"){
                            pointElement.querySelector("#cubic #x1").value = point.x1;
                            pointElement.querySelector("#cubic #y1").value = point.y1;
                        }
                    }else if(point.type == "quadratic" || point.type == "shortquadratic"){
                        pointElement.querySelector("#quadratic #x").value = point.x;
                        pointElement.querySelector("#quadratic #y").value = point.y;
                        if(point.type == "quadratic"){
                            pointElement.querySelector("#quadratic #x1").value = point.x1;
                            pointElement.querySelector("#quadratic #y1").value = point.y1;
                        }
                    }else if(point.type == "arc"){
                        pointElement.querySelector("#arc #rx").value = point.rx;
                        pointElement.querySelector("#arc #ry").value = point.ry;
                        pointElement.querySelector("#arc #x").value = point.x;
                        pointElement.querySelector("#arc #y").value = point.y;
                        pointElement.querySelector("#arc #xRotation").value = point.xRotation;
                        pointElement.querySelector("#arc #largeArcFlag").checked = point.largeArcFlag;
                        pointElement.querySelector("#arc #sweepFlag").checked = point.sweepFlag;
                    } else{
                        throw new Error(`Unknown SVG Path point type: ${point.type}`);
                    }
                }
            }
            for(let [name,value] of Object.entries(svgcomponent.attributes)){
                let attr = await this.addSVGAttribute({target:element.querySelector("#attributes")});
                attr.querySelector("#attributename").value = name;
                attr.querySelector("#attributevalue").value = value;
            }
        }
        this.clearErrorState(null, "Loading");
        // NOTE- updateEquations also calls updateSVG
        this.updateEquations();
    }
}