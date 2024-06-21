import { Book, Context, Example, Theorem, Proof } from './core.js';

export class Matcher {

    book: Book;
    sourceContext: Context;
    targetContext: Context;
    map: Context;

    constructor(book: Book, sourceContext: Context, targetContext: Context) {
        this.book = book;
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
        this.map = {};
    }

    match(source: Example, target: Example): boolean {
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

    hasMatch(source: Example): boolean {
        return (source.type in this.map && source.id in this.map[source.type]);
    }

    clone(): Matcher {
        const copy = new Matcher(this.book, this.sourceContext, this.targetContext);
        for (const id in this.map)
            copy.map[id] = this.map[id];
        return copy;
    }

};

export type Conclusion = { object: Example, adjective: string, value: boolean };
export type DeduceOptions = { types?: string[], ids?: string[], excludeTheorems?: Theorem[] };

export class ContradictionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContradictionError';
    }
};

export class Assistant {

    book: Book;

    constructor(book: Book) {
        this.book = book;
    }

    search(query: Context): Context[] {
        // collect all objects of the query in an array
        const objects: (Example | null)[] = [];
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
        const objectsSorted: Example[] = [];
        while_loop: while (objects.some(x => x != null)) {
            for (let i = 0; i < objects.length; ++i) {
                if (objects[i] == null) continue; // if object has already moved to the sorted array, continue
                if (!arrows.some(x => x[0] == i)) { // this means the i'th object has no dependencies on other objects
                    objectsSorted.unshift(objects[i] as Example); // move from `objects` array to `objects_sorted`
                    objects[i] = null;
                    arrows = arrows.filter(x => x[1] != i); // ignore all dependencies on the i'th object
                    continue while_loop;
                }
            }
            throw new Error('Circular dependencies detected!');
        }

        // find matches for the objects, according to the `objectsSorted` array
        const assistant: Assistant = this;
        const results: Context[] = [];

        function helper(matcher: Matcher, i: number): void {
            if (i == objects.length) { // if all objects have a match, return the results
                const result: Context = {};
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

    applyTheorem(theorem: Theorem, context: Context, id: string, converse: boolean = false): Conclusion[] {
        // check type
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);

        const subject = context[type][id];

        // switch conditions and conclusions if we should apply the converse
        if (converse && !theorem.converse) throw new Error(`Converse of theorem '${theorem.id}' of type '${theorem.type}' does not hold`);
        const theoremConditions = (converse ? theorem.conclusions : theorem.conditions);
        const theoremConclusions = (converse ? theorem.conditions : theorem.conclusions);

        // check the conditions (if there is one that does not hold)
        let conditionsThatHoldCount: number = 0;
        let conditionsCount: number = 0;
        let conditionThatDoesNotHold: { path: string, adjective: string } | null = null;
        for (const path in theoremConditions) {
            const object = this.book.resolvePath(context, subject, path);
            for (const adjective in theoremConditions[path]) {
                ++conditionsCount;
                const value = object.adjectives?.[adjective];
                if (value !== theoremConditions[path][adjective]) {
                    conditionThatDoesNotHold = { path, adjective };
                }
                else {
                    ++conditionsThatHoldCount;
                }
            }
        }

        // check the conclusions (if there is one that is actually false)
        let conclusionsArePossible: boolean = true;
        l: for (const path in theoremConclusions) {
            const object = this.book.resolvePath(context, subject, path);
            for (const adjective in theoremConclusions[path]) {
                const value = object.adjectives?.[adjective];
                if (value === !theoremConclusions[path][adjective]) {
                    conclusionsArePossible = false;
                    break l;
                }
            }
        }

        const conclusions: Conclusion[] = [];

        // If all the conditions hold, we can apply the theorem (in the forward direction) to arrive at the conclusion! (Watch out for contradictions though!)
        if (conditionsThatHoldCount == conditionsCount) {
            for (const path in theoremConclusions) {
                const object = this.book.resolvePath(context, subject, path);
                for (const adjective in theoremConclusions[path]) {
                    const value = theoremConclusions[path][adjective];
                    if (adjective in object.adjectives && object.adjectives[adjective] != value)
                        throw new ContradictionError(`in applying theorem '${theorem.id}' to object '${subject.id}' of type '${type}'`);
                    // console.log(`🚨 Contradiction: in applying theorem '${theorem.id}' to object '${subject.id}' of type '${type}'`);
                    if (!(adjective in object.adjectives)) // only push the conclusions that are new
                        conclusions.push({ object, adjective, value });
                }
            }
        }

        // If there is a faulty conclusion, and all BUT ONE conditions hold, we can apply the theorem (in the backwards direction) to conclude the remaining condition must be false!
        else if (!conclusionsArePossible && conditionsThatHoldCount == conditionsCount - 1 && conditionThatDoesNotHold != null) {
            const object = this.book.resolvePath(context, subject, conditionThatDoesNotHold.path);
            const adjective = conditionThatDoesNotHold.adjective;
            const value = !theoremConditions[conditionThatDoesNotHold.path][adjective]; // NOTE: invert the boolean
            if (object.adjectives?.[adjective] == value) // If the conclusion was already known, simply return an empty list of conclusions
                return [];
            conclusions.push({ object, adjective, value });
        }

        // Apply the conclusions and return them
        for (const conclusion of conclusions) {
            conclusion.object.adjectives[conclusion.adjective] = conclusion.value;
            const proof: Proof = {
                type: subject.type,
                theorem: theorem.id,
                subject: subject.id,
            };
            if (converse) proof.converse = converse; // indicate we have applied the theorem backwards
            if (conditionThatDoesNotHold != null) proof.negated = conditionThatDoesNotHold; // indicate that we have applied the negation of the theorem, and which conclusion was false
            conclusion.object.proofs[conclusion.adjective] = proof;
        }

        return conclusions;
    }

    deduce(context: Context, options?: DeduceOptions): Conclusion[] {
        const conclusions: Conclusion[] = [];
        let updates = true; // keep track of if any theorems are applied
        while (updates) {
            updates = false;
            for (const type in context) { // for every object in the context ...
                if (options?.types && !options.types.includes(type)) continue; // skip if not in options
                for (const id in context[type]) {
                    if (options?.ids && !options.ids.includes(id)) continue; // skip if not in options
                    if (!(type in this.book.theorems)) continue;
                    for (const theorem of Object.values(this.book.theorems[type])) {  // ... and for every theorem of the corresponding type ...
                        if (options?.excludeTheorems && options.excludeTheorems.includes(theorem)) continue;

                        const cs = this.applyTheorem(theorem, context, id);
                        if (cs.length > 0) {
                            conclusions.push(...cs);
                            updates = true;
                        }

                        if (theorem.converse) {
                            const cs = this.applyTheorem(theorem, context, id, true);
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
