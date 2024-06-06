class Matcher {
    constructor(book, context) {
        this.book = book;
        this.context = context;
        this.map = {};
    }
    match(source, target) {
        if (!(source.type in this.map)) // make sure `map` contains a field for this type
            this.map[source.type] = {};
        if (target.type != source.type) // type of `target` must match type of `source`
            return false;
        if (source.id in this.map[source.type]) // if `id` was already mapped, it must be mapped to `target`
            return this.map[source.type][source.id] == target;
        // match adjectives: every adjective that `source` has, `target` must also have
        for (const adj in source.adjectives) {
            if (!(adj in target.adjectives) || target.adjectives[adj] != source.adjectives[adj])
                return false;
        }
        this.map[source.type][source.id] = target; // map `id` to `target`
        for (const key in source.args) { // match arguments as well 
            const argType = this.book.types[source.type].parameters[key];
            const argSource = this.context[argType][source.args[key]];
            const argTarget = this.book.examples[argType][target.args[key]];
            if (!this.match(argSource, argTarget))
                return false;
        }
        return true; // if no problems occurred, return true
    }
    hasMatch(source) {
        return (source.type in this.map && source.id in this.map[source.type]);
    }
    clone() {
        const copy = new Matcher(this.book, this.context);
        for (const id in this.map)
            copy.map[id] = this.map[id];
        return copy;
    }
}
;
export class Assistant {
    constructor(book) {
        this.book = book;
    }
    search(query) {
        // Collect all objects of the query in an array
        const objects = [];
        for (const type in query) {
            for (const id in query[type])
                objects.push(query[type][id]);
        }
        // Construct a set of arrows from all objects to their arguments
        let arrows = [];
        for (const type in query) {
            for (const id in query[type]) {
                const object = query[type][id];
                for (const key in object.args) {
                    const argType = this.book.types[type].parameters[key];
                    arrows.push([objects.indexOf(object), objects.indexOf(query[argType][object.args[key]])]);
                }
            }
        }
        // Apply [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting)
        const objectsSorted = [];
        while_loop: while (objects.some(x => x != null)) {
            for (let i = 0; i < objects.length; ++i) {
                if (objects[i] == null)
                    continue; // if object has already moved to the sorted array, continue
                if (!arrows.some(x => x[0] == i)) { // this means the i'th object has no dependencies on other objects
                    objectsSorted.unshift(objects[i]); // move from `objects` array to `objects_sorted`
                    objects[i] = null;
                    arrows = arrows.filter(x => x[1] != i); // ignore all dependencies on the i'th object
                    continue while_loop;
                }
            }
            throw new Error('Circular dependencies detected!');
        }
        // Find matches for the objects, according to the `objectsSorted` array
        const assistant = this;
        const results = [];
        function helper(matcher, i) {
            if (i == objects.length) { // if all objects have a match, return the results
                const result = {};
                Object.assign(result, matcher.map);
                results.push(result);
                return;
            }
            const source = objectsSorted[i];
            if (matcher.hasMatch(source)) // if the i'th object already has a match, continue with the next object
                return helper(matcher, i + 1);
            // Find possible matches for the i'th object
            for (const target of Object.values(assistant.book.examples[source.type])) {
                const matcherCopy = matcher.clone();
                if (matcherCopy.match(source, target))
                    helper(matcherCopy, i + 1);
            }
        }
        helper(new Matcher(this.book, query), 0);
        return results;
    }
    applyTheorem(theorem, context, id, shouldApply = true) {
        var _a, _b;
        // check type
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);
        const subject = context[type][id];
        // if the theorem conclusion already holds, there is no way in which the theorem yields new information
        const object = this.book.resolvePath(context, subject, theorem.conclusion.path);
        if (object == null)
            throw new Error(`Could not resolve path '${theorem.conclusion.path}' on object '${id}' of type '${type}'`);
        const objectAdjectiveValue = (_a = object.adjectives) === null || _a === void 0 ? void 0 : _a[theorem.conclusion.adjective];
        if (objectAdjectiveValue == theorem.conclusion.value)
            return null;
        let conclusion = null;
        if (objectAdjectiveValue == undefined) { // if the object adjective value is still unknown, we can try to prove it with using the theorem
            // verify conditions
            for (const path in theorem.conditions) {
                const conditionObject = this.book.resolvePath(context, subject, path);
                if (conditionObject == null)
                    throw new Error(`Could not resolve path '${path}' on object '${id}' of type '${type}'`);
                for (const key in theorem.conditions[path]) {
                    if (!(key in conditionObject.adjectives) || conditionObject.adjectives[key] != theorem.conditions[path][key])
                        return null;
                }
            }
            conclusion = { object, adjective: theorem.conclusion.adjective, value: theorem.conclusion.value };
        }
        else if (objectAdjectiveValue != theorem.conclusion.value) { // if the object adjective value is the opposite of the theorem conclusion value, we can try to apply some negation of the theorem
            // count the number of conditions that hold
            let conditionsCount = 0;
            let conditionsThatHoldCount = 0;
            let conditionThatDoesNotHold = null;
            for (const path in theorem.conditions) {
                const conditionObject = this.book.resolvePath(context, subject, path);
                if (conditionObject == null)
                    throw new Error(`Could not resolve path '${path}' on object '${id}' of type '${type}'`);
                for (const key in theorem.conditions[path]) {
                    conditionsCount++;
                    if (((_b = conditionObject.adjectives) === null || _b === void 0 ? void 0 : _b[key]) == theorem.conditions[path][key])
                        conditionsThatHoldCount++;
                    else
                        conditionThatDoesNotHold = { path, adjective: key };
                }
            }
            if (conditionsThatHoldCount == conditionsCount - 1 && conditionThatDoesNotHold != null) { // if all but one conditions hold, then the remaining condition must be false
                const conclusionObject = this.book.resolvePath(context, subject, conditionThatDoesNotHold.path);
                if (conclusionObject == null)
                    throw new Error(`Could not resolve path '${conditionThatDoesNotHold.path}' on object '${id}' of type '${type}'`);
                const conclusionAdjective = conditionThatDoesNotHold.adjective;
                const conclusionValue = !theorem.conditions[conditionThatDoesNotHold.path][conclusionAdjective]; // NOTE: invert the boolean
                conclusion = { object: conclusionObject, adjective: conclusionAdjective, value: conclusionValue };
            }
        }
        // apply the conclusion (if so indicated) and return it
        if (conclusion != null && shouldApply) {
            conclusion.object.adjectives[conclusion.adjective] = conclusion.value;
            conclusion.object.proofs[conclusion.adjective] = {
                type: subject.type,
                theorem: theorem.id,
                subject: subject.id
            };
        }
        return conclusion;
    }
    deduce(context, options) {
        const conclusions = [];
        for (const type in context) { // for every object in the context ...
            if ((options === null || options === void 0 ? void 0 : options.types) && !options.types.includes(type))
                continue; // skip if not in options
            for (const id in context[type]) {
                if ((options === null || options === void 0 ? void 0 : options.ids) && !options.ids.includes(id))
                    continue; // skip if not in options
                if (!(type in this.book.theorems))
                    continue;
                const theorems = this.book.theorems[type];
                for (const theoremId in theorems) { // ... and for every theorem of the corresponding type ...
                    const conclusion = this.applyTheorem(theorems[theoremId], context, id);
                    if (conclusion != null)
                        conclusions.push(conclusion);
                }
            }
        }
        return conclusions;
    }
}
;
//# sourceMappingURL=assistant.js.map