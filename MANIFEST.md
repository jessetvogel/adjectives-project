# These are the kinds of .yaml files that consitute the database

# type = scheme | morphism | scheme property | morphism property | scheme theorem | morphism theorem

```yaml
--- # Example scheme file
type: scheme
name: Spectrum of the integers
description: Take the spectrum of the integers $\ZZ$
adjectives:
  affine: true # if there is no comment, then just true or false is sufficient
  integral: [true, The ring $\ZZ$ is a domain.]
```

```yaml
--- # Example morphism file
type: morphism
source: E0001 # Spec Q
target: E0002 # Spec Z
name: Morphism $\ZZ \to \QQ$
description: The unique morphism $\Spec \QQ \to \Spec \ZZ$
adjectives:
  affine: true
  # etc ...
```

```yaml
--- # Example property file `quasi_compact.yaml`
type: scheme adjective
name: quasi-compact
description: A scheme is quasi-compact if the underlying topological space is quasi-compact.
```

```yaml
--- # Example theorem file `T0001.yaml`
type: scheme theorem
name: Affine schemes are quasi-compact
statement: X affine => X quasi_compact
description: A scheme is quasi-compact if the underlying topological space is quasi-compact.
```

```yaml
--- # Example theorem file `src_qc_of_qc_trg_qc.yaml`
type: morphism theorem
name: Affine morphisms are quasi-compact
statement: Y quasi_compact & f quasi_compact => X quasi_compact # always think of $f : X \to Y$
proof: See reference [...] on page [...].
```



# Architecture

All user data is stored in .yaml files (for readability and ease-of-use) in the /data folder.
All processed data is stored in .json files (for ease-of-use with JavaScript).
Note that the browser not need parse .yaml files, only .json files, which it can do very well.
Note that the distinction between user data and processed data is very clear.
The admin modifies only the .yaml data in the /data folder.

The .yaml data consists of one file per type / theorem / adjective / example.
From the .yaml data, a book.json file is constructed, containing the important data (omitting descriptions and justifications)
The book.json file is loaded by the client to search for examples and perform deductions.
Note that we do not want descriptions and justifications in book.json because we do not want the client to load massive amounts of text.

The descriptions and justifications are stored in the /json folder.
Every type has a file under `/json/types/<id>.json`
Every adjective has a file under `/json/adjectives/<type>/<id>.json`
Every theorem has a file under `/json/theorems/<type>/<id>.json`
Every example has a file under `/json/examples/<type>/<id>.json`



The assistant has the following functionality:
✅ - Given a set of adjectives with truth values, find the matching examples `Assistant.search(Context)`
✅ - Given a context (a set of examples which might refer to each other), and a list of theorems (bundled in a book), deduce adjectives for the examples
  - Also give 'proofs' for the statements: i.e. a (short as possible) list of theorems which to apply in order to arrive at the result
- Given a context, try to deduce a contradiction

# TODO
- Go from snake_case to camelCase ?