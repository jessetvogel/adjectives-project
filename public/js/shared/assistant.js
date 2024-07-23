export class Matcher {
    constructor(book, sourceContext, targetContext) {
        this.book = book;
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
        this.map = {};
    }
    match(source, target) {
        if (!(source.type in this.map))
            this.map[source.type] = {};
        if (target.type != source.type)
            return false;
        if (source.id in this.map[source.type])
            return this.map[source.type][source.id] == target;
        for (const adj in source.adjectives) {
            if (!(adj in target.adjectives) || target.adjectives[adj] != source.adjectives[adj])
                return false;
        }
        this.map[source.type][source.id] = target;
        for (const key in source.args) {
            const argType = this.book.types[source.type].parameters[key];
            const argSource = this.sourceContext[argType][source.args[key]];
            const argTarget = this.targetContext[argType][target.args[key]];
            if (!this.match(argSource, argTarget))
                return false;
        }
        return true;
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
    constructor(message, conclusion, proof) {
        super(message);
        this.name = 'ContradictionError';
        this.conclusion = conclusion;
        this.proof = proof;
    }
}
;
export class Assistant {
    constructor(book) {
        this.book = book;
    }
    search(query) {
        const objects = [];
        for (const type in query) {
            for (const id in query[type])
                objects.push(query[type][id]);
        }
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
        const objectsSorted = [];
        while_loop: while (objects.some(x => x != null)) {
            for (let i = 0; i < objects.length; ++i) {
                if (objects[i] == null)
                    continue;
                if (!arrows.some(x => x[0] == i)) {
                    objectsSorted.unshift(objects[i]);
                    objects[i] = null;
                    arrows = arrows.filter(x => x[1] != i);
                    continue while_loop;
                }
            }
            throw new Error('Circular dependencies detected!');
        }
        const assistant = this;
        const results = [];
        function helper(matcher, i) {
            if (i == objects.length) {
                const result = {};
                Object.assign(result, matcher.map);
                results.push(result);
                return;
            }
            const source = objectsSorted[i];
            if (matcher.hasMatch(source))
                return helper(matcher, i + 1);
            for (const target of Object.values(assistant.book.examples[source.type])) {
                const matcherCopy = matcher.clone();
                if (matcherCopy.match(source, target))
                    helper(matcherCopy, i + 1);
            }
        }
        helper(new Matcher(this.book, query, this.book.examples), 0);
        return results;
    }
    applyTheorem(theorem, context, id, converse = false) {
        var _a, _b, _c;
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);
        const subject = context[type][id];
        if (converse && !theorem.converse)
            throw new Error(`Converse of theorem '${theorem.id}' of type '${theorem.type}' does not hold`);
        const theoremConditions = (converse ? theorem.conclusions : theorem.conditions);
        const theoremConclusions = (converse ? theorem.conditions : theorem.conclusions);
        let conditionsThatHoldCount = 0;
        let conditionsCount = 0;
        let conditionThatDoesNotHold = null;
        let conclusionThatWasFalse = null;
        for (const path in theoremConditions) {
            const object = this.book.resolvePath(context, subject, path);
            for (const adjective in theoremConditions[path]) {
                ++conditionsCount;
                const value = (_a = object.adjectives) === null || _a === void 0 ? void 0 : _a[adjective];
                if (value !== theoremConditions[path][adjective]) {
                    conditionThatDoesNotHold = { path, adjective };
                }
                else {
                    ++conditionsThatHoldCount;
                }
            }
        }
        let conclusionsArePossible = true;
        l: for (const path in theoremConclusions) {
            const object = this.book.resolvePath(context, subject, path);
            for (const adjective in theoremConclusions[path]) {
                const value = (_b = object.adjectives) === null || _b === void 0 ? void 0 : _b[adjective];
                if (value === !theoremConclusions[path][adjective]) {
                    conclusionsArePossible = false;
                    conclusionThatWasFalse = { path, adjective };
                    break l;
                }
            }
        }
        const conclusions = [];
        if (conditionsThatHoldCount == conditionsCount) {
            for (const path in theoremConclusions) {
                const object = this.book.resolvePath(context, subject, path);
                for (const adjective in theoremConclusions[path]) {
                    const value = theoremConclusions[path][adjective];
                    if (adjective in object.adjectives && object.adjectives[adjective] != value)
                        throw new ContradictionError(`in applying theorem '${theorem.id}' to object '${subject.id}' of type '${type}'`, { object, adjective, value }, { type, theorem: theorem.id, subject: subject.id, converse });
                    if (!(adjective in object.adjectives))
                        conclusions.push({ object, adjective, value });
                }
            }
        }
        else if (!conclusionsArePossible && conditionsThatHoldCount == conditionsCount - 1 && conditionThatDoesNotHold != null) {
            const object = this.book.resolvePath(context, subject, conditionThatDoesNotHold.path);
            const adjective = conditionThatDoesNotHold.adjective;
            const value = !theoremConditions[conditionThatDoesNotHold.path][adjective];
            if (((_c = object.adjectives) === null || _c === void 0 ? void 0 : _c[adjective]) == value)
                return [];
            conclusions.push({ object, adjective, value });
        }
        for (const conclusion of conclusions) {
            conclusion.object.adjectives[conclusion.adjective] = conclusion.value;
            const proof = {
                type: subject.type,
                theorem: theorem.id,
                subject: subject.id,
            };
            if (converse)
                proof.converse = converse;
            if (conclusionThatWasFalse != null)
                proof.negated = conclusionThatWasFalse;
            conclusion.object.proofs[conclusion.adjective] = proof;
        }
        return conclusions;
    }
    deduce(context, options) {
        const conclusions = [];
        let updates = true;
        while (updates) {
            updates = false;
            for (const type in context) {
                if ((options === null || options === void 0 ? void 0 : options.types) && !options.types.includes(type))
                    continue;
                for (const id in context[type]) {
                    if ((options === null || options === void 0 ? void 0 : options.ids) && !options.ids.includes(id))
                        continue;
                    if (!(type in this.book.theorems))
                        continue;
                    for (const theorem of Object.values(this.book.theorems[type])) {
                        if ((options === null || options === void 0 ? void 0 : options.excludeTheorems) && options.excludeTheorems.includes(theorem))
                            continue;
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
}
;
