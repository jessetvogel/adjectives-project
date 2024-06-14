export type Type = {
    id: string, // morphism
    name: string, // morphism
    parameters: { [key: string]: string }, // { source: scheme, target: scheme }
};

export type Adjective = {
    id: string, // closed-immersion 
    type: string, // morphism
    name: string, // closed immersion
};

export type TheoremConditions = { [path: string]: { [id: string]: boolean } };

export type Theorem = {
    id: string,   // qc_of_af
    name: string, // affine schemes are quasi-compact
    type: string, // scheme
    subject: string, // X
    conditions: TheoremConditions, // { '': { affine: true } }
    conclusions: TheoremConditions  // { '': { 'quasi-compact': true } }
};

export type Proof = {
    type: string, // type of subject to which the theorem is applied
    theorem: string, // id of theorem which is applied
    subject: string, // id of subject to which it is applied
};

export type Example = {
    id: string, // Spec_ZZ_to_Spec_QQ
    type: string, // morphism
    name: string, // Spec ZZ to Spec QQ
    args: { [key: string]: string }, // { source: Spec QQ, target: Spec ZZ }
    adjectives: { [id: string]: boolean }, // { integral: true }
    proofs: { [id: string]: string | Proof } // { integral: "The ring $\ZZ$ is a domain." }
};

export type Context = { [type: string]: { [id: string]: Example } };

export type BookContents = {
    types: { [id: string]: any },
    adjectives: { [type: string]: { [id: string]: any } },
    theorems: { [type: string]: { [id: string]: any } },
    examples: { [type: string]: { [id: string]: any } },
};

export class Book {
    types: { [id: string]: Type };
    adjectives: { [type: string]: { [id: string]: Adjective } };
    theorems: { [type: string]: { [id: string]: Theorem } };
    examples: Context;

    descriptions: {
        types: { [id: string]: string },
        adjectives: { [type: string]: { [id: string]: string } },
        theorems: { [type: string]: { [id: string]: string } },
        examples: { [type: string]: { [id: string]: string } }
    };

    constructor(contents: BookContents | null = null) {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
        this.descriptions = { types: {}, adjectives: {}, theorems: {}, examples: {} };

        if (contents != null)
            this.initialize(contents);
    }

    initialize(contents: BookContents) {
        for (const id in contents.types)
            this.add(id, contents.types[id]);
        for (const type in contents.adjectives)
            for (const id in contents.adjectives[type])
                this.add(id, contents.adjectives[type][id]);
        for (const type in contents.theorems)
            for (const id in contents.theorems[type])
                this.add(id, contents.theorems[type][id]);
        for (const type in contents.examples)
            for (const id in contents.examples[type])
                this.add(id, contents.examples[type][id]);
    }

    allKeysAreWords(object: object): boolean {
        return typeof object == 'object' && !Object.keys(object).some(x => x.match(/^[\w\-]+$/) == null);
    }

    deserializeType(id: string, data: any): Type {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const parameters = ('parameters' in data) ? data.parameters : {}; // fallback to empty set of parameters if none are given

        // verify parameter keys
        if (!this.allKeysAreWords(parameters)) throw new Error(`Invalid parameters in type '${id}'`);

        return { id, name, parameters };
    }

    serializeType(type: Type, elaborate: boolean = false): any {
        const data: any = {
            type: 'type',
            name: type.name
        }
        if (Object.keys(type.parameters).length > 0)
            data.parameters = type.parameters;
        if (elaborate && type.id in this.descriptions.types)  // add description when elaborate is true
            data.description = this.descriptions.types[type.id];
        return data;
    }

    deserializeTheorem(id: string, data: any): Theorem {
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given

        // parse subject
        if (!('given' in data) || typeof data.given != 'string')
            throw new Error(`Missing field 'given' in theorem '${id}'`);
        const subjectParts = (data.given as string).split(' ');
        if (subjectParts.length != 2)
            throw new Error(`Invalid field 'given' in theorem '${id}'`);
        const type = subjectParts[0];
        const subject = subjectParts[1];
        if (!(type in this.theorems)) this.theorems[type] = {};
        if (id in this.theorems[type])
            throw new Error(`Theorem with id '${id}' for type '${type}' already exists`);

        // parse theorem conditions and conclusions
        function parseTheoremConditions(exprs: string[], kind: 'condition' | 'conclusion'): TheoremConditions {
            const conditions: TheoremConditions = {};
            if (!Array.isArray(exprs))
                throw new Error(`Invalid ${kind}s in theorem '${id}'`);
            for (const condition of exprs) {
                if (typeof condition != 'string')
                    throw new Error(`Invalid ${kind} '${condition}' in theorem '${id}'`);
                const conditionParts = condition.split(' ');
                if (conditionParts.length != 2 && !(conditionParts.length == 3 && conditionParts[1] == 'not'))
                    throw new Error(`Invalid ${kind} '${condition}' in theorem '${id}'`);
                const fullPath = conditionParts[0];
                const adjective = (conditionParts.length == 2) ? conditionParts[1] : conditionParts[2];
                const value = (conditionParts.length == 2) ? true : false;
                if (!fullPath.startsWith(subject))
                    throw new Error(`Invalid path '${fullPath}' (should start with '${subject}') in theorem '${id}'`);
                const path = fullPath.substring(subject.length);
                if (!(path in conditions)) conditions[path] = {};
                if (adjective in conditions[path])
                    throw new Error(`Multiple ${kind}s on adjective '${adjective}' of '${path}' in theorem '${id}'`);
                conditions[path][adjective] = value;
            }
            return conditions;
        }

        if (!('then' in data))
            throw new Error(`Missing field 'then' in theorem '${id}'`);
        if (!Array.isArray(data.then) && typeof data.then != 'string')
            throw new Error(`Invalid field 'then' in theorem '${id}'`);

        const conditions = parseTheoremConditions(('if' in data) ? (typeof data.if == 'string' ? [data.if] : data.if) : [], 'condition');
        const conclusions = parseTheoremConditions(typeof data.then == 'string' ? [data.then] : data.then, 'conclusion');

        return { id, name, type, subject, conditions, conclusions };
    }

    serializeTheorem(theorem: Theorem, elaborate: boolean = false): any {
        function formatCondition(conditions: TheoremConditions, path: string): string[] {
            const out: string[] = [];
            if (path in conditions) {
                for (const adjId in conditions[path]) {
                    const value = conditions[path][adjId];
                    out.push(`${theorem.subject}${path}${value ? ' ' : ' not '}${adjId}`);
                }
            }
            return out;
        }

        function formatConditions(conditions: TheoremConditions): string | string[] { // returns string if only one condition, otherwise an array
            const formatted = Object.keys(conditions).map(path => formatCondition(conditions, path)).flat();
            return (formatted.length == 1) ? formatted[0] : formatted;
        }

        const data: any = {
            type: 'theorem',
            name: theorem.name,
            given: theorem.type + ' ' + theorem.subject,
            if: formatConditions(theorem.conditions),
            then: formatConditions(theorem.conclusions)
        };

        if (elaborate && theorem.type in this.descriptions.theorems && theorem.id in this.descriptions.theorems[theorem.type])  // add description when elaborate is true
            data.description = this.descriptions.theorems[theorem.type][theorem.id];

        return data;
    }

    deserializeAdjective(id: string, data: any): Adjective {
        const type = (data.type as string).replace(/ adjective$/, '');
        if (!(type in this.adjectives)) this.adjectives[type] = {};

        if (id in this.adjectives[type])
            throw new Error(`Adjective with id '${id}' for type '${type}' already exists`);

        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given            

        return { id, type: type, name };
    }

    serializeAdjective(adjective: Adjective, elaborate: boolean = false): any {
        const data: any = {
            type: `${adjective.type} adjective`,
            name: adjective.name,
        };
        if (elaborate && adjective.type in this.descriptions.adjectives && adjective.id in this.descriptions.adjectives[adjective.type])  // add description when elaborate is true
            data.description = this.descriptions.adjectives[adjective.type][adjective.id];
        return data;
    }

    deserializeExample(id: string, data: any): Example {
        const type = data.type;
        const name = ('name' in data) ? data.name : id; // fallback to `id` if no name is given
        const args = ('with' in data) ? data.with : {}; // fallback to empty set of arguments if none are given
        const adjectives = ('adjectives' in data) ? data.adjectives : {}; // fallback to empty set of adjectives if none are given
        const proofs: { [id: string]: string | Proof } = {};

        // parse adjectives
        // NOTE: adjective values may be 'boolean' (usually) or '[boolean, string]' where the string is the proof. We split them.
        //       May also be [boolean], because David liked to do so.
        for (const key in adjectives) {
            const value = adjectives[key];
            if (typeof value == 'boolean') { }
            else if (Array.isArray(value) && value.length == 2 && typeof value[0] == 'boolean' && typeof value[1] == 'string') {
                adjectives[key] = value[0];
                proofs[key] = value[1].trim();
            } else if (Array.isArray(value) && value.length == 1 && typeof value[0] == 'boolean') {
                adjectives[key] = value[0];
            } else throw new Error(`Example with id '${id}' for type '${data.type}' has invalid value for adjective '${key}'`);
        }

        // parse proofs
        if ('proofs' in data) {
            for (const key in data.proofs) {
                const proof = data.proofs[key];
                if (typeof proof == 'string') {
                    proofs[key] = proof;
                } else {
                    if (!('type' in proof) || !('theorem' in proof) || !('subject' in proof))
                        throw new Error(`Example with id '${id}' for type '${data.type}' has invalid proof for adjective '${key}'`);
                    proofs[key] = { type: proof.type, theorem: proof.theorem, subject: proof.subject };
                }
            }
        }

        // check if keys are words
        if (!this.allKeysAreWords(args)) throw new Error(`Invalid arguments in example '${id}' of type '${type}'`);
        if (!this.allKeysAreWords(adjectives)) throw new Error(`Invalid adjectives in example '${id}' of type '${type}'`);
        if (!this.allKeysAreWords(proofs)) throw new Error(`Invalid proofs in example '${id}' of type '${type}'`);

        return { id, type, name, args, adjectives, proofs };
    }

    serializeExample(example: Example, elaborate: boolean = false): any {
        const data: any = {
            type: example.type,
            name: example.name
        }
        if (Object.keys(example.args).length > 0)
            data.with = example.args;
        if (Object.keys(example.adjectives).length > 0)
            data.adjectives = example.adjectives;
        if (elaborate && Object.keys(example.proofs).length > 0)
            data.proofs = example.proofs;

        if (elaborate) { // add description when elaborate is true
            if (example.type in this.descriptions.examples && example.id in this.descriptions.examples[example.type])
                data.description = this.descriptions.examples[example.type][example.id];
        }
        return data;
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

            this.types[id] = this.deserializeType(id, data);

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null)
                this.descriptions.types[id] = description;

            return;
        }

        if (type == 'theorem') { // parse theorems
            const theorem = this.deserializeTheorem(id, data);

            if (!(theorem.type in this.theorems))
                this.theorems[theorem.type] = {};

            if (id in this.theorems[theorem.type])
                throw new Error(`Theorem with id '${id}' for type '${theorem.type}' already exists`);

            this.theorems[theorem.type][id] = theorem;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(theorem.type in this.descriptions.theorems))
                    this.descriptions.theorems[theorem.type] = {};
                this.descriptions.theorems[theorem.type][id] = description;
            }

            return;
        }

        if (type.endsWith(' adjective')) { // parse adjective
            const adjective = this.deserializeAdjective(id, data);

            if (!(adjective.type in this.adjectives))
                this.adjectives[adjective.type] = {};

            if (id in this.adjectives[adjective.type])
                throw new Error(`Adjective with id '${id}' for type '${adjective.type}' already exists`);

            this.adjectives[adjective.type][id] = adjective;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(adjective.type in this.descriptions.adjectives))
                    this.descriptions.adjectives[adjective.type] = {};
                this.descriptions.adjectives[adjective.type][id] = description;
            }

            return;
        }

        { // parse examples
            const example = this.deserializeExample(id, data);

            if (!(type in this.examples)) this.examples[type] = {};

            if (id in this.examples[type])
                throw new Error(`Example with id '${id}' for type '${type}' already exists`);

            this.examples[type][id] = example;

            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null) {
                if (!(example.type in this.descriptions.examples))
                    this.descriptions.examples[example.type] = {};
                this.descriptions.examples[example.type][id] = description;
            }

            return;
        }
    }

    verify(): boolean { // checks if all references in the book are correct
        for (const id in this.types) { // verify types
            const type = this.types[id];
            for (const key in type.parameters) {
                const paramType = type.parameters[key];
                if (!(paramType in this.types))
                    throw new Error(`Type '${id}' refers to unknown type '${paramType}'`);
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

                for (const con of [theorem.conditions, theorem.conclusions]) { // verify theorem conditions & conclusions
                    for (const path in con) {
                        const pathType = this.resolvePathType(theorem.type, path);
                        if (pathType == null)
                            throw new Error(`Theorem '${id}' refers to invalid path '${path}' in its conditions`);
                        for (const key in con[path]) {
                            if (!(key in this.adjectives[pathType]))
                                throw new Error(`Theorem '${id}' refers to unknown adjective '${key}' for '${theorem.subject}${path}' of type '${pathType}'`);
                        }
                    }
                }
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

    resolvePathType(type: string, path: string): string | null { // e.g. `resolve_path_type('morphism', '.source') = 'scheme'`
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                return null;
            if (i > 0 && !(pathParts[i] in this.types[type].parameters))
                return null;
            if (i > 0)
                type = this.types[type].parameters[pathParts[i]];
        }
        return type;
    }

    resolvePath(context: Context, object: Example, path: string): Example | null {
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                return null;
            if (i > 0 && !(pathParts[i] in this.types[object.type].parameters))
                return null;
            if (i > 0 && !(pathParts[i] in object.args))
                throw new Error(`Mysteriously missing argument '${pathParts[i]}' in '${object.id}' of type '${object.type}'`);
            if (i > 0) {
                const argType = this.types[object.type].parameters[pathParts[i]];
                object = context[argType][object.args[pathParts[i]]];
            }
        }
        return object;
    }

    serialize(elaborate: boolean = false): BookContents {
        const contents: BookContents = {
            types: {},
            adjectives: {},
            theorems: {},
            examples: {}
        };
        for (const id in this.types) { // add types
            contents.types[id] = this.serializeType(this.types[id], elaborate);
        }
        for (const type in this.adjectives) { // add adjectives
            if (!(type in contents.adjectives))
                contents.adjectives[type] = {};
            for (const id in this.adjectives[type])
                contents.adjectives[type][id] = this.serializeAdjective(this.adjectives[type][id], elaborate);
        }
        for (const type in this.theorems) {// add theorems
            if (!(type in contents.theorems))
                contents.theorems[type] = {};
            for (const id in this.theorems[type])
                contents.theorems[type][id] = this.serializeTheorem(this.theorems[type][id], elaborate);
        }
        for (const type in this.examples) { // add examples
            if (!(type in contents.examples))
                contents.examples[type] = {};
            for (const id in this.examples[type])
                contents.examples[type][id] = this.serializeExample(this.examples[type][id], elaborate);
        }
        return contents;
    }

    createContextFromType(type: string, id: string): Context {
        const context: Context = {};
        const book: Book = this;
        function addType(type: string, id: string, name: string): void {
            if (!(type in context)) context[type] = {};
            const args: { [id: string]: string } = {};
            for (const [arg, argType] of Object.entries(book.types[type].parameters)) {
                const argId = id + '.' + arg;
                addType(argType, argId, arg);
                args[arg] = argId;
            }
            context[type][id] = { id, type, name, args, adjectives: {}, proofs: {} };
        }
        addType(type, id, this.types[type].name);
        return context;
    }
};
