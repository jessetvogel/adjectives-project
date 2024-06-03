export class Book {
    constructor(contents = {}) {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
        this.initialize(contents);
    }
    initialize(contents) {
        for (const id in contents) {
            const data = (Array.isArray(contents[id])) ? contents[id] : [contents[id]];
            for (const x of data)
                this.add(id, x);
        }
    }
    deserialize_type(id, data) {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const parameters = ('parameters' in data) ? data.parameters : {}; // fallback to empty set of parameters if none are given
        // const description = ('description' in data) ? data.description.toString() : null;
        // TODO: check if parameter keys are [\w\-]+
        return { id, name, parameters };
    }
    serialize_type(type) {
        return {
            type: 'type',
            name: type.name,
            parameters: type.parameters
        };
    }
    deserialize_theorem(id, data) {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        // const description = ('description' in data) ? data.description.toString() : null;
        // parse subject
        if (!('given' in data) || typeof data.given != 'string')
            throw new Error(`Missing field 'given' in theorem '${id}'`);
        const subject_parts = data.given.split(' ');
        if (subject_parts.length != 2)
            throw new Error(`Invalid field 'given' in theorem '${id}'`);
        const subject_type = subject_parts[0];
        const subject_name = subject_parts[1];
        if (!(subject_type in this.theorems))
            this.theorems[subject_type] = {};
        if (id in this.theorems[subject_type])
            throw new Error(`Theorem with id '${id}' for type '${subject_type}' already exists`);
        // parse theorem conditions
        const data_if = ('if' in data) ? (typeof data.if == 'string' ? [data.if] : data.if) : [];
        if (!Array.isArray(data_if))
            throw new Error(`Invalid field 'if' in theorem '${id}'`);
        const conditions = {};
        for (const condition of data_if) {
            if (typeof condition != 'string')
                throw new Error(`Invalid condition '${condition}' in theorem '${id}'`);
            const condition_parts = condition.split(' ');
            if (condition_parts.length != 2 && !(condition_parts.length == 3 && condition_parts[1] == 'not'))
                throw new Error(`Invalid condition '${condition}' in theorem '${id}'`);
            const full_path = condition_parts[0];
            const adjective = (condition_parts.length == 2) ? condition_parts[1] : condition_parts[2];
            const value = (condition_parts.length == 2) ? true : false;
            if (!full_path.startsWith(subject_name))
                throw new Error(`Invalid path '${full_path}' (should start with '${subject_name}') in theorem '${id}'`);
            const path = full_path.substring(subject_name.length);
            if (!(path in conditions))
                conditions[path] = {};
            if (adjective in conditions[path])
                throw new Error(`Multiple conditions on adjective '${adjective}' of '${path}' in theorem '${id}'`);
            conditions[path][adjective] = value;
        }
        // parse conclusion
        if (!('then' in data))
            throw new Error(`Missing field 'then' in theorem '${id}'`);
        const then = data.then;
        if (typeof then != 'string')
            throw new Error(`Invalid field 'then' in theorem '${id}'`);
        const then_parts = then.split(' ');
        if (!then_parts[0].startsWith(subject_name))
            throw new Error(`Invalid path '${then_parts[0]}' (should start with '${subject_name}') in theorem '${id}'`);
        then_parts[0] = then_parts[0].substring(subject_name.length);
        const conclusion = (then_parts.length == 2)
            ? { path: then_parts[0], adjective: then_parts[1], value: true }
            : ((then_parts.length == 3 && then_parts[1] != 'not') ? { path: then_parts[0], adjective: then_parts[2], value: false } : null);
        if (conclusion == null)
            throw new Error(`Invalid conclusion '${then}' in theorem '${id}'`);
        return { id, name, type: subject_type, conditions, conclusion };
    }
    serialize_theorem(theorem) {
        const name = 'x';
        function conditions_for_path(path) {
            const conditions = [];
            for (const adj in theorem.conditions[path]) {
                const value = theorem.conditions[path][adj];
                conditions.push(`${name}${path}${value ? ' ' : ' not '}${adj}`);
            }
            return conditions;
        }
        return {
            type: 'theorem',
            name: theorem.name,
            given: theorem.type + ' ' + name,
            if: Object.keys(theorem.conditions).map(conditions_for_path).flat(),
            then: `${name}${theorem.conclusion.path}${theorem.conclusion.value ? ' ' : ' not'}${theorem.conclusion.adjective}`
        };
    }
    deserialize_adjective(id, data) {
        const type_base = data.type.replace(/ adjective$/, '');
        if (!(type_base in this.adjectives))
            this.adjectives[type_base] = {};
        if (id in this.adjectives[type_base])
            throw new Error(`Adjective with id '${id}' for type '${type_base}' already exists`);
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given            
        // const description = ('description' in data) ? data.description.toString() : null;
        return { id, type: type_base, name };
    }
    serialize_adjective(adjective) {
        return {
            type: `${adjective.type} adjective`,
            name: adjective.name,
        };
    }
    deserialize_example(id, data) {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const args = ('with' in data) ? data.with : {}; // fallback to empty set of arguments if none are given
        const adjectives = ('adjectives' in data) ? data.adjectives : {}; // fallback to empty set of adjectives if none are given
        // const description = ('description' in data) ? data.description.toString() : null;
        for (const key in adjectives) {
            const value = (typeof adjectives[key] == 'boolean')
                ? adjectives[key] : ((Array.isArray(adjectives[key]) && adjectives[key].length == 2 && typeof adjectives[key][0] == 'boolean') ? adjectives[key][0] : null);
            if (value == null)
                throw new Error(`Example with id '${id}' for type '${data.type}' has invalid value for adjective ${key}`);
            adjectives[key] = value;
        }
        // TODO: check if arguments and adjectives keys are [\w\-]+
        return { id, type: data.type, name, args, adjectives };
    }
    serialize_example(example) {
        return {
            type: example.type,
            name: example.name,
            with: example.args,
            adjectives: example.adjectives
        };
    }
    add(id, data) {
        if (!('type' in data) || typeof data.type != 'string')
            throw new Error(`Missing field type for id '${id}'`);
        if (!id.match(/^[\w\-]+$/)) // make sure `id` is alphanumeric possibly with dashses
            throw new Error(`Invalid id '${id}'`);
        const type = data.type;
        if (type == 'type') { // parse types
            if (id in this.types)
                throw new Error(`Type with id '${id}' already exists`);
            this.types[id] = this.deserialize_type(id, data);
            return;
        }
        if (type == 'theorem') { // parse theorems
            const theorem = this.deserialize_theorem(id, data);
            if (!(theorem.type in this.theorems))
                this.theorems[theorem.type] = {};
            if (id in this.theorems[theorem.type])
                throw new Error(`Theorem with id '${id}' for type '${theorem.type}' already exists`);
            this.theorems[theorem.type][id] = theorem;
            return;
        }
        if (type.endsWith(' adjective')) { // parse adjective
            const adjective = this.deserialize_adjective(id, data);
            if (!(adjective.type in this.adjectives))
                this.adjectives[adjective.type] = {};
            if (id in this.adjectives[adjective.type])
                throw new Error(`Adjective with id '${id}' for type '${adjective.type}' already exists`);
            this.adjectives[adjective.type][id] = adjective;
            return;
        }
        { // parse examples
            const example = this.deserialize_example(id, data);
            if (!(type in this.examples))
                this.examples[type] = {};
            if (id in this.examples[type])
                throw new Error(`Example with id '${id}' for type '${type}' already exists`);
            this.examples[type][id] = example;
        }
    }
    verify() {
        for (const id in this.types) { // verify types
            const type = this.types[id];
            for (const key in type.parameters) {
                const param_type = type.parameters[key];
                if (!(param_type in this.types))
                    throw new Error(`Type '${id}' refers to unknown type '${param_type}'`);
            }
        }
        for (const type in this.adjectives) { // verify adjectives
            for (const id in this.adjectives[type]) {
                const adjective = this.adjectives[type][id];
                if (adjective.type != type)
                    throw new Error(`Mysterious mismatch for type of adjective '${id}' ('${adjective.type}' != '${type}')`);
                if (!(adjective.type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
            }
        }
        for (const type in this.theorems) { // verify theorems
            for (const id in this.theorems[type]) {
                const theorem = this.theorems[type][id];
                if (theorem.type != type)
                    throw new Error(`Mysterious mismatch for type of theorem '${id}' ('${theorem.type}' != '${type}')`);
                if (!(theorem.type in this.types))
                    throw new Error(`Theorem '${id}' refers to unknown type '${type}'`);
                for (const path in theorem.conditions) { // verify theorem conditions
                    const path_type = this.resolve_path_type(theorem.type, path);
                    if (path_type == null)
                        throw new Error(`Theorem '${id}' refers to invalid path '${path}' in its conditions`);
                    for (const key in theorem.conditions[path]) {
                        if (!(key in this.adjectives[path_type]))
                            throw new Error(`Theorem '${id}' refers to unknown adjective '${key}' for '${path}' of type '${path_type}'`);
                    }
                }
                // verify theorem conclusion
                const conclusion_path_type = this.resolve_path_type(theorem.type, theorem.conclusion.path);
                if (conclusion_path_type == null)
                    throw new Error(`Theorem '${id}' refers to invalid path '${theorem.conclusion.path}' in its conclusion`);
                if (!(theorem.conclusion.adjective in this.adjectives[conclusion_path_type]))
                    throw new Error(`Theorem '${id}' refers to unknown adjective '${theorem.conclusion.adjective}' for '${theorem.conclusion.path}' of type '${conclusion_path_type}'`);
            }
        }
        for (const type in this.examples) { // verify examples
            for (const id in this.examples[type]) {
                const example = this.examples[type][id];
                // verify type
                if (example.type != type)
                    throw new Error(`Mysterious mismatch for type of example '${id}' ('${example.type}' != '${type}')`);
                if (!(type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
                // verify arguments
                const parameters = this.types[type].parameters;
                for (const key in parameters) {
                    if (!(key in example.args))
                        throw new Error(`Missing argument '${key}' for example '${id}' of type '${type}'`);
                    const arg = example.args[key];
                    if (!(arg in this.examples[parameters[key]])) // note: `parameters[key]` is already verified to be a correct type
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown example '${arg}' of type '${parameters[key]}'`);
                }
                // verify adjectives
                for (const adj in example.adjectives) {
                    if (!(adj in this.adjectives[type]))
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown adjective '${adj}'`);
                }
            }
        }
        return true;
    }
    resolve_path_type(type, path) {
        const path_parts = path.split('.');
        for (let i = 0; i < path_parts.length; ++i) {
            if (i == 0 && path_parts[0] != '')
                return null;
            if (i > 0 && !(path_parts[i] in this.types[type].parameters))
                return null;
            if (i > 0)
                type = this.types[type].parameters[path_parts[i]];
        }
        return type;
    }
    resolve_path(context, object, path) {
        const path_parts = path.split('.');
        for (let i = 0; i < path_parts.length; ++i) {
            if (i == 0 && path_parts[0] != '')
                return null;
            if (i > 0 && !(path_parts[i] in this.types[object.type].parameters))
                return null;
            if (i > 0 && !(path_parts[i] in object.args))
                throw new Error(`Mysteriously missing argument '${path_parts[i]}' in '${object.id}' of type '${object.type}'`);
            if (i > 0) {
                const arg_type = this.types[object.type].parameters[path_parts[i]];
                object = context[arg_type][object.args[path_parts[i]]];
            }
        }
        return object;
    }
    serialize() {
        const contents = {};
        function contents_add(id, data) {
            if (!(id in contents))
                contents[id] = [];
            contents[id].push(data);
        }
        for (const id in this.types) // add types
            contents_add(id, this.serialize_type(this.types[id]));
        for (const type in this.adjectives) // add adjectives
            for (const id in this.adjectives[type])
                contents_add(id, this.serialize_adjective(this.adjectives[type][id]));
        for (const type in this.theorems) // add theorems
            for (const id in this.theorems[type])
                contents_add(id, this.serialize_theorem(this.theorems[type][id]));
        for (const type in this.examples) // add examples
            for (const id in this.examples[type])
                contents_add(id, this.serialize_example(this.examples[type][id]));
        return contents;
    }
}
;
//# sourceMappingURL=core.js.map