# Adjectives Project

The Adjectives Project is a website that collects interesting examples and theorems of schemes and morphisms in algebraic geometry. The aim of this project is to gain a better understanding of the many adjectives regarding schemes and morphisms, and the relation between them.

The website can be used to find examples of schemes and morphisms with certain adjectives. It also uses the theorems to automatically make deductions about the properties of the schemes and morphisms.

The website can be visited at [adjectivesproject.org](https://adjectivesproject.org/).

## Setup and usage

To run the Adjectives Project locally, use the following steps. Make sure that both [Git](https://git-scm.com) and [Node.js](https://nodejs.org) are installed on your machine.

**1.** Clone this repository.
```
git clone https://github.com/jessetvogel/adjectives-project.git
```

**2.** Navigate into the project directory and update the data submodule.
```
cd adjectives-project
git submodule update --init
```

**3.** Install the Node dependencies.
```
npm install
```

**4.** Build the project.
```
npm run build
```

**5.** Serve the `public` folder via an HTTP server. For instance, using Python, run the following command and visit the website via `https://127.0.0.1:8080`.
```
python3 -m http.server -d public 8080
```

## Commands

- `npm run build-css`: build Sass files into CSS files

- `npm run build-js`: build TypeScript files into JavaScript files

- `npm run build-json`: build YAML files into JSON files

- `npm run build`: build the project (runs all of the above)

- `npm run clear-json`: clear all generated JSON files

- `npm run clear`: clear all generated CSS, JS and JSON files

- `npm run watch-scss`: watch the Sass files, and build them into CSS when they change

- `npm run watch-ts`: watch the TypeScript files, and build them into JavaScript when they change

- `npm run watch-yaml`: watch the YAML files, and build them into JSON when they change, automatically calls `npm run build-json` and `npm run deduce`

- `npm run find-redundant`: lists all redundant theorems (those which can be derived from other theorems) and adjectives of examples (those which can be derived from other adjectives)
