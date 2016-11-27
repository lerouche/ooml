(function(undefined) {
	"use strict";

	var OOMLNodesWithUnwrittenChanges = new Set(),
		OOMLWriteChangesSetTimeout,
		OOMLWriteChanges = function() {
			if (OOMLWriteChangesSetTimeout) clearTimeout(OOMLWriteChangesSetTimeout);
			OOMLWriteChangesSetTimeout = setTimeout(function() {
				OOMLNodesWithUnwrittenChanges.forEach(function(node) {
					node.textContent = node[OOML_NODE_PROPNAME_TEXTFORMAT].join('');
				});

				OOMLNodesWithUnwrittenChanges.clear();
			}, 50);
		};

	var OOMLInstanceDestructedError = function() {
		throw new Error('This instance is no longer available to use');
	};

	var OOML_ARRAY_PROPNAME_INTERNALARRAY = '__oomlInternalArray',
		OOML_ARRAY_PROPNAME_ELEMCONSTRUCTOR = '__oomlElementConstructor',

		OOML_NODE_PROPNAME_TEXTFORMAT = '__oomlFormatStr',
		OOML_NODE_PROPNAME_FORMATPARAMMAP = '__oomlParamMap';

	<ZC-IMPORT[utils]>

	var OOML = {};
	<ZC-IMPORT[array]>
	<ZC-IMPORT[element]>
	<ZC-IMPORT[init]>

	if (typeof exports == "object") {
		module.exports = OOML;
	} else {
		window.OOML = OOML;
	}
})();