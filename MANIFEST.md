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

Among the processed .json data is a summary.json file.
The summary.json file contains a virtual tree of the files in the json directory.
However, the summary.json file does not contain descriptions nor justifications.
The summary.json file is loaded by the client to search for examples and perform deductions.
Note that we do not want descriptions and justifications in summary.json because we do not want the client to load massive amounts of text.
The summary.json file is updated whenever new deductions are made.

The full data of each type / adjective / theorem / example are stored in the /json folder as follows:
- Every type has a file under `/json/types/<id>.json`
- Every adjective has a file under `/json/adjectives/<type>/<id>.json`
- Every theorem has a file under `/json/theorems/<type>/<id>.json`
- Every example has a file under `/json/examples/<type>/<id>.json`


There are a number of scripts:
- `script-update-json-from-yaml.js`: reads the .yaml files and updates summary.json and the other .json files accordingly with any new information that is provided. Note that it overwrites (but not erases) existing data.
- `script-deduce.js`: tries to make as many new deductions as possible for the examples (based on the summary.json file), and updates summary.json and the relevant .json files accoringly.

# TODO
- Go from snake_case to camelCase ?


The assistant has the following functionality:
✅ - Given a set of adjectives with truth values, find the matching examples `Assistant.search(Context)`
✅ - Given a context (a set of examples which might refer to each other), and a list of theorems (bundled in a book), deduce adjectives for the examples
   - Also give 'proofs' for the statements: i.e. a (short as possible) list of theorems which to apply in order to arrive at the result
- Given a context, try to deduce a contradiction
- 