Utils.createOOMLClass = ({ namespace, classMetadata }) => {
    let oomlClass;

    // *******************************
    // IMPORT FROM classMetadata START
    // *******************************

    let className = classMetadata.name;
    let classIsAbstract = classMetadata.isAbstract;
    let classParent = classMetadata.parent;
    let classConstructor = classMetadata.constructor;
    let classViewShape = classMetadata.viewShape;
    let classViewShapePathToExtensionPoint = classMetadata.viewShapePathToExtensionPoint;
    let classExposeKeys = classMetadata.exposeKeys;

    let classProperties = classMetadata.properties;
    let classMethods = classMetadata.methods;

    // *****************************
    // IMPORT FROM classMetadata END
    // *****************************

    let classPropertyNames = new StringSet(Object.keys(classProperties));

    if (classIsAbstract) {
        // Create a simpler class if it's abstract
        oomlClass = function(initState) {
            let instance = this;

            // Must use `new` keyword
            if (!(instance instanceof oomlClass)) {
                throw new ReferenceError(`OOML instances need to be constructed`);
            }

            // If no abstract factory available, throw error
            if (!Utils.typeOf(instance.abstractFactory, TYPEOF_FUNCTION)) {
                throw new TypeError(`Unable to construct new instance; "${ className }" is an abstract class`);
            }

            // Unserialise initState
            initState = Utils.unserialiseInitState(instance, initState);

            // Call abstract factory and assert it returned an OOML instance
            let ret = instance.abstractFactory(initState);
            if (!(ret instanceof OOML.Element)) {
                throw new TypeError(`Abstract factory returned a value that is not an OOML element instance`);
            }

            // Return the factory-built instance
            return ret;
        };

    } else {
        // Create a normal non-abstract class
        oomlClass = function(initState) {
            let instance = this;
            let instanceIsAttachedTo = {};

            if (!(instance instanceof oomlClass)) {
                throw new ReferenceError(`OOML instances need to be constructed`);
            }

            initState = Utils.unserialiseInitState(instance, initState);

            if (initState) {
                Object.keys(initState).forEach(propName => {
                    if (classPropertyNames.indexOf(propName) < 0) {
                        throw new ReferenceError(`The property "${propName}" provided in an instance property's initial value does not exist`);
                    }
                });
            }

            // Internal object to hold state of properties
            let instanceProperties = Utils.createCleanObject();

            // Map from property names to an array of properties that have a dynamic binding dependent on it
            let propertiesToDependentBindings = Utils.createCleanObject();
            let propertyRebindSetTimeouts = Utils.createCleanObject();

            let dispatchEventHandlers = Utils.createCleanObject();
            let mutationEventHandlers = Utils.createCleanObject();

            Object.keys(classProperties).forEach(propName => {
                let classPropertyObject = classProperties[propName];

                let instancePropertyObject = {
                    // Initially, the internal value should be undefined
                    currentValue: undefined,
                };

                let bindingIsDynamic = classPropertyObject.bindingIsDynamic;
                if (bindingIsDynamic != undefined) {
                    instancePropertyObject.bindingId = undefined;
                    if (bindingIsDynamic) {
                        instancePropertyObject.bindingParts = classPropertyObject.bindingParts.slice();

                        // Associate this binding's dependent properties to this property
                        Object.keys(instancePropertyObject.bindingPropertyToPartMap).forEach(dependencyPropertyName => {
                            if (!propertiesToDependentBindings[dependencyPropertyName]) {
                                propertiesToDependentBindings[dependencyPropertyName] = [];
                            }
                            propertiesToDependentBindings[dependencyPropertyName].push(propName);
                        });
                    }
                }

                if (classPropertyObject.isArray || classPropertyObject.isInstance) {
                    // For element and array substitutions, so that the anchor position is known
                    instancePropertyObject.insertAfter = undefined;
                } else {
                    // Use NodeSet as attributes may be binded to the same property more than once
                    instancePropertyObject.nodes = new NodeSet();
                }

                instanceProperties[propName] = Object.seal(instancePropertyObject);
            });

            // Defensive coding
            Object.seal(instanceProperties);

            let instanceExposedDOMElems = Utils.createCleanObject(); // { "key": HTMLElement }
            let instanceDom = Utils.constructInstanceDomFromShape({
                instance, instanceProperties, instanceExposedDOMElems,
                node: classViewShape
            });

            let instanceObjectProperties = Utils.createCleanObject();
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_DOMELEM] = instanceDom;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_EVENT_HANDLERS_DISPATCH] = dispatchEventHandlers;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_EVENT_HANDLERS_MUTATION] = mutationEventHandlers;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_CURRENT_ATTACHMENT] = instanceIsAttachedTo;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_PROPERTIES_INTERNAL_OBJECT] = instanceProperties;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_PROPERTIES_TO_DEPENDENT_BINDINGS] = propertiesToDependentBindings;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_PROPERTY_REBIND_SET_TIMEOUTS] = propertyRebindSetTimeouts;
            instanceObjectProperties[OOML_INSTANCE_PROPNAME_EXPOSED_DOM_ELEMS] = instanceExposedDOMElems;

            // Apply local properties
            for (let p in instanceObjectProperties) {
                Object.defineProperty(instance, p, { value: instanceObjectProperties });
            }

            // Prevent assigning to non-existent properties
            Object.preventExtensions(instance);

            classPropertyNames.forEach(propName => {
                let defaultValue = classProperties[propName].defaultValue;

                if (Utils.hasOwnProperty(initState, propName)) {
                    let passthroughProperty = classProperties[propName].passthroughProperty;
                    if (passthroughProperty) {
                        // If passthrough, initialise instance with initState built-in (to prevent it counting as a change,
                        // and to increase efficiency)
                        let unserialised = {};
                        unserialised[passthroughProperty] = initState[propName];
                        // defaultValue could be null
                        instance[propName] = Utils.concat(defaultValue || Utils.createCleanObject(), unserialised);

                    } else {
                        // Otherwise, just use provided value
                        instance[propName] = initState[propName];
                    }

                } else {
                    // All properties have a default value that is valid
                    // Even for instance and array properties
                    instance[propName] = defaultValue;
                }
            });

            // It's possible that this class and no ancestor has a constructor
            if (instance[OOML_CLASS_PROPNAME_SELF_AND_ANCESTOR_CONSTRUCTORS].length) {
                // Build constructor chain and call it
                instance[OOML_CLASS_PROPNAME_SELF_AND_ANCESTOR_CONSTRUCTORS]
                    .reduce((previous, c) => c.bind(instance, previous), undefined)();
            }

            // Update attribute nodes with parameter handlebars that have just been changed
            OOMLWriteChanges();
        };
    }

    oomlClass[OOML_CLASS_PROPNAME_PROPNAMES] = classPropertyNames;
    oomlClass[OOML_CLASS_PROPNAME_PROPERTIES] = classProperties;
    oomlClass[OOML_CLASS_PROPNAME_PREDEFINEDCONSTRUCTOR] = classConstructor;
    oomlClass[OOML_CLASS_PROPNAME_VIEW_SHAPE] = classViewShapePathToExtensionPoint && classViewShape;
    oomlClass[OOML_CLASS_PROPNAME_EXTENSIONPOINT_PATH] = classViewShapePathToExtensionPoint;
    oomlClass[OOML_CLASS_PROPNAME_ROOTELEMTAGNAME] = classViewShape && classViewShape.name;

    Object.defineProperty(oomlClass, "name", { value: className });
    Object.defineProperty(oomlClass, "prototype", { value: Object.create(classParent.prototype) });

    let classProtoPropertiesConfig = Utils.createCleanObject();

    // Set the constructor property
    classProtoPropertiesConfig.constructor = { value: oomlClass };

    // Do this to allow instance methods access to this namespace's classes
    classProtoPropertiesConfig.namespace = { value: namespace };

    classExposeKeys.forEach(keyname => {
        classProtoPropertiesConfig['$' + keyname] = {
            get: function() {
                return this[OOML_INSTANCE_PROPNAME_GET_EXPOSED_DOM_ELEM](keyname);
            },
        };
    });

    classPropertyNames.forEach(prop => {

        let classProperty = classProperties[prop];
        let setter;

        if (classProperty.isArray) {
            // Element array substitution
            setter = function(newVal) {
                this[OOML_INSTANCE_PROPNAME_SET_ARRAY_PROPERTY](prop, newVal);
            };

        } else if (classProperty.isInstance) {
            // Element substitution
            setter = function(newVal) {
                this[OOML_INSTANCE_PROPNAME_SET_OBJECT_PROPERTY](prop, newVal);
            };

        } else {
            // Primitive or transitive substitution
            setter = function(newValue) {
                // .bind is more expensive (in terms of initial speed and memory usage) than closure
                // Also, .bind would prevent "this" value from being auto applied
                return this[OOML_INSTANCE_PROPNAME_SET_PRIMITIVE_OR_TRANSIENT_PROPERTY](prop, newValue);
            };

        }

        classProtoPropertiesConfig[prop] = {
            get: function() {
                return this[OOML_INSTANCE_PROPNAME_GET_PROPERTY](prop);
            },
            set: setter,
            // Don't make enumerable, as this is on prototype, so not enumerable anyway
        };
    });

    // Set defined methods in class prototype
    for (let methodName in classMethods) {
        classProtoPropertiesConfig[methodName] = { value: classMethods[methodName].fn };
    }

    Object.defineProperties(oomlClass.prototype, classProtoPropertiesConfig);

    // Precompute ancestor constructors
    let ancestorConstructors = [];
    let currentProto = oomlClass.prototype;

    while (currentProto !== OOML.Element.prototype) {
        let ancestorConstructor = currentProto.constructor[OOML_CLASS_PROPNAME_PREDEFINEDCONSTRUCTOR];
        if (ancestorConstructor) {
            ancestorConstructors.unshift(OOML_CLASS_PROPNAME_PREDEFINEDCONSTRUCTOR);
        }
        currentProto = Object.getPrototypeOf(currentProto);
    }

    oomlClass[OOML_CLASS_PROPNAME_SELF_AND_ANCESTOR_CONSTRUCTORS] = ancestorConstructors;

    return oomlClass;
};