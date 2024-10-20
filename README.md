# ParametricSVG
![](readmeimages/icon.png)

## Overview
ParametricSVG is a collection of tools built around a [Json Schema](#json-schema) defining the ParametricSVG format. The tools include:
1. An [equation evaluation](#equations) function
2. A [ParametricSVG](#parametricsvgjs) Javascript Object with a parsing function and additional properties and functions for managing SVG namespace, format, and other attributes
3. A [VSCode Extension](https://github.com/AdamantLife/ParametricSVGExtension) which automatically includes the Json Schema in your workspace and adds a Preview Window
4. A [basic GUI](#gui) for assembling and defining a PSVG file

## JSON Schema
The JSON Schema can be used to validate JSON files that will be parsed by [ParametricSVG](#parametricsvgjs) and can provide autocomplete in editors. It is included in this repository and the most recent version can also be [accessed here](https://adamantlife.github.io/parametricsvg.schema.json). The preferred filename suffixes are `{filename}.psvg.json`.

In summary, the Schema defines the following JSON Object:
* **attributes**
    * { Object containing html **attributename** : *attribute value* entries }
        * See the following subsection for a note on values
* **equations**
    * { Object containing Variable Objects whose key is the Variable's **name** }
        * Variable Objects require **name** and **value** entries
        * The **comment** and **disabled** properties as optional
        * Additional properties are disallowed
* **svgcomponents**
    * [ An Array containing Objects defining SVG Components to append to the SVG Element ]
        * All objects require **type** to be defined (e.g.- `circle`, `rect`, `path`)
            * Depending on **type**, additional properties may be required
        * **attributes** is an optional property and is an Object containing html **attribute** : *atribute value* entries which will be added to the constructed Component.
            * See the following subsection for a note on values
        * Additional properties not defined by the **type** are disallowed
* **comments**
    * [ An optional Array of strings that can be used to provided context or documentation ]

#### Attribute Values
Because Attributes sometimes include function names (*e.g.-* `transform: translate(x, y)`), Attribute values can be created using an Array of Strings. Normally `equations.evaluateEquation` would not be able to parse such a value but by using this method each individual string will be passed to `evaluateEquation` and then the results will be concatted together. For example:
```json
// viewBox = "0 0 10 10"
{
    "type": "circle",
    "x": 10,
    "y": 10,
    "r": 5,
    "attributes":{
        "transform": ["translate(", "vbw/10", " , ", "vbh/10", ")"]
    }
}
// Outputs <circle x="10" y="10" r="5" transform="translate(1 , 1)"></circle>
```

## VSCode
It is recommended that you install [the PSVG Extension](https://github.com/AdamantLife/ParametricSVGExtension) as that's the easiest way to include the Schema in VSCode (as well as having other benefits).

If you don't want to, you can modify `settings.json` to add the Schema for validation via the `json.schemas` key. This can be done per the **user** or **workspace** `settings.json` file.

![](readmeimages/vscodesettings.png)

If you have trouble locating the settings file, you can go to **Settings** (`ctrl+,`) and search for "*schema*". This will also allow you to enable automatic downloading if using the *github.io* url.
![](readmeimages/vscodesettingsenable.png)

## Equations
The provided equation parser (`evaluateEquation()` in *equations.js*) has the following constraints:
* Variable names must start with a letter or underscore and be composed of values `[a-zA-Z0-9_]`
* Variable names must be unique within an execution of `evaluateEquation`
* No circular dependencies
* Decimal points must be preceded by a digit
* Implicit multiplication is not allowed (e.g.- "2x" and "4(x+1)" are invalid and should instead be "2\*x" and "4\*(x+1)")
* Parentheses must be closed

## ParametricSVG.js
This [Javascript Object](/src/parametricsvg.js) powers the Extension and the GUI: its primary function is to take a JSON Object which adheres to the above [JSON Schema](#json-schema) and convert it into an `SVGElement` using `ParametricSVG.parseJSON()`. By default it does not have a method to evaluate equations and therefore throws an error: for this reason `evaluateEquation` is included in [equations.js](/src/equations.js). The evaluation callback can be set globally via the `ParametricSVG.evaluator` property or supplied directly to the parsing functions; callbacks provided to parsing functions will override the callback set on the `ParametricSVG` object.

The namespace PSVG uses for the `SVGElement` can be set via the `ParametricSVG.XMLNS` property. There are additional properties available for creating an XML header for saving the SVG to a file.

ParametricSVG treats `vbw` and `vbh` ("*viewbox Width*" and "*viewbox Height*", respectively) as default Variables. If `viewbox` is defined in the `attributes` property of the provided PSVG JSON Object and `vbh` and/or `vbw` are not defined in the `equations` property the missing values will be added.

## GUI
![](readmeimages/gui.png)

A simple GUI is provided as an alternative method of generating the JSON/ JSON file and SVGElement/SVG File. ***Due to its design it does not support all features of the Schema.***

The SVGElement's html code can be *copied* by `Left Clicking` the generated SVG, or *saved* to a file using `Right Click`. By holding down `Ctrl/Cmd`, the JSON file can be *copied* or *saved* (respectively) instead.

The `viewBox` can be set using the scroll wheel (the SVG's displayed size will be updated to match the `viewBox`). By default the increment/decrement rate is `100`:
  * Holding `Ctrl` while scrolling will change the rate to `50`
  * Holding `Ctrl+Shift` will result in `10`
  * While holding `Ctrl+Shift+Alt` provides a step of `1`

The `viewBox` always uses `(0,0)` as the top-left coordinate.

SVGComponents are added via widgets in the first (left) box. Variables/Equations can be included in any non-boolean values.

Variables are declared in the second (right) box. There are three input modes:

1. Widget Mode
    * Functions similarly to SVGComponents
2. Text Mode
    * Variables can be written in a textbox using the form `{"//" to disable} {Variable Name} = {Equation}; {"// [comment]" optional}`
    * Each Variable should be written on a new line
    * This mode does not provide feedback (success or error) and is intended to be a minimalist means of entering the equations.
3. Table Mode
    * Variables can be entered/managed in a tabular format where the first column is the **name**, second is **value**, third is a **disabled** checkbox, and last column is an optional **comment**

Feedback for the equations (such as success evaluation, duplicate name error, or syntax errors) are displayed depending on the input mode (except Text Mode).

## Known Issues and Limitations
For security purposes, the string **"script"** cannot appear in the JSON. This also means that the `<script>` component cannot be parsed by PSVG.

The current version of the PSVG Schema does not validate the `component.children` property. PSVG's parser will add all child components to the parent and it will be up to the browser/viewer to determine what to do with invalid child elements.

The above also means that the Schema will provide all types of SVGElement for `child.type` autocomplete.

The current version of the Schema (and consequently parametricsvg.js) does not include **Filter Elements** (e.x.- `feBlend`, `feFuncA`). This is *mostly* due to the above problem of `component.children` not being scoped appropriately: if they were included they would contribue a large number of elements to the autocomplete. When the `children` issue is resolved we will look into adding **Filter Elements**.

Check [the issues tab](https://github.com/AdamantLife/ParametricSVG/issues) for any additional issues.