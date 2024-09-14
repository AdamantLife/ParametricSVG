class SVGWidgets {
    /**
     * Constructs a new manager for SVG Widgets
     * @param {Element} parent - The parent element to populate with widgets
     */
    constructor(parent){
        this.parent = parent;
        this.parser = new DOMParser();

        /**
         * @typedef {"updated"} SVGCallbackType
         * @typedef {Map<SVGCallbackType, Function>} Callbacks
         * @type {Callbacks}
         */
        this.callbacks = {};

        this.setupParent();
    }

    async setupParent(){
        this.parent.innerHTML = "";
        this.parent.classList.add("defintions");
        let r = await fetch("src/widgets/svgwidgetparent.html");
        let html = await r.text();
        let doc = this.parser.parseFromString(html, "text/html");
        this.svgcontainer = doc.getElementById("svgwidgets");
        doc.getElementById("addsvg").addEventListener("click", e => {
            let value = document.getElementById("svgtype").value;
            this.addSVG(value);   
        });
        this.parent.append(...doc.body.children);
    }

    /**
     * Registers a callback for the given type (prepopulate or evaluated)
     * @param {SVGCallbackType} type
     * @param {Function} callback
     */
    registerCallback(type, callback){
        if (!this.callbacks[type]) this.callbacks[type] = [];
        this.callbacks[type].push(callback);
    }

    /**
     * Unregisters a callback for the given type (prepopulate or evaluated).
     * If callback is true, all callbacks for the given type will be unregistered
     * @param {SVGCallbackType} type
     * @param {Function|true} callback
     */
    unregisterCallback(type, callback){
        if (!this.callbacks[type]) return;
        if(callback === true) return this.callbacks[type] = [];
        this.callbacks[type] = this.callbacks[type].filter(cb => cb !== callback);
    }

    clearAll(){
        this.svgcontainer.innerHTML = "";
        this.notifyUpdate();
    }

    /**
     * Notifies all callbacks that the SVG has been updated
     */
    notifyUpdate(){
        let serial = this.serialize();
        if(!this.callbacks["updated"]) return;
        for(let callback of this.callbacks["updated"]){
            callback(serial);
        }
    }

    /**
     * Adds an SVG Component to the parent
     * @param {"circle" | "ellipse" | "line" | "path" | "polygon" | "polyline" | "rect"} type - The type of SVG Component to add
     * @param {Element} container - The container to add the SVG Component to
     * @returns {Element} - The SVG Component that was added
     */
    async addSVG(type, container){
        if(!["circle", "ellipse", "line", "path", "polygon", "polyline", "rect"].includes(type)) throw new Error(`Invalid type ${type}`);
        let component = await fetch(`src/widgets/svgcomponent.html`);
        let comp = await component.text();
        let doc = this.parser.parseFromString(comp, "text/html");
        let elem = doc.querySelector("div.svgcomponent");

        component = await fetch(`src/widgets/${type}.html`);
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
            SVGWidgets.setValueReset(input, this.notifyUpdate.bind(this));
        }
        elem.querySelector("hr").addEventListener("click", e=> e.target.classList.toggle("show"))
    }

    async addSVGAttribute(e){
        let parent = e.target.parentElement;
        while(!parent.classList.contains("svgcomponent") && parent.parentElement){
            parent = parent.parentElement;
        }
        if(!parent.classList.contains("svgcomponent")){
            throw new Error(`Could not find parent SVG element: ${e.target.outerHTML}`);
        }
        let attribute = await fetch(`src/widgets/attribute.html`);
        let ele = await attribute.text();
        let doc = this.parser.parseFromString(ele, "text/html");
        let elem = doc.querySelector("div.attribute");
        let nameinput = elem.querySelector("#attributename");
        let input = elem.querySelector("#attributevalue");
        SVGWidgets.setValueReset(nameinput, this.notifyUpdate.bind(this));
        SVGWidgets.setValueReset(input, this.notifyUpdate.bind(this));
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
            let resp = await fetch(`src/widgets/pathpoints.html`);
            let ele = await resp.text();
            let doc = this.parser.parseFromString(ele, "text/html");
            point = doc.querySelector("div.point");
            container.append(point);
            SVGWidgets.setupPathPoints(point, this.updateSVG.bind(this));
        }else{
            container = elem.querySelector("#points");
            let resp = await fetch(`src/widgets/polypoints.html`);
            let ele = await resp.text();
            let doc = this.parser.parseFromString(ele, "text/html");
            point = doc.querySelector("div.point");
            container.append(point);
            SVGWidgets.setValueReset(point.querySelector("#x"), this.notifyUpdate.bind(this));
            SVGWidgets.setValueReset(point.querySelector("#y"), this.notifyUpdate.bind(this));
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
        input.addEventListener("keyup", SVGWidgets.handleInputKeyPress)
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
            SVGWidgets.setValueReset(point.querySelector(selector), valueChangeHandler);
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
     * Serializes the current state of the SVG
     * @returns {SVGDescription[]} - An array of Serialized SVG components
     */
    serialize(){
        /** @type {SVGDescription[]} */
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
    /**
     * Serializes a circle widget
     * @param {Element} element - The element to parse
     * @returns {CircleDescription}
     */
    serializeCircle(element){
        let out = {type: "circle"};
        out.attributes = this.serializeAttributes(element);
        out.cx = element.querySelector("#cx").value;
        out.cy = element.querySelector("#cy").value;
        out.r = element.querySelector("#r").value;
        return out;
    }

    /**
     * Serializes an ellipse widget
     * @param {Element} element - The element to parse
     * @returns {EllipseDescription}
     */
    serializeEllipse(element){
        let out  = {type: "ellipse"};
        out.attributes = this.serializeAttributes(element);
        out.cx = element.querySelector("#cx").value;
        out.cy = element.querySelector("#cy").value;
        out.rx = element.querySelector("#rx").value;
        out.ry = element.querySelector("#ry").value;
        return out;
    }

    /**
     * Serializes a rect widget
     * @param {Element} element - The element to parse
     * @returns {RectDescription}
     */
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

    /**
     * Serializes a line widget
     * @param {Element} element - The element to parse
     * @returns {LineDescription}
     */
    serializeLine(element){
        let out = {type: "line"};
        out.attributes = this.serializeAttributes(element);
        out.x1 = element.querySelector("#x1").value;
        out.y1 = element.querySelector("#y1").value;
        out.x2 = element.querySelector("#x2").value;
        out.y2 = element.querySelector("#y2").value;
        return out;
    }

    /**
     * Serializes a polygon widget
     * @param {Element} element - The element to parse
     * @returns {PolygonDescription}
     */
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

    /**
     * Serializes a polyline widget
     * @param {Element} element - The element to parse
     * @returns {PolylineDescription}
     */
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

    /**
     * Serializes a path widget
     * @param {Element} element - The element to parse
     * @returns {PathDescription}
     */
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
        this.notifyUpdate();
    }
}