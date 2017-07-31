# ooml
An object-orientated modern web UI anti-framework.

## Why use ooml?

### Easy setup
To use ooml, just drop in the JS library. There's no environment to set up, build systems to use, or dependencies to manage. Get all of the benefits of an advanced framework with none of the baggage. Also, being so independent, it has no requirements or limitations on the tools and environments you use, so you can reuse most existing common toolchains, or make your own perfect one.

### Incredibly simple
You only need to understand JSON and basic object orientation in order to use ooml. ooml is very declarative, and does not require you to learn any special languages or tools. Unlike most other frameworks, you can start creating scalable, advanced apps with knowledge picked up quickly, and learn the more advanced stuff when you need to.

### Very fast
ooml has no virtual DOM, because it is already the most efficient it can be. There are no hidden performance costs or traps to be avoided. ooml's DOM abstraction is simple, so it's very easy to understand, and its performance linearly scales with its use. All of this comes in a tiny 11 KB, gzipped, CDN-delivered [ooml.js](https://wilsonl.in/ooml.js) file.

As an example, compared to React + Redux, [ooml's raw performance is 4x better](https://wilsonl.in/ooml/comparisons/raw-performance/react-redux.html).

### Have it your way
ooml has a global store, message broker, and event system. Additionally, take advantage of abstract classes, union type checking, inheritance, constructors, getters and setters, mutation observers, serialisers and unserialisers, and so much more, to create your perfect app or library, your way. And because of the way it's designed, you can already use almost every existing web library out there.

### Safety

TODO

### So much more
Don't mistake ooml's simplicity for lack of features or scalability. Check out [ooml's guides](https://wilsonl.in/docs/ooml) to see the all the neat stuff about ooml.

## Quick example

Let's create a to-do list app. No long instructions, just quickly scan through the single and only HTML file needed, and then try out the subsequent JS example code in your browser ([view it live in your browser](https://wilsonl.in/ooml/examples/to-do-list-1.html)):

Note that this page **doesn't render anything initially**; the point is to demonstrate the syntax and API.

```html
<!DOCTYPE html>
<html>
    <head>
        <title>My to-do list</title>
        <script src="https://wilsonl.in/ooml.js"></script>
    </head>

    <body>
        <!--
            In ooml, we have classes, and construct objects from them,
            just like most object-orientated languages...
        -->
        <template ooml-class="Item">
            <ooml-property name="label">""</ooml-property>

            <!--
                ...but ooml classes also declare HTML to represent the
                view of the class (this is a web UI framework after all)
            -->
            <li>{{ this.label }}</li>
        </template>

        <!-- Here's our List class -->
        <template ooml-class="List">
            <!--
                The properties of our class (called member/instance
                variables/fields in other languages) must be declared before
                we can use them in the view
            -->
            <ooml-property name="name" type="string">""</ooml-property>
            <ooml-property name="items" type="Item" array>[]</ooml-property>
        
            <div>
                <!--
                    Notice the braces; this means that whatever the value of
                    "name" is will go here, updating itself automatically
                    whenever the value of "name" changes
                -->
                <!--
                    This is known as substitution
                -->
                <h2>{{ this.name }}</h2>
                <ul>
                    <!--
                        We can also substitute other instances of OOML
                        classes, or arrays of them
                    -->
                    <!--
                        Array of Item instances will be placed here(which makes
                        sense)
                    -->
                    {{ this.items }}
                </ul>
            </div>
        </template>

        <!--
            This is our App class. Note that this isn't necessary, but it's nice
            to have a single top-level class that represents our entire app
        -->
        <template ooml-class="App">
            <ooml-property name="list" type="List"></ooml-property>
            
            <div id="app">
                <ooml-substitution property="list" class="List"></ooml-substitution>
            </div>
        </template>

        <!--
            Declaring a whole bunch of classes is nice,
            but we still need to create something to show in the browser
        -->
        <!--
            In ooml, you can quickly bootstrap your app by declaring a class
            to initially create an instance of, and where to place it
        -->
        <!--
            In this case, we're declaring a new instance of the class App,
            and naming that instance object "app", so we can refer to it later
        -->
        <div ooml-instantiate="App app"></div>

        <script>
            // Don't worry about these 2 lines for now; just consider them as
            // code that parses your classes and bootstraps your app
            var namespace = new OOML.Namespace();
            var app = namespace.objects.app;
        </script>
    </body>
</html>
```

Running the above HTML page in your browser, try these in your browser's console and notice the similarity to plain JavaScript syntax:

```javascript
// Every instance is modelled as a basic object (think JSON)
app.list = { name: "My to-do list" };

// Arrays are modelled just like native arrays, and have all their methods
app.list.items.push({ label: "First item" });

// You can also use the parsed classes, which are just regular JS classes
app.list.items.push(new namespace.classes.Item({ label: "Second item" }));

// Another example of the very vanilla-like syntax
app.list.items.sort("label");

// Every object and array is fully encapsulated, as you'd expect
let firstItem = app.list.items.shift();
firstItem.label = "No. 1";
app.list.items.unshift(firstItem);

// Most of your code will look like normal accessing and assignment -- there's no special API or "way"
// This gives you more flexibility, very readable code, and nearly no learning curve 
app.list.items.get(0).label = "1st item";
```

Open up the console, tinker with the `app` variable, and see how easy it is to utilise the DOM abstraction. Every constructed object is just composed of primitive values, arrays, and more objects, which makes it extremely easy to traverse, manipulate, and serialise at any level.

Every object and array is self-contained, so it's really easy to encapsulate, isolate, and pass around parts of the app, just like regular objects and arrays.

Now, lets quickly add some controls so the user can actually modify and save the list. As a bonus, we'll enable Markdown input, to show just how easy it is to use custom HTML and external libraries in ooml ([view it live in your browser](https://wilsonl.in/ooml/examples/to-do-list-2.html)):

```html
<!DOCTYPE html>
<html>
    <head>
        <title>My to-do list</title>
        <script src="https://wilsonl.in/ooml.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.6/marked.min.js"></script>
    </head>

    <body>
        <template ooml-class="Item">
            <!--
                ooml properties can have type checking, getters, setters, and change listeners
            -->
            <!--
                You can display rich HTML rather than just the value of a property
            -->
            <ooml-property name="label" type="string" set="this.labelSetter">""</ooml-property>
            
            <ooml-method name="labelSetter">
                function(newValue) {
                    return {
                        HTML: `<span>${ marked(newValue) }</span>`
                    };
                }
            </ooml-method>
            
            <ooml-method name="handleDeleteButtonClick">
                function() {
                    this.dispatch('delete', { item: this });
                }
            </ooml-method>

            <li>
                <span>{{ this.label }}</span>
                
                <!--
                    A big part of object orientation is encapsulation.
                    
                    Sometimes, things will happen in a class that actually requires its
                    parent to handle (in this case, the parent is List and the child is Item).
                    
                    In ooml, you can dispatch events to notify the parent that something
                    has happened, and pass along additional data for more context.
                    
                    They can then choose to do whatever they want, including not doing anything.
                    
                    This encourages encapsulation and code reuse, as neither party needs to
                    know about the other's state, implementation, type, or even existence.
                -->
                <button handle-click="this.handleDeleteButtonClick">Delete</button>
            </li>
        </template>

        <template ooml-class="List">
            <ooml-property name="name" type="string">""</ooml-property>
            <ooml-property name="items" type="Item" array handle-delete="this.handleItemDelete">[]</ooml-property>
            
            <ooml-method name="handleItemDelete">
                function(data) {
                    data.item.detach();
                }
            </ooml-method>
            
            <ooml-method name="handleNewItemFormSubmit">
                function(event) {
                    event.preventDefault();
                    this.items.push({ label: this.$newItemInput.value });
                    this.$newItemInput.value = '';
                }
            </ooml-method>
            
            <ooml-method name="handleSerialisationButtonClick">
                function() {
                    prompt('Here is the JSON:', this.toJSON());
                }
            </ooml-method>
        
            <div>
                <h2>{{ this.name }}</h2>
                <ul>
                    {{ this.items }}
                </ul>

                <!--
                    Binding to DOM events is extremely simple
                -->
                <form handle-submit="this.handleNewItemFormSubmit">
                    <!--
                        Sometimes, we actually want to expose the DOM, not hide it away
                    -->
                    <input ooml-expose="newItemInput" placeholder="You can use Markdown!">
                    <button>Add new item</button>
                </form>

                <br>

                <!--
                    Serialisation is tightly built in to all objects and arrays
                -->
                <button handle-click="this.handleSerialisationButtonClick">Serialise this list</button>
            </div>
        </template>

        <template ooml-class="App">
            <!--
                Normally, substitution objects in a class are not
                initialised when the main object is constructed.
            -->
            <!--
                However, if it will always have a familiar structure,
                or you need it to be immediately available, you can
                set a default state for the object, and it will be
                built alongside the main object.
            -->
            <!--
                Since everything in ooml is just JSON, we can very
                easily describe the default value of our app's list.
            -->
            <ooml-property name="list" type="List">{
                name: "My list"
            }</ooml-property>
        
            <div id="app">
                {{ this.list }}
            </div>
        </template>

        <div ooml-instantiate="App app"></div>

        <script>
            let namespace = new OOML.Namespace();
            let app = namespace.objects.app;
        </script>
    </body>
</html>
```

## Learning ooml in 15 minutes

## Getting started

## Help improve ooml

This project needs everyone's help to make ooml a great experience for everyone. Help out by reporting bugs, contributing code, improving documentation, pointing out annoyances (small or fundamental), and suggesting what you want to see in the future. You can direct these to this project by creating [issues](https://github.com/lerouche/ooml/issues) or [pull requests](https://github.com/lerouche/ooml/pulls).
