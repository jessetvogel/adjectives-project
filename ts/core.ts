export type Type = {
    id: string, // morphism
    name: string, // morphism
    parameters: { [key: string]: string } // { source: scheme, target: scheme }
};

export type Adjective = {
    id: string,   // closed-immersion 
    type: string, // morphism
    name: string, // closed immersion
};

type TheoremConditions = { [path: string]: { [id: string]: boolean } };
type TheoremConclusion = { path: string, adjective: string, value: boolean };

export type Theorem = {
    id: string,   // qc_of_af
    name: string, // affine schemes are quasi-compact
    type: string, // scheme
    conditions: TheoremConditions, // { '': { adjectives: { affine: true } } }
    conclusion: TheoremConclusion  // { path: '', adjective: 'quasi-compact', value: true }
};

export type Example = { // TODO: rename to Object or so ?
    id: string,   // Spec_ZZ_to_Spec_QQ
    type: string, // morphism
    name: string, // Spec ZZ to Spec QQ
    args: { [key: string]: string }, // { source: Spec QQ, target: Spec ZZ }
    adjectives: { [id: string]: boolean }
};

export type Context = { [type: string]: { [id: string]: Example } };

export class Book {
    types: { [id: string]: Type };
    adjectives: { [type: string]: { [id: string]: Adjective } };
    theorems: { [type: string]: { [id: string]: Theorem } };
    examples: Context;

    constructor() {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
    }

    addMultiple(array: [string, any][]) { // add data indexed by id
        for (const item of array)
            this.add(item[0], item[1]);
    }

    add(id: string, data: any): void { // add some data to the book, automatically detects whether it is a `Type`, `Adjective`, `Theorem` or `Example`
        if (!('type' in data) || typeof data.type != 'string')
            throw new Error(`Missing field type for id '${id}'`);

        if (!id.match(/^[\w\-]+$/)) // make sure `id` is alphanumeric possibly with dashses
            throw new Error(`Invalid id '${id}'`);

        const type = data.type as string;

        if (type == 'type') { // parse types
            if (id in this.types)
                throw new Error(`Type with id '${id}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
            const parameters = ('parameters' in data) ? data.parameters : {}; // fallback to empty set of parameters if none are given

            // TODO: check if parameter keys are [\w\-]+

            this.types[id] = { id, name, parameters };
            return;
        }

        if (type == 'theorem') { // parse theorems
            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given

            // parse subject
            if (!('given' in data) || typeof data.given != 'string')
                throw new Error(`Missing field 'given' in theorem '${id}'`);
            const subject_parts = (data.given as string).split(' ');
            if (subject_parts.length != 2)
                throw new Error(`Invalid field 'given' in theorem '${id}'`);
            const subject_type = subject_parts[0];
            const subject_name = subject_parts[1];
            if (!(subject_type in this.theorems)) this.theorems[subject_type] = {};
            if (id in this.theorems[subject_type])
                throw new Error(`Theorem with id '${id}' for type '${subject_type}' already exists`);

            // parse theorem conditions
            const data_if = ('if' in data) ? (typeof data.if == 'string' ? [data.if] : data.if) : [];
            if (!Array.isArray(data_if))
                throw new Error(`Invalid field 'if' in theorem '${id}'`);
            const conditions: TheoremConditions = {};
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
                if (!(path in conditions)) conditions[path] = {};
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
            const conclusion: TheoremConclusion | null = (then_parts.length == 2)
                ? { path: then_parts[0], adjective: then_parts[1], value: true }
                : ((then_parts.length == 3 && then_parts[1] != 'not') ? { path: then_parts[0], adjective: then_parts[2], value: false } : null);
            if (conclusion == null)
                throw new Error(`Invalid conclusion '${then}' in theorem '${id}'`);

            // store theorem
            this.theorems[subject_type][id] = { id, name, type: subject_type, conditions, conclusion };
            return;
        }

        const parts = type.split(' ');

        if (parts.length == 2 && parts[1] == 'adjective') { // parse adjectives
            const type_base = parts[0];
            if (!(type_base in this.adjectives)) this.adjectives[type_base] = {};

            if (id in this.adjectives[type_base])
                throw new Error(`Adjective with id '${id}' for type '${type_base}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given            

            // store adjective
            this.adjectives[type_base][id] = { id, type: type_base, name };
            return;
        }

        if (parts.length == 1) { // parse examples
            if (!(type in this.examples)) this.examples[type] = {};

            if (id in this.examples[type])
                throw new Error(`Example with id '${id}' for type '${type}' already exists`);

            const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
            const args = ('arguments' in data) ? data.arguments : {}; // fallback to empty set of arguments if none are given
            const adjectives = ('adjectives' in data) ? data.adjectives : {}; // fallback to empty set of adjectives if none are given

            for (const key in adjectives) {
                const value: boolean | null = (typeof adjectives[key] == 'boolean')
                    ? adjectives[key] : ((Array.isArray(adjectives[key]) && adjectives[key].length == 2 && typeof adjectives[key][0] == 'boolean') ? adjectives[key][0] : null);
                if (value == null)
                    throw new Error(`Example with id '${id}' for type '${type}' has invalid value for adjective ${key}`);
                adjectives[key] = value;
            }


            // TODO: check if arguments and adjectives keys are [\w\-]+

            this.examples[type][id] = { id, type, name, args, adjectives };
            return;
        }

        throw new Error(`Unknown type ''`);
    }

    verify(): boolean { // checks if all references in the book are correct
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

    resolve_path_type(type: string, path: string): string | null { // e.g. `resolve_path_type('morphism', '.source') = 'scheme'`
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

    resolve_path(context: Context, object: Example, path: string): Example | null {
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
};

export function sum(a: number, b: number): number {
    return a + b;
}
