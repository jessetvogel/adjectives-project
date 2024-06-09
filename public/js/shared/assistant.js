export class Matcher {
    constructor(book, sourceContext, targetContext) {
        this.book = book;
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
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
            const argSource = this.sourceContext[argType][source.args[key]];
            const argTarget = this.targetContext[argType][target.args[key]];
            if (!this.match(argSource, argTarget))
                return false;
        }
        return true; // if no problems occurred, return true
    }
    hasMatch(source) {
        return (source.type in this.map && source.id in this.map[source.type]);
    }
    clone() {
        const copy = new Matcher(this.book, this.sourceContext, this.targetContext);
        for (const id in this.map)
            copy.map[id] = this.map[id];
        return copy;
    }
}
;
export class ContradictionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContradictionError';
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
        helper(new Matcher(this.book, query, this.book.examples), 0);
        return results;
    }
    applyTheorem(theorem, context, id, shouldApply = true) {
        var _a, _b;
        // check type
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);
        const subject = context[type][id];
        // If the theorem conclusion already holds, there is no way in which the theorem yields new information
        const object = this.book.resolvePath(context, subject, theorem.conclusion.path);
        if (object == null)
            throw new Error(`Could not resolve path '${theorem.conclusion.path}' on object '${id}' of type '${type}'`);
        const objectAdjectiveValue = (theorem.conclusion.adjective in object.adjectives) ? object.adjectives[theorem.conclusion.adjective] : null;
        if (objectAdjectiveValue == theorem.conclusion.value)
            return null;
        // Count the number of conditions that hold, and keep track of 'the' condition that does not hold
        let conditionsCount = 0;
        let conditionsThatHoldCount = 0;
        let conditionThatDoesNotHold = null;
        for (const path in theorem.conditions) {
            const conditionObject = this.book.resolvePath(context, subject, path);
            if (conditionObject == null)
                throw new Error(`Could not resolve path '${path}' on object '${id}' of type '${type}'`);
            for (const key in theorem.conditions[path]) {
                conditionsCount++;
                if (((_a = conditionObject.adjectives) === null || _a === void 0 ? void 0 : _a[key]) == theorem.conditions[path][key])
                    conditionsThatHoldCount++;
                else
                    conditionThatDoesNotHold = { path, adjective: key };
            }
        }
        let conclusion = null;
        // If the object adjective value is still unknown, and all conditions hold, we can apply the theorem (in the forward direction) to arrive at the conclusion!
        if (objectAdjectiveValue == null && conditionsThatHoldCount == conditionsCount)
            conclusion = { object, adjective: theorem.conclusion.adjective, value: theorem.conclusion.value };
        // If the object adjective is the opposite of the theorem conclusion value, but all conditions hold, we arrive at a contradiction!
        if (objectAdjectiveValue != null && objectAdjectiveValue != theorem.conclusion.value && conditionsThatHoldCount == conditionsCount)
            throw new ContradictionError(`in applying theorem '${theorem.id}' to object '${id}' of type '${type}'`);
        // If the object adjective is the opposite of the theorem conclusion value, and all BUT ONE conditions hold, we can apply the theorem (in the backward direction) to conclude the remaining condition must be false!
        if (objectAdjectiveValue != null && objectAdjectiveValue != theorem.conclusion.value && conditionsThatHoldCount == conditionsCount - 1 && conditionThatDoesNotHold != null) {
            const conclusionObject = this.book.resolvePath(context, subject, conditionThatDoesNotHold.path);
            if (conclusionObject == null)
                throw new Error(`Could not resolve path '${conditionThatDoesNotHold.path}' on object '${id}' of type '${type}'`);
            const conclusionAdjective = conditionThatDoesNotHold.adjective;
            const conclusionValue = !theorem.conditions[conditionThatDoesNotHold.path][conclusionAdjective]; // NOTE: invert the boolean
            if (((_b = conclusionObject.adjectives) === null || _b === void 0 ? void 0 : _b[conclusionAdjective]) == conclusionValue) // if the conclusion was already known, simply return
                return null;
            conclusion = { object: conclusionObject, adjective: conclusionAdjective, value: conclusionValue };
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
        // TODO: repeat if found a theorem!
        const conclusions = [];
        let updates = true; // keep track of if any theorems are applied
        while (updates) {
            updates = false;
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
                        if (conclusion != null) {
                            conclusions.push(conclusion);
                            updates = true;
                        }
                    }
                }
            }
        }
        return conclusions;
    }
}
;
//# sourceMappingURL=assistant.js.map