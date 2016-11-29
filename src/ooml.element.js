OOML.Element = function() {};
var OOMLElementProto = OOML.Element.prototype;
OOMLElementProto.toObject = function() {

	var instance = this;
	var obj = {};

	this.constructor.__oomlProperties.forEach(function(propName) {
		var value = instance[propName];
		if (value !== undefined) {
			if (Utils.isPrimitiveValue(value)) {
				obj[propName] = value;
			} else {
				console.log(propName, value);
				obj[propName] = value == null ? null : value.toObject();
			}
		}
	});

	return obj;
};
OOMLElementProto.toJSON = function() {
	return JSON.stringify(this.toObject());
};
OOMLElementProto.assign = function() {
	var oomlInstance = this;

	for (var i = 0; i < arguments.length; i++) {

		var source = arguments[i];

		// Don't use Object.assign because 1) compatibility 2) it sets non-existent properties
		Object.keys(source).forEach(function(prop) {
			oomlInstance[prop] = source[prop]; // Probably don't need to clone as not mutated
		});
	}

	return this;
};
if (typeof Symbol == "function") {
	OOMLElementProto[Symbol.iterator] = function() {
		var i = -1,
			inst = this,
			objectKeys = this.constructor.__oomlProperties;

		return {
			next: function() {
				if (++i == objectKeys.length) {
					return { done: true };
				}

				return { value: inst[objectKeys[i]], done: false };
			}
		};
	};
}