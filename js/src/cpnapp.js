/**
 * TODO: 
 * 1. whole page view (partially done)
 * 2. Add help(guide) interface within page (...DONE)
 * 3. fix tooltip (bootstrap tooltip isn't guaranteed to work on hidden elements)
 * 4. not important atm; Padding in panels
 * 5. soft-code hardcoded lines: within "createNavigationElem()",
 *  const navigationHandlerName = "state.panelNavigatorHandler";
 * 6. (IMPORTANT) Load new pages (preferably via URLs not local path)
 * 7. Mouse-click on panel (in full page view) to get to panel feature (Very user friendly)
 * 8. have page-turn like effect when page is turned/changed (visual indication of page turn)
 * 9. implement settings feature (+ select app height etc.)
 */

"use strict";

/* elements' ID list: dictates what to name each DOM elements */
let elementIDs = {
	"appEntry": "#comic-and-navigator-app-entry-id",
	"navigatorWrapper": "#navigator-wrapper-id",
	"inputNavigatorWrapper": "#input-navigator-wrapper-id",
	"inputNavigator": "#input-navigator-id",
	"symbolNavigator": "#symbol-navigator-id",
	"currentPanelIndicatorWrapper": "#current-panel-indicator-wrapper-id",
	"currentPanelIndicator": "#current-panel-indicator-id",
	"panelDisplayWrapper": "#panel-display-wrapper-id",
	"panelDisplayImageHolder": "#panel-display-image-holder-id",
	"panelDisplayImage": "#panel-display-image-id",
	"showHelpModalButton": "#show-help-modal-btn-id",
	"helpModalWrapper": "#help-modal-wrapper-id",
	"helpModal": "#help-modal-id",
	"openHelpModalBtn": "#open-help-modal-button-id"
};

let state = {
	"appHeight": "790px",	// height of the total app (740px normally)
	"panelNavigatorHandler": undefined,
	"navigationElem": undefined,
	"currentPanelIndicatorWrapperElem": undefined,
	"panelDisplayWrapperElem": undefined,
	"helpModalElem": undefined,
	"comicData": {
		"title": "",
		"author": "",
		"currentPageIdx": 0,
		"pages": []
	},
	"globalFunctions": {
		"getVariableName": undefined,	// pass variable within { ... }
		"getElementId": undefined,
		"appendElementObjectToDOM": undefined,
		"gotoPage": undefined,
		"gotoPreviousPage": undefined,
		"gotoNextPage": undefined,
		"checkAndReturnPageIdx": undefined
	},
	"symbolCodesForNavigator": { 
		"gotoPrevPage": "<i class='fas fa-step-backward'></i>",
		"gotoFirstPanel": "<i class='fas fa-2x fa-angle-double-left'></i>",
		"gotoPrevPanel": "<i class='fas fa-2x fa-arrow-circle-left'></i>",
		"viewWholePage": "<i class='fas fa-compress'></i>",
		"gotoNextPanel": "<i class='fas fa-2x fa-arrow-circle-right'></i>",
		"gotoFinalPanel": "<i class='fas fa-2x fa-angle-double-right'></i>",		
		"gotoNextPage": "<i class='fas fa-step-forward'></i>",
		"info": "<i class='fas fa-2x fa-info-circle'></i>",
		"gotoPrevPage2x": "<i class='fas fa-2x fa-step-backward'></i>",
		"gotoNextPage2x": "<i class='fas fa-2x fa-step-forward'></i>",
		"viewWholePage2x": "<i class='fas fa-2x fa-compress'></i>"
	}, 
	"navigatorBtnId": { 
		"gotoPrevPage": "nav-prev-page-btn-id",
		"gotoFirstPanel": "nav-first-panel-btn-id",
		"gotoPrevPanel": "nav-prev-panel-btn-id",
		"viewWholePage": "nav-full-page-btn-id",
		"gotoNextPanel": "nav-next-panel-btn-id",
		"gotoFinalPanel": "nav-final-panel-btn-id",
		"gotoNextPage": "nav-next-page-btn-id"
	}
};

function initGlobalState() {
	state.globalFunctions.getVariableName = function (variableObject) {
		return Object.keys(variableObject)[0];
	}

	/**
	 * Returns element id without '#' at the front; 
	 * TODO: maybe function name too similar to getElementById ???
	 * @param {String} componentName Name of the component whose 'id' is to be found
	 * @return {String} Element id without '#' at the beginning
	 */
	state.globalFunctions.getElementId = function (componentName) {
		return elementIDs[componentName].substr(1);
	}

	/**
	 * Appends elemenObject to the element identified by given parentDomId as child element.
	 * @param {String} parentDomId Id of parent element to where new element is to appended
	 * @param {*} elementObject HTML element object
	 */
	state.globalFunctions.appendElementObjectToDOM = function (parentDomId, elementObject) {
		let parentElem = document.getElementById(parentDomId);
		parentElem.appendChild(elementObject);
	}

	state.globalFunctions.checkAndReturnPageIdx = function (pageIdx) {
		// check if page index is an acceptable value
		if (pageIdx < 0) { pageIdx = 0; }
		if (pageIdx > state.comicData.pages.length - 1) { pageIdx = state.comicData.pages.length - 1;}	// can be else if
		return pageIdx;
	}

	state.globalFunctions.gotoPage = function (pageIdx) {
		state.comicData.currentPageIdx = state.globalFunctions.checkAndReturnPageIdx(pageIdx);
		state.panelNavigatorHandler.currentPanelIdx = 0;
		state.panelNavigatorHandler.loadNewPage(state.comicData.pages[state.comicData.currentPageIdx]);
		state.panelNavigatorHandler.state.fullPageRequested = false;
		state.panelNavigatorHandler.currentPanel.reset();
		state.panelNavigatorHandler.gotoFirstPanel();
	}

	state.globalFunctions.gotoPreviousPage = function () {
		let newPageIdx = state.comicData.currentPageIdx - 1;
		state.globalFunctions.gotoPage(newPageIdx);
	}

	state.globalFunctions.gotoNextPage = function () {
		let newPageIdx = state.comicData.currentPageIdx + 1;
		if (newPageIdx < state.comicData.pages.length) {
			// goto new page only if next page exists
			state.globalFunctions.gotoPage(newPageIdx);
		}
	}
};

class Block {
	constructor(elementID) {
		this.state = {
			"elementID": elementID,
			"DOMHtml": "",
			"DOMTriggers" : {},
			"DOMCss" : {},
			"DOMClasses": {}
		};
	};

	set DOMHtml(htmlString) {this.state.DOMHtml = htmlString;};
	set DOMTriggers(DOMTriggers) {this.state.DOMTriggers = DOMTriggers;};
	set DOMCss(DOMCss) {this.state.DOMCss = DOMCss;};
	set DOMClasses(DOMClasses) {this.state.DOMClasses = DOMClasses;};

	get elementID() { return this.state.elementID;};
	get DOMHtml() { return this.state.DOMHtml;};
	get DOMTriggers() { return this.state.DOMTriggers;};
	get DOMCss() { return this.state.DOMCss; };
	get DOMCssAsString() {	// parse this.DOMCss as string
		let cssAsString = "";
		for (let cssProperty in this.DOMCss) {
			cssAsString += `${cssProperty}: ${this.DOMCss[cssProperty]};`;
		}
		return cssAsString;
	}
	get DOMClasses() {return this.state.DOMClasses;};

	createElementObjectFromBlock() {
		let blockElem = document.createElement("DIV");
		blockElem.setAttribute("id", this.elementID);
		blockElem.setAttribute("class", this.DOMClasses);
		blockElem.setAttribute("style", this.DOMCssAsString);
		blockElem.innerHTML = this.DOMHtml;
		return blockElem;
	}
}

class PanelDisplay {
	constructor(panelData) {
		this.state = {
			"panelData": {...panelData},
			"panelOriginalData": {...panelData},	// copy content DONT assign directly (pointer seems the same)
			"pageData": {"width": 0, "height": 0, "naturalWidth": 0, "naturalHeight": 0, "pageIdx": 0},
			"targetHeight": 650,	// minimum/target height for each panel (in px)
			"maxWidth": 1200,	// max width allowed (in px)
			"padding": 32	// in px; NOT implemented yet
		};
		// normal windows laptop screen res: 1366 x 768
		let imageElem = document.getElementById(state.globalFunctions.getElementId("panelDisplayImage"));
		imageElem.onload = (function (thisPanelDataObj) {
			return function(e) {
				// update pageData within 'this' PanelDisplay object
				thisPanelDataObj.state.pageData.width = this.naturalWidth;
				thisPanelDataObj.state.pageData.height = this.naturalHeight;
				thisPanelDataObj.state.pageData.naturalWidth = this.naturalWidth;
				thisPanelDataObj.state.pageData.naturalHeight = this.naturalHeight;
				thisPanelDataObj.changeDimensions();
			};
		})(this);
	}
	reset() {
		this.state.panelData = {...this.state.panelOriginalData};
		this.changeDimensions();
	}
	update(panelData) { // only used when panel dimension is modified e.g. zoom in etc
		this.state.panelData = {...panelData};
		this.state.panelOriginalData = {...panelData};
		this.changeDimensions();
	}
	changeDimensions() {
		let imageHolderElem = document.getElementById(state.globalFunctions.getElementId("panelDisplayImageHolder"));
		let imageElem = document.getElementById(state.globalFunctions.getElementId("panelDisplayImage"));

		this.state.panelData.height = this.state.targetHeight;
		let scaleFactor = parseFloat(this.state.panelData.height) / parseFloat(this.state.panelOriginalData.height);

		// check if new panel width fits into viewport
		let widthOverflowDetected = (this.state.panelOriginalData.width * scaleFactor) > this.state.maxWidth;
		if (widthOverflowDetected) { 
			// recalculate dimensions (now based on 'width') so that new panel fits within viewport width
			scaleFactor = parseFloat(this.state.maxWidth) / parseFloat(this.state.panelOriginalData.width);
		}

		this.state.panelData.width = (parseFloat(this.state.panelOriginalData.width) * scaleFactor).toString();
		this.state.panelData.height = (parseFloat(this.state.panelOriginalData.height) * scaleFactor).toString();

		imageHolderElem.style.width = `${this.state.panelData.width}px`;
		imageHolderElem.style.height = `${this.state.panelData.height}px`;

		// magnifying image itself
		imageElem.width = this.state.pageData.naturalWidth * scaleFactor;
		imageElem.height = this.state.pageData.naturalHeight * scaleFactor;

		// offsetting image move/translate values
		let newTranslateOffsetX = parseFloat(this.state.panelOriginalData.x) * scaleFactor;
		let newTranslateOffsetY = parseFloat(this.state.panelOriginalData.y) * scaleFactor;
		this.state.panelData.x = newTranslateOffsetX.toString();
		this.state.panelData.y = newTranslateOffsetY.toString();
	};
}

// only instantiate after all DOM is created and loaded
class PanelNavigatorHandler {
	constructor(panelLocationsAsList) {
		this.state = {
			"panelDisplayWrapperElemId": state.globalFunctions.getElementId("panelDisplayWrapper"),
			"panelDisplayImageHolderElemId": state.globalFunctions.getElementId("panelDisplayImageHolder"),
			"panelDisplayImageElemId": state.globalFunctions.getElementId("panelDisplayImage"),
			"navigatorWrapper": state.globalFunctions.getElementId("navigatorWrapper"),
			"inputNavigator": state.globalFunctions.getElementId("inputNavigator"),
			"currentPanelIndicatorWrapper": state.globalFunctions.getElementId("currentPanelIndicatorWrapper"),
			"currentPanelIndicator": state.globalFunctions.getElementId("currentPanelIndicator"),
			"panelLocations" : panelLocationsAsList,
			"currentPanelIdx": 0,
			"currentPanel": undefined,
			"navigatorIsBeingUsed": false,
			"fullPageIdxCode": -100,	// when panelIdx === this value, it means a full page view is requested
			"fullPageRequested": false
		}; 
		this.initAutoHideTrigger();
		this.initKeepNavigatorDisplayedTrigger();
		this.state.currentPanel = new PanelDisplay(this.state.panelLocations[0]);
		this.gotoFirstPanel();
	}

	get currentPanel() {return this.state.currentPanel;}

	loadNewPage(comicDataForCurrentPage) {
		let imageElem = document.getElementById(this.state.panelDisplayImageElemId);
		imageElem.src = comicDataForCurrentPage.pageUrl;	// change image src within image element
		this.state.panelLocations = comicDataForCurrentPage.panelData;
		this.state.currentPanelIdx = 0;	
		this.state.currentPanel = new PanelDisplay(this.state.panelLocations[0]);
		this.gotoFirstPanel();
	}

	updateCurrentPanel(newPanelIdx) {
		this.state.currentPanelIdx = this.checkPanelIdx(newPanelIdx);

		if (this.state.fullPageRequested) {
			let fullPageAsPanelData = {...this.state.panelLocations[0]};
			fullPageAsPanelData.x = "0";
			fullPageAsPanelData.y = "0";
			fullPageAsPanelData.width = this.state.currentPanel.state.pageData.naturalWidth;
			fullPageAsPanelData.height = this.state.currentPanel.state.pageData.naturalHeight;
			this.state.currentPanel.update(fullPageAsPanelData);
		} else {
			this.state.currentPanel.update(this.state.panelLocations[this.state.currentPanelIdx]);
		}
		
		// change panel indicator
		let indicatorElem = document.getElementById(this.state.currentPanelIndicator);
		if (indicatorElem) {
			let newIndicatorText = "Page " + (state.comicData.currentPageIdx + 1) + " | Panel ";
			newIndicatorText += (this.state.currentPanelIdx + 1).toString();
			indicatorElem.innerText = newIndicatorText;
		}
		// change input indicator
		let inputElem = document.getElementById(this.state.inputNavigator);
		if (inputElem) {
			inputElem.value = this.state.currentPanelIdx + 1;
		}
	};
	checkPanelIdx(panelIdx) {
		let newCurrentPageIdx = 0;
		let oldCurrentPageIdx = 0;
		// filter bad panelIdx values
		if ( (panelIdx < 0) || (typeof(panelIdx) === "undefined") ) { 
			// by this point, previous panel was requested while on the first panel, 
			// so it is assumed that the user wants to goto the previous page
			oldCurrentPageIdx = state.comicData.currentPageIdx;
			state.globalFunctions.gotoPreviousPage();
			newCurrentPageIdx = state.comicData.currentPageIdx;
			if (oldCurrentPageIdx === newCurrentPageIdx) {
				// this means that page hasn't changed, so dont change panel
				panelIdx = 0;
			} else {
				// new page has changed, so move to the first panel
				panelIdx = this.state.panelLocations.length - 1;
			}
		} 
		if (panelIdx > this.state.panelLocations.length - 1) {
			// goto new page if panelIdx exceeds panel count; MAYBE have option to either
			// a. goto new page automatically OR
			// b. stay in the same page 
			//    BUT make sure: panelIdx = this.state.panelLocations.length - 1; 
			//    to avoid panel list overflow with the new index
			oldCurrentPageIdx = state.comicData.currentPageIdx;
			state.globalFunctions.gotoNextPage();
			newCurrentPageIdx = state.comicData.currentPageIdx;
			if (oldCurrentPageIdx === newCurrentPageIdx) {
				// this means that page hasn't changed, so dont change panel
				panelIdx = this.state.panelLocations.length - 1;
			} else {
				// new page has changed, so move to the first panel
				panelIdx = 0;
			}
		}
		return panelIdx;
	};
	moveToPosition(offsetX, offsetY) {
		let padding = parseInt(this.currentPanel.state.padding);
		//let paddingCompensatedWidth = parseInt(offsetX) - padding;
		//let paddingCompensatedHeight = parseInt(offsetY) - padding;
		let imageElem = document.getElementById(this.state.panelDisplayImageElemId);
		if (imageElem) {
			imageElem.style.transform = `translate(-${offsetX}px, -${offsetY}px)`;
		}
	}
	gotoPanel(panelIdx) {
		this.updateCurrentPanel(panelIdx);
		this.moveToPosition(this.currentPanel.state.panelData.x, this.currentPanel.state.panelData.y);
	};
	gotoPanelViaInput() {
		// find number in input form first 
		let inputElem = document.getElementById(this.state.inputNavigator);
		if (inputElem) {
			let requestedPanelIdx = inputElem.value - 1;
			this.gotoPanel(requestedPanelIdx);
		}
	};
	gotoFirstPanel() {
		this.state.fullPageRequested = false;
		this.gotoPanel(0);
	};
	gotoPrevPanel() {
		this.state.fullPageRequested = false;
		let newPanelIdx = this.state.currentPanelIdx - 1;
		this.gotoPanel(newPanelIdx);
	};
	gotoNextPanel() {
		this.state.fullPageRequested = false;
		let newPanelIdx = this.state.currentPanelIdx + 1;
		this.gotoPanel(newPanelIdx);
	};
	gotoFinalPanel() {
		this.state.fullPageRequested = false;
		this.gotoPanel(this.state.panelLocations.length - 1);
	};
	gotoFullPageView() {
		this.state.fullPageRequested = !(this.state.fullPageRequested);	// flag this to true on 'this' scope 
		this.gotoPanel(this.state.currentPanelIdx);	// !IMP: fullPageIdxCode indicates it is a full page view panel
	};
	initAutoHideTrigger() {
		var selfHandlerObj = this;	// handler MUST be in scope for mouse events below
		let navigatorWrapperElem = document.getElementById(this.state.navigatorWrapper);
		let currentPanelIndicatorWrapperElem = document.getElementById(this.state.currentPanelIndicatorWrapper);
		let imageElem = document.getElementById(this.state.panelDisplayImageElemId);
		imageElem.onmousemove = function(event) {
			// show navigator when mouse pointer is moved inside the panel display element
			// BUT hide it after certain time e.g. 2sec or 2000ms
			if (navigatorWrapperElem.style.display) {
				setTimeout(function() {
					if ( !(selfHandlerObj.state.navigatorIsBeingUsed) ) { navigatorWrapperElem.style.display = "none";}
				}, 2000);
			}
			if (currentPanelIndicatorWrapperElem.style.display) {
				setTimeout(function() {
					if ( !(selfHandlerObj.state.navigatorIsBeingUsed) ) { currentPanelIndicatorWrapperElem.style.display = "none"; }
				}, 2000);
			}
			navigatorWrapperElem.style.display = "";
			currentPanelIndicatorWrapperElem.style.display = "";
		};
	}
	initKeepNavigatorDisplayedTrigger() {
		var selfHandlerObj = this;	// handler MUST be in scope for mouse events below
		let navigatorWrapperElem = document.getElementById(this.state.navigatorWrapper);
		let currentPanelIndicatorWrapperElem = document.getElementById(this.state.currentPanelIndicatorWrapper);
		navigatorWrapperElem.onmouseover = function(event) {
			// show navigator when mouse pointer is within navigator element
			selfHandlerObj.state.navigatorIsBeingUsed = true;
			if (navigatorWrapperElem.style.display) { navigatorWrapperElem.style.display = ""; }
			if (currentPanelIndicatorWrapperElem.style.display) { currentPanelIndicatorWrapperElem.style.display = ""; }
		};
		navigatorWrapperElem.onmouseout = function(event) {
			// hide navigator when mouse pointer is out of nvaigator element
			selfHandlerObj.state.navigatorIsBeingUsed = false;
			if (navigatorWrapperElem.style.display === '') { navigatorWrapperElem.style.display = "none"; }
			if (currentPanelIndicatorWrapperElem.style.display === '') { currentPanelIndicatorWrapperElem.style.display = "none"; }
		};
	}
};

/**
 * DataParser class contains methods to parse data into suitable formats
 */
class DataParser {
	constructor() {}
	/** 
	 * Returns Array of panel-data from a JSON object 
	 * @param {JSON} jsonObj JSON object to parse
	 * @return {Array} the JSON obj as an Array
	 */
	parseListFromJson(jsonObj) {
		let keyList = Object.keys(jsonObj);
		let panelCount = keyList.length;
		let panelDataArr = new Array(panelCount);
		for (let idx = 0; idx < panelCount; ++idx) {
			panelDataArr[idx] = jsonObj[keyList[idx]];
		}
		return panelDataArr;
	}

	/** 
	 * Return panel-data from a stringified JSON
	 * @param {String} jsonString data as string
	 * @return {Array} the panel-data parsed from the provided string
	 */
	parsePanelDataFromString(jsonString) {
		let jsonObj = JSON.parse(jsonString);
		let panelData = this.parseListFromJson(jsonObj);
		return panelData;
	}
}

function createNavigationElem() {
	let navigationBlock = new Block(state.globalFunctions.getElementId("navigatorWrapper"));
	navigationBlock.DOMCss = { 
		"display": "none",	// hide whole block
		"width": "100%",
		"position": "absolute",
		"left": "0%",
		//"background-color": "rgba(0,0,0,0.5)",
		"background-image": "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.3), rgba(0,0,0,0.5), rgba(0,0,0,0.7))",
		"overflow": "hidden",
		"text-shadow": "-1px -1px 0 #000, 1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000",	// sharpens icons
		"z-index": "5"
	};
	navigationBlock.DOMClasses = "row no-gutters pt-1";
	const navigationHandlerName = "state.panelNavigatorHandler";	// name of the handler object; handler should be created after DOM is created

	navigationBlock.DOMHtml = 
	`<div class="container-fluid no-gutters">
		<div id="${state.globalFunctions.getElementId("inputNavigatorWrapper")}" class="row no-gutters justify-content-center"> 
			<form class="form-inline" style="display: none">
				<div class="form-group row mx-sm-3 mb-2">
					<input type="number" class="form-control" id="${state.globalFunctions.getElementId("inputNavigator")}" value="1" placeholder="Panel">	
				</div>
				<button type="button" class="btn btn-primary mb-2 form-control" onclick="${navigationHandlerName}.gotoPanelViaInput()"> Goto Panel </button>
			</form>
		</div>
		<div id="${state.globalFunctions.getElementId("symbolNavigator")}" class="row no-gutters justify-content-center">
			<form class="form-inline">
				<button id="${state.navigatorBtnId.gotoPrevPage}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to Previous Page (Shift + &larr;)"> ${state.symbolCodesForNavigator.gotoPrevPage} </button>
				<button id="${state.navigatorBtnId.gotoFirstPanel}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to First Panel (home)"> ${state.symbolCodesForNavigator.gotoFirstPanel} </button> &nbsp;
				<button id="${state.navigatorBtnId.gotoPrevPanel}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to Previous Panel (&larr;)"> ${state.symbolCodesForNavigator.gotoPrevPanel} </button> &nbsp;
				<button id="${state.navigatorBtnId.viewWholePage}" type="button" class="btn btn-lg mb-2 text-light"  data-toggle="tooltip" title="View Whole Page (f)"> ${state.symbolCodesForNavigator.viewWholePage}</button>
				<button id="${state.navigatorBtnId.gotoNextPanel}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to Next Panel (&rarr;)"> ${state.symbolCodesForNavigator.gotoNextPanel} </button> &nbsp;
				<button id="${state.navigatorBtnId.gotoFinalPanel}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to Final Panel (end)"> ${state.symbolCodesForNavigator.gotoFinalPanel} </button>
				<button id="${state.navigatorBtnId.gotoNextPage}" type="button" class="btn btn-lg mb-2 text-light" data-toggle="tooltip" title="Go to Next Page (Shift + &rarr;)"> ${state.symbolCodesForNavigator.gotoNextPage} </button>
			</form>
		</div>
	</div>`;
	let navigationElem = navigationBlock.createElementObjectFromBlock();
	return navigationElem;
}

function createCurrentPanelIndicatorWrapperElem() {
	let currentPanelIndicatorWrapperBlock = new Block(state.globalFunctions.getElementId("currentPanelIndicatorWrapper"));
	currentPanelIndicatorWrapperBlock.DOMCss = { 
		"z-index": "4",
		"display": "none",
		"position": "absolute",
		"overflow": "hidden"
	};
	currentPanelIndicatorWrapperBlock.DOMClasses = "row no-gutters h4 justify-content-center text-white";
	currentPanelIndicatorWrapperBlock.DOMHtml = `<span id="${state.globalFunctions.getElementId("currentPanelIndicator")}"> - </span>`;
	let currentPanelIndicatorWrapperElem = currentPanelIndicatorWrapperBlock.createElementObjectFromBlock();
	return currentPanelIndicatorWrapperElem;
}

function createPanelDisplayWrapperElem(imageUrl) {
	let panelDisplayWrapperBlock = new Block(state.globalFunctions.getElementId("panelDisplayWrapper")); 
	panelDisplayWrapperBlock.DOMClasses = "row no-gutters justify-content-center pt-5";
	let panelDisplayImageStyle = "z-index: 1;transition-duration: 0.5s; transition-timing-function: ease-in;";	// set animation for panel transition
	let panelDisplayImageHolderStyle = 
		`overflow: hidden; 
		z-index: 5;
		${panelDisplayImageStyle};`// set animation for panel transition
		//border-radius: 2em;`;		// to enable rounded corners for panel
	panelDisplayWrapperBlock.DOMHtml = 
	`<div id="${state.globalFunctions.getElementId("panelDisplayImageHolder")}" style="${panelDisplayImageHolderStyle}">
		<img 
			id="${state.globalFunctions.getElementId("panelDisplayImage")}" 
			class="no-resize"
			src="${imageUrl}"
			style="${panelDisplayImageStyle}"
			width="auto" >
	</div>`;
	let panelDisplayWrapperElem = panelDisplayWrapperBlock.createElementObjectFromBlock();
	return panelDisplayWrapperElem;
}

function createHelpModalElem() {
	let helpModalBlock = new Block(state.globalFunctions.getElementId("helpModalWrapper"));
	helpModalBlock.DOMCss = {};
	helpModalBlock.DOMClasses = "";
	let useSerifStyle = "font-family: serif;";
	helpModalBlock.DOMHtml = 
	`<form class="form-inline">
		<button type="button" class="btn btn-lg mb-2 text-light" title="Show help" data-toggle="modal" 
			id="${state.globalFunctions.getElementId("openHelpModalBtn")}" 
			data-target="#${state.globalFunctions.getElementId("helpModal")}"
			style="position:fixed; bottom: 0; z-index: 6;">
			${state.symbolCodesForNavigator.info} 
		</button>
	</form>
	<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="Help" aria-hidden="true"
		id="${state.globalFunctions.getElementId("helpModal")}" >
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">How to use Comic Viewer?</h5>
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<p> You can use the viewer either through your mouse or your keyboard. </p>
					<div class="card">
						<div class="card-header text-center">
							Using your keyboard <i class="far fa-keyboard"></i>
						</div>
						<div class="card-body">
							<p class="card-text"> 
								You can navigate through panels using your keyboard. Here are some useful keys: 
								<dl class="row">
									<dt class="col-sm-3"> Left Arrow </dt> <dd class="col-sm-9"> Go to previous panel.</dd>
									<dt class="col-sm-3"> Right Arrow </dt> <dd class="col-sm-9"> Go to next panel.</dd>
									<dt class="col-sm-3"> Home key </dt> <dd class="col-sm-9"> Go to the first panel.</dd>
									<dt class="col-sm-3"> End key </dt> <dd class="col-sm-9"> Go to the final panel.</dd>
									<dt class="col-sm-3"> Shift + Left Arrow </dt> <dd class="col-sm-9"> Go to previous page.</dd>
									<dt class="col-sm-3"> Shift + Right Arrow </dt> <dd class="col-sm-9"> Go to next page.</dd>
									<dt class="col-sm-3" style="${useSerifStyle}"> F </dt> <dd class="col-sm-9"> Toggle full page view. </dd>
									<dt class="col-sm-3" style="${useSerifStyle}"> I </dt> <dd class="col-sm-9"> Open (and close) this help box. </dd>
								</dl>
							</p>
						</div>
					</div>
					<div class="card">
						<div class="card-header text-center">
							Using your mouse <i class="fas fa-mouse"></i>
						</div>
						<div class="card-body">
							<p class="card-text"> 
								Hover the mouse pointer over the panel to bring up the panel navigator menu. 
								Each button is explained below.
								<dl class="row">
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoFirstPanel}  </dt> <dd class="col-sm-9"> Go to the first panel. </dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoPrevPanel} </dt> <dd class="col-sm-9"> Go to previous panel.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoNextPanel} </dt> <dd class="col-sm-9"> Go to next panel.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoFinalPanel} </dt> <dd class="col-sm-9"> Go to the final panel.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoPrevPage2x} </dt> <dd class="col-sm-9"> Turn to previous page.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.gotoNextPage2x} </dt> <dd class="col-sm-9"> Turn to next page.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.viewWholePage2x} </dt> <dd class="col-sm-9"> Toggle full page view.</dd>
									<dt class="col-sm-3"> ${state.symbolCodesForNavigator.info} </dt> <dd class="col-sm-9"> Open (and close) this help box. </dd>
								</dl>
							</p>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<div class="card-footer text-muted">
						<span class="text-info"> Note 1: </span> <small> The panel navigator menu will disappear after about 2 seconds of mouse inactivity. Move the pointer again to bring up the menu.
						However, keeping the pointer on the menu itself will prevent it from disappearing automatically. </small>
					</div>
					<div class="card-footer text-muted">
						<span class="text-info"> Note 2: </span> <small> Going to previous panel while on the first panel of the page will take 
						you to the last panel of the previous page (if any). Similarly, going to the next panel while on the last panel 
						of the page, will take you to the first panel of the next page (if any). </small>
					</div>
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
					<button type="button" class="btn btn-primary" title="TODO: link to help page">More info </button>
				</div>
			</div>
		</div>
	</div>`;
	let helpModalElem = helpModalBlock.createElementObjectFromBlock();
	helpModalElem.tablIndex = "-1";
	return helpModalElem;
}

/* --------------------- */
/* only for debug: START */
/* --------------------- */
const bgImageSrc = "./assets/images/bg1.png"; 
const imageUrl0 = "./assets/images/comic-canvas.png";
/* 'comic-canvas.png' */
const blankPanelJSONString = `[
	{"x": "5", "y": "5", "width": "510", "height": "300"},
	{"x": "535", "y": "5", "width": "530", "height": "300"},
	{"x": "10", "y": "330", "width": "340", "height": "450"},
	{"x": "370", "y": "330", "width": "695", "height": "225"},
	{"x": "370", "y": "570", "width": "700", "height": "205"},
	{"x": "10", "y": "800", "width": "550", "height": "395"},
	{"x": "570", "y": "800", "width": "495", "height": "260"},
	{"x": "10", "y": "1210", "width": "265", "height": "400"},
	{"x": "290", "y": "1200", "width": "265", "height": "390"},
	{"x": "570", "y": "1075", "width": "495", "height": "520"}
]`;

const imageUrl1 = "http://192.168.0.67/assets/images/cat-man(comicbookplus)_page60.jpg";
const imageUrl2 = "http://192.168.0.67/assets/images/cat-man(comicbookplus)_page61.jpg";
const imageUrl3 = "http://192.168.0.67/assets/images/cat-man(comicbookplus)_page62.jpg";
/* cat man comics (src: comicbookplus website) */
const comicJSONStringP60 = `[
	{"#":" 1","x":"25","y":"25","width":"359","height":"380"},
	{"#":" 2","x":"385","y":"21","width":"147","height":"382"},
	{"#":" 3","x":"544","y":"16","width":"329","height":"385"},
	{"#":" 4","x":"16","y":"413","width":"373","height":"390"},
	{"#":" 5","x":"408","y":"420","width":"465","height":"383"},
	{"#":" 6","x":"30","y":"814","width":"316","height":"387"},
	{"#":" 7","x":"346","y":"813","width":"191","height":"392"},
	{"#":" 8","x":"543","y":"811","width":"331","height":"397"}
]`;
const comicJSONStringP61 = `[
	{"#":" 1","x":"30","y":"19","width":"565","height":"395"},
	{"#":" 2","x":"599","y":"21","width":"277","height":"396"},
	{"#":" 3","x":"24","y":"425","width":"363","height":"427"},
	{"#":" 4","x":"394","y":"423","width":"483","height":"392"},
	{"#":" 5","x":"29","y":"858","width":"122","height":"358"},
	{"#":" 6","x":"159","y":"860","width":"275","height":"358"},
	{"#":" 7","x":"448","y":"814","width":"430","height":"405"}
]`;

const comicJSONStringP62 = `[
	{"#":" 1","x":"29","y":"22","width":"359","height":"393"},
	{"#":" 2","x":"384","y":"21","width":"503","height":"409"},
	{"#":" 3","x":"28","y":"428","width":"555","height":"394"},
	{"#":" 4","x":"586","y":"432","width":"305","height":"398"},
	{"#":" 5","x":"19","y":"827","width":"447","height":"410"},
	{"#":" 6","x":"465","y":"824","width":"417","height":"420"}
]`;
/* cat man comics (src: comicbookplus website) */

const comicData = `[
	{"pageUrl": "${imageUrl1}", "panelData": ${comicJSONStringP60} },
	{"pageUrl": "${imageUrl2}", "panelData": ${comicJSONStringP61} },
	{"pageUrl": "${imageUrl3}", "panelData": ${comicJSONStringP62} }
]`;

/* ------------------- */
/* only for debug: END */
/* ------------------- */

function initAppEntryElem() {
	let appEntryElem = document.getElementById(state.globalFunctions.getElementId("appEntry"));
	appEntryElem.className = "container-fluid no-gutters py-2";
	appEntryElem.style.width = "100%";
	//appEntryElem.style.backgroundImage = `url('${bgImageSrc}')`;	// uncomment for background image
	appEntryElem.style.backgroundColor = "#111111";
	appEntryElem.style.height = state.appHeight;
}

function initDivs() {
	initAppEntryElem();
	state.navigationElem = createNavigationElem();
	state.currentPanelIndicatorWrapperElem = createCurrentPanelIndicatorWrapperElem();
	state.panelDisplayWrapperElem = createPanelDisplayWrapperElem(state.comicData.pages[state.comicData.currentPageIdx].pageUrl);
	state.helpModalElem = createHelpModalElem();
	state.globalFunctions.appendElementObjectToDOM(state.globalFunctions.getElementId("appEntry"), state.navigationElem);
	state.globalFunctions.appendElementObjectToDOM(state.globalFunctions.getElementId("appEntry"), state.currentPanelIndicatorWrapperElem);
	state.globalFunctions.appendElementObjectToDOM(state.globalFunctions.getElementId("appEntry"), state.panelDisplayWrapperElem);
	state.globalFunctions.appendElementObjectToDOM(state.globalFunctions.getElementId("appEntry"), state.helpModalElem);
}

/**
 * Parse and return data into suitable format (i.e. a list usually)
 */
function initData(jsonString) {
	let dataParser = new DataParser();
	let dataAsList = dataParser.parsePanelDataFromString(jsonString);
	return dataAsList;
}

function initComicData(jsonString) {
	let parsedComicData = JSON.parse(jsonString);
	return parsedComicData;
}

// [NOT USED] sets onload methods to various elements
function initOnloadMethods(navigationHandler) {
	/*
	let imageElem = document.getElementById(navigationHandler.state.panelDisplayImageElemId);
	imageElem.onload = function(e) {
		//navigationHandler.currentPanel.pageData.width = this.naturalWidth;
		//navigationHandler.currentPanel.pageData.height = this.naturalHeight;
	};
	*/
}

// run only after whole DOM is loaded
/**
 * Adds an eventListener to the page register navigation using keyboard;
 * Namely, Left Arrow to goto Previous Panel and
 * Rightt Arrow to goto the next Panel
 * @param {HandlerObject} navigationHandler Handler object that handles events within the app
 */
function initKeyBinding(navigationHandler) {
	document.addEventListener("keydown", event => {
		let keyPressed = event.key;
		if (keyPressed === "ArrowLeft") {
			if (event.shiftKey) {
				state.globalFunctions.gotoPreviousPage();
			} else {
				navigationHandler.gotoPrevPanel();
			}
		} else if (keyPressed === "ArrowRight") {
			if (event.shiftKey) {
				state.globalFunctions.gotoNextPage();
			} else {
				navigationHandler.gotoNextPanel();
			}
		} else if (keyPressed === "Home") {
			navigationHandler.gotoFirstPanel();
		} else if (keyPressed === "End") {
			navigationHandler.gotoFinalPanel();
		} else if (keyPressed === "f") {
			navigationHandler.gotoFullPageView();
		} else if (keyPressed === "i") {
			let openHelpModalButtonElemId = state.globalFunctions.getElementId("openHelpModalBtn");
			let openHelpModalButtonElem = document.getElementById(openHelpModalButtonElemId);
			openHelpModalButtonElem.click();
		}
		// maybe be bind PageUp and PageDown to skip 5 panels +-
	});	
}

/**
 * Adds 'onclick' event listener to nav buttons binding to 
 * corresponding methods from either 'navigationHandler' obj 
 * or 'state.globalFunctions'
 * @param {HandlerObject} navigationHandler 
 */
function initNavigatorBinding(navigationHandler) {
	document.getElementById(state.navigatorBtnId.gotoPrevPage).onclick = function() { state.globalFunctions.gotoPreviousPage(); };
	document.getElementById(state.navigatorBtnId.gotoFirstPanel).onclick = function() { navigationHandler.gotoFirstPanel(); };
	document.getElementById(state.navigatorBtnId.gotoPrevPanel).onclick = function() { navigationHandler.gotoPrevPanel(); };
	document.getElementById(state.navigatorBtnId.viewWholePage).onclick = function() { navigationHandler.gotoFullPageView(); };
	document.getElementById(state.navigatorBtnId.gotoNextPanel).onclick = function() { navigationHandler.gotoNextPanel(); };
	document.getElementById(state.navigatorBtnId.gotoFinalPanel).onclick = function() { navigationHandler.gotoFinalPanel(); };
	document.getElementById(state.navigatorBtnId.gotoNextPage).onclick = function() { state.globalFunctions.gotoNextPage(); };
}

/**
 * Doesn't work; Reason:
 * bootstrap tooltip isn't guaranteed to work on hidden elements
 */
function initTooltips() {
	//$(function () {	$('[data-toggle="tooltip"]').tooltip({});})
	//state.globalFunctions.getElementId("helpModal")
	$(`#${state.globalFunctions.getElementId("helpModal")}`).on('shown.bs.modal', function () {
		$('#myInput').trigger('focus');
	});
}

function initPage() {
	state.comicData.title = "A comic book";
	state.comicData.author = "Jane Doe";
	let parsedComicData = initComicData(comicData);
	state.comicData.pages = parsedComicData;
	state.comicData.currentPageIdx = 0;
}

function initApp() {
	initGlobalState();
	initPage();
	state.comicData.currentPageIdx = 0;	// delete me
	initDivs();
	state.panelNavigatorHandler = new PanelNavigatorHandler(state.comicData.pages[state.comicData.currentPageIdx].panelData);
	initOnloadMethods(state.panelNavigatorHandler);
	initTooltips();
	initNavigatorBinding(state.panelNavigatorHandler);
	initKeyBinding(state.panelNavigatorHandler);
}

jQuery(function() {
	initApp();
});
