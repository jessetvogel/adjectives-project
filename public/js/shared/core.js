export class Book {
    constructor(contents = null) {
        this.types = {};
        this.adjectives = {};
        this.theorems = {};
        this.examples = {};
        this.descriptions = { types: {}, adjectives: {}, theorems: {}, examples: {} };
        if (contents != null)
            this.initialize(contents);
    }
    initialize(contents) {
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
    allKeysAreWords(object) {
        return typeof object == 'object' && !Object.keys(object).some(x => x.match(/^[\w\-]+$/) == null);
    }
    deserializeType(id, data) {
        const name = ('name' in data) ? data.name : id;
        const parameters = ('parameters' in data) ? data.parameters : {};
        if (!this.allKeysAreWords(parameters))
            throw new Error(`Invalid parameters in type '${id}'`);
        return { id, name, parameters };
    }
    serializeType(type, elaborate = false) {
        const data = {
            type: 'type',
            name: type.name
        };
        if (Object.keys(type.parameters).length > 0)
            data.parameters = type.parameters;
        if (elaborate && type.id in this.descriptions.types)
            data.description = this.descriptions.types[type.id];
        return data;
    }
    deserializeTheorem(id, data) {
        const name = ('name' in data) ? data.name : id;
        if (!('given' in data) || typeof data.given != 'string')
            throw new Error(`Missing field 'given' in theorem '${id}'`);
        const subjectParts = data.given.split(' ');
        if (subjectParts.length != 2)
            throw new Error(`Invalid field 'given' in theorem '${id}'`);
        const type = subjectParts[0];
        const subject = subjectParts[1];
        if (!(type in this.theorems))
            this.theorems[type] = {};
        if (id in this.theorems[type])
            throw new Error(`Theorem with id '${id}' for type '${type}' already exists`);
        function parseTheoremConditions(exprs, kind) {
            const conditions = {};
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
                if (!(path in conditions))
                    conditions[path] = {};
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
        const converse = ('converse' in data && data.converse == true);
        return { id, name, type, subject, conditions, conclusions, converse };
    }
    serializeTheorem(theorem, elaborate = false) {
        function formatCondition(conditions, path) {
            const out = [];
            if (path in conditions) {
                for (const adjId in conditions[path]) {
                    const value = conditions[path][adjId];
                    out.push(`${theorem.subject}${path}${value ? ' ' : ' not '}${adjId}`);
                }
            }
            return out;
        }
        function formatConditions(conditions) {
            const formatted = Object.keys(conditions).map(path => formatCondition(conditions, path)).flat();
            return (formatted.length == 1) ? formatted[0] : formatted;
        }
        const data = {
            type: 'theorem',
            name: theorem.name,
            given: theorem.type + ' ' + theorem.subject,
            if: formatConditions(theorem.conditions),
            then: formatConditions(theorem.conclusions)
        };
        if (theorem.converse)
            data.converse = true;
        if (elaborate && theorem.type in this.descriptions.theorems && theorem.id in this.descriptions.theorems[theorem.type])
            data.description = this.descriptions.theorems[theorem.type][theorem.id];
        return data;
    }
    deserializeAdjective(id, data) {
        const type = data.type.replace(/ adjective$/, '');
        const name = ('name' in data) ? data.name : id;
        const adjective = { id, type, name };
        if ('verb' in data) {
            if (!Array.isArray(data.verb) || data.verb.length != 2 || typeof data.verb[0] != 'string' || typeof data.verb[1] != 'string')
                throw new Error(`Invalid field 'verb' in adjective '${id}' of type '${type}'`);
            adjective.verb = data.verb;
        }
        return adjective;
    }
    serializeAdjective(adjective, elaborate = false) {
        const data = {
            type: `${adjective.type} adjective`,
            name: adjective.name,
        };
        if (adjective.verb)
            data.verb = adjective.verb;
        if (elaborate && adjective.type in this.descriptions.adjectives && adjective.id in this.descriptions.adjectives[adjective.type])
            data.description = this.descriptions.adjectives[adjective.type][adjective.id];
        return data;
    }
    deserializeExample(id, data) {
        const type = data.type;
        const name = ('name' in data) ? data.name : id;
        const args = ('with' in data) ? data.with : {};
        const adjectives = ('adjectives' in data) ? data.adjectives : {};
        const proofs = {};
        for (const key in adjectives) {
            const value = adjectives[key];
            if (typeof value == 'boolean') { }
            else if (Array.isArray(value) && value.length == 2 && typeof value[0] == 'boolean' && typeof value[1] == 'string') {
                adjectives[key] = value[0];
                proofs[key] = value[1].trim();
            }
            else if (Array.isArray(value) && value.length == 1 && typeof value[0] == 'boolean') {
                adjectives[key] = value[0];
            }
            else
                throw new Error(`Example with id '${id}' for type '${data.type}' has invalid value for adjective '${key}'`);
        }
        if ('proofs' in data) {
            for (const key in data.proofs) {
                const proof = data.proofs[key];
                if (typeof proof == 'string') {
                    proofs[key] = proof;
                }
                else {
                    if (!('type' in proof) || !('theorem' in proof) || !('subject' in proof))
                        throw new Error(`Example with id '${id}' for type '${data.type}' has invalid proof for adjective '${key}'`);
                    const pf = { type: proof.type, theorem: proof.theorem, subject: proof.subject };
                    if (proof.converse)
                        pf.converse = proof.converse;
                    if (proof.negated)
                        pf.negated = proof.negated;
                    proofs[key] = pf;
                }
            }
        }
        if (!this.allKeysAreWords(args))
            throw new Error(`Invalid arguments in example '${id}' of type '${type}'`);
        if (!this.allKeysAreWords(adjectives))
            throw new Error(`Invalid adjectives in example '${id}' of type '${type}'`);
        if (!this.allKeysAreWords(proofs))
            throw new Error(`Invalid proofs in example '${id}' of type '${type}'`);
        return { id, type, name, args, adjectives, proofs };
    }
    serializeExample(example, elaborate = false) {
        const data = {
            type: example.type,
            name: example.name
        };
        if (Object.keys(example.args).length > 0)
            data.with = example.args;
        if (Object.keys(example.adjectives).length > 0)
            data.adjectives = example.adjectives;
        if (elaborate && Object.keys(example.proofs).length > 0)
            data.proofs = example.proofs;
        if (elaborate) {
            if (example.type in this.descriptions.examples && example.id in this.descriptions.examples[example.type])
                data.description = this.descriptions.examples[example.type][example.id];
        }
        return data;
    }
    add(id, data) {
        if (!('type' in data) || typeof data.type != 'string')
            throw new Error(`Missing field type for id '${id}'`);
        if (!id.match(/^[\w\-]+$/))
            throw new Error(`Invalid id '${id}'`);
        const type = data.type;
        if (type == 'type') {
            if (id in this.types)
                throw new Error(`Type with id '${id}' already exists`);
            this.types[id] = this.deserializeType(id, data);
            const description = ('description' in data) ? data.description.toString() : null;
            if (description != null)
                this.descriptions.types[id] = description;
            return;
        }
        if (type == 'theorem') {
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
        if (type.endsWith(' adjective')) {
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
        if (type.includes(' '))
            throw new Error(`Invalid type '${type}'`);
        {
            const example = this.deserializeExample(id, data);
            if (!(type in this.examples))
                this.examples[type] = {};
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
    verify() {
        for (const id in this.types) {
            const type = this.types[id];
            for (const key in type.parameters) {
                const paramType = type.parameters[key];
                if (!(paramType in this.types))
                    throw new Error(`Type '${id}' refers to unknown type '${paramType}'`);
            }
        }
        for (const type in this.adjectives) {
            for (const id in this.adjectives[type]) {
                const adjective = this.adjectives[type][id];
                if (adjective.type != type)
                    throw new Error(`Mysterious mismatch for type of adjective '${id}' ('${adjective.type}' != '${type}')`);
                if (!(adjective.type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
            }
        }
        for (const type in this.theorems) {
            for (const id in this.theorems[type]) {
                const theorem = this.theorems[type][id];
                if (theorem.type != type)
                    throw new Error(`Mysterious mismatch for type of theorem '${id}' ('${theorem.type}' != '${type}')`);
                if (!(theorem.type in this.types))
                    throw new Error(`Theorem '${id}' refers to unknown type '${type}'`);
                for (const con of [theorem.conditions, theorem.conclusions]) {
                    for (const path in con) {
                        let pathType;
                        try {
                            pathType = this.resolvePathType(theorem.type, path);
                        }
                        catch (err) {
                            throw new Error(`In theorem '${id}': ${err.stack}`);
                        }
                        for (const key in con[path]) {
                            if (!(key in this.adjectives[pathType]))
                                throw new Error(`Theorem '${id}' refers to unknown adjective '${key}' for '${theorem.subject}${path}' of type '${pathType}'`);
                        }
                    }
                }
            }
        }
        for (const type in this.examples) {
            for (const id in this.examples[type]) {
                const example = this.examples[type][id];
                if (example.type != type)
                    throw new Error(`Mysterious mismatch for type of example '${id}' ('${example.type}' != '${type}')`);
                if (!(type in this.types))
                    throw new Error(`Adjective '${id}' refers to unknown type '${type}'`);
                const parameters = this.types[type].parameters;
                for (const key in parameters) {
                    if (!(key in example.args))
                        throw new Error(`Missing argument '${key}' for example '${id}' of type '${type}'`);
                    const arg = example.args[key];
                    if (!(arg in this.examples[parameters[key]]))
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown example '${arg}' of type '${parameters[key]}'`);
                }
                for (const adj in example.adjectives) {
                    if (!(adj in this.adjectives[type]))
                        throw new Error(`Example '${id}' of type '${type}' refers to unknown adjective '${adj}'`);
                }
            }
        }
        return true;
    }
    resolvePathType(type, path) {
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                throw new Error(`Could not resolve path '${path}' starting from type '${type}'`);
            if (i > 0 && !(pathParts[i] in this.types[type].parameters))
                throw new Error(`Could not resolve path '${path}' starting from type '${type}'`);
            if (i > 0)
                type = this.types[type].parameters[pathParts[i]];
        }
        return type;
    }
    resolvePath(context, object, path) {
        const pathParts = path.split('.');
        for (let i = 0; i < pathParts.length; ++i) {
            if (i == 0 && pathParts[0] != '')
                throw new Error(`Could not resolve path '${path}' on object '${object.id}' of type '${object.type}'`);
            if (i > 0 && !(pathParts[i] in this.types[object.type].parameters))
                throw new Error(`Could not resolve path '${path}' on object '${object.id}' of type '${object.type}'`);
            if (i > 0 && !(pathParts[i] in object.args))
                throw new Error(`Mysteriously missing argument '${pathParts[i]}' in '${object.id}' of type '${object.type}'`);
            if (i > 0) {
                const argType = this.types[object.type].parameters[pathParts[i]];
                object = context[argType][object.args[pathParts[i]]];
            }
        }
        return object;
    }
    serialize(elaborate = false) {
        const contents = {
            types: {},
            adjectives: {},
            theorems: {},
            examples: {}
        };
        for (const id in this.types) {
            contents.types[id] = this.serializeType(this.types[id], elaborate);
        }
        for (const type in this.adjectives) {
            if (!(type in contents.adjectives))
                contents.adjectives[type] = {};
            for (const id in this.adjectives[type])
                contents.adjectives[type][id] = this.serializeAdjective(this.adjectives[type][id], elaborate);
        }
        for (const type in this.theorems) {
            if (!(type in contents.theorems))
                contents.theorems[type] = {};
            for (const id in this.theorems[type])
                contents.theorems[type][id] = this.serializeTheorem(this.theorems[type][id], elaborate);
        }
        for (const type in this.examples) {
            if (!(type in contents.examples))
                contents.examples[type] = {};
            for (const id in this.examples[type])
                contents.examples[type][id] = this.serializeExample(this.examples[type][id], elaborate);
        }
        return contents;
    }
    createContextFromType(type, id) {
        const context = {};
        const book = this;
        function addType(type, id, name) {
            if (!(type in context))
                context[type] = {};
            const args = {};
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
    traceProof(context, object, adjective, proofHint) {
        var _a;
        const proof = (_a = proofHint !== null && proofHint !== void 0 ? proofHint : object.proofs[adjective]) !== null && _a !== void 0 ? _a : null;
        if (proof == null || typeof proof == 'string')
            return [];
        const steps = [];
        for (const { object: obj, adjective: adj } of this.traceProofDependencies(context, object, adjective, proof))
            steps.push(...this.traceProof(context, obj, adj));
        steps.push(proof);
        const stepsUnique = [];
        for (const step of steps)
            if (!stepsUnique.some(s => s.type == step.type && s.theorem == step.theorem && s.subject == step.subject))
                stepsUnique.push(step);
        return stepsUnique;
    }
    traceProofDependencies(context, object, adjective, proofHint) {
        var _a;
        const proof = (_a = proofHint !== null && proofHint !== void 0 ? proofHint : object.proofs[adjective]) !== null && _a !== void 0 ? _a : null;
        if (proof == null || typeof proof == 'string')
            return [];
        const theorem = this.theorems[proof.type][proof.theorem];
        const subject = context[proof.type][proof.subject];
        const theoremConditions = (proof.converse ? theorem.conclusions : theorem.conditions);
        const theoremConclusions = (proof.converse ? theorem.conditions : theorem.conclusions);
        const dependencies = [];
        const negated = proof.negated;
        if (negated === undefined) {
            for (const path in theoremConditions) {
                const object = this.resolvePath(context, subject, path);
                for (const adjective in theoremConditions[path])
                    dependencies.push({ object, adjective });
            }
        }
        else {
            dependencies.push({ object: this.resolvePath(context, subject, negated.path), adjective: negated.adjective });
            for (const path in theoremConditions) {
                const obj = this.resolvePath(context, subject, path);
                for (const adj in theoremConditions[path]) {
                    if (obj != object || adj != adjective)
                        dependencies.push({ object: obj, adjective: adj });
                }
            }
        }
        return dependencies;
    }
}
;
