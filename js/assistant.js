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
            const arg_type = this.book.types[source.type].parameters[key];
            const arg_source = this.context[arg_type][source.args[key]];
            const arg_target = this.book.examples[arg_type][target.args[key]];
            if (!this.match(arg_source, arg_target))
                return false;
        }
        return true; // if no problems occurred, return true
    }
    has_match(source) {
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
                    const arg_type = this.book.types[type].parameters[key];
                    arrows.push([objects.indexOf(object), objects.indexOf(query[arg_type][object.args[key]])]);
                }
            }
        }
        // Apply [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting)
        const objects_sorted = [];
        while_loop: while (objects.some(x => x != null)) {
            for (let i = 0; i < objects.length; ++i) {
                if (objects[i] == null)
                    continue; // if object has already moved to the sorted array, continue
                if (!arrows.some(x => x[0] == i)) { // this means the i'th object has no dependencies on other objects
                    objects_sorted.unshift(objects[i]); // move from `objects` array to `objects_sorted`
                    objects[i] = null;
                    arrows = arrows.filter(x => x[1] != i); // ignore all dependencies on the i'th object
                    continue while_loop;
                }
            }
            throw new Error('Circular dependencies detected!');
        }
        // Find matches for the objects, according to the `objects_sorted` array
        const assistant = this;
        const results = [];
        function helper(matcher, i) {
            if (i == objects.length) { // if all objects have a match, return the results
                const result = {};
                Object.assign(result, matcher.map);
                results.push(result);
                return;
            }
            const source = objects_sorted[i];
            if (matcher.has_match(source)) // if the i'th object already has a match, continue with the next object
                return helper(matcher, i + 1);
            // Find possible matches for the i'th object
            for (const target of Object.values(assistant.book.examples[source.type])) {
                const matcher_copy = matcher.clone();
                if (matcher_copy.match(source, target))
                    helper(matcher_copy, i + 1);
            }
        }
        helper(new Matcher(this.book, query), 0);
        return results;
    }
    apply_theorem(theorem, context, id) {
        // check type
        const type = theorem.type;
        if (!(id in context[type]))
            throw new Error(`Cannot apply theorem '${theorem.id}': no object '${id}' of type '${type}' found`);
        const subject = context[type][id];
        // verify conditions
        for (const path in theorem.conditions) {
            const object = this.book.resolve_path(context, subject, path);
            if (object == null)
                throw new Error(`Could not resolve path '${path}' on object '${id}' of type '${type}'`);
            for (const key in theorem.conditions[path]) {
                if (!(key in object.adjectives) || object.adjectives[key] != theorem.conditions[path][key])
                    return false;
            }
        }
        // apply the conclusion
        const object = this.book.resolve_path(context, subject, theorem.conclusion.path);
        if (object == null)
            throw new Error(`Could not resolve path '${theorem.conclusion.path}' on object '${id}' of type '${type}'`);
        object.adjectives[theorem.conclusion.adjective] = theorem.conclusion.value;
        return true;
    }
    deduce(context) {
        for (const type in context) { // for every object in the context ...
            for (const id in context[type]) {
                if (!(type in this.book.theorems))
                    continue;
                const theorems = this.book.theorems[type];
                for (const thm_id in theorems) { // ... and for every theorem of the corresponding type ...
                    if (this.apply_theorem(theorems[thm_id], context, id)) // ... try to apply the theorem to the object
                        console.log(`Successfully applied theorem '${thm_id}' to '${id}'`);
                }
            }
        }
    }
}
;
//# sourceMappingURL=assistant.js.map