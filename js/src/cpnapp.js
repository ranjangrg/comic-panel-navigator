/**
 * TODO: 
 * 1. whole page view (...DONE)
 * 2. Add help(guide) interface within page (...DONE)
 * 3. fix tooltip (bootstrap tooltip isn't guaranteed to work on hidden elements)
 * 4. not important atm; Padding in panels
 * 5. soft-code hardcoded lines: within "createNavigationElem()",
 *  const navigationHandlerName = "state.panelNavigatorHandler";
 * 6. (IMPORTANT) Load new pages (preferably via URLs not local path) (...DONE)
 * 7. Mouse-click on panel (in full page view) to get to panel feature (Very user friendly) (... DONE)
 * 8. have page-turn like effect when page is turned/changed (visual indication of page turn)
 * 9. implement settings feature (+ select app height etc.)
 * 10. Use global Class instead of scoped function (... DONE)
 */

"use strict";

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
	constructor(panelData, globalState) {
		this.globalState = globalState;
		this.state = {
			"panelData": {...panelData},
			"panelOriginalData": {...panelData},	// copy content DONT assign directly (pointer seems the same)
			"pageData": {"width": 0, "height": 0, "naturalWidth": 0, "naturalHeight": 0, "pageIdx": 0},
			"targetHeight": 650,	// minimum/target height for each panel (in px)
			"maxWidth": globalState.appWidth,	// max width allowed (in px)
			"padding": 32	// in px; NOT implemented yet
		};
		// normal windows laptop screen res: 1366 x 768
		let imageElem = document.getElementById(this.globalState.globalFunctions.getElementId("panelDisplayImage"));
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
		let imageHolderElem = document.getElementById(this.globalState.globalFunctions.getElementId("panelDisplayImageHolder"));
		let imageElem = document.getElementById(this.globalState.globalFunctions.getElementId("panelDisplayImage"));

		// check if panel height is larger than the app-view itself
		if ( this.state.targetHeight > parseFloat(this.globalState.appHeight) ) {
			console.warn("[ PANEL VIEW ] Panel-image (height) Overflow detected!");
			this.state.targetHeight = parseFloat(this.globalState.appHeight);
		}

		this.state.panelData.height = this.state.targetHeight;

		let scaleFactor = parseFloat(this.state.panelData.height) / parseFloat(this.state.panelOriginalData.height);

		// check if new panel width fits into viewport
		let widthOverflowDetected = (this.state.panelOriginalData.width * scaleFactor) > this.state.maxWidth;
		if (widthOverflowDetected) { 
			// recalculate dimensions (now based on 'width') so that new panel fits within viewport width
			scaleFactor = parseFloat(this.state.maxWidth) / parseFloat(this.state.panelOriginalData.width);
			console.warn("[ PANEL VIEW ] Panel-image (width) Overflow detected!");
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
	constructor(panelLocationsAsList, globalState) {
		this.globalState = globalState;
		this.state = {
			"panelDisplayWrapperElemId": this.globalState.globalFunctions.getElementId("panelDisplayWrapper"),
			"panelDisplayImageHolderElemId": this.globalState.globalFunctions.getElementId("panelDisplayImageHolder"),
			"panelDisplayImageElemId": this.globalState.globalFunctions.getElementId("panelDisplayImage"),
			"navigatorWrapper": this.globalState.globalFunctions.getElementId("navigatorWrapper"),
			"inputNavigator": this.globalState.globalFunctions.getElementId("inputNavigator"),
			"currentPanelIndicatorWrapper": this.globalState.globalFunctions.getElementId("currentPanelIndicatorWrapper"),
			"currentPanelIndicator": this.globalState.globalFunctions.getElementId("currentPanelIndicator"),
			"panelLocations" : panelLocationsAsList,
			"currentPanelIdx": 0,
			"currentPanel": undefined,
			"navigatorIsBeingUsed": false,
			"fullPageIdxCode": -100,	// when panelIdx === this value, it means a full page view is requested
			"fullPageRequested": false
		}; 
		this.initAutoHideTrigger();
		this.initKeepNavigatorDisplayedTrigger();
		this.state.currentPanel = new PanelDisplay(this.state.panelLocations[0], this.globalState);
		this.gotoFirstPanel();
	}

	get currentPanel() {return this.state.currentPanel;}

	loadNewPage(comicDataForCurrentPage) {
		let imageElem = document.getElementById(this.state.panelDisplayImageElemId);
		imageElem.src = comicDataForCurrentPage.pageUrl;	// change image src within image element
		this.state.panelLocations = comicDataForCurrentPage.panelData;
		this.state.currentPanelIdx = 0;	
		this.state.currentPanel = new PanelDisplay(this.state.panelLocations[0], this.globalState);
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
			let newIndicatorText = "Page " + (this.globalState.comicData.currentPageIdx + 1) + " | Panel ";
			newIndicatorText += (parseInt(this.state.currentPanelIdx) + 1).toString();
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
			oldCurrentPageIdx = this.globalState.comicData.currentPageIdx;
			this.globalState.globalFunctions.gotoPreviousPage();
			newCurrentPageIdx = this.globalState.comicData.currentPageIdx;
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
			oldCurrentPageIdx = this.globalState.comicData.currentPageIdx;
			this.globalState.globalFunctions.gotoNextPage();
			newCurrentPageIdx = this.globalState.comicData.currentPageIdx;
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
			//imageElem.style.webkitTransform = `translate(-${offsetX}px, -${offsetY}px)`; 
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
		// 
		imageElem.onclick = function(event) {
			if (this.state.fullPageRequested) {	// ONLY act on handle event while on full-page-view
				this.handleClickOnFullPageView(event, imageElem);
			}
		}.bind(this);
	}

	// handler for click-on-full-page to navigate to clicked panel
	handleClickOnFullPageView(event, imageElem) {
		var selfHandlerObj = this;	// handler MUST be in scope for mouse events below
		const scaleFactor = imageElem.width/imageElem.naturalWidth;
		let clickedPosition = [
			(event.pageX - imageElem.offsetLeft) / scaleFactor, 
			(event.pageY - imageElem.offsetTop) / scaleFactor
		];
		let clickedPanelIdx = undefined;	// will hold value of panel clicked-on
		for (let panelIdx in selfHandlerObj.state.panelLocations) {
			/* loop through all panels within current page */
			let currentPanel = selfHandlerObj.state.panelLocations[panelIdx];
			const pointA = [parseFloat(currentPanel.x), parseFloat(currentPanel.y)];
			const pointB = [
				pointA[0] + parseFloat(currentPanel.width),
				pointA[1] + parseFloat(currentPanel.height),
			];
			// check if clicked within this panel
			if (
				( clickedPosition[0] > pointA[0] && clickedPosition[0] < pointB[0] ) &&
				( clickedPosition[1] > pointA[1] && clickedPosition[1] < pointB[1] )
			) {
				clickedPanelIdx = panelIdx;
				break;	// since panel is found, break out of search loop
			}
		}
		if (clickedPanelIdx !== undefined) {
			this.gotoPanel(clickedPanelIdx);
			this.gotoFullPageView();
		}
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

function createNavigationElem(globalState) {
	let navigationBlock = new Block(globalState.globalFunctions.getElementId("navigatorWrapper"));
	navigationBlock.DOMCss = { 
		"display": "none",	// hide whole block
		"width": "100%",
		"position": "absolute",
		"left": "0%",
		"background-image": "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.45), rgba(0,0,0,0.5), rgba(0,0,0,0.0))",
		"overflow": "hidden",
		"text-shadow": "-1px -1px 0 #000, 1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000",	// sharpens icons
		"z-index": "5"
	};
	navigationBlock.DOMClasses = "row no-gutters";
	const navigationBtnClassNames = "btn btn-sm col mb-2 text-light";	// classes to use for nav buttons

	const navigationHandlerName = "state.panelNavigatorHandler";	// name of the handler object; handler should be created after DOM is created

	navigationBlock.DOMHtml = 
	`<div class="container-fluid no-gutters">
		<div id="${globalState.globalFunctions.getElementId("inputNavigatorWrapper")}" class="row no-gutters justify-content-center"> 
			<form class="form-inline" style="display: none">
				<div class="form-group row mx-sm-3 mb-2">
					<input type="number" class="form-control" id="${globalState.globalFunctions.getElementId("inputNavigator")}" value="1" placeholder="Panel">	
				</div>
				<button type="button" class="btn btn-primary mb-2 form-control" onclick="${navigationHandlerName}.gotoPanelViaInput()"> Goto Panel </button>
			</form>
		</div>
		<div id="${globalState.globalFunctions.getElementId("symbolNavigator")}" class="row no-gutters justify-content-center">
			<form class="form-inline text-center">
				<button id="${globalState.navigatorBtnId.gotoPrevPage}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to Previous Page (Shift + &larr;)"> ${globalState.symbolCodesForNavigator.gotoPrevPage} </button>
				<button id="${globalState.navigatorBtnId.gotoFirstPanel}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to First Panel (home)"> ${globalState.symbolCodesForNavigator.gotoFirstPanel} </button> &nbsp;
				<button id="${globalState.navigatorBtnId.gotoPrevPanel}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to Previous Panel (&larr;)"> ${globalState.symbolCodesForNavigator.gotoPrevPanel} </button> &nbsp;
				<button id="${globalState.navigatorBtnId.viewWholePage}" type="button" class="${navigationBtnClassNames}"  data-toggle="tooltip" title="View Whole Page (f)"> ${globalState.symbolCodesForNavigator.viewWholePage}</button>
				<button id="${globalState.navigatorBtnId.gotoNextPanel}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to Next Panel (&rarr;)"> ${globalState.symbolCodesForNavigator.gotoNextPanel} </button> &nbsp;
				<button id="${globalState.navigatorBtnId.gotoFinalPanel}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to Final Panel (end)"> ${globalState.symbolCodesForNavigator.gotoFinalPanel} </button>
				<button id="${globalState.navigatorBtnId.gotoNextPage}" type="button" class="${navigationBtnClassNames}" data-toggle="tooltip" title="Go to Next Page (Shift + &rarr;)"> ${globalState.symbolCodesForNavigator.gotoNextPage} </button>
			</form>
		</div>
	</div>`;
	let navigationElem = navigationBlock.createElementObjectFromBlock();
	return navigationElem;
}

function createCurrentPanelIndicatorWrapperElem(globalState) {
	let currentPanelIndicatorWrapperBlock = new Block(globalState.globalFunctions.getElementId("currentPanelIndicatorWrapper"));
	currentPanelIndicatorWrapperBlock.DOMCss = { 
		"z-index": "4",
		"font-family": "'Bangers', cursive",
		"width": "100%",
		"bottom": "0",
		"display": "none",
		"position": "absolute",
		"overflow": "hidden",
		"padding": "0.5em",
		"background-image": "linear-gradient(0deg, rgba(0,0,0,0.0), rgba(0,0,0,0.5), rgba(0,0,0,0.45), rgba(0,0,0,0.0))",
		// for web-kit based browser
		// "-webkit-text-stroke": "1px black",
		// "-webkit-text-fill-color": "white"
		"text-shadow": "2px 2px 8px black",
		"letter-spacing": "0.5ch"
	};
	currentPanelIndicatorWrapperBlock.DOMClasses = "row no-gutters h4 text-white";
	currentPanelIndicatorWrapperBlock.DOMHtml = `
		<button type="button" class="col-1 btn btn-sm text-light" title="Show help" data-toggle="modal" 
			id="${globalState.globalFunctions.getElementId("openHelpModalBtn")}" 
			data-target="#${globalState.globalFunctions.getElementId("helpModal")}">
			${globalState.symbolCodesForNavigator.info} 
		</button>
		<span class="col-10 text-center" id="${globalState.globalFunctions.getElementId("currentPanelIndicator")}"> - </span>
		<span class="col-1 text-center">  </span>
	`;
	let currentPanelIndicatorWrapperElem = currentPanelIndicatorWrapperBlock.createElementObjectFromBlock();
	return currentPanelIndicatorWrapperElem;
}

function createPanelDisplayWrapperElem(globalState) {
	let imageUrl = globalState.comicData.pages[globalState.comicData.currentPageIdx].pageUrl;
	let panelDisplayWrapperBlock = new Block(globalState.globalFunctions.getElementId("panelDisplayWrapper")); 
	panelDisplayWrapperBlock.DOMClasses = "row no-gutters justify-content-center";

	let panelDisplayImageStyle = "z-index: 1;transition-duration: 0.5s; transition-timing-function: ease-in;";	// set animation for panel transition
	let panelDisplayImageHolderStyle = 
		`overflow: hidden; 
		z-index: 5;
		${panelDisplayImageStyle};`// set animation for panel transition
		//border-radius: 2em;`;		// to enable rounded corners for panel
	panelDisplayWrapperBlock.DOMHtml = 
	`<div id="${globalState.globalFunctions.getElementId("panelDisplayImageHolder")}" style="${panelDisplayImageHolderStyle}">
		<img 
			id="${globalState.globalFunctions.getElementId("panelDisplayImage")}" 
			class="no-resize"
			src="${imageUrl}"
			style="${panelDisplayImageStyle}"
			width="auto" >
	</div>`;
	let panelDisplayWrapperElem = panelDisplayWrapperBlock.createElementObjectFromBlock();
	return panelDisplayWrapperElem;
}

function createHelpModalElem(globalState) {
	let helpModalBlock = new Block(globalState.globalFunctions.getElementId("helpModalWrapper"));
	helpModalBlock.DOMCss = {};
	helpModalBlock.DOMClasses = "";
	let useSerifStyle = "font-family: serif;";
	helpModalBlock.DOMHtml = 
	`<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="Help" aria-hidden="true"
		id="${globalState.globalFunctions.getElementId("helpModal")}" >
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
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoFirstPanel}  </dt> <dd class="col-sm-9"> Go to the first panel. </dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoPrevPanel} </dt> <dd class="col-sm-9"> Go to previous panel.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoNextPanel} </dt> <dd class="col-sm-9"> Go to next panel.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoFinalPanel} </dt> <dd class="col-sm-9"> Go to the final panel.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoPrevPage2x} </dt> <dd class="col-sm-9"> Turn to previous page.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.gotoNextPage2x} </dt> <dd class="col-sm-9"> Turn to next page.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.viewWholePage2x} </dt> <dd class="col-sm-9"> Toggle full page view.</dd>
									<dt class="col-sm-3"> ${globalState.symbolCodesForNavigator.info} </dt> <dd class="col-sm-9"> Open (and close) this help box. </dd>
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

class comicPanelNavigatorApp {
	/* note: using selfAppObject to bind 'this' seems a bit hacky */
	/* TODO: maybe find a cleaner implementation */

	constructor( appState ) {
		/* elements' ID list: dictates what to name each DOM elements */
		this.elementIDs = {
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

		this.state = {
			"appHeight": "790px",	// height of the total app (740px normally)
			"appWidth": 200,
			"panelNavigatorHandler": undefined,
			"navigationElem": undefined,
			"currentPanelIndicatorWrapperElem": undefined,
			"panelDisplayWrapperElem": undefined,
			"helpModalElem": undefined,
			"comicDataUrl": "",
			"comicData": {
				"title": "",
				"author": "",
				"currentPageIdx": 0,
				"pages": []
			},
			"globalFunctions": {
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

		let selfAppObject = this;

		this.initPromises(appState, selfAppObject);

		jQuery(function() {
			selfAppObject.initApp(selfAppObject);
		}.bind(selfAppObject));
	}

	initPromises(appState, selfAppObject) {
		this.initGlobalState = new Promise( function(resolve, reject) {
			if (appState.appHeight !== undefined) { selfAppObject.state.appHeight = appState.appHeight; } 
			if (appState.appWidth !== undefined) { selfAppObject.state.appWidth = appState.appWidth; } 
			if (appState.comicDataUrl !== undefined) { selfAppObject.state.comicDataUrl = appState.comicDataUrl; } 
			resolve("[INIT_GLOBAL_STATE]: Loaded new states.");
		}.bind(selfAppObject));

		this.initPageData = new Promise( function(resolve, reject) {
			selfAppObject.state.comicData.title = "A comic book";
			selfAppObject.state.comicData.author = "Jane Doe";
			selfAppObject.state.comicData.currentPageIdx = 0;
			selfAppObject.state.comicData.pages = {};
			let parsedComicData = {};	// maybe rename variable
			let jsonIsLoadedPromise = $.getJSON(selfAppObject.state.comicDataUrl);
			jsonIsLoadedPromise.done(function(json) {
				parsedComicData = json;
				selfAppObject.state.comicData.pages = parsedComicData;
				resolve("[INIT_PAGE_DATA]: Comic data (JSON) is loaded.");
			});
			jsonIsLoadedPromise.fail(function(jqxhr, textStatus, error) {
				reject("[INIT_PAGE_DATA]: Error fetching comic data (JSON): " + textStatus + ", " + error);
			});
		}.bind(selfAppObject));
	}

	initGlobalFunctions(selfAppObject) {
		/**
		 * Returns element id without '#' at the front; 
		 * TODO: maybe function name too similar to getElementById ???
		 * @param {String} componentName Name of the component whose 'id' is to be found
		 * @return {String} Element id without '#' at the beginning
		 */
		selfAppObject.state.globalFunctions.getElementId = function (componentName) {
			return selfAppObject.elementIDs[componentName].substr(1);
		}

		/**
		 * Appends elemenObject to the element identified by given parentDomId as child element.
		 * @param {String} parentDomId Id of parent element to where new element is to appended
		 * @param {*} elementObject HTML element object
		 */
		selfAppObject.state.globalFunctions.appendElementObjectToDOM = function (parentDomId, elementObject) {
			let parentElem = document.getElementById(parentDomId);
			parentElem.appendChild(elementObject);
		}

		selfAppObject.state.globalFunctions.checkAndReturnPageIdx = function (pageIdx) {
			// check if page index is an acceptable value
			if (pageIdx < 0) { pageIdx = 0; }
			if (pageIdx > selfAppObject.state.comicData.pages.length - 1) { pageIdx = selfAppObject.state.comicData.pages.length - 1;}	// can be else if
			return pageIdx;
		}

		selfAppObject.state.globalFunctions.gotoPage = function (pageIdx) {
			selfAppObject.state.comicData.currentPageIdx = selfAppObject.state.globalFunctions.checkAndReturnPageIdx(pageIdx);
			selfAppObject.state.panelNavigatorHandler.currentPanelIdx = 0;
			selfAppObject.state.panelNavigatorHandler.loadNewPage(selfAppObject.state.comicData.pages[selfAppObject.state.comicData.currentPageIdx]);
			selfAppObject.state.panelNavigatorHandler.state.fullPageRequested = false;
			selfAppObject.state.panelNavigatorHandler.currentPanel.reset();
			selfAppObject.state.panelNavigatorHandler.gotoFirstPanel();
		}

		selfAppObject.state.globalFunctions.gotoPreviousPage = function () {
			let newPageIdx = selfAppObject.state.comicData.currentPageIdx - 1;
			selfAppObject.state.globalFunctions.gotoPage(newPageIdx);
		}

		selfAppObject.state.globalFunctions.gotoNextPage = function () {
			let newPageIdx = selfAppObject.state.comicData.currentPageIdx + 1;
			if (newPageIdx < selfAppObject.state.comicData.pages.length) {
				// goto new page only if next page exists
				selfAppObject.state.globalFunctions.gotoPage(newPageIdx);
			}
		}
	};

	initAppEntryElem() {
		let appEntryElem = document.getElementById(this.state.globalFunctions.getElementId("appEntry"));
		appEntryElem.className = "container-fluid no-gutters";
		appEntryElem.style.outline = "none";	// disable blue outline while elem in focus

		appEntryElem.style.position = "relative";
		appEntryElem.style.width = "100%";
		//appEntryElem.style.backgroundImage = `url('${bgImageSrc}')`;	// uncomment for background image
		appEntryElem.style.backgroundColor = "#111111";
		appEntryElem.style.height = this.state.appHeight;
		appEntryElem.tabIndex = "-1";	// required for elem.focus()

		// focus on app (after onclick event)
		appEntryElem.onclick = function putAppInFocus() {
			this.focus();
		}

	}

	initDivs(selfAppObject) {
		selfAppObject.initAppEntryElem();
		selfAppObject.state.navigationElem = createNavigationElem(selfAppObject.state);
		selfAppObject.state.currentPanelIndicatorWrapperElem = createCurrentPanelIndicatorWrapperElem(selfAppObject.state);
		selfAppObject.state.panelDisplayWrapperElem = createPanelDisplayWrapperElem(selfAppObject.state);
		selfAppObject.state.helpModalElem = createHelpModalElem(selfAppObject.state);
		selfAppObject.state.globalFunctions.appendElementObjectToDOM(selfAppObject.state.globalFunctions.getElementId("appEntry"), selfAppObject.state.navigationElem);
		selfAppObject.state.globalFunctions.appendElementObjectToDOM(selfAppObject.state.globalFunctions.getElementId("appEntry"), selfAppObject.state.currentPanelIndicatorWrapperElem);
		selfAppObject.state.globalFunctions.appendElementObjectToDOM(selfAppObject.state.globalFunctions.getElementId("appEntry"), selfAppObject.state.panelDisplayWrapperElem);
		selfAppObject.state.globalFunctions.appendElementObjectToDOM(selfAppObject.state.globalFunctions.getElementId("appEntry"), selfAppObject.state.helpModalElem);
	}

	// CSS media queries; ALWAYS after divs are created
	initDivStyles(selfAppObject) {
		var mql = window.matchMedia("(max-width: 500px)");
		if (mql.matches) {
			/* the viewport is 500 pixels wide or less */
		} else {
			/* the viewport is more than than 500 pixels wide */
		}
		/* listen to changes in media query e.g. display/viewport */
		mql.addEventListener( "change", (e) => {
			if (e.matches) {
				/* the viewport is 500 pixels wide or less */
			} else {
				/* the viewport is more than than 500 pixels wide */
			}
		})
	}	

	importExternalLibraries() {
		var link = document.createElement('link');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('type', 'text/css');
		link.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Bangers&display=swap');
		document.head.appendChild(link);
	}

	/** [NOT USED]
	 * Parse and return data into suitable format (i.e. a list usually)
	 */
	initData(jsonString) {
		let dataParser = new DataParser();
		let dataAsList = dataParser.parsePanelDataFromString(jsonString);
		return dataAsList;
	}
	/* [NOT USED] */
	initComicData(jsonString) {
		let parsedComicData = JSON.parse(jsonString);
		return parsedComicData;
	}

	// [NOT USED] sets onload methods to various elements
	initOnloadMethods(navigationHandler) {
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
	 * Right Arrow to goto the next Panel
	 * @param {HandlerObject} navigationHandler Handler object that handles events within the app
	 */
	initKeyBinding(navigationHandler) {
		document.addEventListener("keydown", event => {
			// only accept keystrokes while app is in focus
			if (document.activeElement.id === this.elementIDs.appEntry.substr(1)) {
				let keyPressed = event.key;
				if (keyPressed === "ArrowLeft") {
					if (event.shiftKey) {
						this.state.globalFunctions.gotoPreviousPage();
					} else {
						navigationHandler.gotoPrevPanel();
					}
				} else if (keyPressed === "ArrowRight") {
					if (event.shiftKey) {
						this.state.globalFunctions.gotoNextPage();
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
					let openHelpModalButtonElemId = this.state.globalFunctions.getElementId("openHelpModalBtn");
					let openHelpModalButtonElem = document.getElementById(openHelpModalButtonElemId);
					openHelpModalButtonElem.click();
				}
				// maybe be bind PageUp and PageDown to skip 5 panels +-
			}
		});	
	}

	/**
	 * Adds 'onclick' event listener to nav buttons binding to 
	 * corresponding methods from either 'navigationHandler' obj 
	 * or 'state.globalFunctions'
	 * @param {HandlerObject} navigationHandler 
	 */
	initNavigatorBinding(selfAppObject) {
		let navigationHandler = selfAppObject.state.panelNavigatorHandler;
		document.getElementById(this.state.navigatorBtnId.gotoPrevPage).onclick = function() { selfAppObject.state.globalFunctions.gotoPreviousPage(); };
		document.getElementById(this.state.navigatorBtnId.gotoFirstPanel).onclick = function() { navigationHandler.gotoFirstPanel(); };
		document.getElementById(this.state.navigatorBtnId.gotoPrevPanel).onclick = function() { navigationHandler.gotoPrevPanel(); };
		document.getElementById(this.state.navigatorBtnId.viewWholePage).onclick = function() { navigationHandler.gotoFullPageView(); };
		document.getElementById(this.state.navigatorBtnId.gotoNextPanel).onclick = function() { navigationHandler.gotoNextPanel(); };
		document.getElementById(this.state.navigatorBtnId.gotoFinalPanel).onclick = function() { navigationHandler.gotoFinalPanel(); };
		document.getElementById(this.state.navigatorBtnId.gotoNextPage).onclick = function() { selfAppObject.state.globalFunctions.gotoNextPage(); };
	}

	/**
	 * Doesn't work; Reason:
	 * bootstrap tooltip isn't guaranteed to work on hidden elements
	 */
	initTooltips() {
		//$(function () {	$('[data-toggle="tooltip"]').tooltip({});})
		//this.state.globalFunctions.getElementId("helpModal")
		$(`#${this.state.globalFunctions.getElementId("helpModal")}`).on('shown.bs.modal', function () {
			$('#myInput').trigger('focus');
		});
	}

	initApp(selfAppObject) {
		selfAppObject.initGlobalState.then( function(initGlobalStateMsg) {
			console.info(initGlobalStateMsg);
			selfAppObject.initGlobalFunctions(selfAppObject);
			selfAppObject.initPageData.then( function(msg) {
				console.info(msg);
				selfAppObject.importExternalLibraries();	// import external CSS lib via headers
				selfAppObject.state.comicData.currentPageIdx = 0;	// delete me
				selfAppObject.initDivs(selfAppObject);
				selfAppObject.initDivStyles(selfAppObject);	// always after all div elements are created
				selfAppObject.state.panelNavigatorHandler = new PanelNavigatorHandler(selfAppObject.state.comicData.pages[selfAppObject.state.comicData.currentPageIdx].panelData, selfAppObject.state);
				selfAppObject.initOnloadMethods(selfAppObject.state.panelNavigatorHandler);
				selfAppObject.initTooltips();
				selfAppObject.initNavigatorBinding(selfAppObject);
				selfAppObject.initKeyBinding(selfAppObject.state.panelNavigatorHandler);
			}.bind(selfAppObject)).catch( (err) => {
				console.err(err);	//console.error(err);
			});
		}.bind(selfAppObject) );
	}
}

/* App initialization example shown below */
/*
const dimensions = {
	"width": window.innerWidth - 30,	// allowing 30px for padding-offset
	"height": window.innerHeight - 30
};

let comicPanelApp = new comicPanelNavigatorApp( {
	"appHeight": `${dimensions.height}px`,	// height of the total app (740px normally)
	"appWidth": dimensions.width,	// max-width of app (and panel image); takes NUMBER (in px)
	"comicDataUrl": "http://192.168.0.82/assets/data/comic-data.php"
} );
*/
