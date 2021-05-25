# Comic Panel Navigator

## About
Comic Panel Navigator provides an interface for navigating through sections within an image. 
Taking a comic book as a reference, the app allows user to navigate through each panel (using either buttons on-screen or keyboard-input). 
> For devs using this app: A properly written data file is used to specify where the image files are located and where each panels are located within the image. 
See [here](#comic-data-file) for more details.

## Usage
### Init container to hold app (`html`)
```html
<div id="comic-and-navigator-app-entry-id"></div>
```
Create a div within html body with id set as `comic-and-navigator-app-entry-id`. Whole app is loaded within this container.

### Init app via `JavaScript`
Within your app/page, make sure to initiate a `comicPanelNavigatorApp` object within your script (JS) as shown below.
```jsx
/* App initialization example shown below */
let comicPanelApp = new comicPanelNavigatorApp( {
	"appHeight": "740px",	// height of the total app (740px normally)
	"comicDataUrl": "http://192.168.0.82/assets/data/comic-data.php"
} );

```

* `appHeight`: specify height of the panel view; `String` ending with "px"
* `comicDataUrl`: specify the url/path to file that contains all the panel data (*see [here](#comic-data-file) for more info on comic-data file*)

# <a id="comic-data-file"> </a> Comic Data file
The comic-data file typically follows JSON format. A sample comic-data file:

```json
[
  {
    "pageUrl": "https://192.168.0.82/assets/images/page01.jpg", 
        "panelData": [
            {"#":" 1","x":"25","y":"25","width":"359","height":"380"},
            {"#":" 2","x":"385","y":"21","width":"147","height":"382"}
        ] 
  }, {
  {
    "pageUrl": "https://192.168.0.82/assets/images/page02.jpg", 
        "panelData": [
            {"#":" 1","x":"25","y":"25","width":"359","height":"380"},
            {"#":" 2","x":"385","y":"21","width":"147","height":"382"}
        ] 
  }, 
  { ... }
]
```

* `pageUrl`: Path to the image file
* `panelData`: List of dictionaries containing panel data. (note: use `String`)
  * `#`: Panel name/id
  * `x`: x-coordinate of the bottom-left point of the panel
  * `y`: y-coordinate of the bottom-left point of the panel
  * `width`: width of the panel in px (Number only)
  * `height`: height of the panel in px (Number only)

# Panel Data extractor
> Not yet published (needs more refinement)

An ongoing project that provides an interface for extracting panel data. 
Web-based project where user imports page-image and manually (visually) selects panels. It allows user to create and export a `JSON` file.

# TODO list
1. Fix dependency issues (mainly Bootstrap and JQuery)
2. Check compatibility on other browsers (mainly Safari)
3. Add panel-data-extractor project (separate project)
4. Add images to this README file.

