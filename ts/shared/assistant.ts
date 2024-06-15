import * as core from './core.js';

export class Matcher {

    book: core.Book;
    sourceContext: core.Context;
    targetContext: core.Context;
    map: core.Context;

    constructor(book: core.Book, sourceContext: core.Context, targetContext: core.Context) {
        this.book = book;
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
        this.map = {};
    }

    match(source: core.Example, target: core.Example): boolean {
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

    hasMatch(source: core.Example): boolean {
        return (source.type in this.map && source.id in this.map[source.type]);
    }

    clone(): Matcher {
        const copy = new Matcher(this.book, this.sourceContext, this.targetContext);
        for (const id in this.map)
            copy.map[id] = this.map[id];
        return copy;
    }

};

export type Conclusion = { object: core.Example, adjective: string, value: boolean };
export type DeduceOptions = { types?: string[], ids?: string[] };

export class ContradictionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContradictionError';
    }
};

export class Assistant {

    book: core.Book;

    constructor(book: core.Book) {
        this.book = book;
    }

    search(query: core.Context): core.Context[] {
        // collect all objects of the query in an array
        const objects: (core.Example | null)[] = [];
        for (const type in query) {
            for (const id in query[type])
                objects.push(query[type][id]);
        }

        // construct a set of arrows from all objects to their arguments
        let arrows: [number, number][] = []
        for (const type in query) {
            for (const id in query[type]) {
                const object = query[type][id];
                for (const key in object.args) {
                    const argType = this.book.types[type].parameters[key];
                    arrows.push([objects.indexOf(object), objects.indexOf(query[argType][object.args[key]])]);
                }
            }
        }

        // apply [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting)
        const objectsSorted: core.Example[] = [];
        while_loop: while (objects.some(x => x != null)) {
            for (let i = 0; i < objects.length; ++i) {
                if (objects[i] == null) continue; // if object has already moved to the sorted array, continue
                if (!arrows.some(x => x[0] == i)) { // this means the i'th object has no dependencies on other objects
                    objectsSorted.unshift(objects[i] as core.Example); // move from `objects` array to `objects_sorted`
                    objects[i] = null;
                    arrows = arrows.filter(x => x[1] != i); // ignore all dependencies on the i'th object
                    continue while_loop;
                }
            }
            throw new Error('Circular dependencies detected!');
        }

        // find matches for the objects, according to the `objectsSorted` array
        const assistant: Assistant = this;
        const results: core.Context[] = [];

        function helper(matcher: Matcher, i: number): void {
            if (i == objects.length) { // if all objects have a match, return the results
                const result: core.Context = {};
                Object.assign(result, matcher.map);
                results.push(result);
                return;
            }

            const source = objectsSorted[i];

            if (matcher.hasMatch(source)) // if the i'th object already has a match, continue with the next object
                return helper(matcher, i + 1);

            // find possible matches for the i'th object
            for (const target of Object.values(assistant.book.examples[source.type])) {
                const matcherCopy = matcher.clone();
                if (matcherCopy.match(source, target))
                    helper(matcherCopy, i + 1);
            }
        }

        helper(new Matcher(this.book, query, this.book.examples), 0);

        return results;
    }

    applyTheorem(theorem: core.Theorem, context: core.Context, id: string): Conclusion[] {
        // check type
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);

        const subject = context[type][id];

        // check the conditions (if there is one that does not hold)
        let conditionsThatHoldCount: number = 0;
        let conditionsCount: number = 0;
        let conditionThatDoesNotHold: { path: string, adjective: string } | null = null;
        for (const path in theorem.conditions) {
            const object = this.book.resolvePath(context, subject, path);
            if (object == null) throw new Error(`Could not resolve path '${path}' on object '${subject.id}' of type '${subject.type}'`);
            for (const adjective in theorem.conditions[path]) {
                ++conditionsCount;
                const value = object.adjectives?.[adjective];
                if (value !== theorem.conditions[path][adjective]) {
                    conditionThatDoesNotHold = { path, adjective };
                }
                else {
                    ++conditionsThatHoldCount;
                }
            }
        }
        const conditionsAreSatisfied = (conditionsThatHoldCount == conditionsCount);

        // check the conclusions (if there is one that is actually false)
        let conclusionsArePossible: boolean = true;
        l: for (const path in theorem.conclusions) {
            const object = this.book.resolvePath(context, subject, path);
            if (object == null) throw new Error(`Could not resolve path '${path}' on object '${subject.id}' of type '${subject.type}'`);
            for (const adjective in theorem.conclusions[path]) {
                const value = object.adjectives?.[adjective];
                if (value === !theorem.conclusions[path][adjective]) {
                    conclusionsArePossible = false;
                    break l;
                }
            }
        }

        const conclusions: Conclusion[] = [];

        // If all the conditions hold, we can apply the theorem (in the forward direction) to arrive at the conclusion! (Watch out for contradictions though!)
        if (conditionsAreSatisfied) {
            for (const path in theorem.conclusions) {
                const object = this.book.resolvePath(context, subject, path);
                if (object == null) throw new Error(`Could not resolve path '${path}' on object '${subject.id}' of type '${type}'`);
                for (const adjective in theorem.conclusions[path]) {
                    const value = theorem.conclusions[path][adjective];
                    if (adjective in object.adjectives && object.adjectives[adjective] != value)
                        throw new ContradictionError(`in applying theorem '${id}' to object '${subject.id}' of type '${type}'`);
                    if (!(adjective in object.adjectives)) // only push the conclusions that are new
                        conclusions.push({ object, adjective, value });
                }
            }
        }

        // If there is a faulty conclusion, and all BUT ONE conditions hold, we can apply the theorem (in the backwards direction) to conclude the remaining condition must be false!
        else if (!conclusionsArePossible && conditionsThatHoldCount == conditionsCount - 1 && conditionThatDoesNotHold != null) {
            const object = this.book.resolvePath(context, subject, conditionThatDoesNotHold.path);
            if (object == null) throw new Error(`Could not resolve path '${conditionThatDoesNotHold.path}' on object '${subject.id}' of type '${type}'`);
            const adjective = conditionThatDoesNotHold.adjective;
            const value = !theorem.conditions[conditionThatDoesNotHold.path][adjective]; // NOTE: invert the boolean
            if (object.adjectives?.[adjective] == value) // If the conclusion was already known, simply return an empty list of conclusions
                return [];
            conclusions.push({ object, adjective, value });
        }

        // Apply the conclusions and return them
        for (const conclusion of conclusions) {
            conclusion.object.adjectives[conclusion.adjective] = conclusion.value;
            conclusion.object.proofs[conclusion.adjective] = {
                type: subject.type,
                theorem: theorem.id,
                subject: subject.id
            };
        }
        return conclusions;
    }

    deduce(context: core.Context, options?: DeduceOptions): Conclusion[] {
        const conclusions: Conclusion[] = [];
        let updates = true; // keep track of if any theorems are applied
        while (updates) {
            updates = false;
            for (const type in context) { // for every object in the context ...
                if (options?.types && !options.types.includes(type)) continue; // skip if not in options
                for (const id in context[type]) {
                    if (options?.ids && !options.ids.includes(id)) continue; // skip if not in options
                    if (!(type in this.book.theorems))
                        continue;
                    for (const theorem of Object.values(this.book.theorems[type])) {  // ... and for every theorem of the corresponding type ...
                        const versions: core.Theorem[] = [theorem];
                        if (theorem.converse)
                            versions.push({ // add the converse theorem
                                id: theorem.id,
                                name: theorem.name,
                                type: theorem.type,
                                subject: theorem.subject,
                                conditions: theorem.conclusions, // NOTE: conditions and conclusions are reversed!
                                conclusions: theorem.conditions, // NOTE: conditions and conclusions are reversed!
                                converse: theorem.converse
                            })
                        for (const thm of versions) {
                            const cs = this.applyTheorem(thm, context, id);
                            if (cs.length > 0) {
                                conclusions.push(...cs);
                                updates = true;
                            }
                        }
                    }
                }
            }
        }
        return conclusions;
    }
};
